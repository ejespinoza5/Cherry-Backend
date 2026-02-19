const { pool } = require('../config/database');

class ClienteOrden {
    /**
     * Crear o actualizar registro de cliente en orden
     */
    static async createOrUpdate(data, connection = null) {
        try {
            const { 
                id_cliente, 
                id_orden, 
                total_compras = 0, 
                total_abonos = 0,
                saldo_al_cierre = 0,
                estado_pago = 'activo'
            } = data;
            
            const useConnection = connection || pool;
            const [result] = await useConnection.query(
                `INSERT INTO cliente_orden 
                    (id_cliente, id_orden, total_compras, total_abonos, saldo_al_cierre, estado_pago) 
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    total_compras = VALUES(total_compras),
                    total_abonos = VALUES(total_abonos),
                    saldo_al_cierre = VALUES(saldo_al_cierre),
                    estado_pago = VALUES(estado_pago)`,
                [id_cliente, id_orden, total_compras, total_abonos, saldo_al_cierre, estado_pago]
            );
            
            return result.insertId || result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar registro por cliente y orden
     */
    static async findByClienteAndOrden(id_cliente, id_orden) {
        try {
            const [rows] = await pool.query(
                `SELECT co.*, 
                        c.nombre, c.apellido, c.codigo,
                        o.nombre_orden
                 FROM cliente_orden co
                 INNER JOIN clientes c ON co.id_cliente = c.id
                 INNER JOIN ordenes o ON co.id_orden = o.id
                 WHERE co.id_cliente = ? AND co.id_orden = ?`,
                [id_cliente, id_orden]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener todos los registros de una orden
     */
    static async findByOrden(id_orden) {
        try {
            const [rows] = await pool.query(
                `SELECT co.*, 
                        c.nombre, c.apellido, c.codigo, c.estado_actividad,
                        (co.total_compras - co.total_abonos) as saldo_actual
                 FROM cliente_orden co
                 INNER JOIN clientes c ON co.id_cliente = c.id
                 WHERE co.id_orden = ?
                 ORDER BY c.nombre ASC`,
                [id_orden]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener historial de órdenes de un cliente
     */
    static async findByCliente(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT co.*, 
                        o.nombre_orden, o.fecha_inicio, o.fecha_fin, o.estado_orden
                 FROM cliente_orden co
                 INNER JOIN ordenes o ON co.id_orden = o.id
                 WHERE co.id_cliente = ?
                 ORDER BY o.created_at DESC`,
                [id_cliente]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar estado de pago al cerrar orden
     */
    static async actualizarAlCierre(id_cliente, id_orden, data, connection = null) {
        try {
            const { 
                saldo_al_cierre, 
                fecha_cierre, 
                fecha_limite_pago,
                estado_pago 
            } = data;
            
            const useConnection = connection || pool;
            const [result] = await useConnection.query(
                `UPDATE cliente_orden 
                 SET saldo_al_cierre = ?, 
                     fecha_cierre = ?, 
                     fecha_limite_pago = ?,
                     estado_pago = ?
                 WHERE id_cliente = ? AND id_orden = ?`,
                [saldo_al_cierre, fecha_cierre, fecha_limite_pago, estado_pago, id_cliente, id_orden]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Registrar abono post-cierre
     */
    static async registrarAbonoPostCierre(id_cliente, id_orden, monto) {
        try {
            const [result] = await pool.query(
                `UPDATE cliente_orden 
                 SET abonos_post_cierre = abonos_post_cierre + ?
                 WHERE id_cliente = ? AND id_orden = ?`,
                [monto, id_cliente, id_orden]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Marcar como pagado
     */
    static async marcarComoPagado(id_cliente, id_orden) {
        try {
            const [result] = await pool.query(
                `UPDATE cliente_orden 
                 SET estado_pago = 'pagado',
                     fecha_pago_completo = NOW()
                 WHERE id_cliente = ? AND id_orden = ?`,
                [id_cliente, id_orden]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Marcar como rematado
     */
    static async marcarComoRematado(id_cliente, id_orden, observaciones = null, connection = null) {
        try {
            const useConnection = connection || pool;
            const [result] = await useConnection.query(
                `UPDATE cliente_orden 
                 SET estado_pago = 'rematado',
                     fecha_remate = NOW(),
                     observaciones = ?
                 WHERE id_cliente = ? AND id_orden = ?`,
                [observaciones, id_cliente, id_orden]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener clientes morosos (periodo de gracia vencido)
     * @param {boolean} incluirVigentes - Si true, incluye clientes en gracia aunque no haya vencido (para remate manual)
     */
    static async obtenerClientesMorosos(id_orden, connection = null, incluirVigentes = false) {
        try {
            const useConnection = connection || pool;
            
            // Si incluirVigentes = true, solo validamos que esté en_gracia y tenga deuda
            // Si incluirVigentes = false (automático), validamos que además ya venció el plazo
            const condicionFecha = incluirVigentes ? '' : 'AND co.fecha_limite_pago < NOW()';
            
            const [rows] = await useConnection.query(
                `SELECT co.*, 
                        c.nombre, c.apellido, c.codigo,
                        (co.total_compras - co.total_abonos) as deuda_pendiente,
                        CASE 
                            WHEN co.fecha_limite_pago < NOW() THEN 'VENCIDO'
                            ELSE 'VIGENTE'
                        END as estado_plazo
                 FROM cliente_orden co
                 INNER JOIN clientes c ON co.id_cliente = c.id
                 WHERE co.id_orden = ? 
                   AND co.estado_pago = 'en_gracia'
                   ${condicionFecha}
                   AND (co.total_compras - co.total_abonos) > 0`,
                [id_orden]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar totales de compras y abonos
     */
    static async actualizarTotales(id_cliente, id_orden, connection = null) {
        try {
            const useConnection = connection || pool;
            
            // Calcular total de compras EN ESTA ORDEN
            const [compras] = await useConnection.query(
                `SELECT COALESCE(SUM(
                    (valor_etiqueta * cantidad_articulos) + 
                    ((valor_etiqueta * cantidad_articulos) * (SELECT impuesto FROM ordenes WHERE id = ?)) + 
                    comision
                ), 0) as total
                FROM productos 
                WHERE id_cliente = ? AND id_orden = ? AND estado = 'activo'`,
                [id_orden, id_cliente, id_orden]
            );

            const total_compras = parseFloat(compras[0].total);

            // Calcular el total de abonos para esta orden específica
            const [abonos] = await useConnection.query(
                `SELECT COALESCE(SUM(monto), 0) as total
                 FROM historial_abono 
                 WHERE id_cliente = ? AND id_orden = ? AND estado_verificacion = 'verificado'`,
                [id_cliente, id_orden]
            );

            const total_abonos = parseFloat(abonos[0].total);

            // Actualizar registro
            await useConnection.query(
                `UPDATE cliente_orden 
                 SET total_compras = ?, total_abonos = ?
                 WHERE id_cliente = ? AND id_orden = ?`,
                [total_compras, total_abonos, id_cliente, id_orden]
            );

            return { total_compras, total_abonos };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ClienteOrden;
