const Abono = require('../models/Abono');
const { isPositiveInteger } = require('../utils/validators');

class AbonoService {
    /**
     * Formatear datos de abono
     */
    static formatAbonoData(abono) {
        return {
            id: abono.id,
            id_cliente: abono.id_cliente,
            id_orden: abono.id_orden,
            cantidad: parseFloat(abono.cantidad),
            comprobante_pago: abono.comprobante_pago,
            estado_verificacion: abono.estado_verificacion,
            fecha_verificacion: abono.fecha_verificacion,
            verificado_by: abono.verificado_by,
            observaciones_verificacion: abono.observaciones_verificacion,
            estado: abono.estado,
            created_at: abono.created_at,
            updated_at: abono.updated_at,
            cliente: {
                nombre: abono.cliente_nombre,
                apellido: abono.cliente_apellido,
                codigo: abono.cliente_codigo
            },
            orden: {
                nombre: abono.nombre_orden,
                estado: abono.estado_orden
            },
            creado_por: abono.creado_por_correo,
            actualizado_por: abono.actualizado_por_correo
        };
    }

    /**
     * Obtener todos los abonos
     */
    static async getAllAbonos() {
        const abonos = await Abono.findAll();
        return abonos.map(abono => this.formatAbonoData(abono));
    }

    /**
     * Obtener abonos de un cliente específico
     */
    static async getAbonosByCliente(id_cliente) {
        // Validar que el ID sea válido
        if (!isPositiveInteger(id_cliente)) {
            throw new Error('INVALID_CLIENT_ID');
        }

        // Verificar que el cliente existe
        const clienteExists = await Abono.clienteExists(id_cliente);
        if (!clienteExists) {
            throw new Error('CLIENT_NOT_FOUND');
        }

        const abonos = await Abono.findByClienteId(id_cliente);
        return abonos.map(abono => this.formatAbonoData(abono));
    }

    /**
     * Obtener abonos por orden
     */
    static async getAbonosByOrden(id_orden) {
        // Validar que el ID sea válido
        if (!isPositiveInteger(id_orden)) {
            throw new Error('INVALID_ORDER_ID');
        }

        // Verificar que la orden existe
        const ordenExists = await Abono.ordenExists(id_orden);
        if (!ordenExists) {
            throw new Error('ORDER_NOT_FOUND');
        }

        const abonos = await Abono.findByOrden(id_orden);
        return abonos.map(abono => ({
            id: abono.id,
            id_cliente: abono.id_cliente,
            cantidad: parseFloat(abono.cantidad),
            comprobante_pago: abono.comprobante_pago,
            estado_verificacion: abono.estado_verificacion,
            fecha_verificacion: abono.fecha_verificacion,
            verificado_by: abono.verificado_by,
            observaciones_verificacion: abono.observaciones_verificacion,
            created_at: abono.created_at,
            cliente: {
                nombre: abono.cliente_nombre,
                apellido: abono.cliente_apellido,
                codigo: abono.cliente_codigo
            }
        }));
    }

    /**
     * Obtener abonos pendientes de verificación
     */
    static async getAbonosPendientes() {
        const abonos = await Abono.findPendingVerification();
        return abonos.map(abono => ({
            id: abono.id,
            id_cliente: abono.id_cliente,
            id_orden: abono.id_orden,
            cantidad: parseFloat(abono.cantidad),
            comprobante_pago: abono.comprobante_pago,
            estado_verificacion: abono.estado_verificacion,
            created_at: abono.created_at,
            cliente: {
                nombre: abono.cliente_nombre,
                apellido: abono.cliente_apellido,
                codigo: abono.cliente_codigo
            },
            orden: {
                nombre: abono.nombre_orden,
                estado: abono.estado_orden
            }
        }));
    }

    /**
     * Obtener abono por ID
     */
    static async getAbonoById(id) {
        // Validar que el ID sea válido
        if (!isPositiveInteger(id)) {
            throw new Error('INVALID_ABONO_ID');
        }

        const abono = await Abono.findById(id);
        
        if (!abono) {
            throw new Error('ABONO_NOT_FOUND');
        }

        return this.formatAbonoData(abono);
    }

