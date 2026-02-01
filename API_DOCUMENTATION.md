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
```bash
# Ejecutar script-cherry.sql en MySQL
mysql -u tu_usuario -p cherry_db < script-cherry.sql
```

### 2. Crear el SuperAdministrador
```bash
# Ejecutar el script de creación de superAdministrador
node create-superadmin.js
```

### 3. (Opcional) Crear usuario Administrador usando init-database.js
```bash
# Este script crea un usuario administrador por defecto
node init-database.js
```

### 4. Usuarios por Defecto

#### SuperAdministrador
- **Correo:** superadmin@cherry.com
- **Contraseña:** Super@2026
- ⚠️ Cambiar después del primer login

#### Administrador (si se ejecutó init-database.js)
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

### 👥 Gestión de Usuarios

**Todas las rutas requieren:**
- Header: `Authorization: Bearer {token}`
- Rol: Administrador (id_rol = 1) o SuperAdministrador (id_rol = 3)

**Permisos por Rol:**
- **SuperAdministrador**: Acceso completo, puede crear cualquier tipo de usuario
- **Administrador**: Solo puede crear usuarios con rol Cliente (id_rol = 2)

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
    },
    {
      "id": 2,
      "correo": "cliente@gmail.com",
      "id_rol": 2,
      "rol_nombre": "Cliente",
      "estado": "activo",
      "created_at": "2026-01-26T11:00:00.000Z",
      "updated_at": "2026-01-26T11:00:00.000Z",
      "cliente": {
        "id": 1,
        "nombre": "Juan",
        "apellido": "Pérez",
        "codigo": "CLIENTE001",
        "direccion": "Calle 123, Ciudad",
        "saldo": 1500.00,
        "estado_actividad": "activo"
      }
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
    "id": 2,
    "correo": "cliente@gmail.com",
    "id_rol": 2,
    "rol_nombre": "Cliente",
    "estado": "activo",
    "created_at": "2026-01-26T10:30:00.000Z",
    "updated_at": "2026-01-26T10:30:00.000Z",
    "cliente": {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLIENTE001",
      "direccion": "Calle 123, Ciudad",
      "saldo": 1500.00,
      "estado_actividad": "activo"
    }
  }
}
```

#### POST /api/usuarios
Crear nuevo usuario.

**Permisos:**
- **SuperAdministrador**: Puede crear Administradores, SuperAdministradores y Clientes
- **Administrador**: Solo puede crear Clientes (id_rol = 2)

**Request Body (Crear SuperAdministrador - Solo SuperAdministrador):**
```json
{
  "correo": "superadmin2@cherry.com",
  "contraseña": "Super@2027",
  "id_rol": 3
}
```

**Request Body (Crear Administrador - Solo SuperAdministrador):**
```json
{
  "correo": "admin2@cherry.com",
  "contraseña": "admin456",
  "id_rol": 1
}
```

**Request Body (Crear Cliente - Admin o SuperAdmin):**
```json
{
  "correo": "cliente@gmail.com",
  "contraseña": "cliente123",
  "id_rol": 2,
  "nombre": "Juan",
  "apellido": "Pérez",
  "direccion": "Calle 123, Ciudad",
  "codigo": "sol 12"
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
    "updated_at": "2026-01-26T11:00:00.000Z",
    "cliente": {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "sol 12",
      "direccion": "Calle 123, Ciudad",
      "saldo": 0.00,
      "estado_actividad": "activo"
    }
  }
}
```

**Error (403) - Administrador intentando crear Administrador:**
```json
{
  "success": false,
  "message": "Los administradores solo pueden crear cuentas de clientes"
}
```

**Error (403) - No SuperAdmin intentando crear SuperAdmin:**
```json
{
  "success": false,
  "message": "Solo el superAdministrador puede crear cuentas de administradores"
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

### 💰 Gestión de Abonos

**Todas las rutas requieren:**
- Header: `Authorization: Bearer {token}`
- Rol: Administrador (id_rol = 1) o SuperAdministrador (id_rol = 3)

#### GET /api/abonos
Obtener todos los abonos registrados.

**Response (200):**
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
      "updated_at": "2026-01-30T14:30:00.000Z",
      "cliente": {
        "nombre": "Juan",
        "apellido": "Pérez",
        "codigo": "CLIENTE001",
        "saldo_actual": 1500.00
      },
      "creado_por": "admin@cherry.com",
      "actualizado_por": null
    }
  ]
}
```

#### GET /api/abonos/cliente/:id_cliente
Obtener todos los abonos de un cliente específico.

**Parámetros:**
- `id_cliente` (URL): ID del cliente

**Response (200):**
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
      "updated_at": "2026-01-30T14:30:00.000Z",
      "cliente": {
        "nombre": "Juan",
        "apellido": "Pérez",
        "codigo": "CLIENTE001",
        "saldo_actual": 1500.00
      },
      "creado_por": "admin@cherry.com",
      "actualizado_por": null
    }
  ]
}
```

