const { pool } = require('../config/database');

class ProductoRematado {
    /**
     * Crear registro de producto rematado
     */
    static async create(data) {
        try {
            const { 
                id_producto, 
                id_cliente, 
                id_orden, 
                valor_producto, 
                abonos_perdidos,
                motivo = 'incumplimiento_pago',
                fecha_remate,
                observaciones,
                created_by
            } = data;
            
            const [result] = await pool.query(
                `INSERT INTO productos_rematados 
                    (id_producto, id_cliente, id_orden, valor_producto, abonos_perdidos, 
                     motivo, fecha_remate, observaciones, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id_producto, id_cliente, id_orden, valor_producto, abonos_perdidos, 
                 motivo, fecha_remate, observaciones, created_by]
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener productos rematados de una orden
     */
    static async findByOrden(id_orden) {
        try {
            const [rows] = await pool.query(
                `SELECT pr.*, 
                        c.nombre as cliente_nombre, 
                        c.apellido as cliente_apellido,
                        c.codigo as cliente_codigo,
                        p.detalles as producto_detalles,
                        p.cantidad_articulos,
                        u.correo as rematado_por_correo
                 FROM productos_rematados pr
                 INNER JOIN clientes c ON pr.id_cliente = c.id
                 INNER JOIN productos p ON pr.id_producto = p.id
                 LEFT JOIN usuarios u ON pr.created_by = u.id
                 WHERE pr.id_orden = ?
                 ORDER BY pr.created_at DESC`,
                [id_orden]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener productos rematados de un cliente
     */
    static async findByCliente(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT pr.*, 
                        o.nombre_orden,
                        p.detalles as producto_detalles,
                        p.cantidad_articulos,
                        u.correo as rematado_por_correo
                 FROM productos_rematados pr
                 INNER JOIN ordenes o ON pr.id_orden = o.id
                 INNER JOIN productos p ON pr.id_producto = p.id
                 LEFT JOIN usuarios u ON pr.created_by = u.id
                 WHERE pr.id_cliente = ?
                 ORDER BY pr.created_at DESC`,
                [id_cliente]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener total de abonos perdidos por cliente
     */
    static async obtenerTotalAbonosPerdidos(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT COALESCE(SUM(abonos_perdidos), 0) as total_perdido
                 FROM productos_rematados
                 WHERE id_cliente = ?`,
                [id_cliente]
            );
            return rows[0].total_perdido;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener estadísticas de remates de una orden
     */
    static async obtenerEstadisticasOrden(id_orden) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    COUNT(DISTINCT id_cliente) as total_clientes_rematados,
                    COUNT(*) as total_productos_rematados,
                    SUM(valor_producto) as valor_total_productos,
                    SUM(abonos_perdidos) as total_abonos_perdidos
                 FROM productos_rematados
                 WHERE id_orden = ?`,
                [id_orden]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ProductoRematado;
