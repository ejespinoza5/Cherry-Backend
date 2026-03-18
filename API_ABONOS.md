# Sistema Cherry - API de Abonos con Comprobantes

## 📋 Descripción General

El sistema de abonos permite a los clientes realizar recargas de saldo **por orden específica** mediante la subida de un comprobante de pago. Los comprobantes deben ser verificados por un administrador antes de que el saldo se refleje en la cuenta del cliente.

## 🔄 Flujo del Sistema

1. **Cliente hace recarga** → Admin registra el abono con comprobante (estado: `pendiente`)
2. **Admin revisa comprobantes** → Lista los abonos pendientes de verificación
3. **Admin verifica/rechaza** → Si verifica, el saldo se actualiza en `cliente_orden`
4. **Saldo reflejado** → Solo los abonos verificados cuentan para el saldo del cliente

## 📊 Estados de Verificación

| Estado | Descripción | Saldo Actualizado |
|--------|-------------|-------------------|
| `pendiente` | Comprobante subido, esperando revisión | ❌ No |
| `verificado` | Comprobante aprobado por admin | ✅ Sí |
| `rechazado` | Comprobante rechazado por admin | ❌ No |

---

## 🔐 Autenticación

**Todas las rutas requieren:**
- Header: `Authorization: Bearer {token}`
- Rol: Administrador (id_rol = 1) o SuperAdministrador (id_rol = 3)

---

## 📝 Endpoints

### 1. Crear Abono con Comprobante

**POST** `/api/abonos`

Registra un nuevo abono con comprobante de pago. El abono queda en estado `pendiente` hasta que sea verificado.

**Content-Type:** `multipart/form-data`

**Form Data:**
```
id_cliente: 1
id_orden: 5
cantidad: 150.50
fecha_abono: 2026-03-18
comprobante: [archivo imagen o PDF]
```

**Campos:**
- `id_cliente` (requerido): ID del cliente que realiza el abono
- `id_orden` (requerido): ID de la orden a la que pertenece el abono
- `cantidad` (requerido): Monto del abono (debe ser positivo)
- `fecha_abono` (opcional): Fecha del abono en formato `YYYY-MM-DD` (si no se envía, se usa la fecha actual)
- `comprobante` (opcional): Archivo del comprobante de pago
  - Formatos aceptados: JPEG, JPG, PNG, WEBP, PDF
  - Tamaño máximo: 10MB
  - Se almacena en `/uploads/comprobantes/`

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/abonos \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "id_cliente=1" \
  -F "id_orden=5" \
  -F "cantidad=150.50" \
  -F "fecha_abono=2026-03-18" \
  -F "comprobante=@ruta/al/comprobante.jpg"
```

**Response (201):**
```json
{
  "success": true,
  "message": "Abono registrado exitosamente. Pendiente de verificación.",
  "data": {
    "id": 1,
    "id_cliente": 1,
    "id_orden": 5,
    "cantidad": 150.50,
    "fecha_abono": "2026-03-18",
    "comprobante_pago": "/uploads/comprobantes/comprobante-1234567890-123456789.jpg",
    "estado_verificacion": "pendiente",
    "fecha_verificacion": null,
    "verificado_by": null,
    "observaciones_verificacion": null,
    "estado": "activo",
    "created_at": "2026-02-19T10:30:00.000Z",
    "updated_at": "2026-02-19T10:30:00.000Z",
    "cliente": {
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLI001"
    },
    "orden": {
      "nombre": "Live Febrero 2026",
      "estado": "abierta"
    },
    "creado_por": "admin@cherry.com",
    "actualizado_por": null
  }
}
```

**Errores:**
- **400** - Campos requeridos faltantes o inválidos
- **404** - Cliente u orden no encontrados

---

### 2. Obtener Abonos Pendientes de Verificación

**GET** `/api/abonos/pendientes`

Lista todos los abonos que están esperando ser verificados.

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/api/abonos/pendientes \
  -H "Authorization: Bearer TU_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_cliente": 1,
      "id_orden": 5,
      "cantidad": 150.50,
      "comprobante_pago": "/uploads/comprobantes/comprobante-1234567890-123456789.jpg",
      "estado_verificacion": "pendiente",
      "created_at": "2026-02-19T10:30:00.000Z",
      "cliente": {
        "nombre": "Juan",
        "apellido": "Pérez",
        "codigo": "CLI001"
      },
      "orden": {
        "nombre": "Live Febrero 2026",
        "estado": "abierta"
      }
    },
    {
      "id": 2,
      "id_cliente": 3,
      "id_orden": 5,
      "cantidad": 200.00,
      "comprobante_pago": "/uploads/comprobantes/comprobante-1234567891-987654321.pdf",
      "estado_verificacion": "pendiente",
      "created_at": "2026-02-19T11:15:00.000Z",
      "cliente": {
        "nombre": "María",
        "apellido": "García",
        "codigo": "CLI002"
      },
      "orden": {
        "nombre": "Live Febrero 2026",
        "estado": "abierta"
      }
    }
  ]
}
```

