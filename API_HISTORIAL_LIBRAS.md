# API - Historial de Actualizaciones de Libras

Esta documentación describe las APIs para gestionar y consultar el historial de actualizaciones manuales de libras de los clientes en las órdenes.

## Funcionalidad

Cada vez que se actualiza manualmente el campo `libras_acumuladas` de un cliente en una orden, el sistema registra automáticamente:
- El valor anterior de libras
- El nuevo valor de libras
- La fecha y hora de la actualización
- El usuario que realizó el cambio

Esto permite llevar un historial completo de todas las modificaciones realizadas y auditar los cambios.

---

## 1. Actualizar Libras (Registro Automático en Historial)

**Endpoint:** `PUT /api/ordenes/:id_orden/clientes/:id_cliente/datos-manuales`

**Descripción:** Al actualizar `libras_acumuladas`, el sistema automáticamente crea un registro en el historial si el valor cambió.

**Autenticación:** Requiere token JWT

**Parámetros de URL:**
- `id_orden` (integer): ID de la orden
- `id_cliente` (integer): ID del cliente

**Body (JSON):**
```json
{
  "libras_acumuladas": 45.5
}
```

**Nota:** También puedes actualizar `valor_total` y `link_excel` en el mismo request. Solo `libras_acumuladas` genera registro en el historial.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Datos manuales actualizados correctamente",
  "data": {
    "id_cliente": 1,
    "id_orden": 5,
    "cliente": {
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLI001"
    },
    "orden": {
      "nombre": "Orden Enero 2024"
    },
    "total_compras": "150.00",
    "total_abonos": "50.00",
    "saldo_pendiente": "200.50",
    "valor_total": "250.50",
    "libras_acumuladas": "45.50",
    "link_excel": "https://docs.google.com/spreadsheets/d/xxxxx",
    "estado_pago": "pendiente"
  }
}
```

**Comportamiento del Historial:**
- ✅ Si el valor de libras cambió: Se crea un registro en el historial
- ❌ Si el valor es el mismo: No se crea registro (evita duplicados)
- 📝 Registra: valor anterior, valor nuevo, fecha, usuario

---

## 2. Consultar Historial de Libras por Cliente y Orden

**Endpoint:** `GET /api/ordenes/:id_orden/clientes/:id_cliente/historial-libras`

**Descripción:** Obtiene el historial completo de actualizaciones de libras de un cliente específico en una orden específica.

**Autenticación:** Requiere token JWT

**Parámetros de URL:**
- `id_orden` (integer): ID de la orden
- `id_cliente` (integer): ID del cliente

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "id_cliente": 1,
      "id_orden": 5,
      "libras_anterior": "35.50",
      "libras_nueva": "45.50",
      "fecha_actualizacion": "2024-02-15T14:30:00.000Z",
      "observaciones": null,
      "correo_usuario": "maria@example.com"
    },
    {
      "id": 12,
      "id_cliente": 1,
      "id_orden": 5,
      "libras_anterior": "25.00",
      "libras_nueva": "35.50",
      "fecha_actualizacion": "2024-02-10T10:15:00.000Z",
      "observaciones": null,
      "correo_usuario": "juan@example.com"
    }
  ],
  "count": 2
}
```

**Notas:**
- Los registros están ordenados por fecha de actualización (más reciente primero)
- Incluye información del usuario que realizó cada cambio
- `count` indica el número total de registros

---

## 3. Consultar Historial de Libras por Orden (Todos los Clientes)

**Endpoint:** `GET /api/ordenes/:id_orden/historial-libras`

**Descripción:** Obtiene el historial de actualizaciones de libras de TODOS los clientes en una orden específica.

**Autenticación:** Requiere token JWT

**Parámetros de URL:**
- `id_orden` (integer): ID de la orden

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 18,
      "id_cliente": 3,
      "id_orden": 5,
      "libras_anterior": "50.00",
      "libras_nueva": "60.00",
      "fecha_actualizacion": "2024-02-16T09:00:00.000Z",
      "observaciones": null,
      "nombre_cliente": "Carlos",
      "apellido_cliente": "López",
      "codigo_cliente": "CLI003",
      "correo_usuario": "admin@example.com"
    },
    {
      "id": 15,
      "id_cliente": 1,
      "id_orden": 5,
      "libras_anterior": "35.50",
      "libras_nueva": "45.50",
      "fecha_actualizacion": "2024-02-15T14:30:00.000Z",
      "observaciones": null,
      "nombre_cliente": "Juan",
      "apellido_cliente": "Pérez",
      "codigo_cliente": "CLI001",
      "correo_usuario": "maria@example.com"
    }
  ],
  "count": 2
}
```

**Notas:**
- Útil para ver todas las actualizaciones de libras realizadas en una orden
- Incluye información del cliente y del usuario que realizó cada cambio
- Ordenado por fecha (más reciente primero)

---

## 4. Consultar Historial de Libras de un Cliente (Todas las Órdenes)

**Endpoint:** `GET /api/cliente/historial-libras`

**Descripción:** Obtiene el historial completo de actualizaciones de libras del cliente autenticado en TODAS sus órdenes.

**Autenticación:** Requiere token JWT de un **Cliente**

**Parámetros:** Ninguno (usa el ID del cliente del token)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 20,
      "id_cliente": 1,
      "id_orden": 6,
      "libras_anterior": "40.00",
      "libras_nueva": "55.00",
      "fecha_actualizacion": "2024-03-05T11:20:00.000Z",
      "observaciones": null,
      "nombre_orden": "Orden Marzo 2024",
      "correo_usuario": "admin@example.com"
    },
    {
      "id": 15,
      "id_cliente": 1,
      "id_orden": 5,
      "libras_anterior": "35.50",
      "libras_nueva": "45.50",
      "fecha_actualizacion": "2024-02-15T14:30:00.000Z",
      "observaciones": null,
      "nombre_orden": "Orden Febrero 2024",
      "correo_usuario": "maria@example.com"
    }
  ],
  "count": 2
}
```

