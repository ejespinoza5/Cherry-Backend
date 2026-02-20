const ClienteService = require('../services/clienteService');

class ClientesController {
    /**
     * Obtener perfil del cliente autenticado
     * GET /api/cliente/perfil
     */
    static async getPerfil(req, res) {
        try {
            const perfil = await ClienteService.getPerfilCliente(req.user.id);

            res.json({
                success: true,
                data: perfil
            });
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener perfil del cliente'
            });
        }
    }

    /**
     * Obtener todas las órdenes del cliente
     * GET /api/cliente/ordenes
     */
    static async getOrdenes(req, res) {
        try {
            const ordenes = await ClienteService.getOrdenesCliente(req.user.id);

            res.json({
                success: true,
                data: ordenes,
                total: ordenes.length
            });
        } catch (error) {
            console.error('Error al obtener órdenes:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener órdenes del cliente'
            });
        }
    }

    /**
     * Obtener detalle de una orden específica
     * GET /api/cliente/ordenes/:id
     */
    static async getOrdenDetalle(req, res) {
        try {
            const { id } = req.params;
            const orden = await ClienteService.getOrdenDetalle(req.user.id, id);

            res.json({
                success: true,
                data: orden
            });
        } catch (error) {
            console.error('Error al obtener detalle de orden:', error);
            res.status(error.message === 'Orden no encontrada' ? 404 : 500).json({
                success: false,
                message: error.message || 'Error al obtener detalle de la orden'
            });
        }
    }

    /**
     * Obtener resumen financiero del cliente
     * GET /api/cliente/resumen-financiero
     */
    static async getResumenFinanciero(req, res) {
        try {
            const resumen = await ClienteService.getResumenFinanciero(req.user.id);

            res.json({
                success: true,
                data: resumen
            });
        } catch (error) {
            console.error('Error al obtener resumen financiero:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener resumen financiero'
            });
        }
    }

    /**
     * Obtener historial de actualizaciones de libras del cliente en todas las órdenes
     * GET /api/cliente/historial-libras
     */
    static async getHistorialLibras(req, res) {
        try {
            const HistorialActualizacionLibras = require('../models/HistorialActualizacionLibras');
            const historial = await HistorialActualizacionLibras.findByCliente(req.user.id);

            res.json({
                success: true,
                data: historial,
                count: historial.length
            });
        } catch (error) {
            console.error('Error al obtener historial de libras:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener historial de libras'
            });
        }
    }
}

module.exports = ClientesController;
