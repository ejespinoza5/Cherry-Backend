const { pool } = require('../config/database');
const ClienteOrden = require('../models/ClienteOrden');
const Orden = require('../models/Orden');

class VerificarPagoOrdenService {
    /**
     * Verificar si un cliente ya pagó su deuda y actualizar su estado
     * Se ejecuta cuando se hace un abono
     */
    static async verificarYActualizarPagoCliente(id_cliente) {
        try {
            // Buscar órdenes en periodo de gracia donde este cliente tiene deuda
            const [ordenesEnGracia] = await pool.query(
                `SELECT co.id_cliente, co.id_orden, co.saldo_al_cierre, co.abonos_post_cierre,
                        (co.saldo_al_cierre - co.abonos_post_cierre) as deuda_restante,
                        o.nombre_orden
                 FROM cliente_orden co
                 INNER JOIN ordenes o ON co.id_orden = o.id
                 WHERE co.id_cliente = ? 
                   AND o.estado_orden = 'en_periodo_gracia'
                   AND co.estado_pago = 'en_gracia'`,
                [id_cliente]
            );

            for (const orden of ordenesEnGracia) {
                // Obtener el saldo ACTUAL y estado del cliente
                const [cliente] = await pool.query(
                    `SELECT saldo, estado_actividad FROM clientes WHERE id = ?`,
                    [id_cliente]
                );

                const saldo_actual = parseFloat(cliente[0].saldo);
                const estado_actividad = cliente[0].estado_actividad;

                // IMPORTANTE: NO procesar clientes BLOQUEADOS (fueron rematados)
                // Los clientes rematados permanecen bloqueados aunque tengan saldo
                if (estado_actividad === 'bloqueado') {
                    console.log(`Cliente ${id_cliente} está bloqueado (rematado), no se procesa el pago automático`);
                    continue;
                }

                // Si el saldo ya NO es negativo, significa que pagó su deuda
                if (saldo_actual >= 0) {
                    // Marcar cliente como pagado
                    await ClienteOrden.marcarComoPagado(id_cliente, orden.id_orden);

                    // Calcular cuánto abonó después del cierre
                    const saldo_al_cierre = parseFloat(orden.saldo_al_cierre);
                    const abonos_post_cierre = saldo_al_cierre; // Pagó toda la deuda

                    // Actualizar abonos post-cierre
                    await pool.query(
                        `UPDATE cliente_orden 
                         SET abonos_post_cierre = ?
                         WHERE id_cliente = ? AND id_orden = ?`,
                        [abonos_post_cierre, id_cliente, orden.id_orden]
                    );

                    // Actualizar estado del cliente de deudor a activo
                    await pool.query(
                        `UPDATE clientes 
                         SET estado_actividad = 'activo'
                         WHERE id = ? AND estado_actividad = 'deudor'`,
                        [id_cliente]
                    );

                    console.log(`Cliente ${id_cliente} pagó su deuda en orden ${orden.id_orden}`);

                    // Verificar si TODOS los clientes de esta orden ya pagaron
                    await this.verificarYCerrarPeriodoGracia(orden.id_orden);
                }
            }
        } catch (error) {
            console.error('Error al verificar pago de cliente:', error);
            throw error;
        }
    }

    /**
     * Verificar si todos los clientes pagaron y cerrar periodo de gracia
     */
    static async verificarYCerrarPeriodoGracia(id_orden) {
        try {
            // Verificar si quedan clientes pendientes de pago
            const [clientesPendientes] = await pool.query(
                `SELECT COUNT(*) as total
                 FROM cliente_orden
                 WHERE id_orden = ? 
                   AND estado_pago = 'en_gracia'`,
                [id_orden]
            );

            // Si NO hay clientes pendientes, cerrar periodo de gracia
            if (clientesPendientes[0].total === 0) {
                await pool.query(
                    `UPDATE ordenes 
                     SET estado_orden = 'cerrada'
                     WHERE id = ? AND estado_orden = 'en_periodo_gracia'`,
                    [id_orden]
                );

                // Actualizar estadísticas en cierre_orden
                await pool.query(
                    `UPDATE cierre_orden 
                     SET clientes_pagados = (
                         SELECT COUNT(*) FROM cliente_orden 
                         WHERE id_orden = ? AND estado_pago = 'pagado'
                     ),
                     clientes_pendientes = 0
                     WHERE id_orden = ?`,
                    [id_orden, id_orden]
                );

                console.log(`✅ Orden ${id_orden} cerrada completamente - Todos pagaron`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error al verificar cierre de periodo de gracia:', error);
            throw error;
        }
    }

    /**
     * API Manual: Verificar y actualizar estado de una orden manualmente
     */
    static async verificarOrdenManual(id_orden) {
        try {
            const cerrado = await this.verificarYCerrarPeriodoGracia(id_orden);

            if (cerrado) {
                return {
                    success: true,
                    mensaje: 'Todos los clientes pagaron. Periodo de gracia cerrado correctamente.',
                    estado_final: 'cerrada'
                };
            } else {
                const [pendientes] = await pool.query(
                    `SELECT c.nombre, c.apellido, co.saldo_al_cierre, co.abonos_post_cierre,
                            (co.saldo_al_cierre - co.abonos_post_cierre) as deuda_pendiente
                     FROM cliente_orden co
                     INNER JOIN clientes c ON co.id_cliente = c.id
                     WHERE co.id_orden = ? AND co.estado_pago = 'en_gracia'`,
                    [id_orden]
                );

                return {
                    success: false,
                    mensaje: `Aún hay ${pendientes.length} cliente(s) con deuda pendiente`,
                    clientes_pendientes: pendientes,
                    estado_actual: 'en_periodo_gracia'
                };
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = VerificarPagoOrdenService;
