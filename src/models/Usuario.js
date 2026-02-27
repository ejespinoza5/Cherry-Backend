const { pool } = require('../config/database');

class Usuario {
    /**
     * Buscar usuario por correo
     */
    static async findByEmail(correo) {
        try {
            const [rows] = await pool.query(
                `SELECT u.*, r.nombre as rol_nombre 
                 FROM usuarios u 
                 INNER JOIN rol r ON u.id_rol = r.id 
                 WHERE u.correo = ? AND u.estado = 'activo'`,
                [correo]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar usuario por ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.query(
                `SELECT u.id, u.correo, u.id_rol, u.estado, u.created_at, u.updated_at, r.nombre as rol_nombre 
                 FROM usuarios u 
                 INNER JOIN rol r ON u.id_rol = r.id 
                 WHERE u.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Crear nuevo usuario
     */
    static async create(correo, hashedPassword, id_rol) {
        try {
            const [result] = await pool.query(
                'INSERT INTO usuarios (correo, contraseña, id_rol, estado) VALUES (?, ?, ?, ?)',
                [correo, hashedPassword, id_rol, 'activo']
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener todos los usuarios activos
     */
    static async findAll() {
        try {
            const [rows] = await pool.query(
                `SELECT u.id, u.correo, u.id_rol, u.estado, u.created_at, u.updated_at, r.nombre as rol_nombre 
                 FROM usuarios u 
                 INNER JOIN rol r ON u.id_rol = r.id 
                 WHERE u.estado = 'activo'
                 ORDER BY u.created_at DESC`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener todos los usuarios activos con información de cliente si aplica
     */
    static async findAllWithClientInfo() {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    u.id, 
                    u.correo, 
                    u.id_rol, 
                    u.estado, 
                    u.created_at, 
                    u.updated_at, 
                    r.nombre as rol_nombre,
                    c.id as cliente_id,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    c.direccion as cliente_direccion,
                    c.pais as cliente_pais,
                    c.estado_actividad as cliente_estado_actividad
                 FROM usuarios u 
                 INNER JOIN rol r ON u.id_rol = r.id 
                 LEFT JOIN clientes c ON u.id = c.id_usuario AND u.id_rol = 2
                 WHERE u.estado = 'activo'
                 ORDER BY u.created_at DESC`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener usuario por ID con información de cliente si aplica
     */
    static async findByIdWithClientInfo(id) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    u.id, 
                    u.correo, 
                    u.id_rol, 
                    u.estado, 
                    u.created_at, 
                    u.updated_at, 
                    r.nombre as rol_nombre,
                    c.id as cliente_id,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    c.direccion as cliente_direccion,
                    c.pais as cliente_pais,
                    c.estado_actividad as cliente_estado_actividad
                 FROM usuarios u 
                 INNER JOIN rol r ON u.id_rol = r.id 
                 LEFT JOIN clientes c ON u.id = c.id_usuario AND u.id_rol = 2
                 WHERE u.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar usuario
     */
    static async update(id, correo, id_rol, estado) {
        try {
            const [result] = await pool.query(
                'UPDATE usuarios SET correo = ?, id_rol = ?, estado = ? WHERE id = ?',
                [correo, id_rol, estado, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar contraseña
     */
    static async updatePassword(id, hashedPassword) {
        try {
            const [result] = await pool.query(
                'UPDATE usuarios SET contraseña = ? WHERE id = ?',
                [hashedPassword, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Eliminar usuario (cambiar estado a inactivo)
     */
    static async delete(id) {
        try {
            const [result] = await pool.query(
                'UPDATE usuarios SET estado = ? WHERE id = ?',
                ['inactivo', id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar si existe un correo
     */
    static async emailExists(correo, excludeId = null) {
        try {
            let query = 'SELECT id FROM usuarios WHERE correo = ?';
            let params = [correo];
            
            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }
            
            const [rows] = await pool.query(query, params);
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Usuario;
