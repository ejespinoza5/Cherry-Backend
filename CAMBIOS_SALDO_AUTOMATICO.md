# Cambios: Sistema de Saldo Automático en Productos

## Descripción General

Se ha implementado un sistema automático de gestión de saldo del cliente que se actualiza automáticamente al agregar o eliminar productos de una orden.

## Cambios Realizados

### 1. Modelo Cliente (`src/models/Cliente.js`)

Se agregaron dos nuevos métodos para gestionar el saldo:

#### `actualizarSaldo(id_cliente, monto)`
- **Descripción**: Actualiza el saldo del cliente sumando o restando un monto
- **Parámetros**: 
  - `id_cliente`: ID del cliente
  - `monto`: Monto a sumar (positivo) o restar (negativo)
- **Uso**: Se utiliza automáticamente al crear o eliminar productos

#### `getSaldo(id_cliente)`
- **Descripción**: Obtiene el saldo actual de un cliente
- **Parámetros**: 
  - `id_cliente`: ID del cliente
- **Retorna**: Saldo actual del cliente (número decimal)

### 2. Servicio de Productos (`src/services/productoService.js`)

#### Modificación en `createProducto()`

**Comportamiento anterior:**
- Solo creaba el producto en la base de datos

**Comportamiento nuevo:**
- Crea el producto
- Calcula el total con IVA: `subtotal + (subtotal * impuesto) + comisión`
- **Resta automáticamente el total del saldo del cliente**
- El saldo puede quedar en negativo si no hay fondos suficientes

**Ejemplo de cálculo:**
```javascript
Producto: $100.00
Impuesto (8%): $8.00
Comisión: $3.00
Total: $111.00

Saldo anterior: $50.00
Saldo nuevo: $50.00 - $111.00 = -$61.00 (negativo permitido)
```

#### Modificación en `deleteProducto()`

**Comportamiento anterior:**
- Solo eliminaba el producto (soft delete)

**Comportamiento nuevo:**
- Calcula el total que se había restado cuando se creó el producto
- Elimina el producto (soft delete)
- **Devuelve automáticamente el monto al saldo del cliente**

**Ejemplo:**
```javascript
Producto eliminado: $111.00 (con IVA)

Saldo anterior: -$61.00
Saldo nuevo: -$61.00 + $111.00 = $50.00
```

## Flujo de Funcionamiento

### Al Crear un Producto:

1. Usuario envía request POST a `/api/productos` con los datos del producto
2. El sistema valida la orden y el cliente
3. Se obtiene el impuesto de la orden
4. Se calcula el total: `valor_etiqueta + (valor_etiqueta * impuesto) + comisión`
5. Se crea el producto en la base de datos
6. **Se resta el total del saldo del cliente**
7. Se retorna el producto creado

### Al Eliminar un Producto:

1. Usuario envía request DELETE a `/api/productos/:id`
2. El sistema obtiene los datos del producto
3. Se calcula el total que se había restado originalmente
4. Se elimina el producto (soft delete)
5. **Se devuelve el total al saldo del cliente**
6. Se retorna mensaje de confirmación

## Ventajas del Sistema

✅ **Automatización completa**: No se requiere intervención manual para actualizar saldos
✅ **Consistencia**: El saldo siempre refleja el total de productos activos
✅ **Saldos negativos permitidos**: Si un cliente no tiene fondos, puede seguir comprando (el saldo queda negativo)
✅ **Reversibilidad**: Al eliminar un producto, el saldo se restaura automáticamente
✅ **Cálculo preciso**: Incluye IVA y comisiones en el cálculo del saldo

## Ejemplo Completo

```javascript
// Cliente inicia con saldo: $0.00

// 1. Agregar Producto A: $100 + IVA(8%) + comisión($3) = $111
// Saldo: $0.00 - $111.00 = -$111.00

// 2. Agregar Producto B: $50 + IVA(8%) + comisión($3) = $57
// Saldo: -$111.00 - $57.00 = -$168.00

// 3. Cliente realiza un abono de $200
// Saldo: -$168.00 + $200.00 = $32.00

// 4. Eliminar Producto A (se devuelve $111)
// Saldo: $32.00 + $111.00 = $143.00

// Saldo final: $143.00
```

## Notas Importantes

⚠️ **Saldos Negativos**: El sistema permite saldos negativos. Esto significa que un cliente puede "deber" dinero.
⚠️ **IVA Dinámico**: El IVA se calcula según el impuesto configurado en cada orden.
⚠️ **Comisión por Defecto**: Si no se especifica comisión, se usa $3.00 por defecto.

## Archivos Modificados

- `src/models/Cliente.js` - Métodos de gestión de saldo
- `src/services/productoService.js` - Lógica automática de actualización de saldo

## Compatibilidad

✅ Compatible con el sistema de abonos existente
✅ No afecta funcionalidades existentes
✅ Los productos creados antes de este cambio no se ven afectados
