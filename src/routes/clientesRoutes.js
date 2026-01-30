const express = require('express');
const router = express.Router();
const ClientesController = require('../controllers/clientesController');
const { verifyToken } = require('../middlewares/auth');

// Middleware para verificar que el usuario sea cliente
const isCliente = (req, res, next) => {
    // Asumiendo que el rol de cliente es id_rol = 2
    if (!req.user || req.user.id_rol !== 2) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Esta función es solo para clientes'
        });
    }
    next();
};

// Todas las rutas requieren autenticación y que el usuario sea cliente
router.use(verifyToken, isCliente);

/**
 * @route   GET /api/cliente/perfil
 * @desc    Obtener perfil del cliente autenticado
 * @access  Cliente
 */
router.get('/perfil', ClientesController.getPerfil);

/**
 * @route   GET /api/cliente/ordenes
 * @desc    Obtener todas las órdenes del cliente
 * @access  Cliente
 */
router.get('/ordenes', ClientesController.getOrdenes);

/**
 * @route   GET /api/cliente/ordenes/:id
 * @desc    Obtener detalle de una orden específica
 * @access  Cliente
 */
router.get('/ordenes/:id', ClientesController.getOrdenDetalle);

/**
 * @route   GET /api/cliente/resumen-financiero
 * @desc    Obtener resumen financiero del cliente (total compras, deudas, etc)
 * @access  Cliente
 */
router.get('/resumen-financiero', ClientesController.getResumenFinanciero);

module.exports = router;
