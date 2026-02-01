const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const { isValidEmail, isValidPassword, isValidEstado } = require('../utils/validators');

class UsuarioService {
    /**
     * Formatear datos de usuario según su rol
     */
    static formatUserData(usuario) {
        const baseData = {
            id: usuario.id,
            correo: usuario.correo,
            id_rol: usuario.id_rol,
            rol_nombre: usuario.rol_nombre,
            estado: usuario.estado,
            created_at: usuario.created_at,
            updated_at: usuario.updated_at
        };

        // Si es cliente (id_rol = 2) y tiene datos de cliente, agregarlos
        if (usuario.id_rol === 2 && usuario.cliente_id) {
            baseData.cliente = {
                id: usuario.cliente_id,
                nombre: usuario.cliente_nombre,
                apellido: usuario.cliente_apellido,
                codigo: usuario.cliente_codigo,
                direccion: usuario.cliente_direccion,
                estado_actividad: usuario.cliente_estado_actividad
            };
        }

        return baseData;
    }

    /**
     * Obtener todos los usuarios activos
     */
    static async getAllUsuarios() {
        const usuarios = await Usuario.findAllWithClientInfo();
        return usuarios.map(usuario => this.formatUserData(usuario));
    }

    /**
     * Obtener usuario por ID
     */
    static async getUsuarioById(id) {
        const usuario = await Usuario.findByIdWithClientInfo(id);

        if (!usuario) {
            throw new Error('USER_NOT_FOUND');
        }

        return this.formatUserData(usuario);
    }

    /**
     * Crear nuevo usuario
     */
    static async createUsuario(data, createdBy, createdByRol) {
        const { correo, contraseña, id_rol, nombre, apellido, codigo, direccion } = data;

        // Validar formato de correo
        if (!isValidEmail(correo)) {
            throw new Error('INVALID_EMAIL_FORMAT');
        }

        // Validar contraseña
        if (!isValidPassword(contraseña)) {
            throw new Error('INVALID_PASSWORD');
        }

        // Validar que el rol sea válido
        if (![1, 2, 3].includes(parseInt(id_rol))) {
            throw new Error('INVALID_ROLE');
        }

        // Validar permisos según el rol del usuario que crea
        // SuperAdministrador (id_rol = 3) puede crear cualquier tipo de usuario
        // Administrador (id_rol = 1) solo puede crear clientes (id_rol = 2)
        if (createdByRol === 1 && parseInt(id_rol) !== 2) {
            throw new Error('ADMIN_CAN_ONLY_CREATE_CLIENTS');
        }

        // Solo superAdministrador puede crear administradores o superAdministradores
        if ((parseInt(id_rol) === 1 || parseInt(id_rol) === 3) && createdByRol !== 3) {
            throw new Error('ONLY_SUPERADMIN_CAN_CREATE_ADMIN');
        }

        // Si es cliente, el nombre y código son obligatorios
        if (parseInt(id_rol) === 2) {
            if (!nombre) {
                throw new Error('NAME_REQUIRED_FOR_CLIENT');
            }
            if (!codigo) {
                throw new Error('CODIGO_REQUIRED_FOR_CLIENT');
            }
        }

        // Verificar si el correo ya existe
        const emailExists = await Usuario.emailExists(correo);
        if (emailExists) {
            throw new Error('EMAIL_ALREADY_EXISTS');
        }

        // Si es cliente, verificar que el código no exista
        if (parseInt(id_rol) === 2 && codigo) {
            const codigoExists = await Cliente.codigoExists(codigo);
            if (codigoExists) {
                throw new Error('CODIGO_ALREADY_EXISTS');
            }
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contraseña, salt);

        // Crear usuario
        const usuarioId = await Usuario.create(correo, hashedPassword, id_rol);

        // Si el rol es cliente (2), crear registro en la tabla clientes
        if (parseInt(id_rol) === 2) {
            await Cliente.create({
                id_usuario: usuarioId,
                nombre,
                apellido: apellido || '',
                codigo,
                direccion: direccion || '',
                created_by: createdBy
            });
        }

        // Retornar el usuario creado con información completa
        const usuarioCreado = await Usuario.findByIdWithClientInfo(usuarioId);
        return this.formatUserData(usuarioCreado);
    }

