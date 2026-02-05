const mysql = require('mysql2/promise');

async function verTablas() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'cherry'
    });

    try {
        console.log('\n=== TABLAS EN LA BASE DE DATOS ===\n');

        const [tablas] = await connection.query('SHOW TABLES');
        
        console.log('Tablas existentes:');
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
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

verTablas();
