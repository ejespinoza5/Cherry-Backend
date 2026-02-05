const OrdenService = require('../services/ordenService');

/**
 * Obtener todas las órdenes
 */
const getAllOrdenes = async (req, res) => {
    try {
        const { estado, fecha_inicio, fecha_fin } = req.query;

        const filters = {};
        if (estado) filters.estado = estado;
        if (fecha_inicio) filters.fecha_inicio = fecha_inicio;
        if (fecha_fin) filters.fecha_fin = fecha_fin;

        const ordenes = await OrdenService.getAllOrdenes(filters);

        res.json({
            success: true,
            data: ordenes,
            count: ordenes.length
        });

    } catch (error) {
        console.error('Error al obtener órdenes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener órdenes',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener orden por ID
 */
const getOrdenById = async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await OrdenService.getOrdenById(id);

        res.json({
            success: true,
            data: orden
        });

    } catch (error) {
        console.error('Error al obtener orden:', error);

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener orden',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Crear nueva orden
 */
const createOrden = async (req, res) => {
    try {
        const { nombre_orden, fecha_inicio, fecha_fin, impuesto, estado } = req.body;
        const createdBy = req.user.id;

        const orden = await OrdenService.createOrden(
            { nombre_orden, fecha_inicio, fecha_fin, impuesto, estado },
            createdBy
        );

        res.status(201).json({
            success: true,
            message: 'Orden creada exitosamente',
            data: orden
        });

    } catch (error) {
        console.error('Error al crear orden:', error);

        if (error.message === 'ORDER_NAME_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la orden es requerido'
            });
        }

        if (error.message === 'START_DATE_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'La fecha de inicio es requerida'
            });
        }

        if (error.message === 'INVALID_DATE_RANGE') {
            return res.status(400).json({
                success: false,
                message: 'La fecha de fin debe ser posterior a la fecha de inicio'
            });
        }

        if (error.message === 'ORDER_NAME_EXISTS') {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una orden con ese nombre'
            });
        }

        if (error.message === 'INVALID_TAX_VALUE') {
            return res.status(400).json({
                success: false,
                message: 'El impuesto debe ser un valor entre 0 y 1 (0% a 100%)'
            });
        }

        // Validación de orden en periodo de gracia
        if (error.message.startsWith('NO_PUEDE_CREAR_ORDEN|')) {
            const mensaje = error.message.split('|')[1];
            return res.status(409).json({
                success: false,
                message: mensaje,
                error_code: 'ORDER_IN_GRACE_PERIOD'
            });
        }

        if (error.message === 'INVALID_COMMISSION_VALUE') {
            return res.status(400).json({
                success: false,
                message: 'La comisión no puede ser negativa'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear orden',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Actualizar orden
 */
const updateOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_orden, fecha_inicio, fecha_fin, impuesto, estado } = req.body;
        const updatedBy = req.user.id;

        const orden = await OrdenService.updateOrden(
            id,
            { nombre_orden, fecha_inicio, fecha_fin, impuesto, estado },
            updatedBy
        );

        res.json({
            success: true,
            message: 'Orden actualizada exitosamente',
            data: orden
        });

    } catch (error) {
        console.error('Error al actualizar orden:', error);

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        if (error.message === 'ORDER_NAME_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la orden es requerido'
            });
        }

        if (error.message === 'START_DATE_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'La fecha de inicio es requerida'
            });
        }

        if (error.message === 'INVALID_DATE_RANGE') {
            return res.status(400).json({
                success: false,
                message: 'La fecha de fin debe ser posterior a la fecha de inicio'
            });
        }

        if (error.message === 'ORDER_NAME_EXISTS') {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una orden con ese nombre'
            });
        }

        if (error.message === 'INVALID_TAX_VALUE') {
            return res.status(400).json({
                success: false,
                message: 'El impuesto debe ser un valor entre 0 y 1 (0% a 100%)'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar orden',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Eliminar orden (soft delete)
 */
const deleteOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBy = req.user.id;

        const result = await OrdenService.deleteOrden(id, deletedBy);

        res.json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error('Error al eliminar orden:', error);

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        if (error.message === 'ORDER_ALREADY_INACTIVE') {
            return res.status(400).json({
                success: false,
                message: 'La orden ya está inactiva'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al eliminar orden',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener estadísticas de una orden
 */
const getOrdenEstadisticas = async (req, res) => {
    try {
        const { id } = req.params;
        const estadisticas = await OrdenService.getOrdenEstadisticas(id);

        res.json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de orden:', error);

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de orden',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

module.exports = {
    getAllOrdenes,
    getOrdenById,
    createOrden,
    updateOrden,
    deleteOrden,
    getOrdenEstadisticas
};
