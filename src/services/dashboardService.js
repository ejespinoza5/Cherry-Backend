const { pool } = require('../config/database');

class DashboardService {

    /**
     * Obtener la última orden creada (abierta o la más reciente)
     */
    static async getUltimaOrden() {
        const [rows] = await pool.query(
            `SELECT id, nombre_orden 
             FROM ordenes 
             WHERE estado != 'inactivo'
             ORDER BY created_at DESC 
             LIMIT 1`
        );
        return rows[0] || null;
    }

    /**
     * Obtener todas las estadísticas del dashboard basadas en la última orden
     */
    static async getEstadisticas() {
        // 1. Obtener la última orden creada
        const ultimaOrden = await DashboardService.getUltimaOrden();

        const id_orden = ultimaOrden ? ultimaOrden.id : null;

        // Ejecutar todas las consultas en paralelo
        const [
            ingresosMes,
            usuariosActivos,
            abonosPendientes,
            abonosVerificados,
            usuariosBloqueados,
            usuariosInactivos,
            usuariosDeudores,
            administradoresActivos
        ] = await Promise.all([

            // Total de ingresos abonados en la última orden (todos los abonos verificados)
            pool.query(
                `SELECT COALESCE(SUM(ha.cantidad), 0) AS total
                 FROM historial_abono ha
                 WHERE ha.estado_verificacion = 'verificado'
                   AND ha.estado = 'activo'
                   AND ha.id_orden = ?`,
                [id_orden]
            ),

            // Clientes con estado_actividad activo
            pool.query(
                `SELECT COUNT(*) AS total
                 FROM clientes
                 WHERE estado_actividad = 'activo'`
            ),

            // Abonos pendientes de la última orden
            pool.query(
                `SELECT COUNT(*) AS total
                 FROM historial_abono
                 WHERE estado_verificacion = 'pendiente'
                   AND estado = 'activo'
                   AND id_orden = ?`,
                [id_orden]
            ),

            // Abonos verificados de la última orden
            pool.query(
                `SELECT COUNT(*) AS total
                 FROM historial_abono
                 WHERE estado_verificacion = 'verificado'
                   AND estado = 'activo'
                   AND id_orden = ?`,
                [id_orden]
            ),

            // Clientes con estado_actividad bloqueado
            pool.query(
                `SELECT COUNT(*) AS total
                 FROM clientes
                 WHERE estado_actividad = 'bloqueado'`
            ),

            // Clientes con estado_actividad inactivo (los que deben)
            pool.query(
                `SELECT COUNT(*) AS total
                 FROM clientes
                 WHERE estado_actividad = 'inactivo'`
            ),

            // Clientes con estado_actividad deudor
            pool.query(
                `SELECT COUNT(*) AS total
                 FROM clientes
                 WHERE estado_actividad = 'deudor'`
            ),

            // Administradores activos (rol admin = 1, superAdmin = 3)
            pool.query(
                `SELECT COUNT(*) AS total
                 FROM usuarios u
                 INNER JOIN rol r ON u.id_rol = r.id
                 WHERE u.estado = 'activo'
                   AND u.id_rol IN (1, 3)`
            )
        ]);

        return {
            ultima_orden: ultimaOrden ? ultimaOrden.nombre_orden : null,
            ingresos_orden: Number(ingresosMes[0][0].total),
            usuarios_activos: Number(usuariosActivos[0][0].total),
            abonos_pendientes: Number(abonosPendientes[0][0].total),
            abonos_verificados: Number(abonosVerificados[0][0].total),
            usuarios_bloqueados: Number(usuariosBloqueados[0][0].total),
            usuarios_inactivos: Number(usuariosInactivos[0][0].total),
            usuarios_deudores: Number(usuariosDeudores[0][0].total),
            administradores_activos: Number(administradoresActivos[0][0].total)
        };
    }
    /**
     * Top 3 clientes que más han abonado y top 3 que más deben en la orden actual
     */
    static async getTop3() {
        const ultimaOrden = await DashboardService.getUltimaOrden();
        const id_orden = ultimaOrden ? ultimaOrden.id : null;

        const [topAbonadores, topDeudores] = await Promise.all([

            // Top 3 que más han abonado (abonos verificados)
            pool.query(
                `SELECT 
                    c.id,
                    c.nombre,
                    c.apellido,
                    c.codigo,
                    COALESCE(SUM(ha.cantidad), 0) AS total_abonado
                 FROM clientes c
                 INNER JOIN historial_abono ha ON ha.id_cliente = c.id
                 WHERE ha.id_orden = ?
                   AND ha.estado_verificacion = 'verificado'
                   AND ha.estado = 'activo'
                 GROUP BY c.id, c.nombre, c.apellido, c.codigo
                 ORDER BY total_abonado DESC
                 LIMIT 3`,
                [id_orden]
            ),

            // Top 3 que más deben (valor_total - total_abonos de cliente_orden)
            pool.query(
                `SELECT 
                    c.id,
                    c.nombre,
                    c.apellido,
                    c.codigo,
                    co.valor_total,
                    co.total_abonos,
                    (co.valor_total - co.total_abonos) AS saldo_pendiente
                 FROM cliente_orden co
                 INNER JOIN clientes c ON co.id_cliente = c.id
                 WHERE co.id_orden = ?
                   AND (co.valor_total - co.total_abonos) > 0
                 ORDER BY saldo_pendiente DESC
                 LIMIT 3`,
                [id_orden]
            )
        ]);

        return {
            orden_actual: ultimaOrden ? ultimaOrden.nombre_orden : null,
            top3_mas_abonaron: topAbonadores[0].map(r => ({
                id: r.id,
                nombre: `${r.nombre} ${r.apellido}`,
                codigo: r.codigo,
                total_abonado: Number(r.total_abonado)
            })),
            top3_mas_deben: topDeudores[0].map(r => ({
                id: r.id,
                nombre: `${r.nombre} ${r.apellido}`,
                codigo: r.codigo,
                valor_total: Number(r.valor_total),
                total_abonos: Number(r.total_abonos),
                saldo_pendiente: Number(r.saldo_pendiente)
            }))
        };
    }
}

module.exports = DashboardService;