    /**
     * Crear nuevo abono con comprobante
     */
    static async createAbono(data, comprobante_pago, created_by) {
        const { id_cliente, id_orden, cantidad } = data;

        // Validar campos requeridos
        if (!id_cliente || !id_orden || !cantidad) {
            throw new Error('FIELDS_REQUIRED');
        }

        // Validar que no se requiera comprobante (puedes hacerlo opcional o requerido)
        // if (!comprobante_pago) {
        //     throw new Error('COMPROBANTE_REQUIRED');
        // }

        // Validar que el ID del cliente sea válido
        if (!isPositiveInteger(id_cliente)) {
            throw new Error('INVALID_CLIENT_ID');
        }

        // Validar que el ID de la orden sea válido
        if (!isPositiveInteger(id_orden)) {
            throw new Error('INVALID_ORDER_ID');
        }

        // Validar que la cantidad sea positiva
        const cantidadNum = parseFloat(cantidad);
        if (isNaN(cantidadNum) || cantidadNum <= 0) {
            throw new Error('INVALID_AMOUNT');
        }

        // Verificar que el cliente existe
        const clienteExists = await Abono.clienteExists(id_cliente);
        if (!clienteExists) {
            throw new Error('CLIENT_NOT_FOUND');
        }

        // Verificar que la orden existe
        const ordenExists = await Abono.ordenExists(id_orden);
        if (!ordenExists) {
            throw new Error('ORDER_NOT_FOUND');
        }

        // Crear abono con comprobante (estado pendiente por defecto)
        const abonoId = await Abono.create(id_cliente, id_orden, cantidadNum, comprobante_pago, created_by);

        // NO verificar pago aquí, se hará cuando se verifique el comprobante

        // Retornar el abono creado
        const abonoCreado = await Abono.findById(abonoId);
        return this.formatAbonoData(abonoCreado);
    }

    /**
     * Verificar comprobante de pago
     */
    static async verificarComprobante(id, verificado_by_email, observaciones = null) {
        // Validar que el ID sea válido
        if (!isPositiveInteger(id)) {
            throw new Error('INVALID_ABONO_ID');
        }

        // Verificar comprobante
        await Abono.verificarComprobante(id, verificado_by_email, observaciones);

        // Obtener el abono actualizado
        const abono = await Abono.findById(id);

        // Retornar el abono actualizado
        return this.formatAbonoData(abono);
    }

    /**
     * Rechazar comprobante de pago
     */
    static async rechazarComprobante(id, verificado_by_email, observaciones) {
        // Validar que el ID sea válido
        if (!isPositiveInteger(id)) {
            throw new Error('INVALID_ABONO_ID');
        }

        // Validar que hay observaciones (requerido al rechazar)
        if (!observaciones || observaciones.trim() === '') {
            throw new Error('OBSERVACIONES_REQUIRED');
        }

        // Rechazar comprobante
        await Abono.rechazarComprobante(id, verificado_by_email, observaciones);

        // Retornar el abono actualizado
        const abono = await Abono.findById(id);
        return this.formatAbonoData(abono);
    }

    /**
     * Actualizar abono
     */
    static async updateAbono(id, data, updated_by) {
        const { cantidad } = data;

        // Validar que el ID sea válido
        if (!isPositiveInteger(id)) {
            throw new Error('INVALID_ABONO_ID');
        }

        // Validar que la cantidad sea positiva
        const cantidadNum = parseFloat(cantidad);
        if (isNaN(cantidadNum) || cantidadNum <= 0) {
            throw new Error('INVALID_AMOUNT');
        }

        // Verificar que el abono existe
        const abonoExists = await Abono.findById(id);
        if (!abonoExists) {
            throw new Error('ABONO_NOT_FOUND');
        }

        // Actualizar abono
        await Abono.update(id, cantidadNum, updated_by);

        // Retornar el abono actualizado
        const abonoActualizado = await Abono.findById(id);
        return this.formatAbonoData(abonoActualizado);
    }

    /**
     * Eliminar abono (cambiar estado a inactivo)
     */
    static async deleteAbono(id, updated_by) {
        // Validar que el ID sea válido
        if (!isPositiveInteger(id)) {
            throw new Error('INVALID_ABONO_ID');
        }

        // Eliminar abono (cambia estado y ajusta saldo)
        await Abono.delete(id, updated_by);

        return true;
    }
}

module.exports = AbonoService;
