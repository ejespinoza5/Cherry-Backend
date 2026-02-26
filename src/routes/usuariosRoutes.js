const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verifyToken, isAdminOrSuperAdmin } = require('../middlewares/auth');

/**
 * Todas las rutas requieren autenticación y permisos de administrador o superAdministrador
 */
router.use(verifyToken, isAdminOrSuperAdmin);

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/', usuariosController.getAllUsuarios);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/:id', usuariosController.getUsuarioById);

/**
 * @route   POST /api/usuarios
 * @desc    Crear nuevo usuario
 * @access  Private (Admin puede crear solo clientes, SuperAdmin puede crear todos)
 */
router.post('/', usuariosController.createUsuario);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario
 * @access  Private (Admin o SuperAdmin)
 */
router.put('/:id', usuariosController.updateUsuario);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario (cambiar estado a inactivo)
 * @access  Private (Admin o SuperAdmin)
 */
router.delete('/:id', usuariosController.deleteUsuario);

/**
 * @route   PATCH /api/usuarios/:id/estado-actividad
 * @desc    Actualizar manualmente el estado de actividad de un cliente
 * @access  Private (Admin o SuperAdmin)
 */
router.patch('/:id/estado-actividad', usuariosController.updateEstadoActividad);

/**
 * @route   PUT /api/usuarios/clientes/:id_cliente/habilitar
 * @desc    Habilitar cliente bloqueado o inactivo para que pueda hacer compras
 * @access  Private (Admin o SuperAdmin)
 */
router.put('/clientes/:id_cliente/habilitar', usuariosController.habilitarCliente);

/**
 * @route   GET /api/usuarios/clientes/:id_cliente/saldo-ultima-orden
 * @desc    Obtener saldo del cliente en su última orden
 * @access  Private (Admin o SuperAdmin)
 */
router.get('/clientes/:id_cliente/saldo-ultima-orden', usuariosController.getSaldoUltimaOrden);

module.exports = router;