---

### 3. Verificar Comprobante

**PUT** `/api/abonos/:id/verificar`

Aprueba el comprobante y actualiza el saldo del cliente en la tabla `cliente_orden`.

**Content-Type:** `application/json`

**Parámetros URL:**
- `id`: ID del abono a verificar

**Request Body (JSON):**
```json
{
  "observaciones": "Comprobante válido - Banco Nacional. Transferencia confirmada."
}
```

**Campos:**
- `observaciones` (opcional): Notas sobre la verificación

**Ejemplo:**
```bash
curl -X PUT http://localhost:3000/api/abonos/1/verificar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "observaciones": "Comprobante válido - Banco Nacional"
  }'
```

**Nota:** Si no envías observaciones, el comprobante se verifica sin notas adicionales.

**Response (200):**
```json
{
  "success": true,
  "message": "Comprobante verificado exitosamente. Saldo actualizado.",
  "data": {
    "id": 1,
    "id_cliente": 1,
    "id_orden": 5,
    "cantidad": 150.50,
    "comprobante_pago": "/uploads/comprobantes/comprobante-1234567890-123456789.jpg",
    "estado_verificacion": "verificado",
    "fecha_verificacion": "2026-02-19T12:00:00.000Z",
    "verificado_by": "admin@cherry.com",
    "observaciones_verificacion": "Comprobante válido - Banco Nacional",
    "estado": "activo",
    "created_at": "2026-02-19T10:30:00.000Z",
    "updated_at": "2026-02-19T12:00:00.000Z",
    "cliente": {
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLI001"
    },
    "orden": {
      "nombre": "Live Febrero 2026",
      "estado": "abierta"
    },
    "creado_por": "admin@cherry.com",
    "actualizado_por": null
  }
}
```

**Errores:**
- **400** - El abono ya fue procesado (verificado o rechazado)
- **404** - Abono no encontrado

---

### 4. Rechazar Comprobante

**PUT** `/api/abonos/:id/rechazar`

Rechaza el comprobante. El saldo NO se actualiza.

**Content-Type:** `application/json`

**Parámetros URL:**
- `id`: ID del abono a rechazar

**Request Body (JSON):**
```json
{
  "observaciones": "Comprobante ilegible. Por favor enviar una imagen más clara."
}
```

**Campos:**
- `observaciones` (requerido): Motivo del rechazo

**Ejemplo:**
```bash
curl -X PUT http://localhost:3000/api/abonos/1/rechazar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "observaciones": "Comprobante ilegible. Por favor enviar una imagen más clara."
  }'
```

**Nota:** Las observaciones son **obligatorias** al rechazar para dar feedback al cliente sobre el motivo.

**Response (200):**
```json
{
  "success": true,
  "message": "Comprobante rechazado",
  "data": {
    "id": 1,
    "id_cliente": 1,
    "id_orden": 5,
    "cantidad": 150.50,
    "comprobante_pago": "/uploads/comprobantes/comprobante-1234567890-123456789.jpg",
    "estado_verificacion": "rechazado",
    "fecha_verificacion": "2026-02-19T12:00:00.000Z",
    "verificado_by": "admin@cherry.com",
    "observaciones_verificacion": "Comprobante ilegible. Por favor enviar una imagen más clara.",
    "estado": "activo",
    "created_at": "2026-02-19T10:30:00.000Z",
    "updated_at": "2026-02-19T12:00:00.000Z"
  }
}
```

