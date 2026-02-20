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
 * @route   GET /api/ordenes/:id_orden/clientes/:id_cliente
 * @desc    Obtener datos de un cliente específico en una orden (incluye campos manuales)
 * @access  Privado
 */
router.get('/:id_orden/clientes/:id_cliente', ordenesController.getClienteOrdenDatos);

/**
 * @route   GET /api/ordenes/:id_orden/clientes/:id_cliente/historial-libras
 * @desc    Obtener historial de actualizaciones de libras de un cliente en una orden
 * @access  Privado
 */
router.get('/:id_orden/clientes/:id_cliente/historial-libras', ordenesController.getHistorialLibrasByClienteOrden);

/**
 * @route   GET /api/ordenes/:id_orden/historial-libras
 * @desc    Obtener historial de actualizaciones de libras de todos los clientes en una orden
 * @access  Privado
 */
router.get('/:id_orden/historial-libras', ordenesController.getHistorialLibrasByOrden);

/**
 * @route   POST /api/ordenes
 * @desc    Crear nueva orden
 * @access  Privado
 * @body    nombre_orden, fecha_inicio, fecha_fin (opcional), estado (opcional)
 */
router.post('/', ordenesController.createOrden);

/**
 * @route   PUT /api/ordenes/:id
 * @desc    Actualizar orden
 * @access  Privado
 * @body    nombre_orden, fecha_inicio, fecha_fin, estado
 */
router.put('/:id', ordenesController.updateOrden);

/**
 * @route   PUT /api/ordenes/:id_orden/clientes/:id_cliente/datos-manuales
 * @desc    Actualizar campos manuales de un cliente en una orden (valor_total, libras_acumuladas, link_excel)
 * @access  Privado
 * @body    valor_total (opcional), libras_acumuladas (opcional), link_excel (opcional)
 */
router.put('/:id_orden/clientes/:id_cliente/datos-manuales', ordenesController.updateClienteOrdenDatosManuales);

/**
 * @route   DELETE /api/ordenes/:id
 * @desc    Eliminar orden (soft delete)
 * @access  Privado
 */
router.delete('/:id', ordenesController.deleteOrden);

module.exports = router;
