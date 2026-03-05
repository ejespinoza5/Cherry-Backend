const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, isAdminOrSuperAdmin } = require('../middlewares/auth');

/**
 * Todas las rutas requieren autenticación y permisos de administrador o superAdministrador
 */
router.use(verifyToken, isAdminOrSuperAdmin);

/**
 * @route   GET /api/dashboard/estadisticas
 * @desc    Obtener estadísticas generales del sistema basadas en la última orden creada
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/estadisticas', dashboardController.getEstadisticas);

/**
 * @route   GET /api/dashboard/top3
 * @desc    Top 3 clientes que más abonaron y top 3 que más deben en la orden actual
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/top3', dashboardController.getTop3);

module.exports = router;
