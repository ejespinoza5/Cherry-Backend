const AbonoService = require('../services/abonoService');

/**
 * Obtener todos los abonos
 */
const getAllAbonos = async (req, res) => {
    try {
        const abonos = await AbonoService.getAllAbonos();

        res.json({
            success: true,
            data: abonos
        });

    } catch (error) {
        console.error('Error al obtener abonos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener abonos',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener abonos de un cliente específico
 */
const getAbonosByCliente = async (req, res) => {
    try {
        const { id_cliente } = req.params;
        const abonos = await AbonoService.getAbonosByCliente(id_cliente);

        res.json({
            success: true,
            data: abonos
        });

    } catch (error) {
        console.error('Error al obtener abonos del cliente:', error);

        if (error.message === 'INVALID_CLIENT_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente inválido'
            });
        }

        if (error.message === 'CLIENT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener abonos del cliente',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener abonos de una orden específica
 */
const getAbonosByOrden = async (req, res) => {
    try {
        const { id_orden } = req.params;
        const abonos = await AbonoService.getAbonosByOrden(id_orden);

        res.json({
            success: true,
            data: abonos
        });

    } catch (error) {
        console.error('Error al obtener abonos de la orden:', error);

        if (error.message === 'INVALID_ORDER_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de orden inválido'
            });
        }

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener abonos de la orden',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener abonos pendientes de verificación
 */
const getAbonosPendientes = async (req, res) => {
    try {
        const abonos = await AbonoService.getAbonosPendientes();

        res.json({
            success: true,
            data: abonos
        });

    } catch (error) {
        console.error('Error al obtener abonos pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener abonos pendientes',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener abono por ID
 */
const getAbonoById = async (req, res) => {
    try {
        const { id } = req.params;
        const abono = await AbonoService.getAbonoById(id);

        res.json({
            success: true,
            data: abono
        });

    } catch (error) {
        console.error('Error al obtener abono:', error);

        if (error.message === 'INVALID_ABONO_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de abono inválido'
            });
        }

        if (error.message === 'ABONO_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Abono no encontrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener abono',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Crear nuevo abono con comprobante
 */
const createAbono = async (req, res) => {
    try {
        const { id_cliente, id_orden, cantidad } = req.body;

        // Validar campos requeridos
        if (!id_cliente || !id_orden || !cantidad) {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente, ID de orden y cantidad son requeridos'
            });
        }

        // Obtener la URL del comprobante si se subió
        const comprobante_pago = req.comprobanteUrl || null;

        // Crear abono
        const nuevoAbono = await AbonoService.createAbono(
            { id_cliente, id_orden, cantidad },
            comprobante_pago,
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: 'Abono registrado exitosamente. Pendiente de verificación.',
            data: nuevoAbono
        });

    } catch (error) {
        console.error('Error al crear abono:', error);

        if (error.message === 'FIELDS_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente, ID de orden y cantidad son requeridos'
            });
        }

        if (error.message === 'INVALID_CLIENT_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente inválido'
            });
        }

        if (error.message === 'INVALID_ORDER_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de orden inválido'
            });
        }

        if (error.message === 'INVALID_AMOUNT') {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser un número positivo'
            });
        }

        if (error.message === 'CLIENT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        if (error.message === 'COMPROBANTE_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'El comprobante de pago es requerido'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear abono',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Verificar comprobante de pago
 */
const verificarComprobante = async (req, res) => {
    try {
        const { id } = req.params;
        const observaciones = req.body?.observaciones || '';

        // Verificar comprobante
        const abonoVerificado = await AbonoService.verificarComprobante(
            id,
            req.user.correo,
            observaciones
        );

        res.json({
            success: true,
            message: 'Comprobante verificado exitosamente. Saldo actualizado.',
            data: abonoVerificado
        });

    } catch (error) {
        console.error('Error al verificar comprobante:', error);

        if (error.message === 'INVALID_ABONO_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de abono inválido'
            });
        }

        if (error.message === 'ABONO_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Abono no encontrado'
            });
        }

        if (error.message === 'ABONO_ALREADY_PROCESSED') {
            return res.status(400).json({
                success: false,
                message: 'Este comprobante ya ha sido procesado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al verificar comprobante',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Rechazar comprobante de pago
 */
const rechazarComprobante = async (req, res) => {
    try {
        const { id } = req.params;
        const observaciones = req.body?.observaciones || '';

        // Validar observaciones requeridas
        if (!observaciones || observaciones.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Las observaciones son requeridas al rechazar un comprobante'
            });
        }

        // Rechazar comprobante
        const abonoRechazado = await AbonoService.rechazarComprobante(
            id,
            req.user.correo,
            observaciones
        );

        res.json({
            success: true,
            message: 'Comprobante rechazado',
            data: abonoRechazado
        });

    } catch (error) {
        console.error('Error al rechazar comprobante:', error);

        if (error.message === 'INVALID_ABONO_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de abono inválido'
            });
        }

        if (error.message === 'ABONO_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Abono no encontrado'
            });
        }

        if (error.message === 'ABONO_ALREADY_PROCESSED') {
            return res.status(400).json({
                success: false,
                message: 'Este comprobante ya ha sido procesado'
            });
        }

        if (error.message === 'OBSERVACIONES_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'Las observaciones son requeridas al rechazar un comprobante'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al rechazar comprobante',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Actualizar abono
 */
const updateAbono = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;
        
        // Obtener la URL del comprobante comprimido si se subió uno nuevo
        const comprobante_pago = req.comprobanteUrl || null;

        // Validar que al menos se envíe cantidad o comprobante
        if (!cantidad && !comprobante_pago) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos la cantidad o el comprobante para actualizar'
            });
        }

        // Preparar datos para actualizar
        const updateData = {};
        if (cantidad) {
            updateData.cantidad = cantidad;
        }
        if (comprobante_pago) {
            updateData.comprobante_pago = comprobante_pago;
        }

        // Actualizar abono
        const abonoActualizado = await AbonoService.updateAbono(
            id,
            updateData,
            req.user.id
        );

        res.json({
            success: true,
            message: 'Abono actualizado exitosamente',
            data: abonoActualizado
        });

    } catch (error) {
        console.error('Error al actualizar abono:', error);

        if (error.message === 'INVALID_ABONO_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de abono inválido'
            });
        }

        if (error.message === 'INVALID_AMOUNT') {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser un número positivo'
            });
        }

        if (error.message === 'ABONO_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Abono no encontrado'
            });
        }

        if (error.message === 'ABONO_NOT_EDITABLE') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden editar abonos en estado pendiente'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar abono',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Eliminar abono (cambiar estado a inactivo y ajustar saldo)
 */
