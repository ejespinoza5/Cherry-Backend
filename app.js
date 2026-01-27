const express = require('express');
require('dotenv').config();
const path = require('path');
const { testConnection } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', (req, res) => {
    res.send('Sistema Cherry - Servidor funcionando correctamente');
});

app.get('/amor', (req, res) => {
    res.send('Te amo mucho Nicol Guadamud Mi amoooor 💖');
});

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes');
const ordenesRoutes = require('./src/routes/ordenesRoutes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/ordenes', ordenesRoutes);

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
    });
};

startServer();

module.exports = app;
