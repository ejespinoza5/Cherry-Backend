const Producto = require('../models/Producto');
const Orden = require('../models/Orden');
const Cliente = require('../models/Cliente');

class ProductoService {
    /**
     * Formatear datos de producto
     */
    static formatProductoData(producto) {
        return {
            id: producto.id,
            id_cliente: producto.id_cliente,
            cliente_nombre: producto.cliente_nombre,
            cliente_apellido: producto.cliente_apellido,
            cliente_codigo: producto.cliente_codigo,
            id_orden: producto.id_orden,
            nombre_orden: producto.nombre_orden,
            cantidad_articulos: producto.cantidad_articulos,
            detalles: producto.detalles,
            valor_etiqueta: parseFloat(producto.valor_etiqueta),
            comision: parseFloat(producto.comision),
            imagen_producto: producto.imagen_producto,
            observacion: producto.observacion,
            estado: producto.estado,
            created_at: producto.created_at,
            updated_at: producto.updated_at,
            creado_por: producto.creado_por_correo,
            actualizado_por: producto.actualizado_por_correo
        };
    }

    /**
     * Obtener todos los productos con filtros
     */
    static async getAllProductos(filters) {
        const productos = await Producto.findAll(filters);
        return productos.map(producto => this.formatProductoData(producto));
    }

    /**
     * Obtener producto por ID
     */
    static async getProductoById(id) {
        const producto = await Producto.findById(id);

        if (!producto) {
            throw new Error('PRODUCT_NOT_FOUND');
        }

        return this.formatProductoData(producto);
    }

    /**
     * Crear nuevo producto
     */
    static async createProducto(data, createdBy) {
        const { 
            id_cliente, 
            id_orden, 
            cantidad_articulos, 
            detalles, 
            valor_etiqueta, 
            comision,
            imagen_producto, 
            observacion, 
            estado 
        } = data;

        // Validar que la orden existe
        const ordenExists = await Producto.ordenExists(id_orden);
        if (!ordenExists) {
            throw new Error('ORDER_NOT_FOUND');
        }

        // Validar que la orden esté abierta
        const ordenCerrada = await Orden.estaCerrada(id_orden);
        if (ordenCerrada) {
            throw new Error('ORDER_CLOSED');
        }

        // Validar que el cliente existe
        const clienteExists = await Producto.clienteExists(id_cliente);
        if (!clienteExists) {
            throw new Error('CLIENT_NOT_FOUND');
        }

        // Verificar que el cliente no esté bloqueado
        const cliente = await Cliente.findById(id_cliente);
        if (cliente.estado_actividad === 'bloqueado') {
            throw new Error('CLIENT_BLOCKED');
        }

        // Validar cantidad de artículos
        if (!cantidad_articulos || cantidad_articulos < 1) {
            throw new Error('INVALID_QUANTITY');
        }

        // Validar detalles
        if (!detalles || detalles.trim() === '') {
            throw new Error('DETAILS_REQUIRED');
        }

        // Validar valor de etiqueta
        if (valor_etiqueta === undefined || valor_etiqueta < 0) {
            throw new Error('INVALID_PRICE');
        }

        // Validar comisión
        if (comision !== undefined && comision < 0) {
            throw new Error('INVALID_COMMISSION');
        }

        // Obtener la orden para calcular el impuesto
        const orden = await Orden.findById(id_orden);
        const impuesto = parseFloat(orden.impuesto || 0);
        
        // Calcular el total con IVA
        const subtotal = parseFloat(valor_etiqueta);
        const comisionFinal = parseFloat(comision || 3.00);
        const impuestoCalculado = subtotal * impuesto;
        const totalConIva = subtotal + impuestoCalculado + comisionFinal;

        // Crear el producto
        const productoId = await Producto.create({
            id_cliente,
            id_orden,
            cantidad_articulos,
            detalles,
            valor_etiqueta,
            comision,
            imagen_producto,
            observacion,
            estado,
            created_by: createdBy
        });

        // Restar el total del saldo del cliente (restar = sumar valor negativo)
        // Esto automáticamente actualizará el estado_actividad
        await Cliente.actualizarSaldo(id_cliente, -totalConIva);

        // Obtener y devolver el producto creado
        const producto = await Producto.findById(productoId);
        return this.formatProductoData(producto);
    }

