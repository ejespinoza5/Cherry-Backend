# 🍒 Sistema de Cierre de Órdenes - Cherry

## 📋 Índice
- [Descripción General](#descripción-general)
- [Flujo del Sistema](#flujo-del-sistema)
- [Base de Datos](#base-de-datos)
- [APIs Disponibles](#apis-disponibles)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Tareas Automáticas](#tareas-automáticas)
- [Score Crediticio](#score-crediticio)
- [Validaciones Importantes](#validaciones-importantes)
- [Gestión de Periodo de Gracia](#gestión-de-periodo-de-gracia)
- [Notas Importantes](#notas-importantes)
- [Preguntas Frecuentes](#-preguntas-frecuentes)

---

## Descripción General

El sistema de cierre de órdenes implementa un flujo completo para gestionar el ciclo de vida de las órdenes (lives), desde su apertura hasta su cierre, incluyendo:

- ✅ Cierre automático y manual de órdenes
- ✅ Periodo de gracia de 48 horas para pago
- ✅ Remate automático de clientes morosos
- ✅ Historial crediticio de clientes
- ✅ Reinicio de saldos en nuevas órdenes
- ✅ Restricciones de órdenes cerradas

---

## Flujo del Sistema

### 1️⃣ Apertura de Orden
```
- Se crea una nueva orden (estado: "abierta")
- Los clientes con DEUDA (saldo negativo) se resetean a $0
- Los clientes con SALDO A FAVOR (saldo positivo) lo mantienen
- Los clientes bloqueados por incumplimientos previos no pueden participar
```

### 2️⃣ Durante la Orden
```
- Los clientes compran productos (se descuenta de su saldo)
- Los clientes realizan abonos (se suma a su saldo)
- NO se pueden agregar/modificar/eliminar productos si la orden está cerrada
```

### 3️⃣ Cierre de Orden
**Manual:** Administrador cierra la orden antes de la fecha fin
**Automático:** Al llegar a la fecha_fin, el sistema cierra automáticamente

Al cerrar:
```
1. Se cambia estado_orden a "cerrada"
2. Se calcula saldo de cada cliente (compras - abonos)
3. Se crea registro en cierre_orden con totales
4. Se crea registro en cliente_orden para cada participante
5. Si hay clientes con deuda → estado_orden pasa a "en_gracia"
6. Se establece fecha_limite_pago = fecha_cierre + 48 horas
7. Se actualiza estado_actividad de cada cliente automáticamente:
   - activo: saldo >= 0 Y compras en últimos 3 meses
   - deudor: debe < $300
   - bloqueado: debe >= $300
   - inactivo: sin compras en 3 meses
```

### 4️⃣ Estado 'En Gracia' (48 horas)
```
- Los clientes con deuda tienen 48h para pagar
- Si pagan → estado_pago = 'pagado'
- Si NO pagan → se ejecuta REMATE automático
- La orden permanece en estado "en_gracia" hasta que todos paguen o sean rematados
```

### 5️⃣ Remate Automático
Cuando pasan las 48 horas sin pagar:
```
1. Se registra el CLIENTE COMPLETO en clientes_rematados (ya no se rematan productos individuales)
2. El cliente PIERDE todos sus abonos
3. Se crea incumplimiento en historial_incumplimientos
4. El cliente es BLOQUEADO (estado_actividad = 'bloqueado')
5. Se actualiza su score crediticio

NOTA: El sistema ya NO registra productos individuales, solo el valor_total que el cliente debía.
```

### 6️⃣ Nueva Orden
```
- Solo se puede crear si NO hay órdenes en periodo de gracia
- Las DEUDAS se resetean a $0 (no se arrastran)
- Los SALDOS A FAVOR se mantienen
- El historial de incumplimientos SÍ permanece
- Clientes con score muy bajo pueden ser bloqueados
```

**⚠️ IMPORTANTE - Validación de Nueva Orden:**

Al intentar crear una nueva orden, el sistema verifica:
```
VALIDACIÓN 1 - No Hay Órdenes Abiertas:
SI existe una orden con estado_orden = 'abierta' ENTONCES:
  ❌ NO permite crear la nueva orden
  → Error 409: "No se puede crear una nueva orden mientras hay una orden abierta"
  
  Acción requerida:
  → CERRAR la orden actual (POST /api/cierre-ordenes/:id/cerrar)

VALIDACIÓN 2 - Periodo de Gracia:
SI existe una orden con estado_orden = 'en_gracia' ENTONCES:
  ❌ NO permite crear la nueva orden
  → Error 409: "No se puede crear una nueva orden mientras hay una orden en periodo de gracia"
  
  Opciones del administrador:
  1. Esperar a que todos paguen (el sistema cierra automáticamente el periodo)
  2. Esperar a que expire el periodo de gracia (automático a las 48h)
  3. Rematar manualmente a los morosos (POST /api/cierre-ordenes/:id/rematar)
  
SI pasan AMBAS validaciones ENTONCES:
  ✅ Permite crear la nueva orden
  → Solo puede haber UNA orden activa a la vez
  → Los SALDOS POSITIVOS de clientes se mantienen
  → Los clientes "deudor" (de órdenes pasadas) vuelven a "activo"
```

**💡 Regla de Oro:** 
- ✅ Solo puedes tener **UNA orden a la vez**
- 🔄 Flujo: **Abrir Orden → Cerrar Orden → Abrir Nueva Orden**
- ❌ NO puedes crear una nueva orden si hay una abierta o en periodo de gracia
- ⚠️ Debes cerrar completamente la orden actual antes de crear la siguiente

---

## Base de Datos

### Nuevas Tablas

#### `cliente_orden`
Registra la participación de cada cliente en cada orden.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_cliente | INT | ID del cliente |
| id_orden | INT | ID de la orden |
| total_compras | DECIMAL | Total de productos comprados |
| total_abonos | DECIMAL | Total de abonos realizados |
| saldo_al_cierre | DECIMAL | Deuda cuando se cerró |
| estado_pago | ENUM | activo, pagado, pendiente, en_gracia, rematado |
| fecha_cierre | DATETIME | Cuándo se cerró |
| fecha_limite_pago | DATETIME | Límite de 48h |
| abonos_post_cierre | DECIMAL | Pagos después del cierre |

#### `clientes_rematados`
Registro de clientes que fueron rematados por incumplimiento.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_cliente | INT | Cliente moroso |
| id_orden | INT | Orden donde ocurrió |
| valor_adeudado | DECIMAL | Valor total que debía el cliente |
| abonos_perdidos | DECIMAL | Abonos que perdió el cliente |
| motivo | ENUM | incumplimiento_pago, otros |
| fecha_remate | DATETIME | Cuándo se remató |
| observaciones | TEXT | Notas adicionales |

#### `historial_incumplimientos`
Historial crediticio de cada cliente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_cliente | INT | Cliente |
| id_orden | INT | Orden |
| tipo_incumplimiento | ENUM | pago_tardio, no_pago, remate |
| monto_adeudado | DECIMAL | Cuánto debía |
| monto_perdido | DECIMAL | Abonos perdidos |
| afecta_credito | BOOLEAN | Si impacta el score |

### Tablas Actualizadas

#### `ordenes`
**Nuevos campos:**
- `fecha_cierre` - Cuándo se cerró
- `estado_orden` - abierta, cerrada, en_gracia
- `tipo_cierre` - manual, automatico
- `closed_by` - Quién la cerró

#### `cierre_orden`
**Campos ampliados:**
- `fecha_limite_pago` - Cierre + 48h
- `total_clientes` - Cuántos participaron
- `clientes_pagados` - Cuántos pagaron
- `clientes_pendientes` - Cuántos deben
- `clientes_rematados` - Cuántos fueron rematados

---

## APIs Disponibles

### Gestión de Órdenes

#### `POST /api/ordenes`
Crea una nueva orden.

**⚠️ VALIDACIÓN CRÍTICA:** No se puede crear si hay órdenes en periodo de gracia.

**Acceso:** Admin, Superadmin

**Request:**
```json
{
  "nombre_orden": "Live Febrero 2026",
  "fecha_inicio": "2026-02-10T10:00:00",
  "fecha_fin": "2026-02-15T23:59:59",
  "impuesto": 0.08
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Orden creada exitosamente",
  "data": {
    "id": 12,
    "nombre_orden": "Live Febrero 2026",
    "estado_orden": "abierta",
    "mensaje": "Nueva orden iniciada. 3 cliente(s) mantienen su saldo a favor. Las deudas fueron reseteadas a $0.",
    "clientes_con_saldo": 3
  }
}
```

**Error - Orden Abierta (409):**
```json
{
  "success": false,
  "message": "No se puede crear una nueva orden mientras la orden 'Live Enero' está abierta. Debes CERRAR la orden actual antes de crear una nueva (POST /api/cierre-ordenes/11/cerrar)",
  "error_code": "ORDER_IN_GRACE_PERIOD"
}
```

**Error - Orden en Periodo de Gracia (409):**
```json
{
  "success": false,
  "message": "No se puede crear una nueva orden mientras la orden 'Live Enero' está en periodo de gracia. Opciones: 1) Espera 36h para que expire automáticamente, 2) Remata manualmente a los clientes morosos (POST /api/cierre-ordenes/11/rematar)",
  "error_code": "ORDER_IN_GRACE_PERIOD"
}
```

---

### Cierre de Órdenes

#### `POST /api/cierre-ordenes/:id/cerrar`
Cierra una orden manualmente.

**Acceso:** Admin, Superadmin

**Respuesta:**
```json
{
  "success": true,
  "message": "Orden cerrada exitosamente",
  "data": {
    "fecha_cierre": "2026-02-05T10:00:00.000Z",
    "fecha_limite_pago": "2026-02-07T10:00:00.000Z",
    "totales": {
      "subtotal": 1500.00,
      "impuestos": 120.00,
      "comisiones": 45.00,
      "total_final": 1665.00
    },
    "estadisticas": {
      "total_clientes": 10,
      "clientes_pagados": 7,
      "clientes_pendientes": 3
    }
  }
}
```

#### `POST /api/cierre-ordenes/:id/reabrir`
Reabre una orden cerrada.

**Acceso:** Admin, Superadmin

#### `GET /api/cierre-ordenes/:id/resumen`
Obtiene el resumen completo del cierre de una orden.

**Acceso:** Autenticado

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "cierre": { ... },
    "clientes": [ ... ],
    "clientes_rematados": [ ... ],
    "incumplimientos": [ ... ]
  }
}
```

#### `GET /api/cierre-ordenes/:id/clientes`
Lista el estado de todos los clientes en una orden.

**Acceso:** Autenticado

#### `GET /api/cierre-ordenes/:id/clientes-rematados`
Obtiene la lista de clientes que fueron rematados en una orden específica.

**Acceso:** Autenticado

**Parámetros:**
- `id` (path): ID de la orden

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "orden": {
      "id": 7,
      "nombre_orden": "Live Enero 2026",
      "estado_orden": "cerrada",
      "fecha_cierre": "2026-01-20T10:00:00.000Z"
    },
    "clientes_rematados": [
      {
        "id": 1,
        "id_cliente": 5,
        "id_orden": 7,
        "valor_adeudado": "350.00",
        "abonos_perdidos": "150.00",
        "motivo": "incumplimiento_pago",
        "fecha_remate": "2026-01-22T12:00:00.000Z",
        "observaciones": "Remate automático por no pagar en periodo de gracia de 48 horas",
        "cliente_nombre": "Juan",
        "cliente_apellido": "Pérez",
        "cliente_codigo": "CLI-001",
        "estado_actividad": "bloqueado",
        "rematado_por_correo": "admin@cherry.com",
        "nombre_orden": "Live Enero 2026"
      },
      {
        "id": 2,
        "id_cliente": 8,
        "id_orden": 7,
        "valor_adeudado": "200.00",
        "abonos_perdidos": "80.00",
        "motivo": "incumplimiento_pago",
        "fecha_remate": "2026-01-22T12:00:00.000Z",
        "observaciones": "Remate automático por no pagar en periodo de gracia de 48 horas",
        "cliente_nombre": "María",
        "cliente_apellido": "García",
        "cliente_codigo": "CLI-008",
        "estado_actividad": "bloqueado",
        "rematado_por_correo": "admin@cherry.com",
        "nombre_orden": "Live Enero 2026"
      }
    ],
    "total": 2
  }
}
```

#### `POST /api/cierre-ordenes/:id/rematar`
Ejecuta el remate manual de clientes morosos.

**✨ NUEVO:** Ahora puedes rematar **en cualquier momento**, antes o después de las 48 horas.

**Acceso:** Admin, Superadmin

**Query Parameters:**
- `forzar=true` (opcional): Permite rematar incluso si NO han pasado las 48 horas. Útil cuando necesitas abrir una nueva orden urgentemente.

**Uso:**

**Opción 1 - Rematar solo clientes que ya vencieron (automático):**
```javascript
POST /api/cierre-ordenes/7/rematar
```
→ Solo remata clientes cuyo periodo de gracia YA venció (fecha_limite_pago < NOW)

**Opción 2 - Rematar TODOS los clientes con deuda (forzar):**
```javascript
POST /api/cierre-ordenes/7/rematar?forzar=true
```
→ Remata TODOS los clientes en estado 'en_gracia' con deuda, sin importar si pasaron las 48h
→ Útil para abrir una nueva orden urgentemente

**Respuesta:**
```json
{
  "success": true,
  "message": "Se remataron 3 cliente(s) moroso(s). La orden ha sido cerrada completamente.",
  "data": [
    {
      "cliente_id": 5,
      "nombre": "Juan Pérez",
      "codigo": "CLI-001",
      "valor_adeudado": 350.00,
      "abonos_perdidos": 150.00
    }
  ],
  "orden_cerrada": true
}
```

**💡 Importante:** Si se rematan TODOS los clientes morosos de la orden, el sistema automáticamente cambia `estado_orden` de `'en_gracia'` a `'cerrada'`, permitiéndote crear inmediatamente una nueva orden.

**Ejemplo de uso urgente:**
```javascript
// Situación: Necesitas abrir nueva orden pero hay clientes en periodo de gracia

// 1. Rematar FORZADO (sin esperar 48h)
await fetch('/api/cierre-ordenes/7/rematar?forzar=true', { 
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN_ADMIN' }
});

// 2. Ahora SÍ puedes crear la nueva orden inmediatamente
await fetch('/api/ordenes', { 
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN_ADMIN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    nombre_orden: 'Live Febrero',
    fecha_inicio: '2026-02-10T10:00:00',
    fecha_fin: '2026-02-15T23:59:59'
  })
});
```

#### `GET /api/cierre-ordenes/:id/morosos`
Obtiene clientes morosos en una orden.

**Acceso:** Admin, Superadmin

#### `POST /api/cierre-ordenes/:id/verificar-pago`
Verifica si todos los clientes pagaron y cierra automáticamente el periodo de gracia.

**Acceso:** Admin, Superadmin

**Cuándo usar:**
- Para verificar manualmente si todos los clientes ya pagaron
- Para forzar la verificación sin esperar a que se haga un nuevo abono
- Para confirmar que puedes crear una nueva orden

**Respuesta Exitosa (Todos Pagaron):**
```json
{
  "success": true,
  "mensaje": "Todos los clientes pagaron. Periodo de gracia cerrado correctamente.",
  "estado_final": "cerrada"
}
```

**Respuesta con Clientes Pendientes:**
```json
{
  "success": false,
  "mensaje": "Aún hay 2 cliente(s) con deuda pendiente",
  "clientes_pendientes": [
    {
      "nombre": "Juan",
      "apellido": "Pérez",
      "saldo_al_cierre": 150.00,
      "abonos_post_cierre": 50.00,
      "deuda_pendiente": 100.00
    },
    {
      "nombre": "María",
      "apellido": "García",
      "saldo_al_cierre": 200.00,
      "abonos_post_cierre": 0.00,
      "deuda_pendiente": 200.00
    }
  ],
  "estado_actual": "en_periodo_gracia"
}
```

**Ejemplo de Uso:**
```javascript
// Verificar estado de la orden 11
const response = await fetch('/api/cierre-ordenes/11/verificar-pago', { 
  method: 'POST',
  headers: { 'Authorization': 'Bearer <token>' }
});

if (response.ok) {
  const data = await response.json();
  
  if (data.success) {
    // ✅ Todos pagaron, crear nueva orden
    console.log('Puedes crear la nueva orden');
  } else {
    // ❌ Aún hay pendientes
    console.log(data.clientes_pendientes);
  }
}
```

### Historial de Clientes

#### `GET /api/cierre-ordenes/cliente/:id_cliente/historial`
Obtiene el historial completo de un cliente.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "ordenes_participadas": [ ... ],
    "incumplimientos": [ ... ],
    "score_crediticio": {
      "total_incumplimientos": 2,
      "total_remates": 1,
      "total_no_pagos": 0,
      "total_pagos_tardios": 1,
      "score_crediticio": 65,
      "clasificacion": "Regular"
    }
  }
}
```

#### `GET /api/cierre-ordenes/cliente/:id_cliente/elegibilidad`
Verifica si un cliente puede participar en nuevas órdenes.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "puede_participar": true,
    "score": 85,
    "clasificacion": "Bueno"
  }
}
```

---

## Ejemplos de Uso

### Flujo Completo: Cerrar Orden y Crear Nueva

**Escenario 1: Todos pagaron (Flujo Ideal)**

```javascript
// 1. Cerrar orden actual
const cierreResponse = await fetch('/api/cierre-ordenes/11/cerrar', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN_ADMIN' }
});

// Respuesta: { estadisticas: { clientes_pendientes: 0 } }
// No hay periodo de gracia porque todos pagaron

// 2. Crear nueva orden inmediatamente
const nuevaOrdenResponse = await fetch('/api/ordenes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN_ADMIN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nombre_orden: 'Live Febrero',
    fecha_inicio: '2026-02-10T10:00:00',
    fecha_fin: '2026-02-15T23:59:59'
  })
});
// ✅ Success: Nueva orden creada, saldos reiniciados
```

**Escenario 2: Hay morosos - Remate Manual FORZADO (Urgente)**

```javascript
// 1. Cerrar orden
await fetch('/api/cierre-ordenes/11/cerrar', { method: 'POST' });
// Respuesta: { estadisticas: { clientes_pendientes: 3 } }
// Estado de orden: "en_periodo_gracia"

// 2. Intentar crear nueva orden
const intentoCrear = await fetch('/api/ordenes', {
  method: 'POST',
  body: JSON.stringify({ nombre_orden: 'Live Febrero', ... })
});
// ❌ Error 409: "No se puede crear... orden en periodo de gracia"

// 3. REMATAR FORZADO - Sin esperar las 48h (parámetro ?forzar=true)
await fetch('/api/cierre-ordenes/11/rematar?forzar=true', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN_ADMIN' }
});
// ✅ Success: 3 clientes rematados (aunque el periodo de gracia aún estaba vigente)});
// ✅ Success: 3 clientes rematados

// 4. AHORA SÍ crear nueva orden
const nuevaOrden = await fetch('/api/ordenes', {
  method: 'POST',
  body: JSON.stringify({ nombre_orden: 'Live Febrero', ... })
});
// ✅ Success: Nueva orden creada
```

**Escenario 3: Hay morosos - Esperar 48h (Automático)**

```javascript
// Día 1 - 10:00 AM
await fetch('/api/cierre-ordenes/11/cerrar', { method: 'POST' });
// Estado: "en_periodo_gracia"

// Día 1 - 14:00 PM
await fetch('/api/ordenes', { method: 'POST', ... });
// ❌ Error: "orden en periodo de gracia, espera 46h"

// Día 3 - 10:00 AM (48h después)
// Sistema ejecuta remate automático (cron job)

// Día 3 - 10:30 AM
await fetch('/api/ordenes', { method: 'POST', ... });
// ✅ Success: Nueva orden creada
```

---

### Cerrar una Orden

```javascript
// Cierre manual
const response = await fetch('/api/cierre-ordenes/5/cerrar', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN_ADMIN'
  }
});
```

### Obtener Clientes con Deuda

```javascript
const response = await fetch('/api/cierre-ordenes/5/morosos', {
  headers: {
    'Authorization': 'Bearer TOKEN_ADMIN'
  }
});

const { data } = await response.json();
// data = [{ cliente_id, nombre, deuda_pendiente, ... }]
```

### Verificar Score de Cliente

```javascript
const response = await fetch('/api/cierre-ordenes/cliente/23/elegibilidad', {
  headers: {
    'Authorization': 'Bearer TOKEN'
  }
});

const { data } = await response.json();
if (!data.puede_participar) {
  alert('Cliente no puede participar: ' + data.motivo);
}
```

---

## Tareas Automáticas

### Cierre Automático de Órdenes
**Función:** `CierreOrdenService.cerrarOrdenesAutomaticamente()`

Debe ejecutarse cada hora para verificar si hay órdenes que deben cerrarse.

```javascript
// Ejemplo con node-cron
const cron = require('node-cron');
const CierreOrdenService = require('./src/services/cierreOrdenService');

// Ejecutar cada hora
cron.schedule('0 * * * *', async () => {
  console.log('Verificando órdenes para cerrar...');
  await CierreOrdenService.cerrarOrdenesAutomaticamente();
});
```

### Remate Automático
**Función:** `CierreOrdenService.procesarRematesAutomaticos()`

Debe ejecutarse cada hora para verificar si hay clientes morosos cuyo periodo de gracia venció.

```javascript
// Ejecutar cada hora
cron.schedule('0 * * * *', async () => {
  console.log('Verificando clientes morosos...');
  await CierreOrdenService.procesarRematesAutomaticos();
});
```

---

## Score Crediticio

### Cálculo
```
Score inicial: 100 puntos

Penalizaciones:
- Remate: -30 puntos
- No pago: -20 puntos  
- Pago tardío: -5 puntos

Mínimo: 0 puntos
```

### Clasificación
- **90-100:** Excelente
- **70-89:** Bueno
- **50-69:** Regular
- **30-49:** Malo
- **0-29:** Muy Malo

### Restricciones
Los clientes con score < 30 y incumplimientos recientes (últimos 30 días) **NO pueden participar** en nuevas órdenes.

---

## Validaciones Importantes

### Al Agregar Productos
```javascript
// ❌ No permitido si la orden está cerrada
POST /api/productos
→ Error 403: "No se pueden agregar productos a una orden cerrada"
```

### Al Modificar Productos
```javascript
// ❌ No permitido si la orden está cerrada
PUT /api/productos/:id
→ Error 403: "No se pueden modificar productos de una orden cerrada"
```

### Al Eliminar Productos
```javascript
// ❌ No permitido si la orden está cerrada
DELETE /api/productos/:id
→ Error 403: "No se pueden eliminar productos de una orden cerrada"
```

### Al Crear Nueva Orden
```javascript
// ❌ No permitido si hay orden en periodo de gracia
POST /api/ordenes
→ Error 409: {
    "success": false,
    "message": "No se puede crear una nueva orden mientras la orden 'Live Enero' está en periodo de gracia. Opciones: 1) Espera 36h para que expire automáticamente, 2) Remata manualmente a los clientes morosos",
    "error_code": "ORDER_IN_GRACE_PERIOD"
  }

// ✅ Permitido si NO hay órdenes en periodo de gracia
POST /api/ordenes
→ Resetea las deudas a $0, mantiene saldos positivos
```

---

## Gestión de Periodo de Gracia

### ✅ Cierre Automático del Periodo de Gracia

**¿Qué pasa cuando todos los clientes pagan?**

El sistema detecta automáticamente cuando un cliente completa su pago:

```
1. Cliente realiza un abono (POST /api/abonos)
2. Sistema verifica si cubría su deuda en órdenes en periodo de gracia
3. Si el cliente pagó todo:
   - Se marca como "pagado" en cliente_orden
   - Se actualiza su estado de "deudor" a "activo"
4. Sistema verifica si TODOS los clientes de esa orden ya pagaron
5. Si todos pagaron:
   - La orden cambia de 'en_periodo_gracia' a 'cerrada'
   - ✅ YA puedes crear una nueva orden sin esperar las 48h
```

**Verificación Manual (opcional):**

Si deseas verificar manualmente el estado:

```javascript
POST /api/cierre-ordenes/:id_orden/verificar-pago
```

**Respuesta si todos pagaron:**
```json
{
  "success": true,
  "mensaje": "Todos los clientes pagaron. Periodo de gracia cerrado correctamente.",
  "estado_final": "cerrada"
}
```

**Respuesta si aún hay pendientes:**
```json
{
  "success": false,
  "mensaje": "Aún hay 2 cliente(s) con deuda pendiente",
  "clientes_pendientes": [
    {
      "nombre": "Juan",
      "apellido": "Pérez",
      "saldo_al_cierre": 150.00,
      "abonos_post_cierre": 50.00,
      "deuda_pendiente": 100.00
    }
  ],
  "estado_actual": "en_periodo_gracia"
}
```

---

### Para Abrir Nueva Orden Antes de las 48 Horas

**Opción 1: Esperar a que Todos Paguen (Automático - Recomendado)**

```
1. Los clientes abonan su deuda
2. Sistema detecta automáticamente y cierra el periodo de gracia
3. Ya puedes crear la nueva orden
```

**Opción 2: Remate Manual (Si ya pasó tiempo y no pagan)**

7. **⚠️ CRÍTICO - Una sola orden activa a la vez:**
   - NO se puede crear una nueva orden mientras hay una en periodo de gracia
   - Esto evita confusión sobre a qué orden van los abonos
   - Los abonos SIEMPRE van a la orden que tiene deuda pendiente
   - Una vez rematados los morosos, se puede crear la nueva orden

8. **Flujo recomendado para nueva orden:**
   ```
   Cerrar Orden 1 → Rematar morosos (manual o esperar 48h) → Crear Orden 2
   ```

```javascript
// 1. Rematar a los clientes morosos
POST /api/cierre-ordenes/5/rematar

// 2. Crear la nueva orden inmediatamente
POST /api/ordenes
```

**Opción 2: Esperar el Remate Automático**

```javascript
// Sistema ejecuta automáticamente a las 48h
// Luego puedes crear la nueva orden
POST /api/ordenes
```

---

## Notas Importantes

1. **Las deudas NO se arrastran** entre órdenes. Los saldos negativos se resetean a $0. Los saldos positivos SÍ se mantienen.

2. **Los incumplimientos SÍ quedan registrados** permanentemente en el historial.

3. **Solo administradores** pueden cerrar/reabrir órdenes manualmente.

4. **Los clientes bloqueados** no pueden comprar hasta que se les desbloquee manualmente.

5. **El periodo de gracia es de 48 horas**, calculado desde el momento del cierre.
si hay clientes con saldo negativo (deudas). El sistema lo bloquea con un error 409. Los abonos SIEMPRE van a la orden donde el cliente tiene deuda pendiente, por eso el sistema fuerza a cerrar todas las órdenes con deudas antes de crear una nueva.

**Flujo correcto:**
1. Cierra la orden actual (POST /api/cierre-ordenes/:id/cerrar)
2. Si hay deudas → periodo de g?

**R:** Los abonos siempre van al **saldo general del cliente**, no a una orden específica. El saldo del cliente es global.

**Flujo normal (una orden a la vez):**
- Cliente tiene saldo: $100
- Compra productos: $50 → Saldo: $50
- Hace abono: $40 → Saldo: $90
- Cierras la orden
- Los clientes con saldo negativo (deuda) entran en periodo de gracia
- Una vez resuelta la orden, puedes crear la siguiente
- Compra en Orden B: $30 → Saldo: $20
- Hace abono: $40 → Saldo: $60
- Puede seguir comprando en cualquier orden activa

**Caso especial - Periodo de Gracia:**
Si una orden está CERRADA y en periodo de gracia (clientes con deuda):
- NO puedes crear una nueva orden hasta que se resuelva
- Los abonos van al saldo del cliente y automáticamente reducen su deuda en la orden cerrada
- Cuando todos paguen o se rematen, puedes crear la nueva orden

### ¿Qué pasa si cierro una orden y hay clientes que deben dinero?

**R:** La orden entra en "periodo de gracia" por 48 horas. Durante ese tiempo:
- Los clientes pueden seguir abonando
- NO puedes crear una nueva orden
- Si pagan todo → quedan como "pagado"
- Si NO pagan en 48h → remate automático

### ¿Cómo puedo abrir una nueva orden antes de las 48 horas?

**R:** Tienes 3 opciones:

1. **Esperar a que todos paguen** (Automático - Recomendado)
   - Cuando el último cliente paga, el sistema cierra automáticamente el periodo de gracia
   - Ya puedes crear la nueva orden sin esperar las 48h completas

2. **Rematar manualmente** a los clientes morosos:
   ```bash
   POST /api/cierre-ordenes/:id/rematar
   ```
   Esto cierra completamente la orden anterior y permite crear la nueva.

3. **Esperar las 48 horas** para el remate automático

### ¿Qué pasa si todos los clientes pagan durante el periodo de gracia?

**R:** ✅ **El sistema detecta automáticamente** cuando el último cliente paga:

1. Al hacer un abono (POST /api/abonos), el sistema verifica si el cliente ya pagó toda su deuda
2. Si ese era el último cliente pendiente, la orden cambia automáticamente de 'en_periodo_gracia' a 'cerrada'
3. Ya puedes crear una nueva orden sin esperar las 48 horas ni rematar manualmente

**Verificación Manual:**
```bash
POST /api/cierre-ordenes/:id_orden/verificar-pago
```

Esto te dirá si todos pagaron o muestra quiénes siguen pecomienza la siguiente orden con +$20
- **SALDOS NEGATIVOS (DEUDAS)**: 
  - Al cerrar una orden, si hay deuda → Periodo de gracia de 48h
  - NO puedes crear nueva orden hasta resolver (pagar o rematar)
  - Una vez resuelto → Deudas se resetean a $0, saldos positivos se mantienen

**Flujo normal:**
1. Orden 1 Abierta: Cliente compra y abona
2. Cierras Orden 1:
   - Si debe dinero → Periodo de gracia
   - Si tiene saldo positivo → Orden cerrada, saldo se mantiene
3. Una vez resuelta → Puedes crear Orden 2
4. Cliente en Orden 2 empieza con el saldo que teníapositivos se mantienen

**Ejemplo:**
- Orden 1 Abierta: Cliente compra $50, no abona → Saldo: -$50 ✅ Normal
- Orden 2 Abierta: Cliente puede seguir comprando ✅ OK
- Cierras Orden 1 con deuda → Periodo de gracia ⏰
- No puedes crear Orden 3 hasta que se resuelva Orden 1

### ¿El historial de incumplimientos se borra?

**R:** NO. El historial queda permanente y afecta el score crediticio del cliente.
❌ **NO**, solo puedes tener **UNA orden a la vez**. 

**Flujo obligatorio:**
1. Crear Orden A (abierta)
2. Clientes compran y abonan
3. **Cerrar** Orden A → puede quedar "cerrada" o "en_periodo_gracia"
4. Solo después de resolver Orden A puedes crear Orden B

**¿Por qué solo una orden a la vez?**
- Claridad contable: No hay confusión sobre qué productos van a qué orden
- Control de pagos: El periodo de gracia se maneja orden por orden
- Simplicidad: Los abonos siempre aplican a la orden activa

**Estados posibles:**
- ✅ Una orden ABIERTA → clientes compran
- ⏰ Una orden en PERIODO_GRACIA → esperando pagos
- ✅ Una orden CERRADA → completamente finalizada
- ✅ Ninguna orden → puedes crear una nueva
- Orden B: "Live Electrónicos" (abierta)
- Orden C: "Live Zapatos" (abierta)
✅ Todo OK, los clientes pueden comprar en las 3

**Ejemplo bloqueado:**
- Orden A: "Live Anterior" (en_periodo_gracia - tiene clientes con deuda)
- Intentas crear Orden B: ❌ Bloqueado hasta que se resuelva la Orden A

### ¿Qué pasa cuando se remata a un cliente?

**R:** El CLIENTE COMPLETO se registra en `clientes_rematados` con el valor total que debía (valor_adeudado) y los abonos que pierde (abonos_perdidos). El sistema ya NO maneja productos individuales - solo se ingresa un valor_total manual por cada cliente en cada orden.

### ¿Qué pasa si un cliente abonó de más en una orden?

**R:** El saldo positivo se MANTIENE para la siguiente orden. Ejemplo completo:

**Orden 1:**
- Juan abonó: $100
- Juan compró: $80
- Saldo final: **+$20** ✅

**Orden 2 (nueva):**
- Juan empieza con: **$20** (saldo de la orden anterior)
- Juan compra: $50
- Saldo después de comprar: $20 - $50 = **-$30**
- Juan abona: $30
- Saldo final: **$0** ✅ (pagado)

Esto es justo para los clientes que abonan de más y evita que pierdan su dinero.

---

## Soporte

Para más información o problemas, consultar:
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- [SISTEMA_ESTADOS_CLIENTES.md](./SISTEMA_ESTADOS_CLIENTES.md)
