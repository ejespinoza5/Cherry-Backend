# Sistema de Estados de Actividad de Clientes

## 📋 Descripción General

Sistema automático de gestión de estados de clientes basado en su saldo y actividad de compras, diseñado para controlar las compras según la deuda acumulada y la actividad reciente.

## 🎯 Estados de Actividad

### 1. **Activo** ✅
- **Condición**: Saldo >= $0 Y ha comprado en los últimos 3 meses
- **Descripción**: Cliente sin deudas y con actividad reciente
- **Comportamiento**: Acceso completo al sistema de compras

### 2. **Deudor** ⚠️
- **Condición**: Deuda > $0 y deuda < $300
- **Descripción**: Cliente con deuda pero dentro del límite permitido
- **Comportamiento**: Puede seguir comprando pero se le marca como deudor
- **Ejemplo**: Deuda = $150.00

### 3. **Bloqueado** 🚫
- **Condición**: Deuda >= $300.00
- **Descripción**: Cliente ha superado el límite de deuda permitido
- **Comportamiento**: **NO puede realizar nuevas compras** hasta pagar o ser habilitado por admin
- **Mensaje**: "El cliente está bloqueado por exceder el límite de deuda permitido ($300)"

### 4. **Inactivo** 💤
- **Condición**: Sin compras en los últimos 3 meses
- **Descripción**: Cliente sin actividad reciente
- **Comportamiento**: **NO puede realizar nuevas compras** hasta ser habilitado por admin
- **Mensaje**: "El cliente está inactivo por no tener actividad en los últimos 3 meses"

## ⚙️ Funcionamiento Automático

### Actualización Automática del Estado

El estado se actualiza **automáticamente** en los siguientes casos:
- ✅ Al cerrar una orden (se recalcula para todos los clientes de la orden)
- ✅ Se puede llamar manualmente via función `Cliente.calcularYActualizarEstadoActividad(id_cliente)`

### Lógica de Negocio

```javascript
const LIMITE_DEUDA = 300.00;
const MESES_INACTIVIDAD = 3;

// Calcular deuda total en órdenes activas/en_gracia
const deuda = calcularDeudaTotal(id_cliente);

// Verificar fecha de última compra
const ultimaCompra = obtenerFechaUltimaCompra(id_cliente);
const tieneActividadReciente = (Date.now() - ultimaCompra) < (MESES_INACTIVIDAD * 30 * 24 * 60 * 60 * 1000);

// Determinar estado
if (!tieneActividadReciente) {
    estado = 'inactivo';      // Sin compras en 3 meses
} else if (deuda >= LIMITE_DEUDA) {
    estado = 'bloqueado';     // Deuda excesiva
} else if (deuda > 0) {
    estado = 'deudor';        // Con deuda pero permitido
} else {
    estado = 'activo';        // Sin deuda y activo
}
```

## 🔒 Restricciones de Compra

### Cliente Bloqueado

Cuando un cliente intenta crear un producto estando bloqueado:

**Request:**
```http
POST /api/productos
{
    "id_cliente": 5,
    "id_orden": 2,
    "valor_etiqueta": 100,
    ...
}
```

**Response:**
```json
{
    "success": false,
    "message": "El cliente está bloqueado por exceder el límite de deuda permitido ($300). No puede realizar nuevas compras."
}
```

**Status Code:** `403 Forbidden`

### Cliente Inactivo

Cuando un cliente intenta crear un producto estando inactivo:

**Request:**
```http
POST /api/productos
{
    "id_cliente": 8,
    "id_orden": 2,
    "valor_etiqueta": 100,
    ...
}
```

**Response:**
```json
{
    "success": false,
    "message": "El cliente está inactivo por no tener actividad en los últimos 3 meses. Contacte al administrador para habilitarlo."
}
```

**Status Code:** `403 Forbidden`

### Habilitar Cliente (Solo Admin/SuperAdmin)

El administrador puede habilitar manualmente un cliente bloqueado o inactivo:

**Request:**
```http
PUT /api/usuarios/clientes/:id_cliente/habilitar
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
    "success": true,
    "message": "Cliente habilitado exitosamente. Ahora puede realizar compras."
}
```

**Status Code:** `200 OK`

**Nota:** Esta acción cambia el `estado_actividad` del cliente a `'activo'` permitiéndole hacer compras nuevamente. El sistema volverá a calcular su estado automáticamente en el próximo cierre de orden.

## 📊 Flujo de Ejemplo

### Escenario Completo

```javascript
// Estado inicial
Cliente: Juan Pérez
Saldo: $0.00
Estado: activo ✅

// 1. Compra producto de $100 (con IVA = $111)
Saldo: -$111.00
Estado: deudor ⚠️

// 2. Compra producto de $200 (con IVA = $222)
Saldo: -$333.00
Estado: bloqueado 🚫

// 3. Intenta comprar otro producto
❌ ERROR: "Cliente bloqueado por exceder límite de deuda"

// 4. Realiza abono de $400
Saldo: $67.00
Estado: activo ✅

// 5. Puede volver a comprar normalmente ✅
```

