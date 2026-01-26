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

module.exports = {
    login,
    me
};
