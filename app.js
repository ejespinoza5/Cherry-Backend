const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const cron = require('node-cron');
const { testConnection } = require('./src/config/database');
const CierreOrdenService = require('./src/services/cierreOrdenService');

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

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/cliente', clientesRoutes);
app.use('/api/abonos', abonosRoutes);
app.use('/api/cierre-ordenes', cierreOrdenRoutes);

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

// ⏰ Configuración de tareas automáticas con CRON
console.log('📅 Configurando tareas automáticas...');

// Ejecutar remate automático cada minuto
cron.schedule('* * * * *', async () => {
    try {
        console.log('🔍 Verificando órdenes para remate automático...');
        const resultados = await CierreOrdenService.procesarRematesAutomaticos();
        if (resultados && resultados.length > 0) {
            console.log(`✅ Remate automático ejecutado: ${resultados.length} orden(es) procesada(s)`);
        }
    } catch (error) {
        console.error('❌ Error en remate automático:', error.message);
    }
});

// Ejecutar cierre automático de órdenes cada hora
cron.schedule('0 * * * *', async () => {
    try {
        console.log('🔍 Verificando órdenes para cierre automático...');
        const resultados = await CierreOrdenService.cerrarOrdenesAutomaticamente();
        if (resultados && resultados.length > 0) {
            console.log(`✅ Cierre automático ejecutado: ${resultados.length} orden(es) cerrada(s)`);
        }
    } catch (error) {
        console.error('❌ Error en cierre automático:', error.message);
    }
});

console.log('✅ Tareas automáticas configuradas correctamente');

// Iniciar servidor
const startServer = async () => {
    app.listen(PORT, async () => {
        console.log(`🍒 Servidor Cherry iniciado en http://localhost:${PORT}`);
        await testConnection();
    });
};

startServer();

module.exports = app;
