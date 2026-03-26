const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const PasswordReset = require('../models/PasswordReset');
const EmailService = require('../utils/emailService');
const { isValidPassword } = require('../utils/validators');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRATION;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || JWT_SECRET;
const JWT_RESET_EXPIRES_IN = process.env.JWT_RESET_EXPIRATION || '15m';

class AuthService {
    /**
     * Autenticar usuario y generar token
     */
    static async login(correo, contraseña) {
        // Buscar usuario por correo
        const usuario = await Usuario.findByEmail(correo);

        if (!usuario) {
            throw new Error('INVALID_CREDENTIALS');
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(contraseña, usuario.contraseña);

        if (!isPasswordValid) {
            throw new Error('INVALID_CREDENTIALS');
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                correo: usuario.correo,
                id_rol: usuario.id_rol,
                rol_nombre: usuario.rol_nombre
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return {
            token,
            usuario: {
                id: usuario.id,
                correo: usuario.correo,
                id_rol: usuario.id_rol,
                rol_nombre: usuario.rol_nombre,
                estado: usuario.estado,
                requiere_cambio_password: Boolean(usuario.requiere_cambio_password)
            }
        };
    }

    /**
     * Obtener información del usuario por ID
     */
    static async getUserInfo(userId) {
        const usuario = await Usuario.findById(userId);

        if (!usuario) {
            throw new Error('USER_NOT_FOUND');
        }

        return {
            id: usuario.id,
            correo: usuario.correo,
            id_rol: usuario.id_rol,
            rol_nombre: usuario.rol_nombre,
            estado: usuario.estado,
            requiere_cambio_password: Boolean(usuario.requiere_cambio_password),
            created_at: usuario.created_at
        };
    }

    /**
     * Cambiar contrasena en primer inicio de sesion.
     */
    static async changeInitialPassword(userId, contraseñaActual, nuevaContrasena) {
        const usuario = await Usuario.findById(userId);

        if (!usuario) {
            throw new Error('USER_NOT_FOUND');
        }

        if (!usuario.requiere_cambio_password) {
            throw new Error('INITIAL_CHANGE_NOT_REQUIRED');
        }

        const currentPasswordHash = await Usuario.getPassword(userId);
        const isCurrentPasswordValid = await bcrypt.compare(contraseñaActual, currentPasswordHash);

        if (!isCurrentPasswordValid) {
            throw new Error('INVALID_CURRENT_PASSWORD');
        }

        const passwordValidation = isValidPassword(nuevaContrasena);
        if (!passwordValidation.valid) {
            const validationError = new Error('INVALID_PASSWORD');
            validationError.details = passwordValidation.message;
            throw validationError;
        }

        if (contraseñaActual === nuevaContrasena) {
            throw new Error('PASSWORD_MUST_BE_DIFFERENT');
        }

        const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
        const updatedPassword = await Usuario.updatePassword(userId, hashedPassword);

        if (!updatedPassword) {
            throw new Error('PASSWORD_UPDATE_FAILED');
        }

        await Usuario.updateRequiereCambioPassword(userId, false);

        return {
            message: 'Contraseña actualizada correctamente. Ya puedes usar el sistema con normalidad.'
        };
    }

    /**
     * Solicitar codigo de recuperacion.
     */
    static async forgotPassword(correo) {
        const usuario = await Usuario.findByEmail(correo);

        if (!usuario) {
            throw new Error('EMAIL_NOT_FOUND');
        }

        await PasswordReset.expireActiveCodesByUser(usuario.id);

        const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        const codigoHash = await bcrypt.hash(codigo, 10);
        const expiraEn = new Date(Date.now() + 15 * 60 * 1000);

        await PasswordReset.create(usuario.id, codigoHash, expiraEn);
        await EmailService.sendRecoveryCode(usuario.correo, codigo);

        return {
            message: 'Se envió un código de recuperación.'
        };
    }

    /**
     * Verificar codigo OTP y emitir token temporal para cambiar contrasena.
     */
    static async verifyRecoveryCode(correo, codigo) {
        const usuario = await Usuario.findByEmail(correo);

        if (!usuario) {
            throw new Error('INVALID_OR_EXPIRED_CODE');
        }

        const recovery = await PasswordReset.findLatestPendingByUserId(usuario.id);

        if (!recovery) {
            throw new Error('INVALID_OR_EXPIRED_CODE');
        }

        if (recovery.estado !== 'pendiente') {
            throw new Error('INVALID_OR_EXPIRED_CODE');
        }

        if (new Date(recovery.expira_en) < new Date()) {
            await PasswordReset.markExpired(recovery.id);
            throw new Error('INVALID_OR_EXPIRED_CODE');
        }

        if (recovery.intentos >= recovery.max_intentos) {
            await PasswordReset.markBlocked(recovery.id);
            throw new Error('CODE_BLOCKED');
        }

        const isMatch = await bcrypt.compare(codigo, recovery.codigo_hash);

        if (!isMatch) {
            await PasswordReset.incrementAttempts(recovery.id);

            const updated = await PasswordReset.findLatestByUserId(usuario.id);
            if (updated && updated.intentos >= updated.max_intentos) {
                await PasswordReset.markBlocked(recovery.id);
                throw new Error('CODE_BLOCKED');
            }

            throw new Error('INVALID_OR_EXPIRED_CODE');
        }

        await PasswordReset.markVerified(recovery.id);

        const resetToken = jwt.sign(
            {
                id: usuario.id,
                action: 'reset_password',
                recovery_id: recovery.id
            },
            JWT_RESET_SECRET,
            { expiresIn: JWT_RESET_EXPIRES_IN }
        );

        return {
            resetToken,
            expiresIn: JWT_RESET_EXPIRES_IN
        };
    }

    /**
     * Cambiar contrasena usando token temporal emitido tras verificar OTP.
     */
    static async resetPassword(resetToken, nuevaContrasena) {
        let payload;

        try {
            payload = jwt.verify(resetToken, JWT_RESET_SECRET);
        } catch (error) {
            throw new Error('INVALID_RESET_TOKEN');
        }

        if (payload.action !== 'reset_password') {
            throw new Error('INVALID_RESET_TOKEN');
        }

        const passwordValidation = isValidPassword(nuevaContrasena);
        if (!passwordValidation.valid) {
            const validationError = new Error('INVALID_PASSWORD');
            validationError.details = passwordValidation.message;
            throw validationError;
        }

        const recovery = await PasswordReset.findLatestVerifiedByUserId(payload.id);

        if (!recovery || recovery.id !== payload.recovery_id) {
            throw new Error('INVALID_RESET_SESSION');
        }

        if (new Date(recovery.expira_en) < new Date()) {
            await PasswordReset.markExpired(recovery.id);
            throw new Error('INVALID_OR_EXPIRED_CODE');
        }

        const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
        const updated = await Usuario.updatePassword(payload.id, hashedPassword);

        if (!updated) {
            throw new Error('PASSWORD_UPDATE_FAILED');
        }

        await PasswordReset.markUsed(recovery.id);
        await Usuario.updateRequiereCambioPassword(payload.id, false);

        return {
            message: 'Contrasena actualizada correctamente.'
        };
    }
}

module.exports = AuthService;
