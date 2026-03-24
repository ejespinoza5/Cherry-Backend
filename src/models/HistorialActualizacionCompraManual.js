const { pool } = require('../config/database');

class HistorialActualizacionCompraManual {
    /**
     * Crear registro de historial de cambios manuales de compra
     */
    static async create(data) {
        const {
            id_cliente,
            id_orden,
            valor_total_anterior,
            valor_total_nuevo,
            libras_anterior,
            libras_nueva,
            link_excel_anterior,
            link_excel_nuevo,
            actualizado_por
        } = data;

        const query = `
            INSERT INTO historial_actualizacion_compra_manual (
                id_cliente,
                id_orden,
                valor_total_anterior,
                valor_total_nuevo,
                libras_anterior,
                libras_nueva,
                link_excel_anterior,
                link_excel_nuevo,
                actualizado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            id_cliente,
            id_orden,
            valor_total_anterior,
            valor_total_nuevo,
            libras_anterior,
            libras_nueva,
            link_excel_anterior,
            link_excel_nuevo,
            actualizado_por
        ]);

        return result.insertId;
    }

    /**
     * Historial por cliente y orden
     */
    static async findByClienteAndOrden(id_cliente, id_orden) {
        const query = `
            SELECT
                h.id,
                h.id_cliente,
                h.id_orden,
                h.valor_total_anterior,
                h.valor_total_nuevo,
                h.libras_anterior,
                h.libras_nueva,
                h.link_excel_anterior,
                h.link_excel_nuevo,
                h.fecha_actualizacion,
                u.correo AS correo_usuario
            FROM historial_actualizacion_compra_manual h
            INNER JOIN usuarios u ON h.actualizado_por = u.id
            WHERE h.id_cliente = ? AND h.id_orden = ?
            ORDER BY h.fecha_actualizacion DESC
        `;

        const [rows] = await pool.query(query, [id_cliente, id_orden]);
        return rows;
    }

    /**
     * Historial por usuario y orden
     */
    static async findByUsuarioAndOrden(id_usuario, id_orden) {
        const query = `
            SELECT
                h.id,
                h.id_cliente,
                h.id_orden,
                h.valor_total_anterior,
                h.valor_total_nuevo,
                h.libras_anterior,
                h.libras_nueva,
                h.link_excel_anterior,
                h.link_excel_nuevo,
                h.fecha_actualizacion,
                c.nombre AS nombre_cliente,
                c.apellido AS apellido_cliente,
                c.codigo AS codigo_cliente,
                u.correo AS correo_usuario
            FROM historial_actualizacion_compra_manual h
            INNER JOIN clientes c ON h.id_cliente = c.id
            INNER JOIN usuarios uc ON c.id_usuario = uc.id
            INNER JOIN usuarios u ON h.actualizado_por = u.id
            WHERE uc.id = ? AND h.id_orden = ?
            ORDER BY h.fecha_actualizacion DESC
        `;

        const [rows] = await pool.query(query, [id_usuario, id_orden]);
        return rows;
    }
}

module.exports = HistorialActualizacionCompraManual;