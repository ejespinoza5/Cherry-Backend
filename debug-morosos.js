const mysql = require('mysql2/promise');

async function debugMorosos() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'cherry'
    });

    try {
        console.log('\n=== DIAGNÓSTICO DE CLIENTES MOROSOS ===\n');

        // 1. Ver estructura de tables
        console.log('📋 Estructura de la BD:\n');
        
        const [ordenesCol] = await connection.query('SHOW COLUMNS FROM ordenes');
        console.log('Columnas en ordenes:', ordenesCol.map(c => c.Field).join(', '));
        
        const [cierreCol] = await connection.query('SHOW COLUMNS FROM cierre_orden');
        console.log('Columnas en cierre_orden:', cierreCol.map(c => c.Field).join(', '));
        
        const [clienteOrdenCol] = await connection.query('SHOW COLUMNS FROM cliente_orden');
        console.log('Columnas en cliente_orden:', clienteOrdenCol.map(c => c.Field).join(', '));

        // 2. Buscar órdenes
        const [ordenes] = await connection.query(
            `SELECT * FROM ordenes WHERE estado = 'activo' ORDER BY id DESC LIMIT 3`
        );

        if (ordenes.length === 0) {
            console.log('\n❌ No hay órdenes activas');
            return;
        }

        console.log('\n📋 Órdenes encontradas:', ordenes.length);
        ordenes.forEach((o, i) => {
            console.log(`${i + 1}. Orden ${o.id}: ${o.nombre_orden}`);
        });

        const orden = ordenes[0];
        console.log('\n✅ Analizando orden:', orden.id, '-', orden.nombre_orden);

        // 2. Ver todos los clientes en cliente_orden
        const [clientesOrden] = await connection.query(
            `SELECT co.*, c.nombre, c.apellido, c.saldo, c.estado_actividad,
                    NOW() as fecha_actual,
                    TIMESTAMPDIFF(HOUR, co.fecha_limite_pago, NOW()) as horas_vencidas
             FROM cliente_orden co
             INNER JOIN clientes c ON co.id_cliente = c.id
             WHERE co.id_orden = ?`,
            [orden.id]
        );

        console.log('\n📋 Clientes en la orden:');
        clientesOrden.forEach((c, i) => {
            console.log(`\nCliente ${i + 1}:`, {
                nombre: `${c.nombre} ${c.apellido}`,
                estado_pago: c.estado_pago,
                saldo_actual: c.saldo,
                estado_actividad: c.estado_actividad,
                fecha_limite_pago: c.fecha_limite_pago,
                fecha_actual: c.fecha_actual,
                horas_vencidas: c.horas_vencidas,
                ya_venció: c.horas_vencidas > 0 ? '✅ SÍ' : '❌ NO'
            });
        });

        // 3. Consulta exacta que usa obtenerClientesMorosos
        console.log('\n🔍 Ejecutando consulta de obtenerClientesMorosos:');
        const [morosos] = await connection.query(
            `SELECT co.*, 
                    c.nombre, c.apellido, c.codigo, c.saldo,
                    ABS(c.saldo) as deuda_pendiente
             FROM cliente_orden co
             INNER JOIN clientes c ON co.id_cliente = c.id
             WHERE co.id_orden = ? 
               AND co.estado_pago = 'en_gracia'
               AND co.fecha_limite_pago < NOW()
               AND c.saldo < 0`,
            [orden.id]
        );

        console.log(`\n📊 Clientes morosos encontrados: ${morosos.length}`);
        
        if (morosos.length > 0) {
            morosos.forEach((m, i) => {
                console.log(`\nMoroso ${i + 1}:`, {
                    nombre: `${m.nombre} ${m.apellido}`,
                    codigo: m.codigo,
                    saldo: m.saldo,
                    deuda: m.deuda_pendiente,
                    estado_pago: m.estado_pago
                });
            });
        } else {
            console.log('\n⚠️ NO se encontraron morosos. Verificando condiciones:');
            
            clientesOrden.forEach((c, i) => {
                const cumpleEstado = c.estado_pago === 'en_gracia';
                const cumpleFecha = c.horas_vencidas > 0;
                const cumpleSaldo = c.saldo < 0;
                
                console.log(`\nCliente ${i + 1} (${c.nombre} ${c.apellido}):`);
                console.log(`  - estado_pago = 'en_gracia'? ${cumpleEstado ? '✅' : '❌'} (actual: ${c.estado_pago})`);
                console.log(`  - fecha_limite_pago < NOW()? ${cumpleFecha ? '✅' : '❌'} (venció hace ${c.horas_vencidas}h)`);
                console.log(`  - saldo < 0? ${cumpleSaldo ? '✅' : '❌'} (actual: ${c.saldo})`);
                console.log(`  - ES MOROSO? ${cumpleEstado && cumpleFecha && cumpleSaldo ? '✅ SÍ' : '❌ NO'}`);
            });
        }

        // 4. Ver si hay productos de estos clientes
        console.log('\n🛍️ Productos en la orden:');
        const [productos] = await connection.query(
            `SELECT p.id, p.id_cliente, p.nombre, p.valor_etiqueta, p.cantidad_articulos,
                    c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.saldo
             FROM productos p
             INNER JOIN clientes c ON p.id_cliente = c.id
             WHERE p.id_orden = ? AND p.estado = 'activo'
             ORDER BY p.id_cliente`,
            [orden.id]
        );

        if (productos.length > 0) {
            productos.forEach(p => {
                console.log(`  - ${p.nombre} (${p.cliente_nombre} ${p.cliente_apellido}) - Saldo: ${p.saldo}`);
            });
        } else {
            console.log('  ⚠️ No hay productos en esta orden');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

debugMorosos();
