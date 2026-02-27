const express = require('express');
const router = express.Router();
const CierreOrdenController = require('../controllers/cierreOrdenController');
const { verifyToken, isAdminOrSuperAdmin } = require('../middlewares/auth');

/**
 * @route   POST /api/cierre-ordenes/:id/cerrar
 * @desc    Cerrar una orden manualmente
 * @access  Private (Admin, Superadmin)
 */
router.post(
    '/:id/cerrar',
    verifyToken,
    isAdminOrSuperAdmin,
    CierreOrdenController.cerrarOrden
);

/**
 * @route   POST /api/cierre-ordenes/:id/reabrir
 * @desc    Reabrir una orden cerrada
 * @access  Private (Admin, Superadmin)
 */
router.post(
    '/:id/reabrir',
    verifyToken,
    isAdminOrSuperAdmin,
    CierreOrdenController.reabrirOrden
);

/**
 * @route   GET /api/cierre-ordenes/:id/resumen
 * @desc    Obtener resumen de cierre de una orden
 * @access  Private
 */
router.get(
    '/:id/resumen',
    verifyToken,
    CierreOrdenController.obtenerResumenCierre
);

/**
 * @route   GET /api/cierre-ordenes/:id/clientes
 * @desc    Obtener estado de clientes en una orden
 * @access  Private
 */
router.get(
    '/:id/clientes',
    verifyToken,
    CierreOrdenController.obtenerEstadoClientes
);

/**
 * @route   POST /api/cierre-ordenes/:id/rematar
 * @desc    Rematar clientes morosos manualmente
 * @access  Private (Admin, Superadmin)
 */
router.post(
    '/:id/rematar',
    verifyToken,
    isAdminOrSuperAdmin,
    CierreOrdenController.rematarClientesMorosos
);

/**
 * @route   GET /api/cierre-ordenes/:id/morosos
 * @desc    Obtener lista de clientes morosos de una orden
 * @access  Private (Admin, Superadmin)
 */
router.get(
    '/:id/morosos',
    verifyToken,
    isAdminOrSuperAdmin,
    CierreOrdenController.obtenerClientesMorosos
);

/**
 * @route   GET /api/cierre-ordenes/cliente/:id_cliente/historial
 * @desc    Obtener historial completo de un cliente
 * @access  Private
 */
router.get(
    '/cliente/:id_cliente/historial',
    verifyToken,
    CierreOrdenController.obtenerHistorialCliente
);

/**
 * @route   GET /api/cierre-ordenes/cliente/:id_cliente/elegibilidad
 * @desc    Verificar si un cliente puede participar en nuevas órdenes
 * @access  Private
 */
router.get(
    '/cliente/:id_cliente/elegibilidad',
    verifyToken,
    CierreOrdenController.verificarElegibilidadCliente
);

/**
 * @route   POST /api/cierre-ordenes/:id/verificar-pago
 * @desc    Verificar si todos los clientes pagaron y cerrar periodo de gracia
 * @access  Private (Admin, Superadmin)
 */
router.post(
    '/:id/verificar-pago',
    verifyToken,
    isAdminOrSuperAdmin,
    CierreOrdenController.verificarEstadoPago
);

/**
 * @route   GET /api/cierre-ordenes/clientes-rematados
 * @desc    Obtener todos los clientes rematados con paginación
 * @access  Private
 * @query   page (opcional, default: 1), limit (opcional, default: 20)
 */
router.get(
    '/clientes-rematados',
    verifyToken,
    CierreOrdenController.obtenerClientesRematados
);

/**
 * @route   GET /api/cierre-ordenes/clientes-en-riesgo
 * @desc    Obtener clientes en riesgo de remate (durante periodo de gracia)
 * @access  Private
 * @query   id_orden (requerido)
 */
router.get(
    '/clientes-en-riesgo',
    verifyToken,
    CierreOrdenController.obtenerClientesEnRiesgo
);

module.exports = router;
