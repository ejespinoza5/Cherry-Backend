const DashboardService = require('../services/dashboardService');

/**
 * Obtener estadísticas del dashboard
 * GET /api/dashboard/estadisticas
 */
const getEstadisticas = async (req, res) => {
    try {
        const { id_orden } = req.params;

        if (!id_orden || isNaN(id_orden)) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar un id_orden válido'
            });
        }

        const estadisticas = await DashboardService.getEstadisticas(Number(id_orden));

        if (!estadisticas) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        res.json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas del dashboard',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener top 3 más abonaron y top 3 más deben en la orden actual
 * GET /api/dashboard/top3
 */
const getTop3 = async (req, res) => {
    try {
        const { id_orden } = req.params;

        if (!id_orden || isNaN(id_orden)) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar un id_orden válido'
            });
        }

        const data = await DashboardService.getTop3(Number(id_orden));

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Error al obtener top 3:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener top 3',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

module.exports = {
    getEstadisticas,
    getTop3
};
