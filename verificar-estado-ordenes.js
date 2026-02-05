const { pool } = require('./src/config/database');

async function verificarEstadoOrdenes() {
    try {
        console.log('=== VERIFICACIÓN DE ESTADO DE ÓRDENES ===\n');

        // 1. Ver todas las órdenes activas
        const [ordenes] = await pool.query(
            `SELECT id, nombre_orden, estado_orden, fecha_cierre, tipo_cierre, estado
             FROM ordenes 
             WHERE estado = 'activo'
             ORDER BY id DESC
             LIMIT 5`
        );

        console.log('📋 ÓRDENES ACTIVAS:');
        ordenes.forEach(o => {
            console.log(`  ID: ${o.id} | ${o.nombre_orden} | Estado: ${o.estado_orden} | Cierre: ${o.fecha_cierre || 'No cerrada'}`);
        });

        // 2. Ver órdenes en periodo de gracia
        const [ordenesGracia] = await pool.query(
            `SELECT o.id, o.nombre_orden, o.estado_orden, co.fecha_limite_pago,
                    co.clientes_pendientes, co.clientes_pagados
             FROM ordenes o
             LEFT JOIN cierre_orden co ON o.id = co.id_orden
             WHERE o.estado_orden = 'en_periodo_gracia' AND o.estado = 'activo'`
        );

        console.log('\n⏰ ÓRDENES EN PERIODO DE GRACIA:');
        if (ordenesGracia.length === 0) {
            console.log('  ✅ Ninguna orden en periodo de gracia');
        } else {
            ordenesGracia.forEach(o => {
                console.log(`  ID: ${o.id} | ${o.nombre_orden}`);
                console.log(`     Límite pago: ${o.fecha_limite_pago}`);
                console.log(`     Pendientes: ${o.clientes_pendientes} | Pagados: ${o.clientes_pagados}`);
            });
        }

        // 3. Ver órdenes cerradas con su info de cierre
        const [ordenesCerradas] = await pool.query(
            `SELECT o.id, o.nombre_orden, o.estado_orden, o.fecha_cierre,
                    co.total_clientes, co.clientes_pendientes, co.clientes_pagados
             FROM ordenes o
             LEFT JOIN cierre_orden co ON o.id = co.id_orden
             WHERE o.estado_orden IN ('cerrada', 'en_periodo_gracia') 
               AND o.estado = 'activo'
             ORDER BY o.id DESC
             LIMIT 3`
        );

        console.log('\n📦 ÓRDENES CERRADAS (últimas 3):');
        if (ordenesCerradas.length === 0) {
            console.log('  ℹ️  No hay órdenes cerradas');
        } else {
            for (const o of ordenesCerradas) {
                console.log(`\n  🔹 ID: ${o.id} | ${o.nombre_orden}`);
                console.log(`     Estado: ${o.estado_orden}`);
                console.log(`     Fecha cierre: ${o.fecha_cierre}`);
                
                if (o.total_clientes !== null) {
                    console.log(`     Total clientes: ${o.total_clientes}`);
                    console.log(`     Pagados: ${o.clientes_pagados}`);
                    console.log(`     Pendientes: ${o.clientes_pendientes}`);

                    // Ver detalles de clientes con deuda
                    if (o.clientes_pendientes > 0) {
                        const [clientesDeuda] = await pool.query(
                            `SELECT c.id, c.nombre, c.apellido, c.codigo, c.saldo,
                                    co_tabla.estado_pago, co_tabla.saldo_al_cierre, co_tabla.abonos_post_cierre
                             FROM cliente_orden co_tabla
                             INNER JOIN clientes c ON co_tabla.id_cliente = c.id
                             WHERE co_tabla.id_orden = ? AND co_tabla.estado_pago = 'en_gracia'`,
                            [o.id]
                        );

                        if (clientesDeuda.length > 0) {
                            console.log(`     ⚠️  CLIENTES CON DEUDA:`);
                            clientesDeuda.forEach(c => {
                                const deuda = parseFloat(c.saldo_al_cierre) - parseFloat(c.abonos_post_cierre);
                                console.log(`        - ${c.nombre} ${c.apellido} (${c.codigo})`);
                                console.log(`          Saldo al cierre: $${c.saldo_al_cierre} | Abonos post: $${c.abonos_post_cierre} | Deuda: $${deuda.toFixed(2)}`);
                                console.log(`          Saldo actual cliente: $${c.saldo}`);
                            });
                        }
                    }
                } else {
                    console.log(`     ⚠️  NO tiene registro en tabla cierre_orden`);
                }
            }
        }

        // 4. Ver clientes con deuda
        const [clientesDeudores] = await pool.query(
            `SELECT id, nombre, apellido, codigo, saldo, estado_actividad
             FROM clientes
             WHERE estado = 'activo' AND (saldo < 0 OR estado_actividad = 'deudor')
             ORDER BY saldo ASC
             LIMIT 10`
        );

        console.log('\n\n💰 CLIENTES CON DEUDA O MARCADOS COMO DEUDOR:');
        if (clientesDeudores.length === 0) {
            console.log('  ✅ No hay clientes con deuda');
        } else {
            clientesDeudores.forEach(c => {
                console.log(`  ${c.nombre} ${c.apellido} (${c.codigo}) | Saldo: $${c.saldo} | Estado: ${c.estado_actividad}`);
            });
        }

        // 5. DIAGNÓSTICO
        console.log('\n\n🔍 DIAGNÓSTICO:');
        
        if (ordenesGracia.length > 0) {
            console.log('  ❌ HAY órdenes en periodo de gracia → NO debería permitir crear nueva orden');
        } else if (clientesDeudores.length > 0) {
            console.log('  ⚠️  HAY clientes con deuda, pero NO hay orden en periodo de gracia');
            console.log('  ℹ️  Esto puede pasar si:');
            console.log('      1. La orden nunca se cerró (está en estado "abierta")');
            console.log('      2. La orden se cerró pero no hay registro en cierre_orden');
            console.log('      3. Los clientes deben dinero de compras pero la orden sigue abierta');
            console.log('\n  💡 SOLUCIÓN: Cerrar las órdenes abiertas antes de crear una nueva');
            console.log('      POST /api/cierre-ordenes/:id/cerrar');
        } else {
            console.log('  ✅ No hay órdenes en periodo de gracia ni clientes con deuda');
            console.log('  ✅ PUEDES crear una nueva orden sin problemas');
        }

    } catch (error) {
        console.error('Error al verificar estado:', error);
    } finally {
        await pool.end();
    }
}

verificarEstadoOrdenes();
