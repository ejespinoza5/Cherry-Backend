const CierreOrdenService = require('../services/cierreOrdenService');
const VerificarPagoOrdenService = require('../services/verificarPagoOrdenService');
const ClienteOrden = require('../models/ClienteOrden');
const HistorialIncumplimiento = require('../models/HistorialIncumplimiento');

class CierreOrdenController {
    /**
     * Cerrar orden manualmente
     */
    static async cerrarOrden(req, res) {
        try {
            const { id } = req.params;
            const usuario_id = req.user.id; // Cambiado de userId a id

            const resultado = await CierreOrdenService.cerrarOrdenManual(id, usuario_id);

            res.status(200).json({
                success: true,
                message: 'Orden cerrada exitosamente',
                data: resultado
            });
        } catch (error) {
            console.error('Error al cerrar orden:', error);
            
            let statusCode = 500;
            let message = 'Error al cerrar la orden';

            if (error.message === 'Orden no encontrada') {
                statusCode = 404;
                message = error.message;
            } else if (error.message === 'La orden ya está cerrada') {
                statusCode = 400;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message,
                error: error.message
            });
        }
    }

    /**
     * Reabrir orden (solo administradores)
     */
    static async reabrirOrden(req, res) {
        try {
            const { id } = req.params;
            const usuario_id = req.user.id; // Cambiado de userId a id

            const resultado = await CierreOrdenService.reabrirOrden(id, usuario_id);

            res.status(200).json({
                success: true,
                message: 'Orden reabierta exitosamente',
                data: resultado
            });
        } catch (error) {
            console.error('Error al reabrir orden:', error);
            
            let statusCode = 500;
            let message = 'Error al reabrir la orden';

            if (error.message === 'Orden no encontrada') {
                statusCode = 404;
                message = error.message;
            } else if (error.message === 'La orden ya está abierta') {
                statusCode = 400;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message,
                error: error.message
            });
        }
    }

    /**
     * Obtener resumen de cierre de orden
     */
    static async obtenerResumenCierre(req, res) {
        try {
            const { id } = req.params;

            const resumen = await CierreOrdenService.obtenerResumenCierre(id);

            if (!resumen) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró información de cierre para esta orden'
                });
            }

            res.status(200).json({
                success: true,
                data: resumen
            });
        } catch (error) {
            console.error('Error al obtener resumen de cierre:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener resumen de cierre',
                error: error.message
            });
        }
    }

    /**
     * Obtener estado de clientes en una orden
     */
    static async obtenerEstadoClientes(req, res) {
        try {
            const { id } = req.params;

            const clientes = await ClienteOrden.findByOrden(id);

            res.status(200).json({
                success: true,
                data: clientes
            });
        } catch (error) {
            console.error('Error al obtener estado de clientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estado de clientes',
                error: error.message
            });
        }
    }

    /**
     * Obtener historial de un cliente
     */
    static async obtenerHistorialCliente(req, res) {
        try {
            const { id_cliente } = req.params;

            const [ordenes, incumplimientos, score] = await Promise.all([
                ClienteOrden.findByCliente(id_cliente),
                HistorialIncumplimiento.findByCliente(id_cliente),
                HistorialIncumplimiento.obtenerScoreCrediticio(id_cliente)
            ]);

            res.status(200).json({
                success: true,
                data: {
                    ordenes_participadas: ordenes,
                    incumplimientos: incumplimientos,
                    score_crediticio: score
                }
            });
        } catch (error) {
            console.error('Error al obtener historial del cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener historial del cliente',
                error: error.message
            });
        }
    }

    /**
     * Rematar productos de clientes morosos (manual)
     * Query params: ?forzar=true (permite rematar antes de las 48h)
     */
    static async rematarClientesMorosos(req, res) {
        try {
            const { id } = req.params;
            const usuario_id = req.user.id; // Cambiado de userId a id
            const forzar = req.query.forzar === 'true'; // Convertir string a boolean

            const resultado = await CierreOrdenService.rematarClientesMorosos(id, usuario_id, forzar);

            const mensaje = resultado.orden_cerrada
                ? `${resultado.mensaje}. La orden ha sido cerrada completamente.`
                : resultado.mensaje;

            res.status(200).json({
                success: true,
                message: mensaje,
                data: resultado.clientes_rematados,
                orden_cerrada: resultado.orden_cerrada
            });
        } catch (error) {
            console.error('Error al rematar clientes morosos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al rematar productos de clientes morosos',
                error: error.message
            });
        }
    }

    /**
     * Verificar si un cliente puede participar en nuevas órdenes
     */
    static async verificarElegibilidadCliente(req, res) {
        try {
            const { id_cliente } = req.params;

            const elegibilidad = await HistorialIncumplimiento.puedeParticipar(id_cliente);

            res.status(200).json({
                success: true,
                data: elegibilidad
            });
        } catch (error) {
            console.error('Error al verificar elegibilidad del cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar elegibilidad del cliente',
                error: error.message
            });
        }
    }

    /**
     * Obtener clientes morosos de una orden
     */
    static async obtenerClientesMorosos(req, res) {
        try {
            const { id } = req.params;

            const morosos = await ClienteOrden.obtenerClientesMorosos(id);

            res.status(200).json({
                success: true,
                data: morosos
            });
        } catch (error) {
            console.error('Error al obtener clientes morosos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener clientes morosos',
                error: error.message
            });
        }
    }

    /**
     * Verificar y actualizar estado de pago de una orden
     * Si todos pagaron, cierra el periodo de gracia
     */
    static async verificarEstadoPago(req, res) {
        try {
            const { id } = req.params;

            const resultado = await VerificarPagoOrdenService.verificarOrdenManual(id);

            res.status(200).json(resultado);
        } catch (error) {
            console.error('Error al verificar estado de pago:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar estado de pago de la orden',
                error: error.message
            });
        }
    }

    /**
     * Obtener todos los productos rematados
     */
    static async obtenerProductosRematados(req, res) {
        try {
            const filters = {
                id_orden: req.query.id_orden,
                id_cliente: req.query.id_cliente,
                fecha_desde: req.query.fecha_desde,
                fecha_hasta: req.query.fecha_hasta,
                limit: req.query.limit
            };

            const resultado = await CierreOrdenService.obtenerProductosRematados(filters);

            res.status(200).json(resultado);
        } catch (error) {
            console.error('Error al obtener productos rematados:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos rematados',
                error: error.message
            });
        }
    }

    /**
     * Obtener productos en riesgo de remate
     */
    static async obtenerProductosEnRiesgo(req, res) {
        try {
            const { id_orden } = req.query;

            const resultado = await CierreOrdenService.obtenerProductosEnRiesgo(id_orden);

            res.status(200).json(resultado);
        } catch (error) {
            console.error('Error al obtener productos en riesgo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos en riesgo de remate',
                error: error.message
            });
        }
    }
}

module.exports = CierreOrdenController;
