const mysql = require('mysql2/promise');
const fs = require('fs');

async function crearTablasFaltantes() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'cherry',
        multipleStatements: true
    });

    try {
        console.log('\n=== CREANDO TABLAS FALTANTES ===\n');

        // Leer el script SQL
        const sql = fs.readFileSync('crear-tablas-faltantes.sql', 'utf8');
        
        // Ejecutar todas las sentencias
        await connection.query(sql);

        console.log('✅ Tablas creadas exitosamente\n');

        // Verificar
        const [tablas] = await connection.query('SHOW TABLES');
        console.log('📋 Tablas en la base de datos:');
        tablas.forEach((t, i) => {
            console.log(`  ${i + 1}. ${Object.values(t)[0]}`);
        });

        console.log('\n=== VERIFICANDO TABLAS DEL SISTEMA DE CIERRE ===\n');
        
        const tablasNecesarias = ['cliente_orden', 'productos_rematados', 'historial_incumplimientos', 'cierre_orden'];
        
        for (const tabla of tablasNecesarias) {
            const existe = tablas.some(t => Object.values(t)[0] === tabla);
            console.log(`${existe ? '✅' : '❌'} ${tabla}`);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nDetalles:', error.sqlMessage || error);
    } finally {
        await connection.end();
    }
}

crearTablasFaltantes();
