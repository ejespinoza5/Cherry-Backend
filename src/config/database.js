const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración del pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cherry',
    waitForConnections: true,
    connectionLimit: 10
});

// Función para verificar la conexión
const testConnection = async () => {
    try {
        console.log('🔄 Intentando conectar a la base de datos...');
        console.log(`📍 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        console.log(`📁 Database: ${process.env.DB_NAME}`);
        
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos exitosa');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:');
        console.error('   Mensaje:', error.message);
        console.error('   Código:', error.code);
        if (error.sqlState) {
            console.error('   SQL State:', error.sqlState);
        }
        return false;
    }
};

module.exports = {
    pool,
    testConnection
};