    /**
     * Actualizar usuario
     */
    static async updateUsuario(id, data, updatedBy) {
        const { correo, id_rol, estado, contraseña, nombre, apellido, codigo, direccion, estado_actividad } = data;

        // Verificar que el usuario existe
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            throw new Error('USER_NOT_FOUND');
        }

        // Validar formato de correo si se proporciona
        if (correo && !isValidEmail(correo)) {
            throw new Error('INVALID_EMAIL_FORMAT');
        }

        // Validar contraseña si se proporciona
        if (contraseña && !isValidPassword(contraseña)) {
            throw new Error('INVALID_PASSWORD');
        }

        // Validar estado si se proporciona
        if (estado && !isValidEstado(estado)) {
            throw new Error('INVALID_ESTADO');
        }

        // Validar estado_actividad si se proporciona
        if (estado_actividad && !isValidEstado(estado_actividad)) {
            throw new Error('INVALID_ESTADO_ACTIVIDAD');
        }

        // Validar rol si se proporciona
        if (id_rol && ![1, 2].includes(parseInt(id_rol))) {
            throw new Error('INVALID_ROLE');
        }

        // Verificar si el correo ya existe (excluyendo el usuario actual)
        if (correo && correo !== usuario.correo) {
            const emailExists = await Usuario.emailExists(correo, id);
            if (emailExists) {
                throw new Error('EMAIL_ALREADY_EXISTS');
            }
        }

        // Si el usuario es cliente (id_rol = 2), validar código único
        const rolFinal = id_rol || usuario.id_rol;
        if (parseInt(rolFinal) === 2 && codigo) {
            const cliente = await Cliente.findByUsuario(id);
            if (cliente) {
                // Verificar que el código no esté duplicado
                const codigoExists = await Cliente.codigoExists(codigo, cliente.id);
                if (codigoExists) {
                    throw new Error('CODIGO_ALREADY_EXISTS');
                }
            }
        }

        // Actualizar datos del usuario
        await Usuario.update(
            id,
            correo || usuario.correo,
            id_rol || usuario.id_rol,
            estado || usuario.estado
        );

        // Actualizar contraseña si se proporciona
        if (contraseña) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contraseña, salt);
            await Usuario.updatePassword(id, hashedPassword);
        }

        // Si el usuario es cliente (id_rol = 2), actualizar datos de cliente
        if (parseInt(rolFinal) === 2 && (nombre || apellido || codigo || direccion || estado_actividad)) {
            const cliente = await Cliente.findByUsuario(id);
            
            if (cliente) {
                // Actualizar datos del cliente existente
                await Cliente.update(
                    cliente.id,
                    {
                        nombre: nombre || cliente.nombre,
                        apellido: apellido !== undefined ? apellido : cliente.apellido,
                        codigo: codigo || cliente.codigo,
                        direccion: direccion !== undefined ? direccion : cliente.direccion,
                        estado_actividad: estado_actividad || cliente.estado_actividad,
                        estado: estado || cliente.estado
                    },
                    updatedBy
                );
            }
        }

        // Retornar usuario actualizado con información completa
        const usuarioActualizado = await Usuario.findByIdWithClientInfo(id);
        return this.formatUserData(usuarioActualizado);
    }

    /**
     * Eliminar usuario (cambiar estado a inactivo)
     */
    static async deleteUsuario(id, currentUserId) {
        // Verificar que el usuario existe
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            throw new Error('USER_NOT_FOUND');
        }

        // No permitir eliminar el propio usuario
        if (parseInt(id) === currentUserId) {
            throw new Error('CANNOT_DELETE_OWN_USER');
        }

        // Eliminar (cambiar estado a inactivo)
        await Usuario.delete(id);

        return true;
    }
}

module.exports = UsuarioService;
