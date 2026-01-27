const express = require('express');
const router = express.Router();
const ordenesController = require('../controllers/ordenesController');
const { verifyToken } = require('../middlewares/auth');

/**
 * Todas las rutas requieren autenticación
 */
router.use(verifyToken);

/**
 * @route   GET /api/ordenes
 * @desc    Obtener todas las órdenes (con filtros opcionales)
 * @access  Privado
 * @query   estado - Filtrar por estado (activo/inactivo)
 * @query   fecha_inicio - Filtrar desde fecha
 * @query   fecha_fin - Filtrar hasta fecha
 */
router.get('/', ordenesController.getAllOrdenes);

/**
 * @route   GET /api/ordenes/:id
 * @desc    Obtener orden por ID
 * @access  Privado
 */
router.get('/:id', ordenesController.getOrdenById);

/**
 * @route   GET /api/ordenes/:id/estadisticas
 * @desc    Obtener estadísticas de una orden
 * @access  Privado
 */
router.get('/:id/estadisticas', ordenesController.getOrdenEstadisticas);

/**
 * @route   POST /api/ordenes
 * @desc    Crear nueva orden
 * @access  Privado
 * @body    nombre_orden, fecha_inicio, fecha_fin (opcional), impuesto (opcional), comision (opcional), estado (opcional)
 */
router.post('/', ordenesController.createOrden);

/**
 * @route   PUT /api/ordenes/:id
 * @desc    Actualizar orden
 * @access  Privado
 * @body    nombre_orden, fecha_inicio, fecha_fin, impuesto, comision, estado
 */
router.put('/:id', ordenesController.updateOrden);

/**
 * @route   DELETE /api/ordenes/:id
 * @desc    Eliminar orden (soft delete)
 * @access  Privado
 */
router.delete('/:id', ordenesController.deleteOrden);

module.exports = router;
