# Sistema de Abonos - Cherry

## 📋 Descripción

El sistema de abonos permite a administradores y superAdministradores registrar pagos/recargas de saldo para los clientes. Cada abono se guarda en el historial y actualiza automáticamente el saldo del cliente.

## 🎯 Funcionalidades

### ✅ Características Principales

1. **Registro de Abonos**
   - Seleccionar cliente
   - Registrar cantidad de abono
   - Actualización automática del saldo

2. **Historial Completo**
   - Ver todos los abonos del sistema
   - Filtrar abonos por cliente
   - Trazabilidad (quién creó/actualizó cada abono)

3. **Gestión de Saldo**
   - Acumulación automática en el campo `saldo` de clientes
   - Recálculo al actualizar abonos
   - Ajuste al eliminar abonos

4. **Integridad de Datos**
   - Transacciones atómicas (todo o nada)
   - Rollback automático en caso de error
   - Validaciones estrictas

## 🔧 Estructura de Datos

### Tabla: historial_abono

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID único del abono |
| id_cliente | INT | ID del cliente (FK) |
| cantidad | DECIMAL(10,2) | Monto del abono |
| estado | ENUM | 'activo' o 'inactivo' |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de última actualización |
| created_by | INT | ID del usuario que creó (FK) |
| updated_by | INT | ID del usuario que actualizó (FK) |

### Tabla: clientes (campo saldo)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| saldo | DECIMAL(10,2) | Saldo acumulado del cliente |

## 🚀 Endpoints API

### Base URL: `/api/abonos`

Todos los endpoints requieren:
- Token JWT válido
- Rol: Administrador o SuperAdministrador

### 1. Obtener Todos los Abonos
```http
GET /api/abonos
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_cliente": 5,
      "cantidad": 500.00,
      "estado": "activo",
      "created_at": "2026-01-30T14:30:00.000Z",
      "cliente": {
        "nombre": "Juan",
        "apellido": "Pérez",
        "codigo": "CLIENTE001",
        "saldo_actual": 1500.00
      },
      "creado_por": "admin@cherry.com"
    }
  ]
}
```

### 2. Obtener Abonos de un Cliente
```http
GET /api/abonos/cliente/:id_cliente
```

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/api/abonos/cliente/5 \
  -H "Authorization: Bearer {token}"
```

### 3. Crear Nuevo Abono
```http
POST /api/abonos
```

**Request Body:**
```json
{
  "id_cliente": 5,
  "cantidad": 500.00
}
```

**Proceso Automático:**
1. ✅ Valida que el cliente exista
2. ✅ Valida que la cantidad sea positiva
3. ✅ Inserta registro en `historial_abono`
4. ✅ Actualiza `clientes.saldo = saldo + cantidad`
5. ✅ Commit de transacción

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/abonos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "id_cliente": 5,
    "cantidad": 500.00
  }'
```

### 4. Actualizar Abono
```http
PUT /api/abonos/:id
```

**Request Body:**
```json
{
  "cantidad": 750.00
}
```

**Proceso de Recálculo:**
1. Obtiene cantidad anterior: `500.00`
2. Nueva cantidad: `750.00`
3. Diferencia: `750.00 - 500.00 = 250.00`
4. Actualiza abono
5. Ajusta saldo: `saldo + 250.00`

**Ejemplo:**
```bash
curl -X PUT http://localhost:3000/api/abonos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "cantidad": 750.00
  }'
```

### 5. Eliminar Abono
```http
DELETE /api/abonos/:id
```

**Proceso:**
1. ✅ Obtiene la cantidad del abono
2. ✅ Cambia estado a "inactivo"
3. ✅ Resta cantidad del saldo: `saldo - cantidad`
4. ✅ Commit de transacción

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3000/api/abonos/1 \
  -H "Authorization: Bearer {token}"