#### GET /api/abonos/:id
Obtener un abono específico por ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "id_cliente": 5,
    "cantidad": 500.00,
    "estado": "activo",
    "created_at": "2026-01-30T14:30:00.000Z",
    "updated_at": "2026-01-30T14:30:00.000Z",
    "cliente": {
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLIENTE001",
      "saldo_actual": 1500.00
    }
  }
}
```

#### POST /api/abonos
Crear nuevo abono (actualiza automáticamente el saldo del cliente).

**Request Body:**
```json
{
  "id_cliente": 5,
  "cantidad": 500.00
}
```

**Notas:**
- `id_cliente` (requerido): ID del cliente a quien se le registra el abono
- `cantidad` (requerido): Monto del abono (debe ser positivo)
- El saldo del cliente se actualiza automáticamente sumando la cantidad

**Response (201):**
```json
{
  "success": true,
  "message": "Abono registrado exitosamente",
  "data": {
    "id": 1,
    "id_cliente": 5,
    "cantidad": 500.00,
    "estado": "activo",
    "created_at": "2026-01-30T14:30:00.000Z",
    "updated_at": "2026-01-30T14:30:00.000Z",
    "cliente": {
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLIENTE001",
      "saldo_actual": 1500.00
    },
    "creado_por": "admin@cherry.com",
    "actualizado_por": null
  }
}
```

**Errores Comunes:**
- **400** - ID de cliente inválido o cantidad no es un número positivo
- **404** - Cliente no encontrado

#### PUT /api/abonos/:id
Actualizar abono (recalcula automáticamente el saldo del cliente).

**Request Body:**
```json
{
  "cantidad": 750.00
}
```

**Notas:**
- Solo se puede actualizar la `cantidad`
- El sistema recalcula automáticamente el saldo del cliente:
  - Si la nueva cantidad es mayor: suma la diferencia
  - Si la nueva cantidad es menor: resta la diferencia

**Response (200):**
```json
{
  "success": true,
  "message": "Abono actualizado exitosamente",
  "data": {
    "id": 1,
    "id_cliente": 5,
    "cantidad": 750.00,
    "estado": "activo",
    "created_at": "2026-01-30T14:30:00.000Z",
    "updated_at": "2026-01-30T15:00:00.000Z",
    "cliente": {
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLIENTE001",
      "saldo_actual": 1750.00
    },
    "creado_por": "admin@cherry.com",
    "actualizado_por": "admin@cherry.com"
  }
}
```

**Errores Comunes:**
- **400** - ID de abono inválido o cantidad no es un número positivo
- **404** - Abono no encontrado

#### DELETE /api/abonos/:id
Eliminar abono (cambia estado a inactivo y ajusta el saldo del cliente).

**Notas:**
- No se elimina físicamente el registro
- Cambia el estado a "inactivo"
- Resta automáticamente la cantidad del saldo del cliente

**Response (200):**
```json
{
  "success": true,
  "message": "Abono eliminado exitosamente (saldo ajustado)"
}
```

**Errores Comunes:**
- **400** - ID de abono inválido
- **404** - Abono no encontrado o ya está inactivo

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

| ID | Nombre | Descripción | Permisos |
|----|--------|-------------|----------|
| 1 | Administrador | Acceso completo a funciones operativas | Puede crear solo usuarios clientes |
| 2 | Cliente | Usuario estándar con permisos limitados | Sin permisos de creación |
| 3 | SuperAdministrador | Acceso total al sistema | Puede crear administradores, superAdministradores y clientes |

### Jerarquía de Permisos para Creación de Usuarios

- **SuperAdministrador (id_rol = 3)**: Puede crear todos los tipos de usuarios (administradores, superAdministradores y clientes)
- **Administrador (id_rol = 1)**: Solo puede crear usuarios con rol Cliente (id_rol = 2)
- **Cliente (id_rol = 2)**: No puede crear usuarios

### Usuarios por Defecto

#### SuperAdministrador
- **Correo:** superadmin@cherry.com
- **Contraseña:** Super@2026
- **Rol:** SuperAdministrador (id_rol = 3)
- ⚠️ **IMPORTANTE:** Cambiar la contraseña después del primer login

#### Administrador
- **Correo:** admin@cherry.com
- **Contraseña:** admin123
- **Rol:** Administrador (id_rol = 1)

---

## Notas Importantes

1. **Tokens JWT**: Los tokens expiran en 24 horas (configurable)
2. **Contraseñas**: Se hashean con bcrypt antes de guardarse
3. **Clientes**: Al crear un usuario con rol Cliente (id_rol=2), automáticamente se crea un registro en la tabla `clientes` con código único
4. **Seguridad**: 
   - Solo administradores y superAdministradores pueden gestionar usuarios
   - Los administradores tienen restricciones en los tipos de usuarios que pueden crear
   - El superAdministrador tiene acceso completo sin restricciones
5. **Eliminación**: Los usuarios no se eliminan físicamente, solo se cambia su estado a "inactivo"
6. **Creación de SuperAdministrador**: Ejecutar el script `create-superadmin.js` para crear el primer superAdministrador

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
---

## 📦 Gestión de Productos (Compras)

**Todas las rutas requieren:**
- Header: `Authorization: Bearer {token}`
- Usuario autenticado

### GET /api/productos
Obtener todos los productos con filtros opcionales.

**Query Parameters:**
- `id_orden` (opcional): Filtrar por orden
- `id_cliente` (opcional): Filtrar por cliente

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_cliente": 5,
      "cliente_nombre": "Juan",
      "cliente_apellido": "Pérez",
      "cliente_codigo": "CLI-001",
      "id_orden": 2,
      "nombre_orden": "Live Enero 2026",
      "cantidad_articulos": 3,
      "detalles": "Zapatos deportivos Nike Air Max",
      "valor_etiqueta": 120.00,
      "comision": 3.00,
      "imagen_producto": "https://example.com/imagen.jpg",
      "observacion": "Talla 42",
      "estado": "activo",
      "created_at": "2026-01-29T10:30:00.000Z",
      "updated_at": "2026-01-29T10:30:00.000Z",
      "creado_por": "admin@cherry.com",
      "actualizado_por": null
    }
  ],
  "count": 1
}
```

