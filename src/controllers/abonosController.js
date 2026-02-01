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
 * Crear nuevo abono
 */
const createAbono = async (req, res) => {
    try {
        const { id_cliente, cantidad } = req.body;

        // Validar campos requeridos
        if (!id_cliente || !cantidad) {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente y cantidad son requeridos'
            });
        }

        // Crear abono
        const nuevoAbono = await AbonoService.createAbono(
            { id_cliente, cantidad },
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: 'Abono registrado exitosamente',
            data: nuevoAbono
        });

    } catch (error) {
        console.error('Error al crear abono:', error);

        if (error.message === 'FIELDS_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente y cantidad son requeridos'
            });
        }

        if (error.message === 'INVALID_CLIENT_ID') {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente inválido'
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

        res.status(500).json({
            success: false,
            message: 'Error al crear abono',
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

        // Validar campos requeridos
        if (!cantidad) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad es requerida'
            });
        }

        // Actualizar abono
        const abonoActualizado = await AbonoService.updateAbono(
            id,
            { cantidad },
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

        res.status(500).json({
            success: false,
            message: 'Error al eliminar abono',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

module.exports = {
    getAllAbonos,
    getAbonosByCliente,
    getAbonoById,
    createAbono,
    updateAbono,
    deleteAbono
};
