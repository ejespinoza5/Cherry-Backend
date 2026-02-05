const { pool } = require('../config/database');

class Orden {
    /**
     * Crear nueva orden
     */
    static async create(data) {
        try {
            const { nombre_orden, fecha_inicio, fecha_fin, impuesto, estado, created_by } = data;
            
            const [result] = await pool.query(
                `INSERT INTO ordenes (nombre_orden, fecha_inicio, fecha_fin, impuesto, estado, estado_orden, created_by) 
                 VALUES (?, ?, ?, ?, ?, 'abierta', ?)`,
                [nombre_orden, fecha_inicio, fecha_fin || null, impuesto || 0.08, estado || 'activo', created_by]
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar orden por ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.query(
                `SELECT o.*, 
                        u1.correo as creado_por_correo, 
                        u2.correo as actualizado_por_correo
                 FROM ordenes o
                 LEFT JOIN usuarios u1 ON o.created_by = u1.id
                 LEFT JOIN usuarios u2 ON o.updated_by = u2.id
                 WHERE o.id = ? AND o.estado != 'inactivo'`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener todas las órdenes
     */
    static async findAll(filters = {}) {
        try {
            let query = `
                SELECT o.*, 
                       u1.correo as creado_por_correo, 
                       u2.correo as actualizado_por_correo
                FROM ordenes o
                LEFT JOIN usuarios u1 ON o.created_by = u1.id
                LEFT JOIN usuarios u2 ON o.updated_by = u2.id
                WHERE 1=1 AND o.estado != 'inactivo'
            `;
            const params = [];

            if (filters.estado) {
                query += ' AND o.estado = ?';
                params.push(filters.estado);
            }

            if (filters.fecha_inicio) {
                query += ' AND DATE(o.fecha_inicio) >= ?';
                params.push(filters.fecha_inicio);
            }

            if (filters.fecha_fin) {
                query += ' AND DATE(o.fecha_fin) <= ?';
                params.push(filters.fecha_fin);
            }

            query += ' ORDER BY o.created_at DESC';

            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar orden
     */
    static async update(id, data, updated_by) {
        try {
            const { nombre_orden, fecha_inicio, fecha_fin, impuesto, estado } = data;
            
            const [result] = await pool.query(
                `UPDATE ordenes 
                 SET nombre_orden = ?, fecha_inicio = ?, fecha_fin = ?, impuesto = ?, estado = ?, updated_by = ? 
                 WHERE id = ?`,
                [nombre_orden, fecha_inicio, fecha_fin || null, impuesto, estado, updated_by, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cerrar orden (manual o automáticamente)
     */
    static async cerrarOrden(id, closed_by, tipo_cierre = 'manual', connection = null) {
        try {
            const useConnection = connection || pool;
            const [result] = await useConnection.query(
                `UPDATE ordenes 
                 SET estado_orden = 'cerrada', 
                     fecha_cierre = NOW(),
                     tipo_cierre = ?,
                     closed_by = ?,
                     updated_by = ?
                 WHERE id = ? AND estado_orden = 'abierta'`,
                [tipo_cierre, closed_by, closed_by, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cambiar a periodo de gracia
     */
    static async cambiarAPeriodoGracia(id) {
        try {
            const [result] = await pool.query(
                `UPDATE ordenes 
                 SET estado_orden = 'en_periodo_gracia'
                 WHERE id = ? AND estado_orden = 'cerrada'`,
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reabrir orden (solo administradores)
     */
    static async reabrirOrden(id, updated_by) {
        try {
            const [result] = await pool.query(
                `UPDATE ordenes 
                 SET estado_orden = 'abierta',
                     fecha_cierre = NULL,
                     tipo_cierre = NULL,
                     closed_by = NULL,
                     updated_by = ?
                 WHERE id = ? AND estado_orden IN ('cerrada', 'en_periodo_gracia')`,
                [updated_by, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar si una orden está cerrada
     */
    static async estaCerrada(id) {
        try {
            const [rows] = await pool.query(
                `SELECT estado_orden FROM ordenes WHERE id = ?`,
                [id]
            );
            
            if (rows.length === 0) return null;
            return rows[0].estado_orden !== 'abierta';
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener órdenes que deben cerrarse automáticamente
     */
    static async obtenerOrdenesParaCerrarAutomaticamente() {
        try {
            const [rows] = await pool.query(
                `SELECT * FROM ordenes 
                 WHERE estado_orden = 'abierta' 
                   AND fecha_fin IS NOT NULL 
                   AND fecha_fin <= NOW()
                   AND estado = 'activo'`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener órdenes en periodo de gracia que vencieron
     */
    static async obtenerOrdenesConGraciaVencida() {
        try {
            const [rows] = await pool.query(
                `SELECT o.* 
                 FROM ordenes o
                 INNER JOIN cierre_orden co ON o.id = co.id_orden
                 WHERE o.estado_orden = 'en_periodo_gracia'
                   AND co.fecha_limite_pago <= NOW()`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Eliminar orden (soft delete)
     */
    static async delete(id, updated_by) {
        try {
            const [result] = await pool.query(
                `UPDATE ordenes 
                 SET estado = 'inactivo', updated_by = ? 
                 WHERE id = ?`,
                [updated_by, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar si existe una orden con el mismo nombre
     */
    static async nombreExists(nombre_orden, excludeId = null) {
        try {
            let query = 'SELECT id FROM ordenes WHERE nombre_orden = ?';
            let params = [nombre_orden];
            
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

    /**
     * Obtener estadísticas de una orden
     */
    static async getEstadisticas(id) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    COUNT(DISTINCT p.id_cliente) as total_clientes,
                    COUNT(p.id) as total_productos,
                    SUM(p.cantidad_articulos) as total_articulos,
                    SUM(p.valor_etiqueta * p.cantidad_articulos) as subtotal,
                    SUM(p.comision) as total_comisiones
                 FROM productos p
                 WHERE p.id_orden = ? AND p.estado = 'activo'`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar órdenes abiertas (con opción de excluir una)
     */
    static async findOrdenesAbiertas(excludeId = null) {
        try {
            let query = `SELECT id, nombre_orden, fecha_inicio, fecha_fin 
                         FROM ordenes 
                         WHERE estado_orden = 'abierta' AND estado = 'activo'`;
            let params = [];
            
            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }
            
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Orden;
