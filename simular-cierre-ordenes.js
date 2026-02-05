const { pool } = require('./src/config/database');

async function simularEscenarios() {
    try {
        console.log('=== SIMULACIÓN DE ESCENARIOS DE CIERRE ===\n');

        // Escenario 1: Cliente con productos pero sin abonos (tiene deuda)
        console.log('📌 Escenario 1: Cliente compra productos sin abonar\n');
        
        const [cliente1] = await pool.query(`SELECT id, nombre, apellido, saldo FROM clientes WHERE estado = 'activo' LIMIT 1`);
        
        if (cliente1.length > 0) {
            const c = cliente1[0];
            console.log(`Cliente: ${c.nombre} ${c.apellido}`);
            console.log(`Saldo actual: $${c.saldo}`);
            
            if (parseFloat(c.saldo) < 0) {
                console.log('✅ Tiene DEUDA → Al cerrar orden debería ir a PERIODO DE GRACIA');
            } else if (parseFloat(c.saldo) === 0) {
                console.log('⚠️  Saldo $0 → Al cerrar orden debería quedar CERRADA (no hay deuda)');
            } else {
                console.log('✅ Saldo positivo → Al cerrar orden debería quedar CERRADA (pagó de más)');
            }
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Verificar todas las órdenes abiertas y sus clientes
        console.log('📋 ÓRDENES ABIERTAS Y SUS CLIENTES:\n');
        
        const [ordenesAbiertas] = await pool.query(
            `SELECT id, nombre_orden FROM ordenes WHERE estado_orden = 'abierta' AND estado = 'activo'`
        );

        for (const orden of ordenesAbiertas) {
            console.log(`\n🔹 ORDEN: ${orden.nombre_orden} (ID: ${orden.id})`);
            
            // Clientes con productos en esta orden
            const [clientesOrden] = await pool.query(
                `SELECT DISTINCT c.id, c.nombre, c.apellido, c.codigo, c.saldo,
                        (SELECT COUNT(*) FROM productos p WHERE p.id_cliente = c.id AND p.id_orden = ? AND p.estado = 'activo') as num_productos,
                        (SELECT COALESCE(SUM((p2.valor_etiqueta * p2.cantidad_articulos) + 
                                ((p2.valor_etiqueta * p2.cantidad_articulos) * (SELECT impuesto FROM ordenes WHERE id = ?)) + 
                                p2.comision), 0)
                         FROM productos p2 
                         WHERE p2.id_cliente = c.id AND p2.id_orden = ? AND p2.estado = 'activo') as total_compras
                 FROM clientes c
                 INNER JOIN productos p ON c.id = p.id_cliente
                 WHERE p.id_orden = ? AND p.estado = 'activo'
                 GROUP BY c.id`,
                [orden.id, orden.id, orden.id, orden.id]
            );

            if (clientesOrden.length === 0) {
                console.log('  ⚠️  No hay clientes con productos en esta orden');
            } else {
                let clientesConDeuda = 0;
                let clientesPagados = 0;
                
                clientesOrden.forEach(c => {
                    const saldo = parseFloat(c.saldo);
                    const compras = parseFloat(c.total_compras);
                    
                    console.log(`\n  👤 ${c.nombre} ${c.apellido} (${c.codigo})`);
                    console.log(`     Productos: ${c.num_productos}`);
                    console.log(`     Total compras: $${compras.toFixed(2)}`);
                    console.log(`     Saldo actual: $${saldo.toFixed(2)}`);
                    
                    if (saldo < 0) {
                        console.log(`     ❌ DEUDA: $${Math.abs(saldo).toFixed(2)} → Estado: EN_GRACIA`);
                        clientesConDeuda++;
                    } else {
                        console.log(`     ✅ SIN DEUDA → Estado: PAGADO`);
                        clientesPagados++;
                    }
                });
                
                console.log(`\n  📊 RESUMEN:`);
                console.log(`     Total clientes: ${clientesOrden.length}`);
                console.log(`     Con deuda: ${clientesConDeuda}`);
                console.log(`     Pagados: ${clientesPagados}`);
                
                if (clientesConDeuda > 0) {
                    console.log(`\n  ⚡ PREDICCIÓN AL CERRAR:`);
                    console.log(`     Estado orden: EN_PERIODO_GRACIA`);
                    console.log(`     Periodo de gracia: 48 horas`);
                    console.log(`     Bloqueará crear nueva orden: SÍ`);
                } else {
                    console.log(`\n  ⚡ PREDICCIÓN AL CERRAR:`);
                    console.log(`     Estado orden: CERRADA`);
                    console.log(`     Permite crear nueva orden: SÍ`);
                }
            }
        }

        console.log('\n\n' + '='.repeat(60));
        console.log('💡 RECOMENDACIONES:\n');
        console.log('1. Si un cliente tiene saldo NEGATIVO → Tiene DEUDA');
        console.log('2. Al CERRAR la orden, se verificará el saldo de cada cliente');
        console.log('3. Si HAY clientes con saldo negativo → Orden va a PERIODO DE GRACIA');
        console.log('4. El cliente debe ABONAR hasta que su saldo sea >= 0');
        console.log('5. Cuando TODOS paguen → Orden cierra automáticamente el periodo de gracia');
        console.log('6. Solo entonces podrás crear una nueva orden\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

simularEscenarios();
