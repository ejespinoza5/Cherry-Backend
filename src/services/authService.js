const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRATION;

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
                estado: usuario.estado
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
            created_at: usuario.created_at
        };
    }
}

module.exports = AuthService;
