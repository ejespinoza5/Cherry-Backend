const { pool } = require('../config/database');

class Cliente {
    /**
     * Crear nuevo cliente
     */
    static async create(data) {
        try {
            const { id_usuario, nombre, apellido, codigo, direccion, created_by } = data;
            
            const [result] = await pool.query(
                `INSERT INTO clientes (id_usuario, nombre, apellido, codigo, direccion, estado_actividad, estado, created_by) 
                 VALUES (?, ?, ?, ?, ?, 'activo', 'activo', ?)`,
                [id_usuario, nombre, apellido, codigo, direccion, created_by]
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
     * Actualizar cliente
     */
    static async update(id, data, updated_by) {
        try {
            const { nombre, apellido, codigo, direccion, estado_actividad, estado } = data;
            
            const [result] = await pool.query(
                `UPDATE clientes 
                 SET nombre = ?, apellido = ?, codigo = ?, direccion = ?, estado_actividad = ?, estado = ?, updated_by = ? 
                 WHERE id = ?`,
                [nombre, apellido, codigo, direccion, estado_actividad, estado, updated_by, id]
            );
            
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
     * Obtener órdenes con productos del cliente
     */
    static async getOrdenesConProductos(id_cliente) {
        try {
            const [ordenes] = await pool.query(
                `SELECT DISTINCT
                    o.id,
                    o.nombre_orden,
                    o.fecha_inicio,
                    o.fecha_fin,
                    o.impuesto,
                    o.estado,
                    o.created_at
                FROM ordenes o
                INNER JOIN productos p ON o.id = p.id_orden
                WHERE p.id_cliente = ?
                ORDER BY o.created_at DESC`,
                [id_cliente]
            );

            // Para cada orden, calcular sus totales
            const ordenesConTotales = await Promise.all(ordenes.map(async (orden) => {
                // Obtener productos de esta orden específica
                const [productos] = await pool.query(
                    `SELECT 
                        COUNT(*) as total_productos,
                        SUM(cantidad_articulos) as total_articulos,
                        SUM(valor_etiqueta) as subtotal,
                        SUM(comision) as total_comisiones
                    FROM productos
                    WHERE id_orden = ? AND id_cliente = ?`,
                    [orden.id, id_cliente]
                );

                const subtotal = parseFloat(productos[0].subtotal || 0);
                const comisiones = parseFloat(productos[0].total_comisiones || 0);
                const impuestos = subtotal * parseFloat(orden.impuesto);
                const total = subtotal + impuestos + comisiones;

                return {
                    id: orden.id,
                    nombre_orden: orden.nombre_orden,
                    fecha_inicio: orden.fecha_inicio,
                    fecha_fin: orden.fecha_fin,
                    impuesto: parseFloat(orden.impuesto),
                    estado: orden.estado,
                    total_productos: parseInt(productos[0].total_productos || 0),
                    total_articulos: parseInt(productos[0].total_articulos || 0),
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    impuestos: parseFloat(impuestos.toFixed(2)),
                    comisiones: parseFloat(comisiones.toFixed(2)),
                    total: parseFloat(total.toFixed(2)),
                    created_at: orden.created_at
                };
            }));

            return ordenesConTotales;
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

            // Calcular totales
            let subtotal = 0;
            let total_comisiones = 0;
            let total_articulos = 0;

            productos.forEach(p => {
                subtotal += parseFloat(p.valor_etiqueta);
                total_comisiones += parseFloat(p.comision || 0);
                total_articulos += parseInt(p.cantidad_articulos);
            });

            const impuestos = subtotal * parseFloat(orden.impuesto);
            const total = subtotal + impuestos + total_comisiones;

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
                impuesto: parseFloat(orden.impuesto),
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
                    impuestos: parseFloat(impuestos.toFixed(2)),
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
            const impuestos = subtotal * 0.08; // 8% promedio
            const total_compras = subtotal + impuestos + total_comisiones;

            // Obtener total de abonos
            const [abonos] = await pool.query(
                `SELECT SUM(cantidad) as total_abonado
                FROM historial_abono
                WHERE id_cliente = ? AND estado = 'activo'`,
                [id_cliente]
            );

            const total_abonado = parseFloat(abonos[0].total_abonado || 0);

            // Obtener saldo actual del cliente
            const [cliente] = await pool.query(
                `SELECT saldo FROM clientes WHERE id = ?`,
                [id_cliente]
            );

            const saldo_pendiente = parseFloat(cliente[0].saldo || 0);

            return {
                total_ordenes: parseInt(ordenesCount[0].total_ordenes || 0),
                total_productos: parseInt(compras[0].total_productos || 0),
                total_articulos: parseInt(compras[0].total_articulos || 0),
                subtotal: parseFloat(subtotal.toFixed(2)),
                impuestos: parseFloat(impuestos.toFixed(2)),
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
     * Actualizar saldo del cliente (resta o suma)
     */
    static async actualizarSaldo(id_cliente, monto) {
        try {
            const [result] = await pool.query(
                `UPDATE clientes 
                 SET saldo = saldo + (?)
                 WHERE id = ?`,
                [monto, id_cliente]
            );
            
            // Actualizar automáticamente el estado_actividad basado en el nuevo saldo
            await this.actualizarEstadoActividad(id_cliente);
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar estado_actividad automáticamente basado en el saldo
     * Límite de deuda: $300
     */
    static async actualizarEstadoActividad(id_cliente) {
        try {
            const LIMITE_DEUDA = -300.00;
            
            // Obtener saldo actual
            const saldo = await this.getSaldo(id_cliente);
            
            let nuevoEstado;
            
            if (saldo >= 0) {
                // Saldo positivo o cero: ACTIVO
                nuevoEstado = 'activo';
            } else if (saldo > LIMITE_DEUDA) {
                // Saldo negativo pero no ha superado el límite: DEUDOR
                nuevoEstado = 'deudor';
            } else {
                // Saldo <= -$300: BLOQUEADO
                nuevoEstado = 'bloqueado';
            }
            
            // Actualizar el estado
            await pool.query(
                `UPDATE clientes 
                 SET estado_actividad = ?
                 WHERE id = ?`,
                [nuevoEstado, id_cliente]
            );
            
            return nuevoEstado;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener saldo actual del cliente
     */
    static async getSaldo(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT saldo FROM clientes WHERE id = ?`,
                [id_cliente]
            );
            
            return rows[0] ? parseFloat(rows[0].saldo) : 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Cliente;