**Errores:**
- **400** - Las observaciones son requeridas al rechazar
- **400** - El abono ya fue procesado
- **404** - Abono no encontrado

---

### 5. Obtener Todos los Abonos

**GET** `/api/abonos`

Lista todos los abonos registrados en el sistema.

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/api/abonos \
  -H "Authorization: Bearer TU_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_cliente": 1,
      "id_orden": 5,
      "cantidad": 150.50,
      "comprobante_pago": "/uploads/comprobantes/comprobante-1234567890.jpg",
      "estado_verificacion": "verificado",
      "fecha_verificacion": "2026-02-19T12:00:00.000Z",
      "verificado_by": "admin@cherry.com",
      "observaciones_verificacion": "Comprobante válido",
      "estado": "activo",
      "created_at": "2026-02-19T10:30:00.000Z",
      "updated_at": "2026-02-19T12:00:00.000Z",
      "cliente": {
        "nombre": "Juan",
        "apellido": "Pérez",
        "codigo": "CLI001"
      },
      "orden": {
        "nombre": "Live Febrero 2026",
        "estado": "abierta"
      },
      "creado_por": "admin@cherry.com",
      "actualizado_por": null
    }
  ]
}
```

---

### 6. Obtener Abonos por Cliente

**GET** `/api/abonos/cliente/:id_cliente`

Lista todos los abonos de un cliente específico en todas sus órdenes.

**Parámetros URL:**
- `id_cliente`: ID del cliente

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/api/abonos/cliente/1 \
  -H "Authorization: Bearer TU_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_cliente": 1,
      "id_orden": 5,
      "cantidad": 150.50,
      "comprobante_pago": "/uploads/comprobantes/comprobante-1234567890.jpg",
      "estado_verificacion": "verificado",
      "fecha_verificacion": "2026-02-19T12:00:00.000Z",
      "verificado_by": "admin@cherry.com",
      "observaciones_verificacion": "Comprobante válido",
      "estado": "activo",
      "created_at": "2026-02-19T10:30:00.000Z",
      "updated_at": "2026-02-19T12:00:00.000Z",
      "cliente": {
        "nombre": "Juan",
        "apellido": "Pérez",
        "codigo": "CLI001"
      },
      "orden": {
        "nombre": "Live Febrero 2026",
        "estado": "abierta"
      },
      "creado_por": "admin@cherry.com",
      "actualizado_por": null
    }
  ]
}
```

**Errores:**
- **400** - ID de cliente inválido
- **404** - Cliente no encontrado

---

### 7. Obtener Abonos por Orden

**GET** `/api/abonos/orden/:id_orden`

Lista todos los abonos de una orden específica, de todos los clientes.

**Parámetros URL:**
- `id_orden`: ID de la orden

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/api/abonos/orden/5 \
  -H "Authorization: Bearer TU_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_cliente": 1,
      "cantidad": 150.50,
      "comprobante_pago": "/uploads/comprobantes/comprobante-1234567890.jpg",
      "estado_verificacion": "verificado",
      "fecha_verificacion": "2026-02-19T12:00:00.000Z",
      "verificado_by": "admin@cherry.com",
      "observaciones_verificacion": "Comprobante válido",
      "created_at": "2026-02-19T10:30:00.000Z",
      "cliente": {
        "nombre": "Juan",
        "apellido": "Pérez",
        "codigo": "CLI001"
      }
    },
    {
      "id": 2,
      "id_cliente": 3,
      "cantidad": 200.00,
      "comprobante_pago": "/uploads/comprobantes/comprobante-1234567891.pdf",
      "estado_verificacion": "pendiente",
      "fecha_verificacion": null,
      "verificado_by": null,
      "observaciones_verificacion": null,
      "created_at": "2026-02-19T11:15:00.000Z",
      "cliente": {
        "nombre": "María",
        "apellido": "García",
        "codigo": "CLI002"
      }
    }
  ]
}
```

**Errores:**
- **400** - ID de orden inválido
- **404** - Orden no encontrada

---

### 8. Obtener Saldo de Cliente en Orden

**GET** `/api/abonos/saldo/:id_cliente/:id_orden`

Obtiene el saldo actualizado de un cliente en una orden específica con el desglose de compras y abonos.

**Parámetros URL:**
- `id_cliente`: ID del cliente
- `id_orden`: ID de la orden

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/api/abonos/saldo/1/5 \
  -H "Authorization: Bearer TU_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id_cliente": 1,
    "id_orden": 5,
    "cliente": {
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLI001"
    },
    "orden": {
      "nombre": "Live Febrero 2026"
    },
    "total_compras": 500.50,
    "total_abonos": 350.00,
    "saldo_pendiente": 150.50,
    "estado_pago": "activo",
    "fecha_cierre": null,
    "fecha_limite_pago": null
  }
}
```

