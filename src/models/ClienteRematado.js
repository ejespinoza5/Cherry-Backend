const { pool } = require('../config/database');

class ClienteRematado {
    /**
     * Crear registro de cliente rematado
     */
    static async create(data) {
        try {
            const { 
                id_cliente, 
                id_orden, 
                valor_adeudado, 
                abonos_perdidos,
                motivo = 'incumplimiento_pago',
                fecha_remate,
                observaciones,
                created_by
            } = data;
            
            const [result] = await pool.query(
                `INSERT INTO clientes_rematados 
                    (id_cliente, id_orden, valor_adeudado, abonos_perdidos, 
                     motivo, fecha_remate, observaciones, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [id_cliente, id_orden, valor_adeudado, abonos_perdidos, 
                 motivo, fecha_remate, observaciones, created_by]
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener clientes rematados de una orden
     */
    static async findByOrden(id_orden) {
        try {
            const [rows] = await pool.query(
                `SELECT cr.*, 
                        c.nombre as cliente_nombre, 
                        c.apellido as cliente_apellido,
                        c.codigo as cliente_codigo,
                        c.estado_actividad,
                        u.correo as rematado_por_correo,
                        o.nombre_orden
                 FROM clientes_rematados cr
                 INNER JOIN clientes c ON cr.id_cliente = c.id
                 INNER JOIN ordenes o ON cr.id_orden = o.id
                 LEFT JOIN usuarios u ON cr.created_by = u.id
                 WHERE cr.id_orden = ?
                 ORDER BY cr.created_at DESC`,
                [id_orden]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener historial de remates de un cliente
     */
    static async findByCliente(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT cr.*, 
                        o.nombre_orden,
                        o.fecha_cierre,
                        u.correo as rematado_por_correo
                 FROM clientes_rematados cr
                 INNER JOIN ordenes o ON cr.id_orden = o.id
                 LEFT JOIN usuarios u ON cr.created_by = u.id
                 WHERE cr.id_cliente = ?
                 ORDER BY cr.created_at DESC`,
                [id_cliente]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar si un cliente ya fue rematado en una orden
     */
    static async existeRemate(id_cliente, id_orden) {
        try {
            const [rows] = await pool.query(
                `SELECT id FROM clientes_rematados 
                 WHERE id_cliente = ? AND id_orden = ?`,
                [id_cliente, id_orden]
            );
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener total de abonos perdidos por cliente (todas las órdenes)
     */
    static async obtenerTotalAbonosPerdidos(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT COALESCE(SUM(abonos_perdidos), 0) as total_perdido
                 FROM clientes_rematados
                 WHERE id_cliente = ?`,
                [id_cliente]
            );
            return parseFloat(rows[0].total_perdido || 0);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener total de valores adeudados por cliente (todas las órdenes)
     */
    static async obtenerTotalAdeudado(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT COALESCE(SUM(valor_adeudado), 0) as total_adeudado
                 FROM clientes_rematados
                 WHERE id_cliente = ?`,
                [id_cliente]
            );
            return parseFloat(rows[0].total_adeudado || 0);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener estadísticas de remates por orden
     */
    static async obtenerEstadisticasPorOrden(id_orden) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    COUNT(*) as total_clientes_rematados,
                    SUM(valor_adeudado) as total_valor_adeudado,
                    SUM(abonos_perdidos) as total_abonos_perdidos
                 FROM clientes_rematados
                 WHERE id_orden = ?`,
                [id_orden]
            );
            
            return {
                total_clientes_rematados: rows[0].total_clientes_rematados || 0,
                total_valor_adeudado: parseFloat(rows[0].total_valor_adeudado || 0),
                total_abonos_perdidos: parseFloat(rows[0].total_abonos_perdidos || 0)
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener historial completo de remates con paginación
     */
    static async findAll(page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;
            
            const [rows] = await pool.query(
                `SELECT cr.*, 
                        c.nombre as cliente_nombre, 
                        c.apellido as cliente_apellido,
                        c.codigo as cliente_codigo,
                        o.nombre_orden,
                        u.correo as rematado_por_correo
                 FROM clientes_rematados cr
                 INNER JOIN clientes c ON cr.id_cliente = c.id
                 INNER JOIN ordenes o ON cr.id_orden = o.id
                 LEFT JOIN usuarios u ON cr.created_by = u.id
                 ORDER BY cr.created_at DESC
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );
            
            // Contar total
            const [count] = await pool.query(
                'SELECT COUNT(*) as total FROM clientes_rematados'
            );
            
            return {
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count[0].total,
                    totalPages: Math.ceil(count[0].total / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ClienteRematado;
