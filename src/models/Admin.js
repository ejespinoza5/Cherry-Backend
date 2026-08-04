const { pool } = require('../config/database');

class Admin {
    /**
     * Crear registro de administrador
     */
    static async create(data, connection = null) {
        const { id_usuario, nombre, apellido = '', created_by } = data;
        const useConnection = connection || pool;

        const [result] = await useConnection.query(
            `INSERT INTO admins (id_usuario, nombre, apellido, estado, created_by)
             VALUES (?, ?, ?, 'activo', ?)` ,
            [id_usuario, nombre, apellido, created_by]
        );

        return result.insertId;
    }

    /**
     * Buscar admin por id_usuario
     */
    static async findByUsuario(id_usuario) {
        const [rows] = await pool.query(
            'SELECT * FROM admins WHERE id_usuario = ? AND estado = "activo"',
            [id_usuario]
        );

        return rows[0] || null;
    }

    /**
     * Buscar admin por id_usuario sin filtrar estado
     */
    static async findByUsuarioAny(id_usuario, connection = null) {
        const useConnection = connection || pool;
        const [rows] = await useConnection.query(
            'SELECT * FROM admins WHERE id_usuario = ?',
            [id_usuario]
        );

        return rows[0] || null;
    }

    /**
     * Actualizar datos del admin
     */
    static async update(id, data, updated_by, connection = null) {
        const { nombre, apellido = '', estado = 'activo' } = data;
        const useConnection = connection || pool;

        const [result] = await useConnection.query(
            `UPDATE admins
             SET nombre = ?, apellido = ?, estado = ?, updated_by = ?
             WHERE id = ?`,
            [nombre, apellido, estado, updated_by, id]
        );

        return result.affectedRows > 0;
    }
}

module.exports = Admin;