const Orden = require('../models/Orden');
const ClienteOrden = require('../models/ClienteOrden');
const ProductoRematado = require('../models/ProductoRematado');
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

            // Cerrar la orden
            await Orden.cerrarOrden(id_orden, usuario_id, 'manual', connection);

            // Procesar el cierre
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
            const fecha_limite_pago = new Date(fecha_cierre.getTime() + (48 * 60 * 60 * 1000)); // +48 horas

            // Obtener todos los clientes que participaron en esta orden
            const [clientes] = await useConnection.query(
                `SELECT DISTINCT p.id_cliente 
                 FROM productos p 
                 WHERE p.id_orden = ? AND p.estado = 'activo'`,
                [id_orden]
            );

            let stats = {
                total_clientes: 0,
                clientes_pagados: 0,
                clientes_pendientes: 0,
                clientes_con_deuda: 0
            };

            // Procesar cada cliente
            for (const { id_cliente } of clientes) {
                stats.total_clientes++;

                // Crear o actualizar registro en cliente_orden
                await ClienteOrden.createOrUpdate({
                    id_cliente,
                    id_orden,
                    estado_pago: 'activo'
                }, useConnection);

                // Actualizar totales de compras y abonos (para registro histórico)
                const totales = await ClienteOrden.actualizarTotales(id_cliente, id_orden, useConnection);
                
                // Obtener el saldo ACTUAL del cliente
                const [clienteData] = await useConnection.query(
                    `SELECT saldo FROM clientes WHERE id = ?`,
                    [id_cliente]
                );
                
                const saldo_actual = parseFloat(clienteData[0].saldo);

                // El saldo ya está calculado en tiempo real (abonos - compras)
                // Si es negativo, el cliente tiene deuda
                let estado_pago = 'pagado';
                if (saldo_actual < 0) {
                    estado_pago = 'en_gracia';
                    stats.clientes_con_deuda++;
                    
                    // Actualizar estado del cliente a deudor
                    await useConnection.query(
                        `UPDATE clientes SET estado_actividad = 'deudor' WHERE id = ?`,
                        [id_cliente]
                    );
                } else {
                    stats.clientes_pagados++;
                }

                // Actualizar estado al cierre
                // saldo_al_cierre es el valor absoluto de lo que debe (si es negativo)
                await ClienteOrden.actualizarAlCierre(id_cliente, id_orden, {
                    saldo_al_cierre: Math.abs(saldo_actual < 0 ? saldo_actual : 0),
                    fecha_cierre: fecha_cierre,
                    fecha_limite_pago: fecha_limite_pago,
                    estado_pago: estado_pago
                }, useConnection);
            }

            stats.clientes_pendientes = stats.clientes_con_deuda;

            // Calcular totales de la orden
            const [totalesOrden] = await useConnection.query(
                `SELECT 
                    SUM(p.valor_etiqueta * p.cantidad_articulos) as subtotal,
                    SUM((p.valor_etiqueta * p.cantidad_articulos) * ?) as impuestos,
                    SUM(p.comision) as comisiones
                 FROM productos p
                 WHERE p.id_orden = ? AND p.estado = 'activo'`,
                [orden.impuesto, id_orden]
            );

            const subtotal = parseFloat(totalesOrden[0].subtotal) || 0;
            const impuestos = parseFloat(totalesOrden[0].impuestos) || 0;
            const comisiones = parseFloat(totalesOrden[0].comisiones) || 0;
            const total_final = subtotal + impuestos + comisiones;

            // Crear o actualizar registro de cierre
            await useConnection.query(
                `INSERT INTO cierre_orden 
                    (id_orden, subtotal, impuestos, comisiones, total_final, 
                     fecha_cierre, fecha_limite_pago, tipo_cierre,
                     total_clientes, clientes_pagados, clientes_pendientes, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    subtotal = VALUES(subtotal),
                    impuestos = VALUES(impuestos),
                    comisiones = VALUES(comisiones),
                    total_final = VALUES(total_final),
                    fecha_cierre = VALUES(fecha_cierre),
                    fecha_limite_pago = VALUES(fecha_limite_pago),
                    tipo_cierre = VALUES(tipo_cierre),
                    total_clientes = VALUES(total_clientes),
                    clientes_pagados = VALUES(clientes_pagados),
                    clientes_pendientes = VALUES(clientes_pendientes)`,
                [id_orden, subtotal, impuestos, comisiones, total_final,
                 fecha_cierre, fecha_limite_pago, orden.tipo_cierre || 'manual',
                 stats.total_clientes, stats.clientes_pagados, stats.clientes_pendientes,
                 usuario_id]
            );

            // Cambiar orden a periodo de gracia si hay clientes con deuda
            if (stats.clientes_con_deuda > 0) {
                await useConnection.query(
                    `UPDATE ordenes 
                     SET estado_orden = 'en_periodo_gracia'
                     WHERE id = ? AND estado_orden = 'cerrada'`,
                    [id_orden]
                );
            }

            if (!connection) await useConnection.commit();

            return {
                fecha_cierre,
                fecha_limite_pago,
                totales: {
                    subtotal,
                    impuestos,
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
     * Rematar productos de clientes morosos
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
                const deuda_pendiente = clienteOrden.deuda_pendiente;
                const abonos_perdidos = clienteOrden.total_abonos;

                // Obtener productos del cliente en esta orden
                const [productos] = await connection.query(
                    `SELECT * FROM productos 
                     WHERE id_cliente = ? AND id_orden = ? AND estado = 'activo'`,
                    [clienteOrden.id_cliente, id_orden]
                );

                // Rematar cada producto
                for (const producto of productos) {
                    // Convertir todo a números para evitar concatenación
                    const valorEtiqueta = parseFloat(producto.valor_etiqueta);
                    const cantidad = parseInt(producto.cantidad_articulos);
                    const comision = parseFloat(producto.comision);
                    const impuesto = parseFloat((await Orden.findById(id_orden)).impuesto);
                    
                    const subtotal = valorEtiqueta * cantidad;
                    const montoImpuesto = subtotal * impuesto;
                    const valor_producto = subtotal + montoImpuesto + comision;

                    const observacion = forzar 
                        ? `Remate manual por administrador antes de vencer el periodo de gracia (${clienteOrden.estado_plazo})`
                        : `Remate automático por no pagar en periodo de gracia de 48 horas`;
                    
                    await ProductoRematado.create({
                        id_producto: producto.id,
                        id_cliente: clienteOrden.id_cliente,
                        id_orden: id_orden,
                        valor_producto: valor_producto,
                        abonos_perdidos: abonos_perdidos / productos.length, // Distribuir abonos perdidos
                        motivo: 'incumplimiento_pago',
                        fecha_remate: new Date(),
                        observaciones: observacion,
                        created_by: usuario_id
                    });
                }

                // Registrar incumplimiento
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

                // Marcar cliente_orden como rematado
                await ClienteOrden.marcarComoRematado(
                    clienteOrden.id_cliente,
                    id_orden,
                    `Productos rematados por mora. Abonos perdidos: $${abonos_perdidos}`,
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
                    productos_rematados: productos.length,
                    deuda_pendiente,
                    abonos_perdidos
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
                
                console.log(`✅ Orden ${id_orden} cerrada completamente después del remate`);
            }

            await connection.commit();

            return {
                success: true,
                mensaje: `Se remataron productos de ${resultados.length} cliente(s) moroso(s)`,
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
        try {
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
                    `No se puede reabrir esta orden porque existe otra orden "${ordenGracia.nombre_orden}" ` +
                    `en periodo de gracia con clientes pendientes de pago. ` +
                    `Espera ${horasRestantes}h para que expire automáticamente o remata a los morosos.`
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

            const resultado = await Orden.reabrirOrden(id_orden, usuario_id);

            if (!resultado) {
                throw new Error('No se pudo reabrir la orden');
            }

            return {
                success: true,
                mensaje: 'Orden reabierta exitosamente'
            };
        } catch (error) {
            throw error;
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
            const productosRematados = await ProductoRematado.findByOrden(id_orden);
            const incumplimientos = await HistorialIncumplimiento.findByOrden(id_orden);

            return {
                cierre,
                clientes: clientesOrden,
                productos_rematados: productosRematados,
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
                    `NO_PUEDE_CREAR_ORDEN|No se puede crear una nueva orden mientras la orden "${orden.nombre_orden}" ` +
                    `está en periodo de gracia.\n\n` +
                    `Opciones:\n` +
                    `  1) Espera ${horasRestantes}h para que expire automáticamente\n` +
                    `  2) Remata manualmente a los clientes morosos`
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

            // Solo resetear saldos negativos (deudas) a 0
            // Los saldos positivos se mantienen
            const [resetResult] = await connection.query(
                `UPDATE clientes 
                 SET saldo = 0.00
                 WHERE estado = 'activo' 
                   AND estado_actividad IN ('activo', 'deudor')
                   AND saldo < 0`
            );

            // Obtener clientes con saldo positivo
            const [clientesConSaldo] = await connection.query(
                `SELECT COUNT(*) as total 
                 FROM clientes 
                 WHERE estado = 'activo' 
                   AND estado_actividad IN ('activo', 'deudor')
                   AND saldo > 0`
            );

            // Cambiar clientes deudores a activos (nueva oportunidad)
            await connection.query(
                `UPDATE clientes 
                 SET estado_actividad = 'activo'
                 WHERE estado = 'activo' AND estado_actividad = 'deudor'`
            );

            await connection.commit();

            const clientesConCredito = clientesConSaldo[0].total;
            let mensaje = 'Nueva orden iniciada. ';
            
            if (clientesConCredito > 0) {
                mensaje += `${clientesConCredito} cliente(s) mantienen su saldo a favor. Las deudas fueron reseteadas a $0.`;
            } else {
                mensaje += 'Todos los clientes comienzan con saldo $0.';
            }

            return {
                success: true,
                id_orden,
                mensaje,
                clientes_con_saldo: clientesConCredito
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = CierreOrdenService;