    /**
     * Actualizar producto
     */
    static async updateProducto(id, data, updatedBy) {
        const { 
            id_cliente, 
            id_orden, 
            cantidad_articulos, 
            detalles, 
            valor_etiqueta, 
            comision,
            imagen_producto, 
            observacion, 
            estado 
        } = data;

        // Verificar que el producto existe
        const producto = await Producto.findById(id);
        if (!producto) {
            throw new Error('PRODUCT_NOT_FOUND');
        }

        // Validar que la orden actual del producto esté abierta
        const ordenCerrada = await Orden.estaCerrada(producto.id_orden);
        if (ordenCerrada) {
            throw new Error('ORDER_CLOSED');
        }

        // Si se actualiza la orden, validar que existe y esté abierta
        if (id_orden !== undefined) {
            const ordenExists = await Producto.ordenExists(id_orden);
            if (!ordenExists) {
                throw new Error('ORDER_NOT_FOUND');
            }
            const nuevaOrdenCerrada = await Orden.estaCerrada(id_orden);
            if (nuevaOrdenCerrada) {
                throw new Error('ORDER_CLOSED');
            }
        }

        // Si se actualiza el cliente, validar que existe
        if (id_cliente !== undefined) {
            const clienteExists = await Producto.clienteExists(id_cliente);
            if (!clienteExists) {
                throw new Error('CLIENT_NOT_FOUND');
            }
        }

        // Validar cantidad de artículos
        if (cantidad_articulos !== undefined && cantidad_articulos < 1) {
            throw new Error('INVALID_QUANTITY');
        }

        // Validar detalles
        if (detalles !== undefined && detalles.trim() === '') {
            throw new Error('DETAILS_REQUIRED');
        }

        // Validar valor de etiqueta
        if (valor_etiqueta !== undefined && valor_etiqueta < 0) {
            throw new Error('INVALID_PRICE');
        }

        // Validar comisión
        if (comision !== undefined && comision < 0) {
            throw new Error('INVALID_COMMISSION');
        }

        // Calcular total anterior del producto
        const ordenAnterior = await Orden.findById(producto.id_orden);
        const impuestoAnterior = parseFloat(ordenAnterior.impuesto || 0);
        const subtotalAnterior = parseFloat(producto.valor_etiqueta);
        const comisionAnterior = parseFloat(producto.comision || 3.00);
        const impuestoCalculadoAnterior = subtotalAnterior * impuestoAnterior;
        const totalAnterior = subtotalAnterior + impuestoCalculadoAnterior + comisionAnterior;

        // Preparar datos para actualizar
        const updateData = {
            id_cliente: id_cliente !== undefined ? id_cliente : producto.id_cliente,
            id_orden: id_orden !== undefined ? id_orden : producto.id_orden,
            cantidad_articulos: cantidad_articulos !== undefined ? cantidad_articulos : producto.cantidad_articulos,
            detalles: detalles !== undefined ? detalles : producto.detalles,
            valor_etiqueta: valor_etiqueta !== undefined ? valor_etiqueta : producto.valor_etiqueta,
            comision: comision !== undefined ? comision : producto.comision,
            imagen_producto: imagen_producto !== undefined ? imagen_producto : producto.imagen_producto,
            observacion: observacion !== undefined ? observacion : producto.observacion,
            estado: estado !== undefined ? estado : producto.estado
        };

        // Calcular total nuevo del producto
        const ordenNueva = await Orden.findById(updateData.id_orden);
        const impuestoNuevo = parseFloat(ordenNueva.impuesto || 0);
        const subtotalNuevo = parseFloat(updateData.valor_etiqueta);
        const comisionNueva = parseFloat(updateData.comision || 3.00);
        const impuestoCalculadoNuevo = subtotalNuevo * impuestoNuevo;
        const totalNuevo = subtotalNuevo + impuestoCalculadoNuevo + comisionNueva;

        // Calcular la diferencia y actualizar saldo
        // Si el cliente cambió, devolver al anterior y restar del nuevo
        const clienteAnterior = producto.id_cliente;
        const clienteNuevo = updateData.id_cliente;

        if (clienteAnterior !== clienteNuevo) {
            // Devolver el total al cliente anterior
            await Cliente.actualizarSaldo(clienteAnterior, totalAnterior);
            // Restar el total del nuevo cliente
            await Cliente.actualizarSaldo(clienteNuevo, -totalNuevo);
        } else {
            // Mismo cliente: devolver el monto anterior y restar el nuevo
            await Cliente.actualizarSaldo(clienteAnterior, totalAnterior);
            await Cliente.actualizarSaldo(clienteNuevo, -totalNuevo);
        }

        // Actualizar el producto
        await Producto.update(id, updateData, updatedBy);

        // Obtener y devolver el producto actualizado
        const productoActualizado = await Producto.findById(id);
        return this.formatProductoData(productoActualizado);
    }

