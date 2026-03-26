const AuthService = require('../services/authService');

/**
 * Login de usuario
 */
const login = async (req, res) => {
    try {
        const { correo, contraseña } = req.body;

        // Validar campos requeridos
        if (!correo || !contraseña) {
            return res.status(400).json({
                success: false,
                message: 'Correo y contraseña son requeridos'
            });
        }

        // Llamar al servicio de autenticación
        const result = await AuthService.login(correo, contraseña);

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: result
        });

    } catch (error) {
        console.error('Error en login:', error);

        // Manejo de errores específicos
        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener información del usuario autenticado
 */
const me = async (req, res) => {
    try {
        const usuario = await AuthService.getUserInfo(req.user.id);

        res.json({
            success: true,
            data: usuario
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);

        // Manejo de errores específicos
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener información del usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Solicitar codigo OTP para recuperar contrasena.
 */
const forgotPassword = async (req, res) => {
    try {
        const { correo } = req.body;

        if (!correo) {
            return res.status(400).json({
                success: false,
                message: 'El correo es requerido'
            });
        }

        const result = await AuthService.forgotPassword(correo);

        return res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error en forgotPassword:', error);

        if (error.message === 'EMAIL_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'El correo no está registrado'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'No se pudo procesar la solicitud',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Verificar codigo OTP de recuperacion.
 */
const verifyRecoveryCode = async (req, res) => {
    try {
        const { correo, codigo } = req.body;

        if (!correo || !codigo) {
            return res.status(400).json({
                success: false,
                message: 'Correo y codigo son requeridos'
            });
        }

        if (!/^\d{6}$/.test(String(codigo))) {
            return res.status(400).json({
                success: false,
                message: 'El codigo debe tener 6 digitos numericos'
            });
        }

        const result = await AuthService.verifyRecoveryCode(correo, String(codigo));

        return res.json({
            success: true,
            message: 'Codigo verificado correctamente',
            data: result
        });
    } catch (error) {
        console.error('Error en verifyRecoveryCode:', error);

        if (error.message === 'CODE_BLOCKED') {
            return res.status(429).json({
                success: false,
                message: 'Codigo bloqueado por demasiados intentos'
            });
        }

        if (error.message === 'INVALID_OR_EXPIRED_CODE') {
            return res.status(400).json({
                success: false,
                message: 'Codigo invalido o expirado'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'No se pudo verificar el codigo',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Cambiar contrasena usando el token temporal de recuperacion.
 */
const resetPassword = async (req, res) => {
    try {
        const { resetToken, nuevaContrasena } = req.body;

        if (!resetToken || !nuevaContrasena) {
            return res.status(400).json({
                success: false,
                message: 'resetToken y nuevaContrasena son requeridos'
            });
        }

        const result = await AuthService.resetPassword(resetToken, nuevaContrasena);

        return res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error en resetPassword:', error);

        if (error.message === 'INVALID_RESET_TOKEN' || error.message === 'INVALID_RESET_SESSION') {
            return res.status(401).json({
                success: false,
                message: 'Token de recuperacion invalido o expirado'
            });
        }

        if (error.message === 'INVALID_PASSWORD') {
            return res.status(400).json({
                success: false,
                message: error.details || 'La contrasena no cumple los requisitos de seguridad'
            });
        }

        if (error.message === 'INVALID_OR_EXPIRED_CODE') {
            return res.status(400).json({
                success: false,
                message: 'El codigo usado para recuperar la contrasena ya no es valido'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'No se pudo actualizar la contrasena',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Cambiar contrasena en primer inicio de sesion.
 */
const changeInitialPassword = async (req, res) => {
    try {
        const { contraseñaActual, nuevaContrasena } = req.body;

        if (!contraseñaActual || !nuevaContrasena) {
            return res.status(400).json({
                success: false,
                message: 'contraseñaActual y nuevaContrasena son requeridos'
            });
        }

        const result = await AuthService.changeInitialPassword(
            req.user.id,
            contraseñaActual,
            nuevaContrasena
        );

        return res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error en changeInitialPassword:', error);

        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (error.message === 'INITIAL_CHANGE_NOT_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'Este usuario no requiere cambio de contraseña inicial'
            });
        }

        if (error.message === 'INVALID_CURRENT_PASSWORD') {
            return res.status(401).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        if (error.message === 'PASSWORD_MUST_BE_DIFFERENT') {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe ser diferente a la actual'
            });
        }

        if (error.message === 'INVALID_PASSWORD') {
            return res.status(400).json({
                success: false,
                message: error.details || 'La nueva contraseña no cumple los requisitos de seguridad'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'No se pudo cambiar la contraseña inicial',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Solicitar cambio de correo con codigo OTP.
 */
const requestEmailChange = async (req, res) => {
    try {
        const { nuevoCorreo } = req.body;

        if (!nuevoCorreo) {
            return res.status(400).json({
                success: false,
                message: 'nuevoCorreo es requerido'
            });
        }

        const result = await AuthService.requestEmailChange(req.user.id, nuevoCorreo);

        return res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error en requestEmailChange:', error);

        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (error.message === 'INVALID_EMAIL_FORMAT') {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo es inválido'
            });
        }

        if (error.message === 'SAME_EMAIL') {
            return res.status(400).json({
                success: false,
                message: 'El nuevo correo debe ser diferente al actual'
            });
        }

        if (error.message === 'EMAIL_ALREADY_EXISTS') {
            return res.status(400).json({
                success: false,
                message: 'El correo ya está registrado por otro usuario'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'No se pudo solicitar el cambio de correo',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Verificar codigo OTP de cambio de correo.
 */
const verifyEmailChange = async (req, res) => {
    try {
        const { nuevoCorreo, codigo } = req.body;

        if (!nuevoCorreo || !codigo) {
            return res.status(400).json({
                success: false,
                message: 'nuevoCorreo y codigo son requeridos'
            });
        }

        if (!/^\d{6}$/.test(String(codigo))) {
            return res.status(400).json({
                success: false,
                message: 'El codigo debe tener 6 dígitos numéricos'
            });
        }

        const result = await AuthService.verifyEmailChange(req.user.id, nuevoCorreo, String(codigo));

        return res.json({
            success: true,
            message: result.message,
            data: {
                correo: result.correo
            }
        });
    } catch (error) {
        console.error('Error en verifyEmailChange:', error);

        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (error.message === 'INVALID_EMAIL_FORMAT') {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo es inválido'
            });
        }

        if (error.message === 'EMAIL_ALREADY_EXISTS') {
            return res.status(400).json({
                success: false,
                message: 'El correo ya está registrado por otro usuario'
            });
        }

        if (error.message === 'CODE_BLOCKED') {
            return res.status(429).json({
                success: false,
                message: 'Código bloqueado por demasiados intentos'
            });
        }

        if (error.message === 'INVALID_OR_EXPIRED_CODE') {
            return res.status(400).json({
                success: false,
                message: 'Código inválido o expirado'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'No se pudo verificar el cambio de correo',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

module.exports = {
    login,
    me,
    forgotPassword,
    verifyRecoveryCode,
    resetPassword,
    changeInitialPassword,
    requestEmailChange,
    verifyEmailChange
};
