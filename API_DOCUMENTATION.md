# Sistema Cherry - Documentación de APIs

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PORT=3000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=cherry_db
JWT_SECRET=cherry_secret_key_2026
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

## Configuración Inicial

### 1. Ejecutar el script de base de datos
```sql
-- Ejecutar script-cherry.sql
source script-cherry.sql

-- Luego ejecutar el script de inserción de roles y admin
source insert-roles-admin.sql
```

### 2. Usuario Administrador por Defecto
- **Correo:** admin@cherry.com
- **Contraseña:** admin123

---

## Endpoints de la API

### 🔐 Autenticación

#### POST /api/auth/login
Iniciar sesión en el sistema.

**Request Body:**
```json
{
  "correo": "admin@cherry.com",
  "contraseña": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 1,
      "correo": "admin@cherry.com",
      "id_rol": 1,
      "rol_nombre": "Administrador",
      "estado": "activo"
    }
  }
}
```

#### GET /api/auth/me
Obtener información del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "correo": "admin@cherry.com",
    "id_rol": 1,
    "rol_nombre": "Administrador",
    "estado": "activo",
    "created_at": "2026-01-26T10:30:00.000Z"
  }
}
```

---

### 👥 Gestión de Usuarios (Solo Administrador)

**Todas las rutas requieren:**
- Header: `Authorization: Bearer {token}`
- Rol: Administrador (id_rol = 1)

#### GET /api/usuarios
Obtener todos los usuarios.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "correo": "admin@cherry.com",
      "id_rol": 1,
      "rol_nombre": "Administrador",
      "estado": "activo",
      "created_at": "2026-01-26T10:30:00.000Z",
      "updated_at": "2026-01-26T10:30:00.000Z"
    }
  ]
}
```

#### GET /api/usuarios/:id
Obtener usuario por ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "correo": "admin@cherry.com",
    "id_rol": 1,
    "rol_nombre": "Administrador",
    "estado": "activo",
    "created_at": "2026-01-26T10:30:00.000Z",
    "updated_at": "2026-01-26T10:30:00.000Z"
  }
}
```

#### POST /api/usuarios
Crear nuevo usuario (Administrador o Cliente).

**Request Body (Crear Administrador):**
```json
{
  "correo": "admin2@cherry.com",
  "contraseña": "admin456",
  "id_rol": 1
}
```

**Request Body (Crear Cliente):**
```json
{
  "correo": "cliente@gmail.com",
  "contraseña": "cliente123",
  "id_rol": 2,
  "nombre": "Juan",
  "apellido": "Pérez",
  "direccion": "Calle 123, Ciudad",
  "codigo":"sol 12"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": 2,
    "correo": "cliente@gmail.com",
    "id_rol": 2,
    "rol_nombre": "Cliente",
    "estado": "activo",
    "created_at": "2026-01-26T11:00:00.000Z",
    "updated_at": "2026-01-26T11:00:00.000Z"
  }
}
```

#### PUT /api/usuarios/:id
Actualizar usuario.

**Request Body:**
```json
**Si es admin**
{
  "correo": "nuevoemail@cherry.com",
  "id_rol": 2,
  "estado": "activo",
  "contraseña": "nuevacontraseña123"
}
**Si es cliente**
{
  "correo": "josue@gmail.com",
  "id_rol": 2,
  "nombre": "Josué",
  "apellido": "Espinoza",
  "codigo": "Luna 23",
  "direccion": "Brisas 9"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "id": 2,
    "correo": "nuevoemail@cherry.com",
    "id_rol": 2,
    "rol_nombre": "Cliente",
    "estado": "activo",
    "created_at": "2026-01-26T11:00:00.000Z",
    "updated_at": "2026-01-26T12:00:00.000Z"
  }
}
```

#### DELETE /api/usuarios/:id
Eliminar usuario (cambiar estado a inactivo).

**Response (200):**
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

---

### 📦 Gestión de Órdenes

**Todas las rutas requieren:**
- Header: `Authorization: Bearer {token}`

#### GET /api/ordenes
Obtener todas las órdenes.

**Query Parameters (opcionales):**
- `estado` - Filtrar por estado (activo/inactivo)
- `fecha_inicio` - Filtrar desde fecha (YYYY-MM-DD)
- `fecha_fin` - Filtrar hasta fecha (YYYY-MM-DD)

**Ejemplo:**
```
GET /api/ordenes?estado=activo
GET /api/ordenes?fecha_inicio=2026-01-01&fecha_fin=2026-12-31
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre_orden": "Live Enero 2026",
      "fecha_inicio": "2026-01-15T00:00:00.000Z",
      "fecha_fin": "2026-01-20T23:59:59.000Z",
      "impuesto": 0.08,
      "comision": 50.00,
      "estado": "activo",
      "created_at": "2026-01-14T10:30:00.000Z",
      "updated_at": "2026-01-14T10:30:00.000Z",
      "creado_por": "admin@cherry.com",
      "actualizado_por": null
    }
  ],
  "count": 1
}
```

#### GET /api/ordenes/:id
Obtener orden por ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre_orden": "Live Enero 2026",
    "fecha_inicio": "2026-01-15T00:00:00.000Z",
    "fecha_fin": "2026-01-20T23:59:59.000Z",
    "impuesto": 0.08,
    "comision": 50.00,
    "estado": "activo",
    "created_at": "2026-01-14T10:30:00.000Z",
    "updated_at": "2026-01-14T10:30:00.000Z",
    "creado_por": "admin@cherry.com",
    "actualizado_por": null
  }
}
```

