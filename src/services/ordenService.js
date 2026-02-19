const Orden = require('../models/Orden');
const CierreOrdenService = require('./cierreOrdenService');

class OrdenService {
    /**
     * Formatear datos de orden
     */
    static formatOrdenData(orden) {
        return {
            id: orden.id,
            nombre_orden: orden.nombre_orden,
            fecha_inicio: orden.fecha_inicio,
            fecha_fin: orden.fecha_fin,
            fecha_cierre: orden.fecha_cierre,
            estado_orden: orden.estado_orden,
            tipo_cierre: orden.tipo_cierre,
            estado: orden.estado,
            created_at: orden.created_at,
            updated_at: orden.updated_at,
            creado_por: orden.creado_por_correo,
            actualizado_por: orden.actualizado_por_correo
        };
    }

    /**
     * Obtener todas las órdenes
     */
    static async getAllOrdenes(filters) {
        const ordenes = await Orden.findAll(filters);
        return ordenes.map(orden => this.formatOrdenData(orden));
    }

    /**
     * Obtener orden por ID
     */
    static async getOrdenById(id) {
        const orden = await Orden.findById(id);

        if (!orden) {
            throw new Error('ORDER_NOT_FOUND');
        }

        return this.formatOrdenData(orden);
    }

    /**
     * Crear nueva orden
     */
    static async createOrden(data, createdBy) {
        const { nombre_orden, fecha_inicio, fecha_fin, estado } = data;

        // Validar nombre de orden
        if (!nombre_orden || nombre_orden.trim() === '') {
            throw new Error('ORDER_NAME_REQUIRED');
        }

        // Validar fecha de inicio
        if (!fecha_inicio) {
            throw new Error('START_DATE_REQUIRED');
        }

        // Validar que la fecha de fin sea posterior a la fecha de inicio
        if (fecha_fin && new Date(fecha_fin) < new Date(fecha_inicio)) {
            throw new Error('INVALID_DATE_RANGE');
        }

        // Verificar que el nombre no exista
        const nombreExists = await Orden.nombreExists(nombre_orden);
        if (nombreExists) {
            throw new Error('ORDER_NAME_EXISTS');
        }

        try {
            // Crear la orden con reinicio de saldos
            const resultado = await CierreOrdenService.iniciarNuevaOrden({
                nombre_orden,
                fecha_inicio,
                fecha_fin,
                estado
            }, createdBy);

            // Obtener y devolver la orden creada
            const orden = await Orden.findById(resultado.id_orden);
            return {
                ...this.formatOrdenData(orden),
                mensaje: resultado.mensaje
            };
        } catch (error) {
            // Re-lanzar errores de validación de periodo de gracia
            if (error.message.startsWith('NO_PUEDE_CREAR_ORDEN|')) {
                throw error;
            }
            throw error;
        }
    }

    /**
     * Actualizar orden
     */
    static async updateOrden(id, data, updatedBy) {
        const { nombre_orden, fecha_inicio, fecha_fin, estado } = data;

        // Verificar que la orden existe
        const orden = await Orden.findById(id);
        if (!orden) {
            throw new Error('ORDER_NOT_FOUND');
        }

        // Validar nombre de orden
        if (nombre_orden !== undefined && nombre_orden.trim() === '') {
            throw new Error('ORDER_NAME_REQUIRED');
        }

        // Validar fecha de inicio
        if (fecha_inicio !== undefined && !fecha_inicio) {
            throw new Error('START_DATE_REQUIRED');
        }

        // Validar que la fecha de fin sea posterior a la fecha de inicio
        const newFechaInicio = fecha_inicio || orden.fecha_inicio;
        const newFechaFin = fecha_fin !== undefined ? fecha_fin : orden.fecha_fin;
        
        if (newFechaFin && new Date(newFechaFin) < new Date(newFechaInicio)) {
            throw new Error('INVALID_DATE_RANGE');
        }

        // Si se actualiza el nombre, verificar que no exista
        if (nombre_orden && nombre_orden !== orden.nombre_orden) {
            const nombreExists = await Orden.nombreExists(nombre_orden, id);
            if (nombreExists) {
                throw new Error('ORDER_NAME_EXISTS');
            }
        }

        // Preparar datos para actualizar (solo los campos proporcionados)
        const updateData = {
            nombre_orden: nombre_orden !== undefined ? nombre_orden : orden.nombre_orden,
            fecha_inicio: fecha_inicio !== undefined ? fecha_inicio : orden.fecha_inicio,
            fecha_fin: fecha_fin !== undefined ? fecha_fin : orden.fecha_fin,
            estado: estado !== undefined ? estado : orden.estado
        };

        // Actualizar la orden
        await Orden.update(id, updateData, updatedBy);

        // Obtener y devolver la orden actualizada
        const ordenActualizada = await Orden.findById(id);
        return this.formatOrdenData(ordenActualizada);
    }