**Campos en la respuesta:**
- `total_compras`: Total de productos comprados en esta orden (con impuestos y comisiones)
- `total_abonos`: Suma de todos los abonos **verificados** en esta orden
- `saldo_pendiente`: Deuda restante (total_compras - total_abonos)
- `estado_pago`: Estado del pago (`activo`, `en_gracia`, `pagado`)
- `fecha_cierre`: Fecha en que se cerró la orden (null si está abierta)
- `fecha_limite_pago`: Fecha límite para pagar (null si está abierta o pagado)

**Nota:** Solo los abonos con `estado_verificacion = 'verificado'` se incluyen en `total_abonos`.

**Errores:**
- **400** - ID de cliente u orden inválido
- **404** - No se encontró registro del cliente en esta orden

---

### 9. Obtener Abono por ID

**GET** `/api/abonos/:id`

Obtiene los detalles completos de un abono específico.

**Parámetros URL:**
- `id`: ID del abono

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/api/abonos/1 \
  -H "Authorization: Bearer TU_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "id_cliente": 1,
    "id_orden": 5,
    "cantidad": 150.50,
    "comprobante_pago": "/uploads/comprobantes/comprobante-1234567890-123456789.jpg",
    "estado_verificacion": "verificado",
    "fecha_verificacion": "2026-02-19T12:00:00.000Z",
    "verificado_by": "admin@cherry.com",
    "observaciones_verificacion": "Comprobante válido - Banco Nacional",
    "estado": "activo",
    "created_at": "2026-02-19T10:30:00.000Z",
    "updated_at": "2026-02-19T12:00:00.000Z",
    "cliente": {
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLI001"
    },
    "orden": {
      "nombre": "Live Febrero 2026",
      "estado": "abierta"
    },
    "creado_por": "admin@cherry.com",
    "actualizado_por": null
  }
}
```

**Errores:**
- **400** - ID de abono inválido
- **404** - Abono no encontrado

---

### 10. Actualizar Abono

**PUT** `/api/abonos/:id`

Actualiza la cantidad y/o el comprobante de un abono. **Solo se pueden editar abonos en estado "pendiente"**. Una vez verificado o rechazado, el abono no puede ser modificado.

**Parámetros URL:**
- `id`: ID del abono

**Content-Type:** `multipart/form-data` (si se actualiza el comprobante) o `application/json` (solo cantidad)

**Campos (al menos uno es requerido):**
- `cantidad` (opcional): Nueva cantidad del abono
- `comprobante` (opcional): Nuevo archivo de comprobante de pago
  - Formatos aceptados: JPEG, JPG, PNG, WEBP, PDF
  - Tamaño máximo: 10MB
  - **Se comprime automáticamente** a WebP con calidad 85% y máximo 1200x1200px
  - El comprobante anterior se elimina automáticamente del servidor

**Ejemplo 1 - Actualizar solo cantidad:**
```bash
curl -X PUT http://localhost:3000/api/abonos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"cantidad": 175.00}'
```

**Ejemplo 2 - Actualizar solo comprobante:**
```bash
curl -X PUT http://localhost:3000/api/abonos/1 \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "comprobante=@nuevo-comprobante.jpg"
```

**Ejemplo 3 - Actualizar ambos:**
```bash
curl -X PUT http://localhost:3000/api/abonos/1 \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "cantidad=200.00" \
  -F "comprobante=@nuevo-comprobante.jpg"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Abono actualizado exitosamente",
  "data": {
    "id": 1,
    "id_cliente": 1,
    "id_orden": 5,
    "cantidad": 175.00,
    "comprobante_pago": "/uploads/comprobantes/comprobante-1234567890-new.webp",
    "estado_verificacion": "pendiente",
    "fecha_verificacion": null,
    "verificado_by": null,
    "estado": "activo",
    "created_at": "2026-02-19T10:30:00.000Z",
    "updated_at": "2026-02-19T13:00:00.000Z"
  }
}
```

**Errores:**
- **400** - Cantidad inválida, abono no está en estado pendiente, o no se proporcionó ningún campo para actualizar
- **404** - Abono no encontrado

---

### 11. Eliminar Abono

**DELETE** `/api/abonos/:id`

Elimina un abono (soft delete). **Solo se pueden eliminar abonos en estado "pendiente"**. Una vez verificado o rechazado, el abono no puede ser eliminado para mantener la integridad del historial.

**El comprobante asociado se elimina automáticamente del servidor.**

**Parámetros URL:**
- `id`: ID del abono

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3000/api/abonos/1 \
  -H "Authorization: Bearer TU_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Abono eliminado exitosamente (saldo ajustado)"
}
```

