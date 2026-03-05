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
     * Obtener una orden por ID
     */
    static async getOrdenById(id_orden) {
        const [rows] = await pool.query(
            `SELECT id, nombre_orden 
             FROM ordenes 
             WHERE id = ? AND estado != 'inactivo'`,
            [id_orden]
        );
        return rows[0] || null;
    }

    /**
     * Obtener todas las estadísticas del dashboard para una orden específica
     */
    static async getEstadisticas(id_orden) {
        const orden = await DashboardService.getOrdenById(id_orden);

        if (!orden) return null;
        // Ejecutar todas las consultas en paralelo
        const [
            ingresosMes,
            usuariosActivos,
            abonosPendientes,
            abonosVerificados,
            abonosRechazados,
            usuariosBloqueados,
            usuariosInactivos,
            usuariosDeudores,
            usuariosRestablecidos,
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

            // Abonos rechazados de la última orden
            pool.query(
                `SELECT COUNT(*) AS total
                 FROM historial_abono
                 WHERE estado_verificacion = 'rechazado'
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

            // Clientes con estado_actividad reestablecido
            pool.query(
                `SELECT COUNT(*) AS total
                 FROM clientes
                 WHERE estado_actividad = 'reestablecido'`
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
            orden: orden.nombre_orden,
            ingresos_orden: Number(ingresosMes[0][0].total),
            usuarios_activos: Number(usuariosActivos[0][0].total),
            abonos_pendientes: Number(abonosPendientes[0][0].total),
            abonos_verificados: Number(abonosVerificados[0][0].total),
            abonos_rechazados: Number(abonosRechazados[0][0].total),
            usuarios_bloqueados: Number(usuariosBloqueados[0][0].total),
            usuarios_inactivos: Number(usuariosInactivos[0][0].total),
            usuarios_deudores: Number(usuariosDeudores[0][0].total),
            usuarios_restablecidos: Number(usuariosRestablecidos[0][0].total),
            administradores_activos: Number(administradoresActivos[0][0].total)
        };
    }
    /**
     * Top 3 clientes que más han abonado y top 3 que más deben en una orden específica
     */
    static async getTop3(id_orden) {
        const orden = await DashboardService.getOrdenById(id_orden);

        if (!orden) return null;
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
            orden: orden.nombre_orden,
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
    /**
     * Comparativo por orden para gráfico de puntos/línea
     * Cada punto = una orden con sus métricas
     */
    static async getComparativoOrdenes() {
        const [rows] = await pool.query(
            `SELECT 
                o.id,
                o.nombre_orden,
                COALESCE(SUM(ha.cantidad), 0) AS total_compras
             FROM ordenes o
             LEFT JOIN historial_abono ha
                    ON ha.id_orden = o.id
                   AND ha.estado_verificacion = 'verificado'
                   AND ha.estado = 'activo'
             WHERE o.estado != 'inactivo'
             GROUP BY o.id, o.nombre_orden
             ORDER BY o.fecha_inicio DESC
             LIMIT 10`
        );

        return rows.reverse().map(r => ({
            id:            r.id,
            nombre_orden:  r.nombre_orden,
            total_compras: Number(r.total_compras)
        }));
    }

    /**
     * Salud de la orden: porcentaje de abonos verificados vs total de compras
     */
    static async getSaludOrden(id_orden) {
        const orden = await DashboardService.getOrdenById(id_orden);

        if (!orden) return null;

        const [[compras], [abonado]] = await Promise.all([
            pool.query(
                `SELECT COALESCE(SUM(valor_total), 0) AS total
                 FROM cliente_orden
                 WHERE id_orden = ?`,
                [id_orden]
            ),
            pool.query(
                `SELECT COALESCE(SUM(cantidad), 0) AS total
                 FROM historial_abono
                 WHERE id_orden = ?
                   AND estado_verificacion = 'verificado'
                   AND estado = 'activo'`,
                [id_orden]
            )
        ]);

        const total_compras  = Number(compras[0].total);
        const total_abonado  = Number(abonado[0].total);
        const saldo_pendiente = Math.max(total_compras - total_abonado, 0);
        const porcentaje     = total_compras > 0
            ? Math.min(Math.round((total_abonado / total_compras) * 100), 100)
            : 0;

        let estado;
        if (porcentaje >= 90)      estado = 'excelente';
        else if (porcentaje >= 70) estado = 'bueno';
        else if (porcentaje >= 40) estado = 'regular';
        else                       estado = 'critico';

        return {
            orden:            orden.nombre_orden,
            total_compras,
            total_abonado,
            saldo_pendiente,
            porcentaje,
            estado
        };
    }

    /**
     * Top 3 clientes con más libras acumuladas en una orden específica
     */
    static async getTop3Libras(id_orden) {
        const orden = await DashboardService.getOrdenById(id_orden);

        if (!orden) return null;

        const [rows] = await pool.query(
            `SELECT 
                c.id,
                c.nombre,
                c.apellido,
                c.codigo,
                co.libras_acumuladas
             FROM cliente_orden co
             INNER JOIN clientes c ON co.id_cliente = c.id
             WHERE co.id_orden = ?
               AND co.libras_acumuladas > 0
             ORDER BY co.libras_acumuladas DESC
             LIMIT 3`,
            [id_orden]
        );

        return {
            orden: orden.nombre_orden,
            top3_libras: rows.map(r => ({
                id:                r.id,
                nombre:            `${r.nombre} ${r.apellido}`,
                codigo:            r.codigo,
                libras_acumuladas: Number(r.libras_acumuladas)
            }))
        };
    }

    /**
     * Clientes activos agrupados por país (para gráfico de pastel)
     */
    static async getClientesPorPais() {
        const [rows] = await pool.query(
            `SELECT 
                c.pais,
                COUNT(*) AS total
             FROM clientes c
             INNER JOIN usuarios u ON c.id_usuario = u.id
             WHERE u.estado = 'activo'
             GROUP BY c.pais
             ORDER BY total DESC`
        );
        return rows.map(r => ({
            pais: r.pais || 'Sin especificar',
            total: Number(r.total)
        }));
    }
}

module.exports = DashboardService;