#### GET /api/ordenes/:id/estadisticas
Obtener estadísticas de una orden (clientes, productos, totales).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orden": {
      "id": 1,
      "nombre_orden": "Live Enero 2026",
      "fecha_inicio": "2026-01-15T00:00:00.000Z",
      "fecha_fin": "2026-01-20T23:59:59.000Z",
      "impuesto": 0.08,
      "comision": 50.00,
      "estado": "activo",
      "created_at": "2026-01-14T10:30:00.000Z",
      "updated_at": "2026-01-14T10:30:00.000Z",
      "creado_por": "admin@cherry.com",
      "actualizado_por": null
    },
    "estadisticas": {
      "total_clientes": 5,
      "total_productos": 12,
      "total_articulos": 35,
      "subtotal": "1250.00",
      "impuestos": "100.00",
      "comisiones": "50.00",
      "total": "1400.00"
    }
  }
}
```

#### POST /api/ordenes
Crear nueva orden.

**Request Body:**
```json
{
  "nombre_orden": "Live Febrero 2026",
  "fecha_inicio": "2026-02-01T00:00:00.000Z",
  "fecha_fin": "2026-02-05T23:59:59.000Z",
  "impuesto": 0.08,
  "comision": 75.00,
  "estado": "activo"
}
```

**Notas:**
- `nombre_orden` (requerido): Debe ser único
- `fecha_inicio` (requerido): Fecha de inicio de la orden
- `fecha_fin` (opcional): Debe ser posterior a fecha_inicio
- `impuesto` (opcional): Valor entre 0 y 1 (0% a 100%). Por defecto: 0.08
- `comision` (opcional): Valor mayor o igual a 0. Por defecto: 0
- `estado` (opcional): 'activo' o 'inactivo'. Por defecto: 'activo'

**Response (201):**
```json
{
  "success": true,
  "message": "Orden creada exitosamente",
  "data": {
    "id": 2,
    "nombre_orden": "Live Febrero 2026",
    "fecha_inicio": "2026-02-01T00:00:00.000Z",
    "fecha_fin": "2026-02-05T23:59:59.000Z",
    "impuesto": 0.08,
    "comision": 75.00,
    "estado": "activo",
    "created_at": "2026-01-26T14:30:00.000Z",
    "updated_at": "2026-01-26T14:30:00.000Z",
    "creado_por": "admin@cherry.com",
    "actualizado_por": null
  }
}
```

#### PUT /api/ordenes/:id
Actualizar orden.

**Request Body:**
```json
{
  "nombre_orden": "Live Febrero 2026 - Actualizado",
  "fecha_inicio": "2026-02-01T00:00:00.000Z",
  "fecha_fin": "2026-02-07T23:59:59.000Z",
  "impuesto": 0.10,
  "comision": 100.00,
  "estado": "activo"
}
```

**Notas:**
- Todos los campos son opcionales, solo se actualizan los campos enviados
- Si se actualiza el nombre, debe ser único

**Response (200):**
```json
{
  "success": true,
  "message": "Orden actualizada exitosamente",
  "data": {
    "id": 2,
    "nombre_orden": "Live Febrero 2026 - Actualizado",
    "fecha_inicio": "2026-02-01T00:00:00.000Z",
    "fecha_fin": "2026-02-07T23:59:59.000Z",
    "impuesto": 0.10,
    "comision": 100.00,
    "estado": "activo",
    "created_at": "2026-01-26T14:30:00.000Z",
    "updated_at": "2026-01-26T15:00:00.000Z",
    "creado_por": "admin@cherry.com",
    "actualizado_por": "admin@cherry.com"
  }
}
```

#### DELETE /api/ordenes/:id
Eliminar orden (cambiar estado a inactivo).

**Response (200):**
```json
{
  "success": true,
  "message": "Orden eliminada correctamente"
}
```

**Errores Comunes:**
- **400** - Orden ya está inactiva
- **404** - Orden no encontrada

---

## Códigos de Estado HTTP

- **200** - OK: Solicitud exitosa
- **201** - Created: Recurso creado exitosamente
- **400** - Bad Request: Datos de entrada inválidos
- **401** - Unauthorized: No autenticado o token inválido
- **403** - Forbidden: No tiene permisos para esta acción
- **404** - Not Found: Recurso no encontrado
- **500** - Internal Server Error: Error del servidor

---

## Roles del Sistema

| ID | Nombre | Descripción |
|----|--------|-------------|
| 1 | Administrador | Acceso completo al sistema |
| 2 | Cliente | Usuario estándar con permisos limitados |

---

## Notas Importantes

1. **Tokens JWT**: Los tokens expiran en 24 horas (configurable)
2. **Contraseñas**: Se hashean con bcrypt antes de guardarse
3. **Clientes**: Al crear un usuario con rol Cliente (id_rol=2), automáticamente se crea un registro en la tabla `clientes` con código único
4. **Seguridad**: Solo los administradores pueden crear, actualizar y eliminar usuarios
5. **Eliminación**: Los usuarios no se eliminan físicamente, solo se cambia su estado a "inactivo"

---

## Ejemplos de Uso con cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@cherry.com","contraseña":"admin123"}'
```

### Crear Cliente
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "correo":"cliente@gmail.com",
    "contraseña":"cliente123",
    "id_rol":2,
    "nombre":"Juan",
    "apellido":"Pérez"
  }'
```

### Obtener Usuarios
```bash
curl -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Crear Orden
```bash
curl -X POST http://localhost:3000/api/ordenes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nombre_orden":"Live Enero 2026",
    "fecha_inicio":"2026-01-15T00:00:00.000Z",
    "fecha_fin":"2026-01-20T23:59:59.000Z",
    "impuesto":0.08,
    "comision":50.00
  }'
```

### Obtener Órdenes
```bash
curl -X GET http://localhost:3000/api/ordenes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener Estadísticas de Orden
```bash
curl -X GET http://localhost:3000/api/ordenes/1/estadisticas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Actualizar Orden
```bash
curl -X PUT http://localhost:3000/api/ordenes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nombre_orden":"Live Enero 2026 - Actualizado",
    "comision":75.00
  }'
```

### Eliminar Orden
```bash
curl -X DELETE http://localhost:3000/api/ordenes/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