**Errores:**
- **400** - ID de abono inválido o abono no está en estado pendiente
- **404** - Abono no encontrado

---

## 📊 Consultar Saldo del Cliente por Orden

**Opción 1: Usar el endpoint de la API (Recomendado)**

```bash
curl -X GET http://localhost:3000/api/abonos/saldo/1/5 \
  -H "Authorization: Bearer TU_TOKEN"
```

Esto devuelve toda la información del saldo actualizado incluyendo:
- Total de compras
- Total de abonos verificados
- Saldo pendiente
- Estado de pago
- Información del cliente y orden

**Opción 2: Consulta SQL directa**

Si prefieres consultar directamente la base de datos:

```sql
SELECT 
  id_cliente,
  id_orden,
  total_compras,      -- Total de productos comprados
  total_abonos,       -- Solo abonos VERIFICADOS
  (total_compras - total_abonos) as saldo_pendiente
FROM cliente_orden
WHERE id_cliente = ? AND id_orden = ?
```

**Nota:** Solo los abonos con `estado_verificacion = 'verificado'` se suman a `total_abonos`.

---

## 🔒 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Abono creado exitosamente |
| 400 | Bad Request - Datos inválidos o faltantes |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 💡 Notas Importantes

1. **Comprobantes**: Se almacenan en `/uploads/comprobantes/` con nombres únicos y se comprimen automáticamente si son imágenes
2. **Verificación**: Solo los administradores pueden verificar/rechazar comprobantes
3. **Saldo por Orden**: Cada cliente tiene un saldo diferente por cada orden
4. **Auditoría**: Se registra quién verificó el comprobante (`verificado_by`) y cuándo (`fecha_verificacion`)
5. **Estados**: Los abonos pendientes o rechazados NO afectan el saldo del cliente
6. **Observaciones**: Las observaciones al rechazar son obligatorias para dar feedback al cliente
7. **Content-Type**: 
   - Para crear abonos con comprobante: `multipart/form-data`
   - Para verificar/rechazar: `application/json` (IMPORTANTE: asegúrate de incluir este header)

---

## 🎯 Ejemplo de Flujo Completo

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@cherry.com","contraseña":"admin123"}' \
  | jq -r '.data.token')

# 2. Crear abono con comprobante
curl -X POST http://localhost:3000/api/abonos \
  -H "Authorization: Bearer $TOKEN" \
  -F "id_cliente=1" \
  -F "id_orden=5" \
  -F "cantidad=150.50" \
  -F "comprobante=@comprobante.jpg"

# 3. Ver abonos pendientes
curl -X GET http://localhost:3000/api/abonos/pendientes \
  -H "Authorization: Bearer $TOKEN"

# 4. Verificar comprobante (ID del abono = 1)
curl -X PUT http://localhost:3000/api/abonos/1/verificar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"observaciones": "Comprobante válido"}'

# 5. Consultar saldo actualizado del cliente en la orden
curl -X GET http://localhost:3000/api/abonos/saldo/1/5 \
  -H "Authorization: Bearer $TOKEN"

# 6. Ver todos los abonos del cliente
curl -X GET http://localhost:3000/api/abonos/cliente/1 \
  -H "Authorization: Bearer $TOKEN"
```
