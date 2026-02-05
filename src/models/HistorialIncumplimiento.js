const { pool } = require('../config/database');

class HistorialIncumplimiento {
    /**
     * Crear registro de incumplimiento
     */
    static async create(data) {
        try {
            const { 
                id_cliente, 
                id_orden, 
                tipo_incumplimiento,
                monto_adeudado,
                monto_perdido = 0,
                fecha_incumplimiento,
                afecta_credito = true,
                observaciones
            } = data;
            
            const [result] = await pool.query(
                `INSERT INTO historial_incumplimientos 
                    (id_cliente, id_orden, tipo_incumplimiento, monto_adeudado, monto_perdido,
                     fecha_incumplimiento, afecta_credito, observaciones) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [id_cliente, id_orden, tipo_incumplimiento, monto_adeudado, monto_perdido,
                 fecha_incumplimiento, afecta_credito, observaciones]
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener historial de un cliente
     */
    static async findByCliente(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT hi.*, 
                        o.nombre_orden,
                        o.fecha_inicio,
                        o.fecha_fin
                 FROM historial_incumplimientos hi
                 INNER JOIN ordenes o ON hi.id_orden = o.id
                 WHERE hi.id_cliente = ?
                 ORDER BY hi.fecha_incumplimiento DESC`,
                [id_cliente]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener incumplimientos de una orden
     */
    static async findByOrden(id_orden) {
        try {
            const [rows] = await pool.query(
                `SELECT hi.*, 
                        c.nombre as cliente_nombre,
                        c.apellido as cliente_apellido,
                        c.codigo as cliente_codigo
                 FROM historial_incumplimientos hi
                 INNER JOIN clientes c ON hi.id_cliente = c.id
                 WHERE hi.id_orden = ?
                 ORDER BY hi.fecha_incumplimiento DESC`,
                [id_orden]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener score crediticio de un cliente
     */
    static async obtenerScoreCrediticio(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    COUNT(*) as total_incumplimientos,
                    SUM(CASE WHEN tipo_incumplimiento = 'remate' THEN 1 ELSE 0 END) as total_remates,
                    SUM(CASE WHEN tipo_incumplimiento = 'no_pago' THEN 1 ELSE 0 END) as total_no_pagos,
                    SUM(CASE WHEN tipo_incumplimiento = 'pago_tardio' THEN 1 ELSE 0 END) as total_pagos_tardios,
                    SUM(monto_adeudado) as total_adeudado_historico,
                    SUM(monto_perdido) as total_perdido_historico,
                    MAX(fecha_incumplimiento) as ultimo_incumplimiento
                 FROM historial_incumplimientos
                 WHERE id_cliente = ? AND afecta_credito = TRUE`,
                [id_cliente]
            );
            
            const stats = rows[0];
            
            // Calcular score (0-100, donde 100 es perfecto)
            let score = 100;
            score -= (stats.total_remates * 30); // -30 por cada remate
            score -= (stats.total_no_pagos * 20); // -20 por cada no pago
            score -= (stats.total_pagos_tardios * 5); // -5 por cada pago tardío
            
            score = Math.max(0, score); // No puede ser menor a 0
            
            return {
                ...stats,
                score_crediticio: score,
                clasificacion: this._getClasificacion(score)
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Clasificar cliente según score
     */
    static _getClasificacion(score) {
        if (score >= 90) return 'Excelente';
        if (score >= 70) return 'Bueno';
        if (score >= 50) return 'Regular';
        if (score >= 30) return 'Malo';
        return 'Muy Malo';
    }

    /**
     * Verificar si un cliente puede participar en nuevas órdenes
     */
    static async puedeParticipar(id_cliente) {
        try {
            const score = await this.obtenerScoreCrediticio(id_cliente);
            
            // Si tiene score menor a 30 y tiene remates recientes (últimos 30 días), no puede participar
            if (score.score_crediticio < 30 && score.ultimo_incumplimiento) {
                const diasDesdeUltimoIncumplimiento = 
                    (new Date() - new Date(score.ultimo_incumplimiento)) / (1000 * 60 * 60 * 24);
                
                if (diasDesdeUltimoIncumplimiento < 30) {
                    return {
                        puede_participar: false,
                        motivo: 'Cliente con historial crediticio muy malo y incumplimientos recientes',
                        score: score.score_crediticio
                    };
                }
            }
            
            return {
                puede_participar: true,
                score: score.score_crediticio,
                clasificacion: score.clasificacion
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener estadísticas generales de incumplimientos
     */
    static async obtenerEstadisticasGenerales() {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    COUNT(DISTINCT id_cliente) as total_clientes_con_incumplimientos,
                    COUNT(*) as total_incumplimientos,
                    SUM(CASE WHEN tipo_incumplimiento = 'remate' THEN 1 ELSE 0 END) as total_remates,
                    SUM(monto_adeudado) as monto_total_adeudado,
                    SUM(monto_perdido) as monto_total_perdido
                 FROM historial_incumplimientos
                 WHERE afecta_credito = TRUE`
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = HistorialIncumplimiento;
