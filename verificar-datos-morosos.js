const mysql = require('mysql2/promise');

async function verificarDatos() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3307,
        user: 'admin',
        password: 'N5XAZQzpFqWhvAXeCj2bFA2hSueA646gL!',
        database: 'cherry'
    });

    try {
        console.log('\n=== VERIFICANDO DATOS PARA REMATE ===\n');

        // 1. Ver registros en cliente_orden
        const [clientesOrden] = await connection.query(
            `SELECT co.*, c.nombre, c.apellido, c.saldo, c.estado_actividad,
                    o.nombre_orden,
                    NOW() as ahora,
                    CASE 
                        WHEN co.fecha_limite_pago < NOW() THEN 'VENCIDO'
                        ELSE 'VIGENTE'
                    END as estado_plazo
             FROM cliente_orden co
             INNER JOIN clientes c ON co.id_cliente = c.id
             INNER JOIN ordenes o ON co.id_orden = o.id
             ORDER BY co.id DESC
             LIMIT 10`
        );

        console.log(`📋 Registros en cliente_orden: ${clientesOrden.length}\n`);
        
        if (clientesOrden.length === 0) {
            console.log('❌ No hay registros en cliente_orden. Debes CERRAR una orden primero.\n');
        } else {
            clientesOrden.forEach((co, i) => {
                console.log(`${i + 1}. Cliente: ${co.nombre} ${co.apellido}`);
                console.log(`   Orden: ${co.nombre_orden} (ID: ${co.id_orden})`);
                console.log(`   Estado pago: ${co.estado_pago}`);
                console.log(`   Saldo actual cliente: ${co.saldo}`);
                console.log(`   Fecha límite: ${co.fecha_limite_pago}`);
                console.log(`   Estado plazo: ${co.estado_plazo}`);
                console.log(`   Ahora: ${co.ahora}`);
                console.log('');
            });

            // 2. Consulta exacta de obtenerClientesMorosos
            console.log('🔍 Ejecutando consulta de obtenerClientesMorosos:\n');
            
            const [morosos] = await connection.query(
                `SELECT co.*, 
                        c.nombre, c.apellido, c.codigo, c.saldo,
                        ABS(c.saldo) as deuda_pendiente
                 FROM cliente_orden co
                 INNER JOIN clientes c ON co.id_cliente = c.id
                 WHERE co.estado_pago = 'en_gracia'
                   AND co.fecha_limite_pago < NOW()
                   AND c.saldo < 0`
            );

            console.log(`📊 Clientes morosos encontrados: ${morosos.length}\n`);

            if (morosos.length > 0) {
                morosos.forEach((m, i) => {
                    console.log(`${i + 1}. MOROSO: ${m.nombre} ${m.apellido}`);
                    console.log(`   Código: ${m.codigo}`);
                    console.log(`   Saldo: ${m.saldo}`);
                    console.log(`   Deuda: ${m.deuda_pendiente}`);
                    console.log(`   Orden: ${m.id_orden}`);
                    console.log('');
                });
            } else {
                console.log('⚠️ NO se encontraron clientes morosos.\n');
                console.log('Verificando por qué...\n');

                // Verificar cada condición
                const [conEstado] = await connection.query(
                    `SELECT COUNT(*) as total FROM cliente_orden WHERE estado_pago = 'en_gracia'`
                );
                console.log(`Clientes con estado_pago = 'en_gracia': ${conEstado[0].total}`);

                const [vencidos] = await connection.query(
                    `SELECT COUNT(*) as total FROM cliente_orden WHERE fecha_limite_pago < NOW()`
                );
                console.log(`Clientes con plazo vencido: ${vencidos[0].total}`);

                const [conDeuda] = await connection.query(
                    `SELECT COUNT(*) as total 
                     FROM cliente_orden co
                     INNER JOIN clientes c ON co.id_cliente = c.id
                     WHERE c.saldo < 0`
                );
                console.log(`Clientes con saldo negativo: ${conDeuda[0].total}`);

                const [todas] = await connection.query(
                    `SELECT COUNT(*) as total 
                     FROM cliente_orden co
                     INNER JOIN clientes c ON co.id_cliente = c.id
                     WHERE co.estado_pago = 'en_gracia'
                       AND co.fecha_limite_pago < NOW()
                       AND c.saldo < 0`
                );
                console.log(`Que cumplen TODAS las condiciones: ${todas[0].total}\n`);
            }
        }

        // 3. Ver órdenes actuales
        console.log('📦 Órdenes en la base de datos:\n');
        const [ordenes] = await connection.query(
            `SELECT o.id, o.nombre_orden, o.estado,
                    co.fecha_cierre, co.fecha_limite_pago,
                    CASE 
                        WHEN co.fecha_limite_pago < NOW() THEN 'VENCIDO'
                        ELSE 'VIGENTE'
                    END as estado_gracia
             FROM ordenes o
             LEFT JOIN cierre_orden co ON o.id = co.id_orden
             WHERE o.estado = 'activo'
             ORDER BY o.id DESC`
        );

        ordenes.forEach(o => {
            console.log(`Orden ${o.id}: ${o.nombre_orden}`);
            console.log(`  Estado: ${o.estado}`);
            console.log(`  Fecha cierre: ${o.fecha_cierre || 'No cerrada'}`);
            console.log(`  Fecha límite pago: ${o.fecha_limite_pago || 'N/A'}`);
            console.log(`  Periodo gracia: ${o.estado_gracia || 'N/A'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await connection.end();
    }
}

verificarDatos();
