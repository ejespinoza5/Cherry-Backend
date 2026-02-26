const express = require('express');
const router = express.Router();
const abonosController = require('../controllers/abonosController');
const { verifyToken, isAdminOrSuperAdmin } = require('../middlewares/auth');
const { uploadComprobante, processComprobante } = require('../middlewares/upload');

/**
 * Todas las rutas requieren autenticación y permisos de administrador o superAdministrador
 */
router.use(verifyToken, isAdminOrSuperAdmin);

/**
 * @route   GET /api/abonos
 * @desc    Obtener todos los abonos
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/', abonosController.getAllAbonos);

/**
 * @route   GET /api/abonos/pendientes
 * @desc    Obtener abonos pendientes de verificación
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/pendientes', abonosController.getAbonosPendientes);

/**
 * @route   GET /api/abonos/ordenes/:id_orden/clientes
 * @desc    Obtener clientes con sus abonos por orden, filtrados por estado de verificación
 * @query   estado (opcional): pendiente, verificado, rechazado
 * @query   page (opcional, default: 1): número de página
 * @query   limit (opcional, default: 10): registros por página
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/ordenes/:id_orden/clientes', abonosController.getClientesConAbonosPorOrden);

/**
 * @route   GET /api/abonos/ordenes/:id_orden/contador-estados
 * @desc    Obtener contador de abonos por estado de verificación en una orden
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/ordenes/:id_orden/contador-estados', abonosController.getContadorEstadosVerificacion);

/**
 * @route   GET /api/abonos/saldo/:id_cliente/:id_orden
 * @desc    Obtener saldo actualizado de un cliente en una orden específica
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/saldo/:id_cliente/:id_orden', abonosController.getSaldoClienteOrden);

/**
 * @route   GET /api/abonos/cliente/:id_cliente
 * @desc    Obtener todos los abonos de un cliente específico
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/cliente/:id_cliente', abonosController.getAbonosByCliente);

/**
 * @route   GET /api/abonos/orden/:id_orden
 * @desc    Obtener todos los abonos de una orden específica
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/orden/:id_orden', abonosController.getAbonosByOrden);

/**
 * @route   GET /api/abonos/:id
 * @desc    Obtener abono por ID
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/:id', abonosController.getAbonoById);

/**
 * @route   POST /api/abonos
 * @desc    Crear nuevo abono con comprobante (estado pendiente hasta verificación)
 * @access  Private (Admin o SuperAdmin)
 */
router.post('/', 
    uploadComprobante.single('comprobante'),
    processComprobante,
    abonosController.createAbono
);

/**
 * @route   PUT /api/abonos/:id/verificar
 * @desc    Verificar comprobante de pago (actualiza el saldo en cliente_orden)
 * @access  Private (Admin o SuperAdmin)
 */
router.put('/:id/verificar', abonosController.verificarComprobante);

/**
 * @route   PUT /api/abonos/:id/rechazar
 * @desc    Rechazar comprobante de pago
 * @access  Private (Admin o SuperAdmin)
 */
router.put('/:id/rechazar', abonosController.rechazarComprobante);

/**
 * @route   PUT /api/abonos/:id
 * @desc    Actualizar abono (solo si está pendiente, permite cambiar cantidad y/o comprobante)
 * @access  Private (Admin o SuperAdmin)
 */
router.put('/:id', 
    uploadComprobante.single('comprobante'),
    processComprobante,
    abonosController.updateAbono
);

/**
 * @route   DELETE /api/abonos/:id
 * @desc    Eliminar abono (cambia estado a inactivo y resta del saldo si estaba verificado)
 * @access  Private (Admin o SuperAdmin)
 */
router.delete('/:id', abonosController.deleteAbono);

module.exports = router;