### GET /api/productos/:id
Obtener producto por ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "id_cliente": 5,
    "cliente_nombre": "Juan",
    "cliente_apellido": "Pérez",
    "cliente_codigo": "CLI-001",
    "id_orden": 2,
    "nombre_orden": "Live Enero 2026",
    "cantidad_articulos": 3,
    "detalles": "Zapatos deportivos Nike Air Max",
    "valor_etiqueta": 120.00,
    "comision": 3.00,
    "imagen_producto": "https://example.com/imagen.jpg",
    "observacion": "Talla 42",
    "estado": "activo",
    "created_at": "2026-01-29T10:30:00.000Z",
    "updated_at": "2026-01-29T10:30:00.000Z",
    "creado_por": "admin@cherry.com",
    "actualizado_por": null
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Producto no encontrado"
}
```

### POST /api/productos
Crear nuevo producto.

**Content-Type:** 
- `multipart/form-data` (cuando se envía imagen)
- `application/json` (cuando NO se envía imagen)

**Request Body (con imagen):**
```
POST /api/productos
Content-Type: multipart/form-data

Form Data:
- id_cliente: 5
- id_orden: 2
- cantidad_articulos: 3
- detalles: "Zapatos deportivos Nike Air Max"
- valor_etiqueta: 120.00
- comision: 3.00
- imagen: [archivo de imagen]
- observacion: "Talla 42"
```

**Request Body (sin imagen - JSON):**
```json
{
  "id_cliente": 5,
  "id_orden": 2,
  "cantidad_articulos": 3,
  "detalles": "Zapatos deportivos Nike Air Max",
  "valor_etiqueta": 120.00,
  "comision": 3.00,
  "imagen_producto": "https://example.com/imagen.jpg",
  "observacion": "Talla 42"
}
```

**Campos:**
- `id_cliente` (requerido): ID del cliente
- `id_orden` (requerido): ID de la orden
- `cantidad_articulos` (requerido): Cantidad de artículos (mínimo 1)
- `detalles` (requerido): Descripción del producto
- `valor_etiqueta` (requerido): Precio del producto
- `comision` (opcional): Comisión por el producto (default: 3.00)
- `imagen` (opcional): Archivo de imagen (campo form-data)
- `imagen_producto` (opcional): URL de imagen externa (alternativa al archivo)
- `observacion` (opcional): Observaciones adicionales
- `estado` (opcional): Estado del producto (default: 'activo')

**Notas sobre imágenes:**
- Formatos aceptados: JPEG, JPG, PNG, WEBP
- Tamaño máximo: 5MB
- La imagen se redimensiona automáticamente a máximo 800x800px
- Se convierte a formato WebP con calidad 80% para optimizar espacio
- Se almacena en `/uploads/images/`

**Response (201):**
```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "id": 1,
    "id_cliente": 5,
    "cliente_nombre": "Juan",
    "cliente_apellido": "Pérez",
    "cliente_codigo": "CLI-001",
    "id_orden": 2,
    "nombre_orden": "Live Enero 2026",
    "cantidad_articulos": 3,
    "detalles": "Zapatos deportivos Nike Air Max",
    "valor_etiqueta": 120.00,
    "comision": 3.00,
    "imagen_producto": "https://example.com/imagen.jpg",
    "observacion": "Talla 42",
    "estado": "activo",
    "created_at": "2026-01-29T10:30:00.000Z",
    "updated_at": "2026-01-29T10:30:00.000Z",
    "creado_por": "admin@cherry.com",
    "actualizado_por": null
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "La cantidad de artículos debe ser al menos 1"
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "La orden especificada no existe o está inactiva"
}
```

### PUT /api/productos/:id
Actualizar producto existente.

**Request Body (todos los campos son opcionales):**
```json
{
  "cantidad_articulos": 5,
  "detalles": "Zapatos deportivos Nike Air Max - Color Negro",
  "valor_etiqueta": 125.00,
  "comision": 4.00,
  "observacion": "Talla 42 - Stock disponible"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Producto actualizado exitosamente",
  "data": {
    "id": 1,
    "id_cliente": 5,
    "cliente_nombre": "Juan",
    "cliente_apellido": "Pérez",
    "cliente_codigo": "CLI-001",
    "id_orden": 2,
    "nombre_orden": "Live Enero 2026",
    "cantidad_articulos": 5,
    "detalles": "Zapatos deportivos Nike Air Max - Color Negro",
    "valor_etiqueta": 125.00,
    "comision": 4.00,
    "imagen_producto": "https://example.com/imagen.jpg",
    "observacion": "Talla 42 - Stock disponible",
    "estado": "activo",
    "created_at": "2026-01-29T10:30:00.000Z",
    "updated_at": "2026-01-29T11:45:00.000Z",
    "creado_por": "admin@cherry.com",
    "actualizado_por": "admin@cherry.com"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Producto no encontrado"
}
```

### DELETE /api/productos/:id
Eliminar producto (soft delete - cambia estado a inactivo).

**Response (200):**
```json
{
  "success": true,
  "message": "Producto eliminado correctamente"
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Producto no encontrado"
}
```

### GET /api/productos/resumen/:id_orden/:id_cliente
Obtener resumen de productos por cliente en una orden específica.

**Parámetros:**
- `id_orden`: ID de la orden
- `id_cliente`: ID del cliente

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id_orden": 2,
    "id_cliente": 5,
    "total_productos": 4,
    "total_articulos": 12,
    "subtotal": "480.00",
    "total_comisiones": "12.00"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Orden no encontrada"
}
```

### GET /api/productos/cliente/:id_cliente/:id_orden
Obtener todos los productos de un cliente específico en una orden específica. Este endpoint retorna la información del cliente y la orden con todos los productos asociados.

**Parámetros:**
- `id_cliente`: ID del cliente
- `id_orden`: ID de la orden

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cliente": {
      "id": 5,
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLI-001",
      "direccion": "Calle 123",
      "saldo": "150.00"
    },
    "total_ordenes": 1,
    "total_productos": 3,
    "total_articulos": 8,
    "subtotal_general": "360.00",
    "total_comisiones_general": "9.00",
    "total_general": "369.00",
    "ordenes": [
      {
        "id": 2,
        "nombre_orden": "Live Enero 2026",
        "total_productos": 3,
        "total_articulos": 8,
        "subtotal": "360.00",
        "total_comisiones": "9.00",
        "total": "369.00",
        "productos": [
          {
            "id": 1,
            "cantidad_articulos": 3,
            "detalles": "Zapatos Nike Air Max",
            "valor_etiqueta": 120.00,
            "comision": 3.00,
            "imagen_producto": "/uploads/images/producto-1738168273456-123456789.webp",
            "observacion": "Talla 42",
            "created_at": "2026-01-29T10:30:00.000Z"
          },
          {
            "id": 2,
            "cantidad_articulos": 2,
            "detalles": "Camiseta Adidas",
            "valor_etiqueta": 45.00,
            "comision": 3.00,
            "imagen_producto": null,
            "observacion": "Talla M",
            "created_at": "2026-01-29T11:15:00.000Z"
          },
          {
            "id": 5,
            "cantidad_articulos": 3,
            "detalles": "Pantalón deportivo",
            "valor_etiqueta": 35.00,
            "comision": 3.00,
            "imagen_producto": null,
            "observacion": null,
            "created_at": "2026-01-29T12:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "No se encontraron productos para este cliente en esta orden"
}
```

### GET /api/productos/agrupados/:id_orden
Obtener productos agrupados por cliente en una orden. Este endpoint retorna los datos de cada cliente una sola vez con todos sus productos en un array, evitando la repetición de información del cliente.

**Parámetros:**
- `id_orden`: ID de la orden

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id_orden": 2,
    "total_clientes": 2,
    "clientes": [
      {
        "id": 5,
        "nombre": "Juan",
        "apellido": "Pérez",
        "codigo": "CLI-001",
        "direccion": "Calle 123",
        "saldo": "150.00",
        "total_productos": 3,
        "total_articulos": 8,
        "subtotal": "360.00",
        "total_comisiones": "9.00",
        "total": "369.00",
        "productos": [
          {
            "id": 1,
            "cantidad_articulos": 3,
            "detalles": "Zapatos Nike Air Max",
            "valor_etiqueta": 120.00,
            "comision": 3.00,
            "imagen_producto": "/uploads/images/producto-1738168273456-123456789.webp",
            "observacion": "Talla 42",
            "created_at": "2026-01-29T10:30:00.000Z"
          },
          {
            "id": 2,
            "cantidad_articulos": 2,
            "detalles": "Camiseta Adidas",
            "valor_etiqueta": 45.00,
            "comision": 3.00,
            "imagen_producto": null,
            "observacion": "Talla M",
            "created_at": "2026-01-29T11:15:00.000Z"
          }
        ]
      },
      {
        "id": 8,
        "nombre": "María",
        "apellido": "García",
        "codigo": "CLI-005",
        "direccion": "Av. Principal 456",
        "saldo": "0.00",
        "total_productos": 1,
        "total_articulos": 1,
        "subtotal": "85.00",
        "total_comisiones": "3.00",
        "total": "88.00",
        "productos": [
          {
            "id": 15,
            "cantidad_articulos": 1,
            "detalles": "Bolso deportivo",
            "valor_etiqueta": 85.00,
            "comision": 3.00,
            "imagen_producto": "/uploads/images/producto-1738168500789-987654321.webp",
            "observacion": null,
            "created_at": "2026-01-29T12:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Orden no encontrada"
}
```

---

## Ejemplos de Uso - Productos

### Crear Producto con Imagen
```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "id_cliente=5" \
  -F "id_orden=2" \
  -F "cantidad_articulos=3" \
  -F "detalles=Zapatos deportivos Nike Air Max" \
  -F "valor_etiqueta=120.00" \
  -F "comision=3.00" \
  -F "imagen=@/ruta/a/imagen.jpg" \
  -F "observacion=Talla 42"
```

### Crear Producto sin Imagen (JSON)
```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "id_cliente": 5,
    "id_orden": 2,
    "cantidad_articulos": 3,
    "detalles": "Zapatos deportivos Nike Air Max",
    "valor_etiqueta": 120.00,
    "comision": 3.00,
    "observacion": "Talla 42"
  }'
```

### Obtener Productos Agrupados por Cliente
```bash
curl -X GET http://localhost:3000/api/productos/agrupados/2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener Productos de un Cliente en una Orden Específica
```bash
curl -X GET http://localhost:3000/api/productos/cliente/5/2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener Productos de una Orden
```bash
curl -X GET "http://localhost:3000/api/productos?id_orden=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener Productos de un Cliente
```bash
curl -X GET "http://localhost:3000/api/productos?id_cliente=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener Productos de un Cliente en una Orden
```bash
curl -X GET "http://localhost:3000/api/productos?id_orden=2&id_cliente=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener Resumen de Cliente en Orden
```bash
curl -X GET http://localhost:3000/api/productos/resumen/2/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Actualizar Producto con Nueva Imagen
```bash
curl -X PUT http://localhost:3000/api/productos/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "cantidad_articulos=5" \
  -F "valor_etiqueta=125.00" \
  -F "imagen=@/ruta/a/nueva-imagen.jpg"
```

### Actualizar Producto sin Imagen (JSON)
```bash
curl -X PUT http://localhost:3000/api/productos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cantidad_articulos": 5,
    "valor_etiqueta": 125.00
  }'
```

### Eliminar Producto
```bash
curl -X DELETE http://localhost:3000/api/productos/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---