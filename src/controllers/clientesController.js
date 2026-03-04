const ClienteService = require('../services/clienteService');

class ClientesController {
    /**
     * Obtener perfil del cliente autenticado
     * GET /api/cliente/perfil
     */
    static async getPerfil(req, res) {
        try {
            const perfil = await ClienteService.getPerfilCliente(req.user.id);

            res.json({
                success: true,
                data: perfil
            });
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener perfil del cliente'
            });
        }
    }

    /**
     * Obtener todas las órdenes del cliente
     * GET /api/cliente/ordenes
     */
    static async getOrdenes(req, res) {
        try {
            const ordenes = await ClienteService.getOrdenesCliente(req.user.id);

            res.json({
                success: true,
                data: ordenes,
                total: ordenes.length
            });
        } catch (error) {
            console.error('Error al obtener órdenes:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener órdenes del cliente'
            });
        }
    }

    /**
     * Obtener detalle de una orden específica
     * GET /api/cliente/ordenes/:id
     */
    static async getOrdenDetalle(req, res) {
        try {
            const { id } = req.params;
            const orden = await ClienteService.getOrdenDetalle(req.user.id, id);

            res.json({
                success: true,
                data: orden
            });
        } catch (error) {
            console.error('Error al obtener detalle de orden:', error);
            res.status(error.message === 'Orden no encontrada' ? 404 : 500).json({
                success: false,
                message: error.message || 'Error al obtener detalle de la orden'
            });
        }
    }

    /**
     * Obtener resumen financiero del cliente
     * GET /api/cliente/resumen-financiero
     */
    static async getResumenFinanciero(req, res) {
        try {
            const resumen = await ClienteService.getResumenFinanciero(req.user.id);

            res.json({
                success: true,
                data: resumen
            });
        } catch (error) {
            console.error('Error al obtener resumen financiero:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener resumen financiero'
            });
        }
    }

    /**
     * Obtener historial de actualizaciones de libras del cliente en todas las órdenes
     * GET /api/cliente/historial-libras
     */
    static async getHistorialLibras(req, res) {
        try {
            const HistorialActualizacionLibras = require('../models/HistorialActualizacionLibras');
            const historial = await HistorialActualizacionLibras.findByCliente(req.user.id);

            res.json({
                success: true,
                data: historial,
                count: historial.length
            });
        } catch (error) {
            console.error('Error al obtener historial de libras:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener historial de libras'
            });
        }
    }

    /**
     * Obtener saldo del cliente en la última orden
     * GET /api/cliente/saldo-ultima-orden
     */
    static async getSaldoUltimaOrden(req, res) {
        try {
            const Cliente = require('../models/Cliente');
            const saldo = await Cliente.getSaldoUltimaOrden(req.user.id);

            if (!saldo) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró información de órdenes para este cliente'
                });
            }

            res.json({
                success: true,
                data: saldo
            });
        } catch (error) {
            console.error('Error al obtener saldo de última orden:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener saldo de última orden'
            });
        }
    }

    /**
     * Obtener historial de compras del cliente
     * GET /api/cliente/historial-compras
     */
    static async getHistorialCompras(req, res) {
        try {
            const historial = await ClienteService.getHistorialCompras(req.user.id);

            res.json({
                success: true,
                data: historial,
                count: historial.length
            });
        } catch (error) {
            console.error('Error al obtener historial de compras:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener historial de compras'
            });
        }
    }

    /**
     * Obtener historial de abonos del cliente (aceptados y rechazados)
     * GET /api/cliente/historial-abonos
     */
    static async getHistorialAbonos(req, res) {
        try {
            const historial = await ClienteService.getHistorialAbonos(req.user.id);

            res.json({
                success: true,
                data: historial,
                count: historial.length
            });
        } catch (error) {
            console.error('Error al obtener historial de abonos:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener historial de abonos'
            });
        }
    }

    /**
     * Obtener saldo total del cliente
     * GET /api/cliente/saldo
     */
    static async getSaldo(req, res) {
        try {
            const saldo = await ClienteService.getSaldo(req.user.id);

            res.json({
                success: true,
                data: saldo
            });
        } catch (error) {
            console.error('Error al obtener saldo:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener saldo del cliente'
            });
        }
    }

    /**
     * Obtener datos personales del cliente
     * GET /api/cliente/datos-personales
     */
    static async getDatosPersonales(req, res) {
        try {
            const datos = await ClienteService.getDatosPersonales(req.user.id);

            res.json({
                success: true,
                data: datos
            });
        } catch (error) {
            console.error('Error al obtener datos personales:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener datos personales'
            });
        }
    }

    /**
     * Actualizar datos personales del cliente (excepto código de casillero)
     * PUT /api/cliente/datos-personales
     */
    static async updateDatosPersonales(req, res) {
        try {
            const { nombre, apellido, direccion, pais } = req.body;

            // Validar que se incluyan los campos obligatorios
            if (!nombre || !apellido) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre y apellido son obligatorios'
                });
            }

            await ClienteService.updateDatosPersonales(req.user.id, {
                nombre,
                apellido,
                direccion,
                pais
            });

            res.json({
                success: true,
                message: 'Datos personales actualizados exitosamente'
            });
        } catch (error) {
            console.error('Error al actualizar datos personales:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al actualizar datos personales'
            });
        }
    }

    /**
     * Actualizar correo del cliente
     * PUT /api/cliente/correo
     */
    static async updateCorreo(req, res) {
        try {
            const { correo } = req.body;

            // Validar que se incluya el correo
            if (!correo) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo es obligatorio'
                });
            }

            // Validar formato de correo
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                return res.status(400).json({
                    success: false,
                    message: 'El formato del correo es inválido'
                });
            }

            await ClienteService.updateCorreo(req.user.id, correo);

            res.json({
                success: true,
                message: 'Correo actualizado exitosamente'
            });
        } catch (error) {
            console.error('Error al actualizar correo:', error);
            const statusCode = error.message.includes('ya está registrado') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Error al actualizar correo'
            });
        }
    }

    /**
     * Actualizar contraseña del cliente
     * PUT /api/cliente/contrasena
     */
    static async updateContrasena(req, res) {
        try {
            const { contrasena_actual, nueva_contrasena, confirmar_contrasena } = req.body;

            // Validar que se incluyan todos los campos
            if (!contrasena_actual || !nueva_contrasena || !confirmar_contrasena) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son obligatorios'
                });
            }

            // Validar que las nuevas contraseñas coincidan
            if (nueva_contrasena !== confirmar_contrasena) {
                return res.status(400).json({
                    success: false,
                    message: 'Las contraseñas nuevas no coinciden'
                });
            }

            // Validar requisitos de seguridad de la contraseña
            const { isValidPassword } = require('../utils/validators');
            const passwordValidation = isValidPassword(nueva_contrasena);
            
            if (!passwordValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: passwordValidation.message
                });
            }

            await ClienteService.updateContrasena(req.user.id, contrasena_actual, nueva_contrasena);

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            const statusCode = error.message.includes('incorrecta') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Error al actualizar contraseña'
            });
        }
    }
}

module.exports = ClientesController;