**Notas:**
- Solo accesible para usuarios con rol de Cliente
- Incluye el nombre de la orden en cada registro
- Permite al cliente ver todo su historial de cambios de libras

---

## Ejemplos de Uso con cURL

### Actualizar libras (genera registro automático)

```bash
curl -X PUT http://localhost:3000/api/ordenes/5/clientes/1/datos-manuales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "libras_acumuladas": 45.5
  }'
```

### Consultar historial de un cliente en una orden

```bash
curl -X GET http://localhost:3000/api/ordenes/5/clientes/1/historial-libras \
  -H "Authorization: Bearer TU_TOKEN_JWT"
```

### Consultar historial de una orden completa

```bash
curl -X GET http://localhost:3000/api/ordenes/5/historial-libras \
  -H "Authorization: Bearer TU_TOKEN_JWT"
```

### Consultar historial completo del cliente (como cliente)

```bash
curl -X GET http://localhost:3000/api/cliente/historial-libras \
  -H "Authorization: Bearer TU_TOKEN_CLIENTE_JWT"
```

---

## Ejemplos con JavaScript/Fetch

### Actualizar libras

```javascript
const actualizarLibras = async (idOrden, idCliente, libras) => {
  const response = await fetch(
    `http://localhost:3000/api/ordenes/${idOrden}/clientes/${idCliente}/datos-manuales`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        libras_acumuladas: libras
      })
    }
  );
  
  const data = await response.json();
  console.log('Libras actualizadas:', data);
  return data;
};

// Uso
actualizarLibras(5, 1, 45.5);
```

### Consultar historial

```javascript
const obtenerHistorialLibras = async (idOrden, idCliente) => {
  const response = await fetch(
    `http://localhost:3000/api/ordenes/${idOrden}/clientes/${idCliente}/historial-libras`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  console.log('Historial:', data);
  return data;
};

// Uso
obtenerHistorialLibras(5, 1);
```

---

## Estructura de la Base de Datos

**Tabla:** `historial_actualizacion_libras`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID único del registro |
| id_cliente | INT | ID del cliente |
| id_orden | INT | ID de la orden |
| libras_anterior | DECIMAL(10,2) | Valor anterior de libras |
| libras_nueva | DECIMAL(10,2) | Nuevo valor de libras |
| fecha_actualizacion | DATETIME | Fecha y hora de la actualización |
| actualizado_por | INT | ID del usuario que hizo el cambio |
| observaciones | TEXT | Notas opcionales (nullable) |
| created_at | DATETIME | Fecha de creación del registro |

**Índices:**
- `idx_historial_libras_cliente_orden`: Para búsquedas por cliente y orden
- `idx_historial_libras_fecha`: Para ordenar por fecha

---

## Resumen de Endpoints

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| PUT | `/api/ordenes/:id_orden/clientes/:id_cliente/datos-manuales` | Actualizar libras (genera historial) | Admin/Usuario |
| GET | `/api/ordenes/:id_orden/clientes/:id_cliente/historial-libras` | Ver historial cliente-orden | Admin/Usuario |
| GET | `/api/ordenes/:id_orden/historial-libras` | Ver historial de toda la orden | Admin/Usuario |
| GET | `/api/cliente/historial-libras` | Ver historial propio (cliente) | Cliente |

---

## Notas Importantes

1. **Registro Automático:** No necesitas hacer nada especial. Al actualizar `libras_acumuladas`, el historial se crea automáticamente.

2. **Solo si Cambia:** Si intentas actualizar con el mismo valor, NO se crea un registro duplicado.

3. **Auditoria Completa:** Cada cambio registra quién lo hizo y cuándo, permitiendo auditoría total.

4. **Diferencia vs Total:** El sistema guarda la diferencia completa, no incrementos. Es decir, si cambias de 35.5 a 45.5, guarda ambos valores completos.

5. **Permisos:** Los endpoints de admin requieren autenticación. El endpoint del cliente solo funciona con token de cliente.
