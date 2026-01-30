const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const { verifyToken } = require('../middlewares/auth');
const { upload, processImage } = require('../middlewares/upload');

// Todas las rutas requieren autenticación
router.use(verifyToken);

/**
 * @route   GET /api/productos
 * @desc    Obtener todos los productos (con filtros opcionales)
 * @access  Privado
 * @query   id_orden - Filtrar por orden
 * @query   id_cliente - Filtrar por cliente
 */
router.get('/', productosController.getAllProductos);

/**
 * @route   GET /api/productos/agrupados/:id_orden
 * @desc    Obtener productos agrupados por cliente en una orden
 * @access  Privado
 */
router.get('/agrupados/:id_orden', productosController.getProductosAgrupadosPorCliente);

/**
 * @route   GET /api/productos/cliente/:id_cliente/:id_orden
 * @desc    Obtener todos los productos de un cliente en una orden específica
 * @access  Privado
 */
router.get('/cliente/:id_cliente/:id_orden', productosController.getProductosPorCliente);

/**
 * @route   GET /api/productos/resumen/:id_orden/:id_cliente
 * @desc    Obtener resumen de productos por cliente en una orden
 * @access  Privado
 */
router.get('/resumen/:id_orden/:id_cliente', productosController.getResumenPorCliente);

/**
 * @route   GET /api/productos/:id
 * @desc    Obtener producto por ID
 * @access  Privado
 */
router.get('/:id', productosController.getProductoById);

/**
 * @route   POST /api/productos
 * @desc    Crear nuevo producto (con imagen opcional)
 * @access  Privado
 */
router.post('/', upload.single('imagen'), processImage, productosController.createProducto);

/**
 * @route   PUT /api/productos/:id
 * @desc    Actualizar producto (con imagen opcional)
 * @access  Privado
 */
router.put('/:id', upload.single('imagen'), processImage, productosController.updateProducto);

/**
 * @route   DELETE /api/productos/:id
 * @desc    Eliminar producto (soft delete)
 * @access  Privado
 */
router.delete('/:id', productosController.deleteProducto);

module.exports = router;