    /**
     * Eliminar producto (soft delete)
     */
    static async deleteProducto(id, deletedBy) {
        const producto = await Producto.findById(id);

        if (!producto) {
            throw new Error('PRODUCT_NOT_FOUND');
        }

        // Validar que la orden esté abierta
        const ordenCerrada = await Orden.estaCerrada(producto.id_orden);
        if (ordenCerrada) {
            throw new Error('ORDER_CLOSED');
        }

        // Obtener la orden para calcular el impuesto
        const orden = await Orden.findById(producto.id_orden);
        const impuesto = parseFloat(orden.impuesto || 0);
        
        // Calcular el total que se había restado del saldo
        const subtotal = parseFloat(producto.valor_etiqueta);
        const comisionFinal = parseFloat(producto.comision || 3.00);
        const impuestoCalculado = subtotal * impuesto;
        const totalConIva = subtotal + impuestoCalculado + comisionFinal;

        // Eliminar el producto (soft delete)
        await Producto.delete(id, deletedBy);

        // Devolver el monto al saldo del cliente (sumar de vuelta)
        await Cliente.actualizarSaldo(producto.id_cliente, totalConIva);

        return { message: 'Producto eliminado correctamente y saldo actualizado' };
    }

    /**
     * Obtener resumen de productos por cliente en una orden
     */
    static async getResumenPorCliente(id_orden, id_cliente) {
        // Validar que la orden existe
        const ordenExists = await Producto.ordenExists(id_orden);
        if (!ordenExists) {
            throw new Error('ORDER_NOT_FOUND');
        }

        // Validar que el cliente existe
        const clienteExists = await Producto.clienteExists(id_cliente);
        if (!clienteExists) {
            throw new Error('CLIENT_NOT_FOUND');
        }

        const resumen = await Producto.getResumenPorCliente(id_orden, id_cliente);

        return {
            id_orden: parseInt(id_orden),
            id_cliente: parseInt(id_cliente),
            total_productos: parseInt(resumen.total_productos || 0),
            total_articulos: parseInt(resumen.total_articulos || 0),
            subtotal: parseFloat(resumen.subtotal || 0).toFixed(2),
            total_comisiones: parseFloat(resumen.total_comisiones || 0).toFixed(2)
        };
    }

    /**
     * Obtener productos agrupados por cliente en una orden
     */
    static async getProductosAgrupadosPorCliente(id_orden) {
        // Validar que la orden existe
        const ordenExists = await Producto.ordenExists(id_orden);
        if (!ordenExists) {
            throw new Error('ORDER_NOT_FOUND');
        }

        const rows = await Producto.getProductosAgrupadosPorCliente(id_orden);

        // Agrupar productos por cliente
        const clientesMap = new Map();

        rows.forEach(row => {
            const clienteId = row.cliente_id;

            if (!clientesMap.has(clienteId)) {
                clientesMap.set(clienteId, {
                    id: clienteId,
                    nombre: row.cliente_nombre,
                    apellido: row.cliente_apellido,
                    codigo: row.cliente_codigo,
                    direccion: row.cliente_direccion,
                    saldo: parseFloat(row.cliente_saldo || 0).toFixed(2),
                    estado_actividad: row.cliente_estado_actividad,
                    productos: []
                });
            }

            // Agregar producto al cliente
            clientesMap.get(clienteId).productos.push({
                id: row.producto_id,
                cantidad_articulos: row.cantidad_articulos,
                detalles: row.detalles,
                valor_etiqueta: parseFloat(row.valor_etiqueta),
                comision: parseFloat(row.comision),
                imagen_producto: row.imagen_producto,
                observacion: row.observacion,
                created_at: row.producto_created_at
            });
        });

        // Convertir Map a array y calcular totales por cliente
        const clientes = Array.from(clientesMap.values()).map(cliente => {
            const subtotal = cliente.productos.reduce((sum, p) => 
                sum + (p.valor_etiqueta * p.cantidad_articulos), 0);
            const total_comisiones = cliente.productos.reduce((sum, p) => 
                sum + p.comision, 0);
            const total_articulos = cliente.productos.reduce((sum, p) => 
                sum + p.cantidad_articulos, 0);

            return {
                ...cliente,
                total_productos: cliente.productos.length,
                total_articulos,
                subtotal: subtotal.toFixed(2),
                total_comisiones: total_comisiones.toFixed(2),
                total: (subtotal + total_comisiones).toFixed(2)
            };
        });

        return clientes;
    }