    /**
     * Eliminar orden (soft delete)
     */
    static async deleteOrden(id, deletedBy) {
        const orden = await Orden.findById(id);

        if (!orden) {
            throw new Error('ORDER_NOT_FOUND');
        }

        if (orden.estado === 'inactivo') {
            throw new Error('ORDER_ALREADY_INACTIVE');
        }

        await Orden.delete(id, deletedBy);
        return { message: 'Orden eliminada correctamente' };
    }

    /**
     * Obtener estadísticas de una orden
     */
    static async getOrdenEstadisticas(id) {
        const orden = await Orden.findById(id);

        if (!orden) {
            throw new Error('ORDER_NOT_FOUND');
        }

        const estadisticas = await Orden.getEstadisticas(id);

        // Calcular totales (sin impuestos automáticos)
        const subtotal = parseFloat(estadisticas.subtotal || 0);
        const comisiones = parseFloat(estadisticas.total_comisiones || 0);
        const total = subtotal + comisiones;

        return {
            orden: this.formatOrdenData(orden),
            estadisticas: {
                total_clientes: parseInt(estadisticas.total_clientes || 0),
                total_productos: parseInt(estadisticas.total_productos || 0),
                total_articulos: parseInt(estadisticas.total_articulos || 0),
                subtotal: subtotal.toFixed(2),
                comisiones: comisiones.toFixed(2),
                total: total.toFixed(2)
            }
        };
    }

    /**
     * Actualizar campos manuales de un cliente en una orden (crea el registro si no existe)
     */
    static async updateClienteOrdenDatosManuales(id_cliente, id_orden, data) {
        const ClienteOrden = require('../models/ClienteOrden');

        try {
            // Actualizar o crear los campos manuales (valida existencia de cliente y orden)
            await ClienteOrden.actualizarCamposManuales(id_cliente, id_orden, data);

            // Retornar los datos actualizados
            return await OrdenService.getClienteOrdenDatos(id_cliente, id_orden);
        } catch (error) {
            if (error.message === 'CLIENT_NOT_FOUND') {
                throw new Error('CLIENT_NOT_FOUND');
            }
            if (error.message === 'ORDER_NOT_FOUND') {
                throw new Error('ORDER_NOT_FOUND');
            }
            throw error;
        }
    }

    /**
     * Obtener datos de un cliente en una orden específica
     */
    static async getClienteOrdenDatos(id_cliente, id_orden) {
        const ClienteOrden = require('../models/ClienteOrden');

        // Obtener registro
        const registro = await ClienteOrden.findByClienteAndOrden(id_cliente, id_orden);
        if (!registro) {
            throw new Error('CLIENT_ORDER_NOT_FOUND');
        }

        return {
            id_cliente: registro.id_cliente,
            id_orden: registro.id_orden,
            cliente: {
                nombre: registro.nombre,
                apellido: registro.apellido,
                codigo: registro.codigo
            },
            orden: {
                nombre: registro.nombre_orden
            },
            total_compras: parseFloat(registro.total_compras || 0).toFixed(2),
            total_abonos: parseFloat(registro.total_abonos || 0).toFixed(2),
            saldo_pendiente: Math.max(0, parseFloat(registro.valor_total || 0) - parseFloat(registro.total_abonos || 0)).toFixed(2),
            valor_total: parseFloat(registro.valor_total || 0).toFixed(2),
            libras_acumuladas: parseFloat(registro.libras_acumuladas || 0).toFixed(2),
            link_excel: registro.link_excel,
            estado_pago: registro.estado_pago
        };
    }
}

module.exports = OrdenService;
