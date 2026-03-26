const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar codigo OTP para recuperar contrasena
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/auth/verify-recovery-code
 * @desc    Verificar codigo OTP de recuperacion
 * @access  Public
 */
router.post('/verify-recovery-code', authController.verifyRecoveryCode);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Cambiar contrasena con token temporal
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @route   POST /api/auth/change-initial-password
 * @desc    Cambiar contrasena en primer inicio de sesion
 * @access  Private
 */
router.post('/change-initial-password', verifyToken, authController.changeInitialPassword);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', verifyToken, authController.me);

module.exports = router;
