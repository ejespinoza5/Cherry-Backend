const { pool } = require('../config/database');

class HistorialActualizacionLibras {
    /**
     * Crear un registro de historial de actualizacion de libras
     */
    static async create(data) {
        const {
            id_cliente,
            id_orden,
            libras_anterior,
            libras_nueva,
            actualizado_por,
            observaciones = null
        } = data;

        const query = `
            INSERT INTO historial_actualizacion_libras 
            (id_cliente, id_orden, libras_anterior, libras_nueva, actualizado_por, observaciones)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            id_cliente,
            id_orden,
            libras_anterior,
            libras_nueva,
            actualizado_por,
            observaciones
        ]);

        return result.insertId;
    }

    /**
     * Obtener historial de actualizaciones por cliente y orden
     */
    static async findByClienteAndOrden(id_cliente, id_orden) {
        const query = `
            SELECT 
                hal.id,
                hal.id_cliente,
                hal.id_orden,
                hal.libras_anterior,
                hal.libras_nueva,
                hal.fecha_actualizacion,
                hal.observaciones,
                u.correo as correo_usuario
            FROM historial_actualizacion_libras hal
            INNER JOIN usuarios u ON hal.actualizado_por = u.id
            WHERE hal.id_cliente = ? AND hal.id_orden = ?
            ORDER BY hal.fecha_actualizacion DESC
        `;

        const [rows] = await pool.query(query, [id_cliente, id_orden]);
        return rows;
    }

    /**
     * Obtener historial de actualizaciones por cliente (todas las ordenes)
     */
    static async findByCliente(id_cliente) {
        const query = `
            SELECT 
                hal.id,
                hal.id_cliente,
                hal.id_orden,
                hal.libras_anterior,
                hal.libras_nueva,
                hal.fecha_actualizacion,
                hal.observaciones,
                o.nombre_orden,
                u.correo as correo_usuario
            FROM historial_actualizacion_libras hal
            INNER JOIN usuarios u ON hal.actualizado_por = u.id
            INNER JOIN ordenes o ON hal.id_orden = o.id
            WHERE hal.id_cliente = ?
            ORDER BY hal.fecha_actualizacion DESC
        `;

        const [rows] = await pool.query(query, [id_cliente]);
        return rows;
    }

    /**
     * Obtener historial de actualizaciones por orden (todos los clientes)
     */
    static async findByOrden(id_orden) {
        const query = `
            SELECT 
                hal.id,
                hal.id_cliente,
                hal.id_orden,
                hal.libras_anterior,
                hal.libras_nueva,
                hal.fecha_actualizacion,
                hal.observaciones,
                c.nombre as nombre_cliente,
                c.apellido as apellido_cliente,
                c.codigo as codigo_cliente,
                u.correo as correo_usuario
            FROM historial_actualizacion_libras hal
            INNER JOIN usuarios u ON hal.actualizado_por = u.id
            INNER JOIN clientes c ON hal.id_cliente = c.id
            WHERE hal.id_orden = ?
            ORDER BY hal.fecha_actualizacion DESC
        `;

        const [rows] = await pool.query(query, [id_orden]);
        return rows;
    }

    /**
     * Obtener todo el historial (con paginación opcional)
     */
    static async findAll(limit = 100, offset = 0) {
        const query = `
            SELECT 
                hal.id,
                hal.id_cliente,
                hal.id_orden,
                hal.libras_anterior,
                hal.libras_nueva,
                hal.fecha_actualizacion,
                hal.observaciones,
                c.nombre as nombre_cliente,
                c.apellido as apellido_cliente,
                c.codigo as codigo_cliente,
                o.nombre_orden,
                u.correo as correo_usuario
            FROM historial_actualizacion_libras hal
            INNER JOIN usuarios u ON hal.actualizado_por = u.id
            INNER JOIN clientes c ON hal.id_cliente = c.id
            INNER JOIN ordenes o ON hal.id_orden = o.id
            ORDER BY hal.fecha_actualizacion DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(query, [limit, offset]);
        return rows;
    }

    /**
     * Obtener un registro por ID
     */
    static async findById(id) {
        const query = `
            SELECT 
                hal.id,
                hal.id_cliente,
                hal.id_orden,
                hal.libras_anterior,
                hal.libras_nueva,
                hal.fecha_actualizacion,
                hal.observaciones,
                c.nombre as nombre_cliente,
                c.apellido as apellido_cliente,
                c.codigo as codigo_cliente,
                o.nombre_orden,
                u.correo as correo_usuario
            FROM historial_actualizacion_libras hal
            INNER JOIN usuarios u ON hal.actualizado_por = u.id
            INNER JOIN clientes c ON hal.id_cliente = c.id
            INNER JOIN ordenes o ON hal.id_orden = o.id
            WHERE hal.id = ?
        `;

        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }
}

module.exports = HistorialActualizacionLibras;
