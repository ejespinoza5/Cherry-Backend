const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

/**
 * Todas las rutas requieren autenticación y permisos de administrador
 */
router.use(verifyToken, isAdmin);

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios
 * @access  Private (Admin)
 */
router.get('/', usuariosController.getAllUsuarios);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Private (Admin)
 */
router.get('/:id', usuariosController.getUsuarioById);

/**
 * @route   POST /api/usuarios
 * @desc    Crear nuevo usuario (Admin o Cliente)
 * @access  Private (Admin)
 */
router.post('/', usuariosController.createUsuario);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario
 * @access  Private (Admin)
 */
router.put('/:id', usuariosController.updateUsuario);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario (cambiar estado a inactivo)
 * @access  Private (Admin)
 */
router.delete('/:id', usuariosController.deleteUsuario);

module.exports = router;
