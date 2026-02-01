const express = require('express');
const router = express.Router();
const abonosController = require('../controllers/abonosController');
const { verifyToken, isAdminOrSuperAdmin } = require('../middlewares/auth');

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
 * @route   GET /api/abonos/cliente/:id_cliente
 * @desc    Obtener todos los abonos de un cliente específico
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/cliente/:id_cliente', abonosController.getAbonosByCliente);

/**
 * @route   GET /api/abonos/:id
 * @desc    Obtener abono por ID
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/:id', abonosController.getAbonoById);

/**
 * @route   POST /api/abonos
 * @desc    Crear nuevo abono (actualiza automáticamente el saldo del cliente)
 * @access  Private (Admin o SuperAdmin)
 */
router.post('/', abonosController.createAbono);

/**
 * @route   PUT /api/abonos/:id
 * @desc    Actualizar abono (recalcula el saldo del cliente)
 * @access  Private (Admin o SuperAdmin)
 */
router.put('/:id', abonosController.updateAbono);

/**
 * @route   DELETE /api/abonos/:id
 * @desc    Eliminar abono (cambia estado a inactivo y resta del saldo del cliente)
 * @access  Private (Admin o SuperAdmin)
 */
router.delete('/:id', abonosController.deleteAbono);

module.exports = router;
