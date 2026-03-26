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

module.exports = {
    login,
    me,
    forgotPassword,
    verifyRecoveryCode,
    resetPassword
};