## 🗄️ Cambios en la Base de Datos

### Tabla `clientes`

```sql
-- Antes
estado_actividad ENUM('activo','inactivo')

-- Después
estado_actividad ENUM('activo','deudor','bloqueado','inactivo')
```

### Script de Migración

Ejecutar el archivo: `update-estados-cliente.sql`

```sql
-- Modifica el ENUM
ALTER TABLE clientes 
MODIFY COLUMN estado_actividad ENUM('activo','deudor','bloqueado','inactivo');

-- Actualiza estados existentes basado en saldo actual
UPDATE clientes SET estado_actividad = 'activo' WHERE saldo >= 0;
UPDATE clientes SET estado_actividad = 'deudor' WHERE saldo < 0 AND saldo > -300;
UPDATE clientes SET estado_actividad = 'bloqueado' WHERE saldo <= -300;
```

## 💻 Implementación Técnica

### Modelo Cliente

#### `actualizarEstadoActividad(id_cliente)`
```javascript
// Actualiza automáticamente el estado basado en el saldo
const LIMITE_DEUDA = -300.00;
const saldo = await this.getSaldo(id_cliente);

if (saldo >= 0) nuevoEstado = 'activo';
else if (saldo > LIMITE_DEUDA) nuevoEstado = 'deudor';
else nuevoEstado = 'bloqueado';
```

### Servicio de Productos

#### `createProducto()`
```javascript
// 1. Validar que cliente no esté bloqueado
const cliente = await Cliente.findById(id_cliente);
if (cliente.estado_actividad === 'bloqueado') {
    throw new Error('CLIENT_BLOCKED');
}

// 2. Crear producto y actualizar saldo
await Cliente.actualizarSaldo(id_cliente, -totalConIva);
// ↑ Esto automáticamente actualiza el estado_actividad
```

## 📈 Beneficios del Sistema

✅ **Prevención de Deudas**: Limita automáticamente las compras al llegar al límite
✅ **Sin Intervención Manual**: Los estados se actualizan solos
✅ **Transparente**: El cliente ve claramente su estado
✅ **Política Clara**: "Este negocio es para comprar por encargo, no para prestar plata"
✅ **Control Financiero**: Mejor gestión de cuentas por cobrar

## 🎛️ Configuración

### Cambiar el Límite de Deuda

En `src/models/Cliente.js`, línea ~375:

```javascript
// Modificar este valor según necesidad
const LIMITE_DEUDA = -300.00; // Cambiar aquí
```

### Deshabilitar Validación de Bloqueo

En `src/services/productoService.js`, comentar estas líneas:

```javascript
// const cliente = await Cliente.findById(id_cliente);
// if (cliente.estado_actividad === 'bloqueado') {
//     throw new Error('CLIENT_BLOCKED');
// }
```

## 📋 Checklist de Implementación

- [x] Actualizar enum en `script-cherry.sql`
- [x] Crear método `actualizarEstadoActividad()` en modelo Cliente
- [x] Modificar `actualizarSaldo()` para llamar actualización automática
- [x] Agregar validación de bloqueo en `createProducto()`
- [x] Agregar manejo de error `CLIENT_BLOCKED` en controller
- [x] Crear script de migración `update-estados-cliente.sql`
- [x] Documentar el sistema completo

## 🔄 Compatibilidad

✅ Compatible con sistema de abonos existente
✅ Compatible con sistema de saldo automático
✅ No afecta clientes existentes hasta que se ejecute la migración
✅ Los clientes con estado 'inactivo' manual se respetan

## ⚠️ Notas Importantes

1. **Ejecutar migración**: Debe ejecutarse `update-estados-cliente.sql` en la base de datos
2. **Límite de $300**: Es el valor por defecto, modificable según política del negocio
3. **Estado Inactivo**: No se actualiza automáticamente, solo manualmente
4. **Cliente Bloqueado**: Solo se desbloquea al pagar y reducir deuda por debajo de $300

## 📞 Ejemplos de Uso

### Consultar estado de un cliente

```javascript
const cliente = await Cliente.findById(5);
console.log(cliente.estado_actividad); // 'activo', 'deudor', 'bloqueado', 'inactivo'
console.log(cliente.saldo); // -150.50
```

### Forzar actualización manual de estado

```javascript
const nuevoEstado = await Cliente.actualizarEstadoActividad(5);
console.log(nuevoEstado); // 'deudor'
```

## Archivos Modificados

1. `src/models/Cliente.js` - Lógica de estados automáticos
2. `src/services/productoService.js` - Validación de bloqueo
3. `src/controllers/productosController.js` - Manejo de errores
4. `script-cherry.sql` - Definición de tabla actualizada
5. `update-estados-cliente.sql` - Script de migración (NUEVO)
