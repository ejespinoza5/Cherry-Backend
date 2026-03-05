const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, isAdminOrSuperAdmin } = require('../middlewares/auth');

/**
 * Todas las rutas requieren autenticación y permisos de administrador o superAdministrador
 */
router.use(verifyToken, isAdminOrSuperAdmin);

/**
 * @route   GET /api/dashboard/estadisticas/:id_orden
 * @desc    Obtener estadísticas del sistema para una orden específica
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/estadisticas/:id_orden', dashboardController.getEstadisticas);

/**
 * @route   GET /api/dashboard/top3/:id_orden
 * @desc    Top 3 clientes que más abonaron y top 3 que más deben en una orden específica
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/top3/:id_orden', dashboardController.getTop3);

module.exports = router;
