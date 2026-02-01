const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 */
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token no proporcionado'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cherry_secret_key_2026');
        req.user = decoded; // { id, correo, id_rol, rol_nombre }
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.id_rol !== 1) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren permisos de administrador'
        });
    }
    next();
};

/**
 * Middleware para verificar que el usuario sea superAdministrador
 */
const isSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.id_rol !== 3) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren permisos de superAdministrador'
        });
    }
    next();
};

/**
 * Middleware para verificar que el usuario sea administrador o superAdministrador
 */
const isAdminOrSuperAdmin = (req, res, next) => {
    if (!req.user || (req.user.id_rol !== 1 && req.user.id_rol !== 3)) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren permisos de administrador'
        });
    }
    next();
};

module.exports = {
    verifyToken,
    isAdmin,
    isSuperAdmin,
    isAdminOrSuperAdmin
};
