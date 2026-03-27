const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const cron = require('node-cron');
const { testConnection } = require('./src/config/database');
const OrdenService = require('./src/services/ordenService');
const Cliente = require('./src/models/Cliente');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Permitir todas las origenes o especificar en .env
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.get('/', (req, res) => {
    res.send('Sistema Cherry - Servidor funcionando correctamente');
});



// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes');
const ordenesRoutes = require('./src/routes/ordenesRoutes');
const productosRoutes = require('./src/routes/productosRoutes');
const clientesRoutes = require('./src/routes/clientesRoutes');
const abonosRoutes = require('./src/routes/abonosRoutes');
const cierreOrdenRoutes = require('./src/routes/cierreOrdenRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/cliente', clientesRoutes);
app.use('/api/abonos', abonosRoutes);
app.use('/api/cierre-ordenes', cierreOrdenRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Iniciar servidor
const startServer = async () => {
    app.listen(PORT, async () => {
        console.log(`🍒 Servidor Cherry iniciado en http://localhost:${PORT}`);
        await testConnection();

        // Aviso preventivo de cierre: corre diariamente a las 09:00.
        cron.schedule('0 9 * * *', async () => {
            try {
                const resultado = await OrdenService.enviarRecordatorioCierre3Dias();
                if (resultado.total_ordenes > 0) {
                    console.log(
                        `📨 Aviso cierre 3 dias: ordenes=${resultado.total_ordenes}, enviados=${resultado.correos_enviados}, fallidos=${resultado.correos_fallidos}`
                    );
                }
            } catch (error) {
                console.error('Error en cron de aviso cierre 3 dias:', error.message);
            }
        });

        // Recalculo diario de estado_actividad: asegura cambios automaticos a inactivo/deudor/bloqueado.
        cron.schedule('0 6 * * *', async () => {
            try {
                const resultado = await Cliente.recalcularEstadoActividadTodosActivos();
                console.log(
                    `🔄 Recalculo estado_actividad: clientes=${resultado.total_clientes}, actualizados=${resultado.actualizados}, errores=${resultado.errores}`
                );
            } catch (error) {
                console.error('Error en cron de recalculo estado_actividad:', error.message);
            }
        });
    });
};

startServer();

module.exports = app;
