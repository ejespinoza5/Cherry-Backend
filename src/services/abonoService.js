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
            cantidad: parseFloat(abono.cantidad),
            estado: abono.estado,
            created_at: abono.created_at,
            updated_at: abono.updated_at,
            cliente: {
                nombre: abono.cliente_nombre,
                apellido: abono.cliente_apellido,
                codigo: abono.cliente_codigo,
                saldo_actual: parseFloat(abono.cliente_saldo_actual)
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
     * Crear nuevo abono
     */
    static async createAbono(data, created_by) {
        const { id_cliente, cantidad } = data;

        // Validar campos requeridos
        if (!id_cliente || !cantidad) {
            throw new Error('FIELDS_REQUIRED');
        }

        // Validar que el ID del cliente sea válido
        if (!isPositiveInteger(id_cliente)) {
            throw new Error('INVALID_CLIENT_ID');
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

        // Crear abono
        const abonoId = await Abono.create(id_cliente, cantidadNum, created_by);

        // Retornar el abono creado
        const abonoCreado = await Abono.findById(abonoId);
        return this.formatAbonoData(abonoCreado);
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
