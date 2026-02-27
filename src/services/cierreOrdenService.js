const Orden = require('../models/Orden');
const ClienteOrden = require('../models/ClienteOrden');
const ClienteRematado = require('../models/ClienteRematado');
const HistorialIncumplimiento = require('../models/HistorialIncumplimiento');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const { pool } = require('../config/database');

class CierreOrdenService {
    /**
     * Cerrar una orden manualmente
     */
    static async cerrarOrdenManual(id_orden, usuario_id) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Verificar que la orden existe y está abierta
            const orden = await Orden.findById(id_orden);
            if (!orden) {
                throw new Error('Orden no encontrada');
            }

            if (orden.estado_orden !== 'abierta') {
                throw new Error('La orden ya está cerrada');
            }

            // Procesar el cierre (esto incluye cerrar la orden con el estado correcto)
            const resultadoCierre = await this._procesarCierre(id_orden, usuario_id, connection);

            await connection.commit();

            return {
                success: true,
                mensaje: 'Orden cerrada exitosamente',
                ...resultadoCierre
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Cerrar órdenes automáticamente (cron job)
     */
    static async cerrarOrdenesAutomaticamente() {
        try {
            const ordenes = await Orden.obtenerOrdenesParaCerrarAutomaticamente();
            
            const resultados = [];
            for (const orden of ordenes) {
                try {
                    const resultado = await this.cerrarOrdenManual(orden.id, 1); // Usuario sistema
                    resultados.push({
                        orden_id: orden.id,
                        nombre: orden.nombre_orden,
                        success: true,
                        ...resultado
                    });
                } catch (error) {
                    resultados.push({
                        orden_id: orden.id,
                        nombre: orden.nombre_orden,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            return resultados;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Procesar cierre de orden (interno)
     */
    static async _procesarCierre(id_orden, usuario_id, connection = null) {
        const useConnection = connection || await pool.getConnection();
        
        try {
            if (!connection) await useConnection.beginTransaction();

            const orden = await Orden.findById(id_orden);
            const fecha_cierre = new Date();
            const fecha_limite_pago = new Date(fecha_cierre.getTime() + (1 * 60 * 1000)); // +1 minuto

            // Obtener todos los clientes que tienen valor_total > 0 en esta orden
            const [clientes] = await useConnection.query(
                `SELECT id_cliente, valor_total, total_abonos 
                 FROM cliente_orden 
                 WHERE id_orden = ? AND valor_total > 0`,
                [id_orden]
            );

            let stats = {
                total_clientes: 0,
                clientes_pagados: 0,
                clientes_pendientes: 0,
                clientes_con_deuda: 0
            };

            // Procesar cada cliente
            for (const cliente of clientes) {
                stats.total_clientes++;

                const { id_cliente, valor_total, total_abonos } = cliente;
                
                // Calcular deuda: valor_total - total_abonos
                const saldo_actual = parseFloat(valor_total) - parseFloat(total_abonos);

                // Si el saldo es positivo, el cliente tiene deuda
                let estado_pago = 'pagado';
                if (saldo_actual > 0) {
                    estado_pago = 'en_gracia'; // Para cliente_orden
                    stats.clientes_con_deuda++;
                } else {
                    stats.clientes_pagados++;
                }

                // Actualizar estado al cierre
                // saldo_al_cierre es el valor de lo que debe (si es positivo)
                await ClienteOrden.actualizarAlCierre(id_cliente, id_orden, {
                    saldo_al_cierre: (saldo_actual > 0 ? saldo_actual : 0),
                    fecha_cierre: fecha_cierre,
                    fecha_limite_pago: fecha_limite_pago,
                    estado_pago: estado_pago
                }, useConnection);

                // Calcular y actualizar estado_actividad del cliente
                await Cliente.calcularYActualizarEstadoActividad(id_cliente, useConnection);
            }

            stats.clientes_pendientes = stats.clientes_con_deuda;

            // Calcular totales de la orden desde cliente_orden
            const [totalesOrden] = await useConnection.query(
                `SELECT 
                    COALESCE(SUM(valor_total), 0) as subtotal,
                    0 as comisiones
                 FROM cliente_orden
                 WHERE id_orden = ? AND valor_total > 0`,
                [id_orden]
            );

            const subtotal = parseFloat(totalesOrden[0].subtotal) || 0;
            const comisiones = parseFloat(totalesOrden[0].comisiones) || 0;
            const total_final = subtotal + comisiones;

            // Crear o actualizar registro de cierre
            await useConnection.query(
                `INSERT INTO cierre_orden 
                    (id_orden, subtotal, comisiones, total_final, 
                     fecha_cierre, fecha_limite_pago, tipo_cierre,
                     total_clientes, clientes_pagados, clientes_pendientes, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    subtotal = VALUES(subtotal),
                    comisiones = VALUES(comisiones),
                    total_final = VALUES(total_final),
                    fecha_cierre = VALUES(fecha_cierre),
                    fecha_limite_pago = VALUES(fecha_limite_pago),
                    tipo_cierre = VALUES(tipo_cierre),
                    total_clientes = VALUES(total_clientes),
                    clientes_pagados = VALUES(clientes_pagados),
                    clientes_pendientes = VALUES(clientes_pendientes)`,
                [id_orden, subtotal, comisiones, total_final,
                 fecha_cierre, fecha_limite_pago, orden.tipo_cierre || 'manual',
                 stats.total_clientes, stats.clientes_pagados, stats.clientes_pendientes,
                 usuario_id]
            );

            // Determinar el estado final de la orden:
            // - 'en_periodo_gracia' si hay clientes con deuda
            // - 'cerrada' si todos pagaron
            const estado_final = stats.clientes_con_deuda > 0 ? 'en_periodo_gracia' : 'cerrada';

            // Cerrar la orden con el estado correcto
            await useConnection.query(
                `UPDATE ordenes 
                 SET estado_orden = ?, 
                     fecha_cierre = ?,
                     tipo_cierre = ?,
                     closed_by = ?,
                     updated_by = ?
                 WHERE id = ? AND estado_orden = 'abierta'`,
                [estado_final, fecha_cierre, orden.tipo_cierre || 'manual', usuario_id, usuario_id, id_orden]
            );

            if (!connection) await useConnection.commit();

            return {
                fecha_cierre,
                fecha_limite_pago,
                totales: {
                    subtotal,
                    comisiones,
                    total_final
                },
                estadisticas: stats
            };
        } catch (error) {
            if (!connection) await useConnection.rollback();
            throw error;
        } finally {
            if (!connection) useConnection.release();
        }
    }

    /**
     * Rematar clientes morosos (sin productos, usando valor_total manual)
     * @param {boolean} forzar - Si true, remata aunque no hayan pasado las 48h (remate manual)
     */
    static async rematarClientesMorosos(id_orden, usuario_id, forzar = false) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Obtener clientes morosos
            // Si forzar=true, obtiene todos los clientes en gracia (manual)
            // Si forzar=false, solo obtiene los que ya vencieron (automático)
            const clientesMorosos = await ClienteOrden.obtenerClientesMorosos(id_orden, connection, forzar);

            const resultados = [];

            for (const clienteOrden of clientesMorosos) {
                const ClienteRematado = require('../models/ClienteRematado');
                
                // Verificar si este cliente ya fue rematado antes (evitar duplicados)
                const yaRematado = await ClienteRematado.existeRemate(clienteOrden.id_cliente, id_orden);
                
                if (yaRematado) {
                    continue;
                }

                const deuda_pendiente = parseFloat(clienteOrden.deuda_pendiente || 0);
                const abonos_perdidos = parseFloat(clienteOrden.total_abonos || 0);

                const observacion = forzar 
                    ? `Remate manual por administrador antes de vencer el periodo de gracia (${clienteOrden.estado_plazo})`
                    : `Remate automático por no pagar en periodo de gracia de 48 horas`;
                
                // Rematar al cliente completo (no productos individuales)
                await ClienteRematado.create({
                    id_cliente: clienteOrden.id_cliente,
                    id_orden: id_orden,
                    valor_adeudado: deuda_pendiente,
                    abonos_perdidos: abonos_perdidos,
                    motivo: 'incumplimiento_pago',
                    fecha_remate: new Date(),
                    observaciones: observacion,
                    created_by: usuario_id
                });

                // Registrar incumplimiento (solo si no existe)
                const [incumpAnterior] = await connection.query(
                    `SELECT id FROM historial_incumplimientos 
                     WHERE id_cliente = ? AND id_orden = ? AND tipo_incumplimiento = 'remate'`,
                    [clienteOrden.id_cliente, id_orden]
                );

                if (incumpAnterior.length === 0) {
                    const observacionIncump = forzar
                        ? `Remate manual por administrador. Estado: ${clienteOrden.estado_plazo}`
                        : `Cliente no pagó en el periodo de gracia de 48 horas`;
                    
                    await HistorialIncumplimiento.create({
                        id_cliente: clienteOrden.id_cliente,
                        id_orden: id_orden,
                        tipo_incumplimiento: 'remate',
                        monto_adeudado: deuda_pendiente,
                        monto_perdido: abonos_perdidos,
                        fecha_incumplimiento: new Date(),
                        afecta_credito: true,
                        observaciones: observacionIncump
                    });
                }

                // Marcar cliente_orden como rematado
                await ClienteOrden.marcarComoRematado(
                    clienteOrden.id_cliente,
                    id_orden,
                    `Cliente rematado por mora. Abonos perdidos: $${abonos_perdidos}`,
                    connection
                );

                // Actualizar estado del cliente a bloqueado
                await connection.query(
                    `UPDATE clientes 
                     SET estado_actividad = 'bloqueado'
                     WHERE id = ?`,
                    [clienteOrden.id_cliente]
                );

                // Actualizar estadísticas en cierre_orden
                await connection.query(
                    `UPDATE cierre_orden 
                     SET clientes_rematados = clientes_rematados + 1,
                         clientes_pendientes = clientes_pendientes - 1
                     WHERE id_orden = ?`,
                    [id_orden]
                );

                resultados.push({
                    cliente_id: clienteOrden.id_cliente,
                    nombre: `${clienteOrden.nombre} ${clienteOrden.apellido}`,
                    codigo: clienteOrden.codigo,
                    valor_adeudado: deuda_pendiente.toFixed(2),
                    abonos_perdidos: abonos_perdidos.toFixed(2)
                });
            }

            // Verificar si ya NO quedan clientes pendientes en la orden
            const [pendientes] = await connection.query(
                `SELECT COUNT(*) as total
                 FROM cliente_orden
                 WHERE id_orden = ? AND estado_pago = 'en_gracia'`,
                [id_orden]
            );

            // Si ya no hay clientes pendientes, cerrar completamente la orden
            if (pendientes[0].total === 0) {
                await connection.query(
                    `UPDATE ordenes 
                     SET estado_orden = 'cerrada'
                     WHERE id = ?`,
                    [id_orden]
                );
            }

            await connection.commit();

            return {
                success: true,
                mensaje: `Se remataron ${resultados.length} cliente(s) moroso(s)`,
                clientes_rematados: resultados,
                orden_cerrada: pendientes[0].total === 0
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Procesar remates automáticos (cron job)
     */
    static async procesarRematesAutomaticos() {
        try {
            const ordenesVencidas = await Orden.obtenerOrdenesConGraciaVencida();
            
            const resultados = [];
            for (const orden of ordenesVencidas) {
                try {
                    const resultado = await this.rematarClientesMorosos(orden.id, 1); // Usuario sistema
                    resultados.push({
                        orden_id: orden.id,
                        nombre: orden.nombre_orden,
                        ...resultado
                    });
                } catch (error) {
                    resultados.push({
                        orden_id: orden.id,
                        nombre: orden.nombre_orden,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            return resultados;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reabrir orden (solo administradores)
     */
    static async reabrirOrden(id_orden, usuario_id) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const orden = await Orden.findById(id_orden);
            
            if (!orden) {
                throw new Error('Orden no encontrada');
            }

            if (orden.estado_orden === 'abierta') {
                throw new Error('La orden ya está abierta');
            }

            // Verificar que NO haya OTRAS órdenes en periodo de gracia en el sistema
            const ordenesEnGracia = await Orden.findOrdenesEnGracia(id_orden);

            if (ordenesEnGracia.length > 0) {
                const ordenGracia = ordenesEnGracia[0];
                const fechaLimite = new Date(ordenGracia.fecha_limite_pago);
                const ahora = new Date();
                const horasRestantes = Math.ceil((fechaLimite - ahora) / (1000 * 60 * 60));

                throw new Error(
                    `No se puede reabrir porque la orden "${ordenGracia.nombre_orden}" está en periodo de gracia. ` +
                    `Opciones: espera ${horasRestantes}h o remata a los clientes morosos.`
                );
            }

            // Verificar que NO haya otras órdenes abiertas
            const ordenesAbiertas = await Orden.findOrdenesAbiertas(id_orden);

            if (ordenesAbiertas.length > 0) {
                const ordenAbierta = ordenesAbiertas[0];
                throw new Error(
                    `No se puede reabrir esta orden porque ya existe otra orden abierta: "${ordenAbierta.nombre_orden}". ` +
                    `Solo puede haber una orden abierta a la vez. Cierra primero la orden actual.`
                );
            }

            // LIMPIAR TODOS LOS DATOS DEL CIERRE ANTERIOR
            
            // 1. Obtener IDs de clientes que fueron rematados en esta orden
            const [clientesRematados] = await connection.query(
                `SELECT DISTINCT id_cliente FROM clientes_rematados WHERE id_orden = ?`,
                [id_orden]
            );

            // 2. Eliminar clientes rematados de esta orden
            await connection.query(
                `DELETE FROM clientes_rematados WHERE id_orden = ?`,
                [id_orden]
            );

            // 3. Eliminar registros de cliente_orden
            await connection.query(
                `DELETE FROM cliente_orden WHERE id_orden = ?`,
                [id_orden]
            );

            // 4. Eliminar historial de incumplimientos de esta orden
            await connection.query(
                `DELETE FROM historial_incumplimientos WHERE id_orden = ?`,
                [id_orden]
            );

            // 5. Eliminar registro de cierre_orden
            await connection.query(
                `DELETE FROM cierre_orden WHERE id_orden = ?`,
                [id_orden]
            );

            // 6. Restaurar estado de clientes que fueron rematados a "activo"
            if (clientesRematados.length > 0) {
                const idsClientes = clientesRematados.map(c => c.id_cliente);
                await connection.query(
                    `UPDATE clientes 
                     SET estado_actividad = 'activo'
                     WHERE id IN (?) AND estado_actividad = 'bloqueado'`,
                    [idsClientes]
                );
            }

            // 7. Reabrir la orden
            const resultado = await Orden.reabrirOrden(id_orden, usuario_id);

            if (!resultado) {
                throw new Error('No se pudo reabrir la orden');
            }

            await connection.commit();

            return {
                success: true,
                mensaje: 'Orden reabierta exitosamente. Se eliminaron todos los registros del cierre anterior.',
                registros_eliminados: {
                    clientes_rematados: true,
                    cliente_orden: true,
                    historial_incumplimientos: true,
                    cierre_orden: true,
                    clientes_restaurados: clientesRematados.length
                }
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Obtener resumen de cierre de orden
     */
    static async obtenerResumenCierre(id_orden) {
        try {
            const [cierreRows] = await pool.query(
                `SELECT * FROM cierre_orden WHERE id_orden = ?`,
                [id_orden]
            );

            if (cierreRows.length === 0) {
                return null;
            }

            const cierre = cierreRows[0];
            const clientesOrden = await ClienteOrden.findByOrden(id_orden);
            const clientesRematados = await ClienteRematado.findByOrden(id_orden);
            const incumplimientos = await HistorialIncumplimiento.findByOrden(id_orden);

            return {
                cierre,
                clientes: clientesOrden,
                clientes_rematados: clientesRematados,
                incumplimientos
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Iniciar nueva orden (reiniciar saldos de clientes)
     */
    static async iniciarNuevaOrden(data_orden, usuario_id) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // VALIDACIÓN 1: Verificar que NO haya órdenes en periodo de gracia
            const ordenesEnGracia = await Orden.findOrdenesEnGracia();

            if (ordenesEnGracia.length > 0) {
                const orden = ordenesEnGracia[0];
                const fechaLimite = new Date(orden.fecha_limite_pago);
                const ahora = new Date();
                const horasRestantes = Math.ceil((fechaLimite - ahora) / (1000 * 60 * 60));

                throw new Error(
                    `NO_PUEDE_CREAR_ORDEN|No se puede crear una nueva orden mientras "${orden.nombre_orden}" está en periodo de gracia. ` +
                    `Opciones: espera ${horasRestantes}h para que expire automáticamente, o remata manualmente a los clientes morosos.`
                );
            }

            // VALIDACIÓN 2: Verificar que NO haya otras órdenes abiertas
            const ordenesAbiertas = await Orden.findOrdenesAbiertas();

            if (ordenesAbiertas.length > 0) {
                const orden = ordenesAbiertas[0];
                throw new Error(
                    `NO_PUEDE_CREAR_ORDEN|No se puede crear una nueva orden mientras la orden "${orden.nombre_orden}" ` +
                    `está abierta. Debes cerrar la orden actual antes de crear una nueva.`
                );
            }

            // Crear la nueva orden
            const id_orden = await Orden.create({
                ...data_orden,
                created_by: usuario_id
            });

            // Cambiar clientes deudores a activos (nueva oportunidad con la nueva orden)
            // Los clientes bloqueados permanecen bloqueados
            await connection.query(
                `UPDATE clientes 
                 SET estado_actividad = 'activo'
                 WHERE estado = 'activo' AND estado_actividad = 'deudor'`
            );

            await connection.commit();

            return {
                success: true,
                id_orden,
                mensaje: 'Nueva orden iniciada. Todos los clientes activos pueden participar.'
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Obtener todos los clientes rematados con paginación
     */
    static async obtenerClientesRematados(page = 1, limit = 20) {
        try {
            const resultado = await ClienteRematado.findAll(page, limit);
            
            return {
                success: true,
                data: resultado.data,
                pagination: resultado.pagination
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener clientes rematados de una orden específica
     */
    static async obtenerClientesRematadosPorOrden(id_orden) {
        try {
            const orden = await Orden.findById(id_orden);
            
            if (!orden) {
                throw new Error('Orden no encontrada');
            }

            const clientesRematados = await ClienteRematado.findByOrden(id_orden);
            
            return {
                success: true,
                data: {
                    orden: {
                        id: orden.id,
                        nombre_orden: orden.nombre_orden,
                        estado_orden: orden.estado_orden,
                        fecha_cierre: orden.fecha_cierre
                    },
                    clientes_rematados: clientesRematados,
                    total: clientesRematados.length
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener clientes en riesgo de remate (durante periodo de gracia)
     */
    static async obtenerClientesEnRiesgo(id_orden) {
        try {
            const orden = await Orden.findById(id_orden);
            
            if (!orden) {
                throw new Error('Orden no encontrada');
            }

            if (orden.estado_orden !== 'en_periodo_gracia') {
                return {
                    success: false,
                    message: `La orden "${orden.nombre_orden}" no está en periodo de gracia. Estado actual: ${orden.estado_orden}`,
                    total_clientes: 0,
                    data: []
                };
            }

            // Obtener clientes con deuda en periodo de gracia
            const [clientesEnRiesgo] = await pool.query(
                `SELECT 
                    co.id_cliente,
                    co.id_orden,
                    c.nombre,
                    c.apellido,
                    c.codigo,
                    c.estado_actividad,
                    co.valor_total,
                    co.total_abonos,
                    (co.valor_total - co.total_abonos) as deuda_pendiente,
                    co.fecha_limite_pago,
                    co.estado_pago,
                    o.nombre_orden
                FROM cliente_orden co
                INNER JOIN clientes c ON co.id_cliente = c.id
                INNER JOIN ordenes o ON co.id_orden = o.id
                WHERE co.id_orden = ? 
                    AND co.estado_pago = 'en_gracia'
                    AND (co.valor_total - co.total_abonos) > 0
                ORDER BY co.fecha_limite_pago ASC`,
                [id_orden]
            );

            const clientesFormateados = clientesEnRiesgo.map(cliente => ({
                id_cliente: cliente.id_cliente,
                nombre_completo: `${cliente.nombre} ${cliente.apellido || ''}`.trim(),
                codigo: cliente.codigo,
                estado_actividad: cliente.estado_actividad,
                valor_total: parseFloat(cliente.valor_total || 0).toFixed(2),
                total_abonos: parseFloat(cliente.total_abonos || 0).toFixed(2),
                deuda_pendiente: parseFloat(cliente.deuda_pendiente || 0).toFixed(2),
                fecha_limite_pago: cliente.fecha_limite_pago,
                estado_pago: cliente.estado_pago,
                nombre_orden: cliente.nombre_orden
            }));

            return {
                success: true,
                total_clientes: clientesFormateados.length,
                data: clientesFormateados
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CierreOrdenService;
