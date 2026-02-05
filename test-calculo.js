const { pool } = require('./src/config/database');
const Orden = require('./src/models/Orden');

async function testearCalculo() {
    try {
        const id_orden = 7;
        const id_producto = 7;

        // Obtener el producto
        const [productos] = await pool.query(
            'SELECT * FROM productos WHERE id = ?',
            [id_producto]
        );

        const producto = productos[0];

        console.log('\n=== DATOS DEL PRODUCTO ===');
        console.log('valor_etiqueta:', producto.valor_etiqueta, typeof producto.valor_etiqueta);
        console.log('cantidad_articulos:', producto.cantidad_articulos, typeof producto.cantidad_articulos);
        console.log('comision:', producto.comision, typeof producto.comision);

        // Obtener la orden
        const orden = await Orden.findById(id_orden);
        console.log('\n=== DATOS DE LA ORDEN ===');
        console.log('impuesto:', orden.impuesto, typeof orden.impuesto);

        // Realizar el cálculo paso a paso
        console.log('\n=== CÁLCULO PASO A PASO ===');
        
        const paso1 = producto.valor_etiqueta * producto.cantidad_articulos;
        console.log('Paso 1 (subtotal):', producto.valor_etiqueta, '*', producto.cantidad_articulos, '=', paso1);

        const paso2 = paso1 * orden.impuesto;
        console.log('Paso 2 (impuesto):', paso1, '*', orden.impuesto, '=', paso2);

        const paso3 = producto.comision;
        console.log('Paso 3 (comisión):', paso3);

        const total = paso1 + paso2 + paso3;
        console.log('\n=== RESULTADO ===');
        console.log('Total:', paso1, '+', paso2, '+', paso3, '=', total);

        // Cálculo como está en el código (NUEVO - con parseFloat)
        console.log('\n=== CÁLCULO COMO ESTÁ EN EL CÓDIGO (NUEVO) ===');
        const valorEtiqueta = parseFloat(producto.valor_etiqueta);
        const cantidad = parseInt(producto.cantidad_articulos);
        const comision = parseFloat(producto.comision);
        const impuesto = parseFloat(orden.impuesto);
        
        const subtotal = valorEtiqueta * cantidad;
        const montoImpuesto = subtotal * impuesto;
        const valor_producto = subtotal + montoImpuesto + comision;
        
        console.log('Subtotal:', subtotal);
        console.log('Impuesto:', montoImpuesto);
        console.log('Comisión:', comision);
        console.log('TOTAL:', valor_producto);
        console.log('✅ CORRECTO:', valor_producto === 327);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testearCalculo();
