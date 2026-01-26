const { pool } = require('../config/database');

class Cliente {
    /**
     * Crear nuevo cliente
     */
    static async create(data) {
        try {
            const { id_usuario, nombre, apellido, codigo, direccion, created_by } = data;
            
            const [result] = await pool.query(
                `INSERT INTO clientes (id_usuario, nombre, apellido, codigo, direccion, estado_actividad, estado, created_by) 
                 VALUES (?, ?, ?, ?, ?, 'activo', 'activo', ?)`,
                [id_usuario, nombre, apellido, codigo, direccion, created_by]
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar cliente por usuario
     */
    static async findByUsuario(id_usuario) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM clientes WHERE id_usuario = ?',
                [id_usuario]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar cliente por ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM clientes WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener todos los clientes
     */
    static async findAll() {
        try {
            const [rows] = await pool.query(
                `SELECT c.*, u.correo 
                 FROM clientes c 
                 INNER JOIN usuarios u ON c.id_usuario = u.id 
                 ORDER BY c.created_at DESC`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar cliente
     */
    static async update(id, data, updated_by) {
        try {
            const { nombre, apellido, codigo, direccion, estado_actividad, estado } = data;
            
            const [result] = await pool.query(
                `UPDATE clientes 
                 SET nombre = ?, apellido = ?, codigo = ?, direccion = ?, estado_actividad = ?, estado = ?, updated_by = ? 
                 WHERE id = ?`,
                [nombre, apellido, codigo, direccion, estado_actividad, estado, updated_by, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar si existe un código (excluyendo un cliente específico)
     */
    static async codigoExists(codigo, excludeId = null) {
        try {
            let query = 'SELECT id FROM clientes WHERE codigo = ?';
            let params = [codigo];
            
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

module.exports = Cliente;
