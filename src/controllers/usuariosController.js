const UsuarioService = require('../services/usuarioService');

/**
 * Obtener todos los usuarios
 */
const getAllUsuarios = async (req, res) => {
    try {
        const usuarios = await UsuarioService.getAllUsuarios();

        res.json({
            success: true,
            data: usuarios
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener usuario por ID
 */
const getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await UsuarioService.getUsuarioById(id);

        res.json({
            success: true,
            data: usuario
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);

        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Crear nuevo usuario (Solo administrador)
 */
const createUsuario = async (req, res) => {
    try {
        const { correo, contraseña, id_rol, nombre, apellido, direccion } = req.body;

        // Validar campos requeridos
        if (!correo || !contraseña || !id_rol) {
            return res.status(400).json({
                success: false,
                message: 'Correo, contraseña y rol son requeridos'
            });
        }

        // Crear usuario a través del servicio
        const nuevoUsuario = await UsuarioService.createUsuario(
            { correo, contraseña, id_rol, nombre, apellido, direccion },
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: nuevoUsuario
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);

        // Manejo de errores específicos
        if (error.message === 'INVALID_EMAIL_FORMAT') {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo electrónico es inválido'
            });
        }

        if (error.message === 'INVALID_PASSWORD') {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        if (error.message === 'INVALID_ROLE') {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Debe ser 1 (Administrador) o 2 (Cliente)'
            });
        }

        if (error.message === 'NAME_REQUIRED_FOR_CLIENT') {
            return res.status(400).json({
                success: false,
                message: 'El nombre es requerido para usuarios tipo cliente'
            });
        }

        if (error.message === 'EMAIL_ALREADY_EXISTS') {
            return res.status(400).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Actualizar usuario
 */
const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { correo, id_rol, estado, contraseña, nombre, apellido, codigo, direccion, estado_actividad } = req.body;

        const usuarioActualizado = await UsuarioService.updateUsuario(
            id,
            {
                correo,
                id_rol,
                estado,
                contraseña,
                nombre,
                apellido,
                codigo,
                direccion,
                estado_actividad
            },
            req.user.id
        );

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: usuarioActualizado
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);

        // Manejo de errores específicos
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (error.message === 'INVALID_EMAIL_FORMAT') {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo electrónico es inválido'
            });
        }

        if (error.message === 'INVALID_PASSWORD') {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        if (error.message === 'INVALID_ESTADO') {
            return res.status(400).json({
                success: false,
                message: 'El estado debe ser "activo" o "inactivo"'
            });
        }

        if (error.message === 'INVALID_ESTADO_ACTIVIDAD') {
            return res.status(400).json({
                success: false,
                message: 'El estado de actividad debe ser "activo" o "inactivo"'
            });
        }

        if (error.message === 'INVALID_ROLE') {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Debe ser 1 (Administrador) o 2 (Cliente)'
            });
        }

        if (error.message === 'EMAIL_ALREADY_EXISTS') {
            return res.status(400).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }

        if (error.message === 'CODIGO_ALREADY_EXISTS') {
            return res.status(400).json({
                success: false,
                message: 'El código de cliente ya está en uso'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Eliminar usuario (cambiar estado a inactivo)
 */
const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        await UsuarioService.deleteUsuario(id, req.user.id);

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);

        // Manejo de errores específicos
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (error.message === 'CANNOT_DELETE_OWN_USER') {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propio usuario'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

module.exports = {
    getAllUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario
};
