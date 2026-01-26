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
  "direccion": "Calle 123, Ciudad"
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