const deleteAbono = async (req, res) => {
    try {
        const { id } = req.params;

        await AbonoService.deleteAbono(id, req.user.id);

        res.json({
            success: true,
            message: 'Abono eliminado exitosamente (saldo ajustado)'
        });

    } catch (error) {
        console.error('Error al eliminar abono:', error);

        if (error.message === 'INVALID_ABONO_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de abono inválido'
            });
        }

        if (error.message === 'ABONO_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Abono no encontrado'
            });
        }

        if (error.message === 'ABONO_NOT_DELETABLE') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden eliminar abonos en estado pendiente'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al eliminar abono',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener saldo actualizado de un cliente en una orden específica
 */
const getSaldoClienteOrden = async (req, res) => {
    try {
        const { id_cliente, id_orden } = req.params;
        const saldoInfo = await AbonoService.getSaldoClienteOrden(id_cliente, id_orden);

        res.json({
            success: true,
            data: saldoInfo
        });

    } catch (error) {
        console.error('Error al obtener saldo del cliente en la orden:', error);

        if (error.message === 'INVALID_CLIENT_ID' || error.message === 'INVALID_ORDER_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente u orden inválido'
            });
        }

        if (error.message === 'CLIENT_ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'No se encontró registro del cliente en esta orden'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener saldo',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener clientes con sus abonos por orden, filtrados por estado de verificación
 * GET /api/abonos/ordenes/:id_orden/clientes?estado=pendiente&page=1&limit=10
 */
const getClientesConAbonosPorOrden = async (req, res) => {
    try {
        const { id_orden } = req.params;
        const { estado, page = 1, limit = 10 } = req.query;

        const resultado = await AbonoService.getClientesConAbonosPorOrden(
            id_orden, 
            estado, 
            parseInt(page), 
            parseInt(limit)
        );

        res.json({
            success: true,
            data: resultado.clientes,
            pagination: resultado.pagination
        });

    } catch (error) {
        console.error('Error al obtener clientes con abonos:', error);

        if (error.message === 'INVALID_ORDER_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de orden inválido'
            });
        }

        if (error.message === 'INVALID_PAGE' || error.message === 'INVALID_LIMIT') {
            return res.status(400).json({
                success: false,
                message: 'Parámetros de paginación inválidos'
            });
        }

        if (error.message === 'INVALID_VERIFICATION_STATUS') {
            return res.status(400).json({
                success: false,
                message: 'Estado de verificación inválido. Use: pendiente, verificado o rechazado'
            });
        }

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes con abonos',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener contador de abonos por estado de verificación en una orden
 * GET /api/abonos/ordenes/:id_orden/contador-estados
 */
const getContadorEstadosVerificacion = async (req, res) => {
    try {
        const { id_orden } = req.params;

        const resultado = await AbonoService.getContadorEstadosVerificacionPorOrden(id_orden);

        res.json({
            success: true,
            data: resultado
        });

    } catch (error) {
        console.error('Error al obtener contador de estados:', error);

        if (error.message === 'INVALID_ORDER_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de orden inválido'
            });
        }

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener contador de estados',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

module.exports = {
    getAllAbonos,
    getAbonosByCliente,
    getAbonosByOrden,
    getAbonosPendientes,
    getAbonoById,
    createAbono,
    verificarComprobante,
    rechazarComprobante,
    updateAbono,
    deleteAbono,
    getSaldoClienteOrden,
    getClientesConAbonosPorOrden,
    getContadorEstadosVerificacion
};