```

## 💡 Casos de Uso

### Caso 1: Registrar Primer Abono

**Situación:**
- Cliente: Juan Pérez (id: 5)
- Saldo actual: $0.00
- Abono a registrar: $500.00

**Petición:**
```json
POST /api/abonos
{
  "id_cliente": 5,
  "cantidad": 500.00
}
```

**Resultado:**
- ✅ Registro creado en `historial_abono`
- ✅ Saldo del cliente: $0.00 → $500.00

### Caso 2: Registrar Segundo Abono

**Situación:**
- Cliente: Juan Pérez (id: 5)
- Saldo actual: $500.00
- Nuevo abono: $300.00

**Petición:**
```json
POST /api/abonos
{
  "id_cliente": 5,
  "cantidad": 300.00
}
```

**Resultado:**
- ✅ Nuevo registro en historial
- ✅ Saldo del cliente: $500.00 → $800.00

### Caso 3: Corregir Abono (Actualizar)

**Situación:**
- Abono registrado: $500.00
- Cantidad correcta: $600.00
- Saldo actual del cliente: $800.00

**Petición:**
```json
PUT /api/abonos/1
{
  "cantidad": 600.00
}
```

**Resultado:**
- ✅ Abono actualizado: $500.00 → $600.00
- ✅ Diferencia: +$100.00
- ✅ Saldo del cliente: $800.00 → $900.00

### Caso 4: Cancelar Abono (Eliminar)

**Situación:**
- Abono erróneo: $500.00
- Saldo actual del cliente: $900.00

**Petición:**
```http
DELETE /api/abonos/1
```

**Resultado:**
- ✅ Estado cambiado: activo → inactivo
- ✅ Saldo ajustado: $900.00 → $400.00

## 🔐 Seguridad

### Permisos Requeridos
- ✅ Token JWT válido
- ✅ Rol: Administrador (id_rol = 1) o SuperAdministrador (id_rol = 3)
- ❌ Clientes NO pueden gestionar abonos

### Validaciones
1. **Cliente existe y está activo**
2. **Cantidad es número positivo**
3. **Abono existe antes de actualizar/eliminar**
4. **Usuario autenticado tiene permisos**

## 🛡️ Transacciones

Todas las operaciones que modifican el saldo utilizan **transacciones atómicas**:

```javascript
// Ejemplo de transacción en Crear Abono
const connection = await pool.getConnection();
try {
    await connection.beginTransaction();
    
    // 1. Insertar abono
    await connection.query('INSERT INTO historial_abono...');
    
    // 2. Actualizar saldo
    await connection.query('UPDATE clientes SET saldo = saldo + ?...');
    
    await connection.commit(); // ✅ Todo OK
} catch (error) {
    await connection.rollback(); // ❌ Revertir cambios
    throw error;
} finally {
    connection.release();
}
```

### Ventajas:
- ✅ Integridad de datos garantizada
- ✅ No hay estados inconsistentes
- ✅ Si falla una operación, se revierte todo

## 📊 Consultas Útiles

### Ver saldo total de todos los clientes
```sql
SELECT 
    c.id,
    c.nombre,
    c.apellido,
    c.codigo,
    c.saldo,
    COUNT(ha.id) as total_abonos,
    SUM(ha.cantidad) as suma_abonos
FROM clientes c
LEFT JOIN historial_abono ha ON c.id = ha.id_cliente AND ha.estado = 'activo'
GROUP BY c.id;
```

### Ver historial completo de un cliente
```sql
SELECT 
    ha.*,
    u.correo as registrado_por
FROM historial_abono ha
LEFT JOIN usuarios u ON ha.created_by = u.id
WHERE ha.id_cliente = 5
ORDER BY ha.created_at DESC;
```

## 📁 Archivos del Módulo

- **Modelo**: [src/models/Abono.js](src/models/Abono.js)
- **Servicio**: [src/services/abonoService.js](src/services/abonoService.js)
- **Controlador**: [src/controllers/abonosController.js](src/controllers/abonosController.js)
- **Rutas**: [src/routes/abonosRoutes.js](src/routes/abonosRoutes.js)

## 🎓 Ejemplo Completo de Flujo

```javascript
// 1. Admin selecciona cliente
const clientes = await fetch('/api/cliente'); // Ver clientes disponibles

// 2. Admin registra abono
const abono = await fetch('/api/abonos', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
        id_cliente: 5,
        cantidad: 500.00
    })
});

// 3. Ver historial del cliente
const historial = await fetch('/api/abonos/cliente/5', {
    headers: {
        'Authorization': 'Bearer ' + token
    }
});

// 4. Actualizar abono si es necesario
const actualizado = await fetch('/api/abonos/1', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
        cantidad: 600.00
    })
});
```

## ⚠️ Notas Importantes

1. **No se eliminan físicamente**: Los abonos cambian a estado "inactivo"
2. **Saldo siempre sincronizado**: Las transacciones garantizan consistencia
3. **Auditoría completa**: Se registra quién creó/actualizó cada abono
4. **Validación estricta**: Solo números positivos y clientes activos
5. **Histórico inmutable**: No se pueden modificar fechas de creación

---

Para más información, consultar [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