    /**
     * Obtener productos de un cliente específico en una orden específica
     */
    static async getProductosPorCliente(id_cliente, id_orden) {
        // Validar que el cliente existe
        const clienteExists = await Producto.clienteExists(id_cliente);
        if (!clienteExists) {
            throw new Error('CLIENT_NOT_FOUND');
        }

        // Validar que la orden existe
        const ordenExists = await Orden.findById(id_orden);
        if (!ordenExists) {
            throw new Error('ORDER_NOT_FOUND');
        }

        const rows = await Producto.getProductosPorCliente(id_cliente, id_orden);

        if (rows.length === 0) {
            throw new Error('NO_PRODUCTS_FOUND');
        }

        // Obtener información del cliente (primer registro)
        const clienteInfo = {
            id: rows[0].cliente_id,
            nombre: rows[0].cliente_nombre,
            apellido: rows[0].cliente_apellido,
            codigo: rows[0].cliente_codigo,
            direccion: rows[0].cliente_direccion,
            correo: rows[0].cliente_correo,
            saldo: parseFloat(rows[0].cliente_saldo || 0).toFixed(2),
            estado_actividad: rows[0].cliente_estado_actividad
        };

        // Agrupar productos por orden
        const ordenesMap = new Map();

        rows.forEach(row => {
            const ordenId = row.orden_id;

            if (!ordenesMap.has(ordenId)) {
                ordenesMap.set(ordenId, {
                    id: ordenId,
                    nombre_orden: row.nombre_orden,
                    productos: []
                });
            }

            // Agregar producto a la orden
            ordenesMap.get(ordenId).productos.push({
                id: row.producto_id,
                cantidad_articulos: row.cantidad_articulos,
                detalles: row.detalles,
                valor_etiqueta: parseFloat(row.valor_etiqueta),
                comision: parseFloat(row.comision),
                imagen_producto: row.imagen_producto,
                observacion: row.observacion,
                created_at: row.producto_created_at
            });
        });

        // Convertir Map a array (sin calcular totales por orden)
        const ordenes = Array.from(ordenesMap.values()).map(orden => {
            return {
                id: orden.id,
                nombre_orden: orden.nombre_orden,
                productos: orden.productos
            };
        });

        // Obtener el impuesto de la orden (viene en todos los registros, usamos el primero)
        const impuesto_orden = parseFloat(rows[0].orden_impuesto || 0);

        // Calcular totales generales
        const total_productos_general = rows.length;
        const total_articulos_general = rows.reduce((sum, r) => sum + r.cantidad_articulos, 0);
        const subtotal_general = rows.reduce((sum, r) => 
            sum + (parseFloat(r.valor_etiqueta) * r.cantidad_articulos), 0);
        const impuesto_aplicado = subtotal_general * impuesto_orden;
        const total_con_impuestos = subtotal_general + impuesto_aplicado;
        const total_comisiones_general = rows.reduce((sum, r) => sum + parseFloat(r.comision), 0);

        return {
            cliente: clienteInfo,
            total_ordenes: ordenes.length,
            total_productos: total_productos_general,
            total_articulos: total_articulos_general,
            subtotal_general: subtotal_general.toFixed(2),
            impuesto: (impuesto_orden * 100).toFixed(0) + '%',
            impuesto_aplicado: impuesto_aplicado.toFixed(2),
            total_con_impuestos: total_con_impuestos.toFixed(2),
            total_comisiones_general: total_comisiones_general.toFixed(2),
            total_general: (total_con_impuestos + total_comisiones_general).toFixed(2),
            ordenes: ordenes
        };
    }
}

module.exports = ProductoService;
