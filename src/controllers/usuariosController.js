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
        const { correo, contraseña, id_rol, nombre, apellido, codigo, direccion } = req.body;

        // Validar campos requeridos
        if (!correo || !contraseña || !id_rol) {
            return res.status(400).json({
                success: false,
                message: 'Correo, contraseña y rol son requeridos'
            });
        }

        // Crear usuario a través del servicio (pasando el rol del usuario que crea)
        const nuevoUsuario = await UsuarioService.createUsuario(
            { correo, contraseña, id_rol, nombre, apellido, codigo, direccion },
            req.user.id,
            req.user.id_rol  // Pasar el rol del usuario autenticado
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

        if (error.message === 'ADMIN_CAN_ONLY_CREATE_CLIENTS') {
            return res.status(403).json({
                success: false,
                message: 'Los administradores solo pueden crear cuentas de clientes'
            });
        }

        if (error.message === 'ONLY_SUPERADMIN_CAN_CREATE_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Solo el superAdministrador puede crear cuentas de administradores'
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

        if (error.message === 'CODIGO_REQUIRED_FOR_CLIENT') {
            return res.status(400).json({
                success: false,
                message: 'El código es requerido para usuarios tipo cliente'
            });
        }

        if (error.message === 'CODIGO_ALREADY_EXISTS') {
            return res.status(400).json({
                success: false,
                message: 'El código de cliente ya está en uso'
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

/**
 * Actualizar estado de actividad del cliente
 */
const updateEstadoActividad = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_actividad } = req.body;

        // Validar que se proporcionó el estado
        if (!estado_actividad) {
            return res.status(400).json({
                success: false,
                message: 'El estado_actividad es requerido'
            });
        }

        // Validar que el estado sea válido
        const estadosValidos = ['activo', 'deudor', 'bloqueado', 'inactivo'];
        if (!estadosValidos.includes(estado_actividad)) {
            return res.status(400).json({
                success: false,
                message: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`
            });
        }

        const resultado = await UsuarioService.updateEstadoActividad(id, estado_actividad, req.user.id);

        res.json({
            success: true,
            message: `Estado de actividad actualizado a '${estado_actividad}' exitosamente`,
            data: resultado
        });

    } catch (error) {
        console.error('Error al actualizar estado de actividad:', error);

        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (error.message === 'USER_IS_NOT_CLIENT') {
            return res.status(400).json({
                success: false,
                message: 'Solo se puede cambiar el estado de actividad de usuarios tipo cliente'
            });
        }

        if (error.message === 'CLIENT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado de actividad',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Habilitar cliente bloqueado o inactivo (Solo Admin/SuperAdmin)
 */
const habilitarCliente = async (req, res) => {
    try {
        const { id_cliente } = req.params;
        
        const Cliente = require('../models/Cliente');
        await Cliente.habilitarCliente(id_cliente, req.user.id);

        res.json({
            success: true,
            message: 'Cliente habilitado exitosamente. Ahora puede realizar compras.'
        });

    } catch (error) {
        console.error('Error al habilitar cliente:', error);

        if (error.message === 'CLIENTE_NO_REQUIERE_HABILITACION') {
            return res.status(400).json({
                success: false,
                message: 'El cliente no requiere habilitación o no existe'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al habilitar cliente',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener saldo del cliente en la última orden
 * GET /api/usuarios/clientes/:id_cliente/saldo-ultima-orden
 */
const getSaldoUltimaOrden = async (req, res) => {
    try {
        const { id_cliente } = req.params;
        const Cliente = require('../models/Cliente');
        
        const saldo = await Cliente.getSaldoUltimaOrden(id_cliente);

        if (!saldo) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró información de órdenes para este cliente'
            });
        }

        res.json({
            success: true,
            data: saldo
        });

    } catch (error) {
        console.error('Error al obtener saldo de última orden:', error);

        res.status(500).json({
            success: false,
            message: 'Error al obtener saldo de última orden',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

module.exports = {
    getAllUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    updateEstadoActividad,
    habilitarCliente,
    getSaldoUltimaOrden
};
