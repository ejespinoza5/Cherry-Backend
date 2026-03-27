const { pool } = require('../config/database');

class Cliente {
    static canNotifyDebtState(estadoAnterior, estadoNuevo) {
        return estadoAnterior !== estadoNuevo && ['deudor', 'bloqueado'].includes(estadoNuevo);
    }

    /**
     * Crear nuevo cliente
     */
    static async create(data) {
        try {
            const {
                id_usuario,
                nombre,
                apellido,
                codigo,
                direccion,
                ciudad,
                provincia,
                pais,
                informacion_adicional,
                created_by
            } = data;
            
            const [result] = await pool.query(
                `INSERT INTO clientes (
                    id_usuario,
                    nombre,
                    apellido,
                    codigo,
                    direccion,
                    ciudad,
                    provincia,
                    pais,
                    informacion_adicional,
                    estado_actividad,
                    estado,
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', 'activo', ?)`,
                [
                    id_usuario,
                    nombre,
                    apellido,
                    codigo,
                    direccion,
                    ciudad,
                    provincia,
                    pais,
                    informacion_adicional,
                    created_by
                ]
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar cliente por usuario
     */
    static async findByUsuario(id_usuario) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM clientes WHERE id_usuario = ?',
                [id_usuario]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar cliente por ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM clientes WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener todos los clientes
     */
    static async findAll() {
        try {
            const [rows] = await pool.query(
                `SELECT c.*, u.correo 
                 FROM clientes c 
                 INNER JOIN usuarios u ON c.id_usuario = u.id 
                 ORDER BY c.created_at DESC`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener clientes activos elegibles para notificaciones de nuevas órdenes o avisos de cierre
     * Excluye clientes con estado_actividad inactivo y bloqueado.
     */
    static async findRecipientsForOrderNotifications() {
        try {
            const [rows] = await pool.query(
                `SELECT c.*, u.correo
                 FROM clientes c
                 INNER JOIN usuarios u ON c.id_usuario = u.id
                 WHERE c.estado = 'activo'
                   AND u.estado = 'activo'
                   AND c.estado_actividad NOT IN ('inactivo', 'bloqueado')
                 ORDER BY c.created_at DESC`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar cliente
     */
    static async update(id, data, updated_by) {
        try {
            const [clienteActual] = await pool.query(
                'SELECT estado_actividad FROM clientes WHERE id = ? LIMIT 1',
                [id]
            );
            const estadoAnterior = clienteActual.length > 0 ? clienteActual[0].estado_actividad : null;

            const {
                nombre,
                apellido,
                codigo,
                direccion,
                ciudad,
                provincia,
                pais,
                informacion_adicional,
                estado_actividad,
                estado
            } = data;
            
            const [result] = await pool.query(
                `UPDATE clientes 
                 SET nombre = ?, apellido = ?, codigo = ?, direccion = ?, ciudad = ?, provincia = ?, pais = ?, informacion_adicional = ?, estado_actividad = ?, estado = ?, updated_by = ? 
                 WHERE id = ?`,
                [
                    nombre,
                    apellido,
                    codigo,
                    direccion,
                    ciudad,
                    provincia,
                    pais,
                    informacion_adicional,
                    estado_actividad,
                    estado,
                    updated_by,
                    id
                ]
            );

            if (this.canNotifyDebtState(estadoAnterior, estado_actividad)) {
                await this.enviarRecordatorioDeudaPorCambioEstado(id, estadoAnterior, estado_actividad);
            }
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar si existe un código (excluyendo un cliente específico)
     */
    static async codigoExists(codigo, excludeId = null) {
        try {
            let query = 'SELECT id FROM clientes WHERE codigo = ?';
            let params = [codigo];
            
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
     * Obtener órdenes en las que el cliente ha participado (desde cliente_orden)
     */
    static async getOrdenesConProductos(id_cliente) {
        try {
            const [ordenes] = await pool.query(
                `SELECT 
                    o.id,
                    o.nombre_orden,
                    o.estado_orden,
                    o.fecha_inicio,
                    o.fecha_fin,
                    o.estado,
                    o.created_at,
                    co.valor_total,
                    co.total_abonos,
                    co.saldo_al_cierre,
                    co.libras_acumuladas,
                    (co.valor_total - co.total_abonos) as saldo_pendiente,
                    co.estado_pago,
                    co.fecha_limite_pago
                FROM cliente_orden co
                INNER JOIN ordenes o ON co.id_orden = o.id
                WHERE co.id_cliente = ?
                ORDER BY o.created_at DESC`,
                [id_cliente]
            );

            return ordenes.map(o => ({
                id:               o.id,
                nombre_orden:     o.nombre_orden,
                estado_orden:     o.estado_orden,
                fecha_inicio:     o.fecha_inicio,
                fecha_fin:        o.fecha_fin,
                estado:           o.estado,
                valor_total:      parseFloat(o.valor_total      || 0),
                total_abonos:     parseFloat(o.total_abonos     || 0),
                saldo_pendiente:  parseFloat(o.saldo_pendiente  || 0),
                saldo_al_cierre:  parseFloat(o.saldo_al_cierre  || 0),
                libras_acumuladas: parseFloat(o.libras_acumuladas || 0),
                estado_pago:      o.estado_pago,
                fecha_limite_pago: o.fecha_limite_pago,
                created_at:       o.created_at
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener detalle de una orden específica del cliente
     */
    static async getDetalleOrden(id_cliente, id_orden) {
        try {
            // Verificar que la orden existe y pertenece al cliente
            const [ordenes] = await pool.query(
                `SELECT o.*
                FROM ordenes o
                INNER JOIN productos p ON o.id = p.id_orden
                WHERE o.id = ? AND p.id_cliente = ?
                LIMIT 1`,
                [id_orden, id_cliente]
            );

            if (ordenes.length === 0) {
                return null;
            }

            const orden = ordenes[0];

            // Obtener productos del cliente en esta orden
            const [productos] = await pool.query(
                `SELECT 
                    id,
                    cantidad_articulos,
                    detalles,
                    valor_etiqueta,
                    comision,
                    imagen_producto,
                    observacion,
                    estado,
                    created_at
                FROM productos
                WHERE id_orden = ? AND id_cliente = ?
                ORDER BY created_at DESC`,
                [id_orden, id_cliente]
            );

            // Calcular totales (sin impuestos automáticos)
            let subtotal = 0;
            let total_comisiones = 0;
            let total_articulos = 0;

            productos.forEach(p => {
                subtotal += parseFloat(p.valor_etiqueta);
                total_comisiones += parseFloat(p.comision || 0);
                total_articulos += parseInt(p.cantidad_articulos);
            });

            const total = subtotal + total_comisiones;

            // Obtener historial de abonos
            const [abonos] = await pool.query(
                `SELECT 
                    id,
                    cantidad,
                    estado,
                    created_at
                FROM historial_abono
                WHERE id_cliente = ?
                ORDER BY created_at DESC`,
                [id_cliente]
            );

            const total_abonado = abonos.reduce((sum, abono) => {
                return sum + parseFloat(abono.cantidad || 0);
            }, 0);

            return {
                id: orden.id,
                nombre_orden: orden.nombre_orden,
                fecha_inicio: orden.fecha_inicio,
                fecha_fin: orden.fecha_fin,
                estado: orden.estado,
                productos: productos.map(p => ({
                    id: p.id,
                    cantidad_articulos: parseInt(p.cantidad_articulos),
                    detalles: p.detalles,
                    valor_etiqueta: parseFloat(p.valor_etiqueta),
                    comision: parseFloat(p.comision || 0),
                    imagen: p.imagen_producto,
                    observacion: p.observacion,
                    estado: p.estado,
                    created_at: p.created_at
                })),
                resumen: {
                    total_productos: productos.length,
                    total_articulos: total_articulos,
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    comisiones: parseFloat(total_comisiones.toFixed(2)),
                    total: parseFloat(total.toFixed(2))
                },
                abonos: abonos.map(abono => ({
                    id: abono.id,
                    cantidad: parseFloat(abono.cantidad),
                    fecha: abono.created_at,
                    estado: abono.estado
                })),
                total_abonado: parseFloat(total_abonado.toFixed(2)),
                created_at: orden.created_at
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener resumen financiero del cliente
     */
    static async getResumenFinanciero(id_cliente) {
        try {
            // Contar órdenes únicas
            const [ordenesCount] = await pool.query(
                `SELECT COUNT(DISTINCT id_orden) as total_ordenes
                FROM productos
                WHERE id_cliente = ? AND estado = 'activo'`,
                [id_cliente]
            );

            // Calcular totales de compras
            const [compras] = await pool.query(
                `SELECT 
                    SUM(valor_etiqueta) as subtotal,
                    SUM(comision) as total_comisiones,
                    COUNT(*) as total_productos,
                    SUM(cantidad_articulos) as total_articulos
                FROM productos
                WHERE id_cliente = ? AND estado = 'activo'`,
                [id_cliente]
            );

            const subtotal = parseFloat(compras[0].subtotal || 0);
            const total_comisiones = parseFloat(compras[0].total_comisiones || 0);
            const total_compras = subtotal + total_comisiones;

            // Obtener total de abonos
            const [abonos] = await pool.query(
                `SELECT SUM(cantidad) as total_abonado
                FROM historial_abono
                WHERE id_cliente = ? AND estado = 'activo'`,
                [id_cliente]
            );

            const total_abonado = parseFloat(abonos[0].total_abonado || 0);

            // Obtener saldo pendiente actual del cliente (suma de todas sus órdenes)
            const [saldoData] = await pool.query(
                `SELECT COALESCE(SUM(total_compras - total_abonos), 0) as saldo_total
                 FROM cliente_orden 
                 WHERE id_cliente = ? AND (total_compras - total_abonos) > 0`,
                [id_cliente]
            );

            const saldo_pendiente = parseFloat(saldoData[0].saldo_total || 0);

            return {
                total_ordenes: parseInt(ordenesCount[0].total_ordenes || 0),
                total_productos: parseInt(compras[0].total_productos || 0),
                total_articulos: parseInt(compras[0].total_articulos || 0),
                subtotal: parseFloat(subtotal.toFixed(2)),
                comisiones: parseFloat(total_comisiones.toFixed(2)),
                total_compras: parseFloat(total_compras.toFixed(2)),
                total_abonado: parseFloat(total_abonado.toFixed(2)),
                saldo_pendiente: parseFloat(saldo_pendiente.toFixed(2))
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar estado_actividad manualmente (sin considerar el saldo)
     */
    static async updateEstadoActividadManual(id_cliente, estado_actividad, updated_by) {
        try {
            const [clienteActual] = await pool.query(
                'SELECT estado_actividad FROM clientes WHERE id = ? LIMIT 1',
                [id_cliente]
            );

            const estadoAnterior = clienteActual.length > 0 ? clienteActual[0].estado_actividad : null;

            await pool.query(
                `UPDATE clientes 
                 SET estado_actividad = ?, updated_by = ?
                 WHERE id = ?`,
                [estado_actividad, updated_by, id_cliente]
            );

            if (this.canNotifyDebtState(estadoAnterior, estado_actividad)) {
                await this.enviarRecordatorioDeudaPorCambioEstado(id_cliente, estadoAnterior, estado_actividad);
            }
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener saldo total pendiente del cliente (suma de todas las órdenes)
     */
    static async getSaldo(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT COALESCE(SUM(total_compras - total_abonos), 0) as saldo_total
                 FROM cliente_orden 
                 WHERE id_cliente = ? AND (total_compras - total_abonos) > 0`,
                [id_cliente]
            );
            
            return parseFloat(rows[0].saldo_total || 0);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar link de Excel del cliente (compartido en todas las órdenes)
     */
    static async updateLinkExcel(id_cliente, link_excel) {
        try {
            await pool.query(
                `UPDATE clientes 
                 SET link_excel = ?
                 WHERE id = ?`,
                [link_excel, id_cliente]
            );
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Calcular y actualizar estado_actividad automáticamente
     * Reglas:
     * - activo: saldo >= 0 Y ha comprado en los últimos 3 meses
     * - deudor: debe < $300
     * - bloqueado: debe >= $300
     * - inactivo: sin compras en los últimos 3 meses
     */
    static async calcularYActualizarEstadoActividad(id_cliente, connection = null) {
        const useConnection = connection || pool;
        
        try {
            // Obtener saldo total del cliente (deuda total en todas las órdenes abiertas/en gracia)
            const [saldoData] = await useConnection.query(
                `SELECT COALESCE(SUM(co.valor_total - co.total_abonos), 0) as deuda_total
                 FROM cliente_orden co
                 INNER JOIN ordenes o ON co.id_orden = o.id
                 WHERE co.id_cliente = ? 
                   AND o.estado_orden IN ('abierta', 'en_periodo_gracia')
                   AND (co.valor_total - co.total_abonos) > 0`,
                [id_cliente]
            );

            const deuda = parseFloat(saldoData[0].deuda_total || 0);

            const [estadoActualRows] = await useConnection.query(
                'SELECT estado_actividad FROM clientes WHERE id = ? LIMIT 1',
                [id_cliente]
            );

            const estadoAnterior = estadoActualRows.length > 0 ? estadoActualRows[0].estado_actividad : null;

            // Obtener fecha de última compra (última vez que se le asignó valor_total)
            const [ultimaCompra] = await useConnection.query(
                `SELECT MAX(co.created_at) as ultima_compra
                 FROM cliente_orden co
                 WHERE co.id_cliente = ? AND co.valor_total > 0`,
                [id_cliente]
            );

            const fechaUltimaCompra = ultimaCompra[0].ultima_compra;
            
            // Calcular si tiene actividad en los últimos 3 meses
            let tieneActividadReciente = false;
            if (fechaUltimaCompra) {
                const tresMesesAtras = new Date();
                tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
                tieneActividadReciente = new Date(fechaUltimaCompra) >= tresMesesAtras;
            }

            // Determinar estado según reglas
            let nuevoEstado;
            
            if (!tieneActividadReciente) {
                // Sin compras en 3 meses = inactivo
                nuevoEstado = 'inactivo';
            } else if (deuda >= 300) {
                // Debe $300 o más = bloqueado
                nuevoEstado = 'bloqueado';
            } else if (deuda > 0 && deuda < 300) {
                // Debe menos de $300 = deudor
                nuevoEstado = 'deudor';
            } else {
                // Saldo >= 0 y con actividad = activo
                nuevoEstado = 'activo';
            }

            // Actualizar estado_actividad solo cuando hay un cambio real.
            if (estadoAnterior !== nuevoEstado) {
                await useConnection.query(
                    `UPDATE clientes 
                     SET estado_actividad = ?
                     WHERE id = ?`,
                    [nuevoEstado, id_cliente]
                );

                const isTransactionalConnection = connection && connection !== pool;
                if (!isTransactionalConnection && this.canNotifyDebtState(estadoAnterior, nuevoEstado)) {
                    await this.enviarRecordatorioDeudaPorCambioEstado(id_cliente, estadoAnterior, nuevoEstado);
                }
            }

            return nuevoEstado;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Recalcular estado_actividad para todos los clientes activos.
     * Se usa en tareas programadas para mantener estados al dia sin depender de eventos.
     */
    static async recalcularEstadoActividadTodosActivos() {
        try {
            const [clientes] = await pool.query(
                `SELECT id, estado_actividad
                 FROM clientes
                 WHERE estado = 'activo'`
            );

            let actualizados = 0;
            let errores = 0;

            for (const cliente of clientes) {
                try {
                    const nuevoEstado = await this.calcularYActualizarEstadoActividad(cliente.id);
                    if (nuevoEstado !== cliente.estado_actividad) {
                        actualizados += 1;
                    }
                } catch (error) {
                    errores += 1;
                    console.error(`Error recalculando estado_actividad para cliente ${cliente.id}:`, error.message);
                }
            }

            return {
                total_clientes: clientes.length,
                actualizados,
                errores
            };
        } catch (error) {
            throw error;
        }
    }

    static async getClienteRecordatorioDeudaById(id_cliente, connection = null) {
        const useConnection = connection || pool;

        const [rows] = await useConnection.query(
            `SELECT
                c.id,
                c.nombre,
                c.apellido,
                c.codigo,
                c.estado_actividad,
                u.correo,
                COALESCE(SUM(
                    CASE
                        WHEN o.estado_orden IN ('abierta', 'en_periodo_gracia')
                             AND (co.valor_total - co.total_abonos) > 0
                        THEN (co.valor_total - co.total_abonos)
                        ELSE 0
                    END
                ), 0) AS deuda_total,
                (
                    SELECT o2.nombre_orden
                    FROM cliente_orden co2
                    INNER JOIN ordenes o2 ON o2.id = co2.id_orden
                    WHERE co2.id_cliente = c.id
                      AND o2.estado_orden IN ('abierta', 'en_periodo_gracia')
                      AND (co2.valor_total - co2.total_abonos) > 0
                    ORDER BY co2.created_at DESC
                    LIMIT 1
                ) AS nombre_orden,
                (
                    SELECT (co2.valor_total - co2.total_abonos)
                    FROM cliente_orden co2
                    INNER JOIN ordenes o2 ON o2.id = co2.id_orden
                    WHERE co2.id_cliente = c.id
                      AND o2.estado_orden IN ('abierta', 'en_periodo_gracia')
                      AND (co2.valor_total - co2.total_abonos) > 0
                    ORDER BY co2.created_at DESC
                    LIMIT 1
                ) AS saldo_orden,
                (
                                        SELECT co2.fecha_cierre
                    FROM cliente_orden co2
                    INNER JOIN ordenes o2 ON o2.id = co2.id_orden
                    WHERE co2.id_cliente = c.id
                      AND o2.estado_orden IN ('abierta', 'en_periodo_gracia')
                      AND (co2.valor_total - co2.total_abonos) > 0
                    ORDER BY co2.created_at DESC
                    LIMIT 1
                                ) AS fecha_cierre_orden
            FROM clientes c
            INNER JOIN usuarios u ON u.id = c.id_usuario
            LEFT JOIN cliente_orden co ON co.id_cliente = c.id
            LEFT JOIN ordenes o ON o.id = co.id_orden
            WHERE c.id = ?
              AND c.estado = 'activo'
              AND u.estado = 'activo'
            GROUP BY c.id, c.nombre, c.apellido, c.codigo, c.estado_actividad, u.correo
            HAVING deuda_total > 0
            LIMIT 1`,
            [id_cliente]
        );

        return rows[0] || null;
    }

    static async enviarRecordatorioDeudaPorCambioEstado(id_cliente, estadoAnterior, estadoNuevo, connection = null) {
        if (!this.canNotifyDebtState(estadoAnterior, estadoNuevo)) {
            return false;
        }

        try {
            const cliente = await this.getClienteRecordatorioDeudaById(id_cliente, connection);
            if (!cliente || !cliente.correo) {
                return false;
            }

            const EmailService = require('../utils/emailService');
            const nombreCliente = [cliente.nombre, cliente.apellido].filter(Boolean).join(' ').trim();

            await EmailService.sendDebtReminderEmail({
                correoDestino: cliente.correo,
                nombreCliente,
                codigoCliente: cliente.codigo,
                estadoActividad: estadoNuevo,
                deudaTotal: cliente.deuda_total,
                nombreOrden: cliente.nombre_orden,
                saldoOrden: cliente.saldo_orden,
                fechaCierreOrden: cliente.fecha_cierre_orden
            });

            return true;
        } catch (error) {
            console.error('Error enviando correo por cambio de estado de actividad:', error.message);
            return false;
        }
    }

    /**
     * Habilitar cliente bloqueado/inactivo (solo admin)
     * Cambia el estado a 'activo' manualmente
     */
    static async habilitarCliente(id_cliente, updated_by) {
        try {
            const [result] = await pool.query(
                `UPDATE clientes 
                 SET estado_actividad = 'activo', updated_by = ?
                 WHERE id = ? AND estado_actividad IN ('bloqueado', 'inactivo')`,
                [updated_by, id_cliente]
            );
            
            if (result.affectedRows === 0) {
                throw new Error('CLIENTE_NO_REQUIERE_HABILITACION');
            }
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener saldo del cliente en la última orden activa
     * Si no ha participado en la orden actual, devuelve la orden con saldo 0
     */
    static async getSaldoUltimaOrden(id_cliente) {
        try {
            // Primero verificar si hay orden activa
            const [ordenActiva] = await pool.query(
                `SELECT id, nombre_orden, estado_orden, fecha_inicio, fecha_cierre
                 FROM ordenes 
                 WHERE estado = 'activo' AND estado_orden = 'abierta'
                 ORDER BY created_at DESC
                 LIMIT 1`
            );

            // Si no hay orden activa, no hay saldo que mostrar
            if (ordenActiva.length === 0) {
                return null;
            }

            const orden = ordenActiva[0];

            // Verificar si el cliente ha participado en esta orden
            const [result] = await pool.query(
                `SELECT 
                    o.id as id_orden,
                    o.nombre_orden,
                    o.estado_orden,
                    o.fecha_inicio,
                    o.fecha_cierre,
                    co.valor_total,
                    co.total_abonos,
                    co.libras_acumuladas,
                    (co.valor_total - co.total_abonos) as saldo_pendiente,
                    co.estado_pago,
                    co.fecha_limite_pago
                 FROM cliente_orden co
                 INNER JOIN ordenes o ON co.id_orden = o.id
                 WHERE co.id_cliente = ? 
                   AND o.id = ?
                 LIMIT 1`,
                [id_cliente, orden.id]
            );
            
            // Si el cliente ha participado, devolver sus datos
            if (result.length > 0) {
                return result[0];
            }

            // Si el cliente NO ha participado, devolver la orden con saldo 0
            return {
                id_orden: orden.id,
                nombre_orden: orden.nombre_orden,
                estado_orden: orden.estado_orden,
                fecha_inicio: orden.fecha_inicio,
                fecha_cierre: orden.fecha_cierre,
                valor_total: 0,
                total_abonos: 0,
                libras_acumuladas: 0,
                saldo_pendiente: 0,
                estado_pago: null,
                fecha_limite_pago: null
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener historial de compras del cliente en todas las órdenes
     * Ahora obtiene los datos desde cliente_orden ya que no se registran productos individuales
     */
    static async getHistorialCompras(id_cliente) {
        try {
            const [compras] = await pool.query(
                `SELECT 
                    co.id_orden,
                    o.nombre_orden,
                    o.estado_orden,
                    o.fecha_inicio,
                    o.fecha_fin,
                    co.total_compras,
                    co.total_abonos,
                    co.saldo_al_cierre,
                    co.valor_total,
                    co.libras_acumuladas,
                    (co.valor_total - co.total_abonos) as saldo_pendiente,
                    co.estado_pago,
                    co.fecha_limite_pago,
                    co.created_at,
                    co.updated_at,
                    c.link_excel
                FROM cliente_orden co
                INNER JOIN ordenes o ON co.id_orden = o.id
                INNER JOIN clientes c ON co.id_cliente = c.id
                WHERE co.id_cliente = ? AND co.valor_total > 0
                ORDER BY co.created_at DESC`,
                [id_cliente]
            );

            // Obtener todo el historial de libras del cliente en una sola query
            const [historialLibras] = await pool.query(
                `SELECT 
                    hal.id_orden,
                    hal.libras_anterior,
                    hal.libras_nueva,
                    hal.fecha_actualizacion,
                    hal.observaciones
                FROM historial_actualizacion_libras hal
                WHERE hal.id_cliente = ?
                ORDER BY hal.fecha_actualizacion ASC`,
                [id_cliente]
            );

            // Agrupar el historial de libras por id_orden
            const librasPorOrden = {};
            for (const h of historialLibras) {
                if (!librasPorOrden[h.id_orden]) librasPorOrden[h.id_orden] = [];
                librasPorOrden[h.id_orden].push({
                    libras_anterior: parseFloat(h.libras_anterior || 0),
                    libras_nueva: parseFloat(h.libras_nueva || 0),
                    fecha_actualizacion: h.fecha_actualizacion,
                    observaciones: h.observaciones || null
                });
            }

            return compras.map(c => ({
                orden: {
                    id: c.id_orden,
                    nombre: c.nombre_orden,
                    estado: c.estado_orden,
                    fecha_inicio: c.fecha_inicio,
                    fecha_fin: c.fecha_fin
                },
                total_compras: parseFloat(c.total_compras || 0),
                valor_total: parseFloat(c.valor_total || 0),
                total_abonos: parseFloat(c.total_abonos || 0),
                saldo_pendiente: parseFloat(c.saldo_pendiente || 0),
                saldo_al_cierre: parseFloat(c.saldo_al_cierre || 0),
                libras_acumuladas: parseFloat(c.libras_acumuladas || 0),
                historial_libras: librasPorOrden[c.id_orden] || [],
                estado_pago: c.estado_pago,
                fecha_limite_pago: c.fecha_limite_pago,
                link_excel: c.link_excel || null,
                created_at: c.created_at,
                updated_at: c.updated_at
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener saldo total del cliente (todas las órdenes)
     */
    static async getSaldoTotal(id_cliente) {
        try {
            const [result] = await pool.query(
                `SELECT 
                    COALESCE(SUM(co.valor_total), 0) as total_compras,
                    COALESCE(SUM(co.total_abonos), 0) as total_abonos,
                    COALESCE(SUM(co.valor_total - co.total_abonos), 0) as saldo_pendiente
                FROM cliente_orden co
                INNER JOIN ordenes o ON co.id_orden = o.id
                WHERE co.id_cliente = ?`,
                [id_cliente]
            );

            const saldoPendiente = parseFloat(result[0].saldo_pendiente || 0);

            return {
                total_compras: parseFloat(result[0].total_compras || 0),
                total_abonos: parseFloat(result[0].total_abonos || 0),
                saldo_pendiente: saldoPendiente,
                estado: saldoPendiente > 0 ? 'debe' : saldoPendiente < 0 ? 'a_favor' : 'al_dia'
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener clientes deudores/bloqueados con deuda pendiente para recordatorio por correo
     */
    static async getClientesParaRecordatorioDeuda() {
        try {
            const [rows] = await pool.query(
                `SELECT
                    c.id,
                    c.nombre,
                    c.apellido,
                    c.codigo,
                    c.estado_actividad,
                    u.correo,
                    COALESCE(SUM(
                        CASE
                            WHEN o.estado_orden IN ('abierta', 'en_periodo_gracia')
                                 AND (co.valor_total - co.total_abonos) > 0
                            THEN (co.valor_total - co.total_abonos)
                            ELSE 0
                        END
                    ), 0) AS deuda_total,
                    (
                        SELECT o2.nombre_orden
                        FROM cliente_orden co2
                        INNER JOIN ordenes o2 ON o2.id = co2.id_orden
                        WHERE co2.id_cliente = c.id
                          AND o2.estado_orden IN ('abierta', 'en_periodo_gracia')
                          AND (co2.valor_total - co2.total_abonos) > 0
                        ORDER BY co2.created_at DESC
                        LIMIT 1
                    ) AS nombre_orden,
                    (
                        SELECT (co2.valor_total - co2.total_abonos)
                        FROM cliente_orden co2
                        INNER JOIN ordenes o2 ON o2.id = co2.id_orden
                        WHERE co2.id_cliente = c.id
                          AND o2.estado_orden IN ('abierta', 'en_periodo_gracia')
                          AND (co2.valor_total - co2.total_abonos) > 0
                        ORDER BY co2.created_at DESC
                        LIMIT 1
                    ) AS saldo_orden,
                    (
                                                SELECT co2.fecha_cierre
                        FROM cliente_orden co2
                        INNER JOIN ordenes o2 ON o2.id = co2.id_orden
                        WHERE co2.id_cliente = c.id
                          AND o2.estado_orden IN ('abierta', 'en_periodo_gracia')
                          AND (co2.valor_total - co2.total_abonos) > 0
                        ORDER BY co2.created_at DESC
                        LIMIT 1
                                        ) AS fecha_cierre_orden
                FROM clientes c
                INNER JOIN usuarios u ON u.id = c.id_usuario
                LEFT JOIN cliente_orden co ON co.id_cliente = c.id
                LEFT JOIN ordenes o ON o.id = co.id_orden
                WHERE c.estado = 'activo'
                  AND u.estado = 'activo'
                  AND c.estado_actividad IN ('deudor', 'bloqueado')
                GROUP BY c.id, c.nombre, c.apellido, c.codigo, c.estado_actividad, u.correo
                HAVING deuda_total > 0
                ORDER BY deuda_total DESC`
            );

            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener datos personales del cliente para perfil
     */
    static async getDatosPersonales(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    c.id,
                    c.nombre,
                    c.apellido,
                    c.codigo,
                    c.direccion,
                    c.pais,
                    c.estado_actividad,
                    c.created_at,
                    u.correo
                FROM clientes c
                INNER JOIN usuarios u ON c.id_usuario = u.id
                WHERE c.id = ?`,
                [id_cliente]
            );

            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar datos personales del cliente (sin modificar código de casillero)
     */
    static async updateDatosPersonales(id_cliente, data) {
        try {
            const { nombre, apellido, direccion, pais } = data;
            
            const [result] = await pool.query(
                `UPDATE clientes 
                 SET nombre = ?, apellido = ?, direccion = ?, pais = ?
                 WHERE id = ?`,
                [nombre, apellido, direccion, pais, id_cliente]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Cliente;
