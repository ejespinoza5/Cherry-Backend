# API de Perfil de Cliente

## Descripción General

Este documento describe las APIs disponibles para el perfil del cliente. Todas las rutas requieren autenticación mediante token JWT y que el usuario tenga rol de cliente (`id_rol = 2`).

**Base URL:** `/api/cliente`

**Headers requeridos:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

---

## 1. Obtener Perfil del Cliente

### `GET /api/cliente/perfil`

Obtiene la información básica del perfil del cliente autenticado.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "codigo": "JP001",
    "direccion": "Calle Principal 123",
    "saldo_pendiente": 150.50,
    "correo": "juan@ejemplo.com",
    "estado": "activo",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 2. Obtener Historial de Compras

### `GET /api/cliente/historial-compras`

Obtiene todas las compras (órdenes) en las que el cliente ha participado con el resumen de cada una.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "orden": {
        "id": 5,
        "nombre": "Orden Enero 2024",
        "estado": "cerrada",
        "fecha_inicio": "2024-01-01",
        "fecha_fin": "2024-01-31"
      },
      "total_compras": 1200.00,
      "valor_total": 1200.00,
      "total_abonos": 800.00,
      "saldo_pendiente": 400.00,
      "saldo_al_cierre": 0.00,
      "libras_acumuladas": 45.5,
      "estado_pago": "activo",
      "fecha_limite_pago": "2024-02-15",
      "created_at": "2024-01-05T10:00:00.000Z",
      "updated_at": "2024-01-31T18:30:00.000Z"
    },
    {
      "orden": {
        "id": 6,
        "nombre": "Orden Febrero 2024",
        "estado": "abierta",
        "fecha_inicio": "2024-02-01",
        "fecha_fin": null
      },
      "total_compras": 500.00,
      "valor_total": 500.00,
      "total_abonos": 500.00,
      "saldo_pendiente": 0.00,
      "saldo_al_cierre": 0.00,
      "libras_acumuladas": 20.3,
      "estado_pago": "activo",
      "fecha_limite_pago": "2024-03-15",
      "created_at": "2024-02-03T14:20:00.000Z",
      "updated_at": "2024-02-28T16:45:00.000Z"
    }
  ],
  "count": 2
}
```

#### Campos Explicados:
- `total_compras`: Total de compras en la orden (sin incluir abonos)
- `valor_total`: Valor total de la compra (usado para cálculos)
- `total_abonos`: Total que el cliente ha abonado en esta orden
- `saldo_pendiente`: Saldo que aún debe en esta orden (valor_total - total_abonos)
- `saldo_al_cierre`: Saldo registrado al momento del cierre de la orden
- `libras_acumuladas`: Total de libras compradas en esta orden
- `estado_pago`: Estado del pago de la orden
- `fecha_limite_pago`: Fecha límite para completar el pago
```

---

## 3. Obtener Historial de Abonos

### `GET /api/cliente/historial-abonos`

Obtiene el historial completo de abonos del cliente, incluyendo tanto los aceptados como los rechazados, con sus descripciones y observaciones.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "orden": {
        "id": 5,
        "nombre": "Orden Enero 2024",
        "estado": "cerrada"
      },
      "cantidad": 100.00,
      "comprobante": "uploads/comprobantes/comprobante45.jpg",
      "estado_verificacion": "verificado",
      "fecha_verificacion": "2024-01-12T09:30:00.000Z",
      "observaciones": "Abono aprobado correctamente",
      "verificado_por": "admin@ejemplo.com",
      "fecha_creacion": "2024-01-11T14:20:00.000Z"
    },
    {
      "id": 46,
      "orden": {
        "id": 5,
        "nombre": "Orden Enero 2024",
        "estado": "cerrada"
      },
      "cantidad": 50.00,
      "comprobante": "uploads/comprobantes/comprobante46.jpg",
      "estado_verificacion": "rechazado",
      "fecha_verificacion": "2024-01-15T11:00:00.000Z",
      "observaciones": "Comprobante no legible, favor reenviar",
      "verificado_por": "admin@ejemplo.com",
      "fecha_creacion": "2024-01-14T16:45:00.000Z"
    },
    {
      "id": 47,
      "orden": {
        "id": 6,
        "nombre": "Orden Febrero 2024",
        "estado": "abierta"
      },
      "cantidad": 200.00,
      "comprobante": "uploads/comprobantes/comprobante47.jpg",
      "estado_verificacion": "pendiente",
      "fecha_verificacion": null,
      "observaciones": null,
      "verificado_por": null,
      "fecha_creacion": "2024-02-10T10:15:00.000Z"
    }
  ],
  "count": 3
}
```

#### Estados de Verificación:
- `pendiente`: Abono enviado, esperando verificación
- `verificado`: Abono aceptado y aplicado
- `rechazado`: Abono rechazado, no se aplicó al saldo

---

## 4. Obtener Saldo Total

### `GET /api/cliente/saldo`

Obtiene el saldo total del cliente en todas las órdenes, indicando si debe dinero, tiene crédito a favor o está al día.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "total_compras": 1500.00,
    "total_abonos": 1200.00,
    "saldo_pendiente": 300.00,
    "estado": "debe"
  }
}
```

#### Estados del Saldo:
- `debe`: El cliente tiene deuda pendiente (saldo_pendiente > 0)
- `a_favor`: El cliente tiene crédito a favor (saldo_pendiente < 0)
- `al_dia`: El cliente no debe ni tiene crédito (saldo_pendiente = 0)

---

## 5. Obtener Datos Personales

### `GET /api/cliente/datos-personales`

Obtiene los datos personales completos del cliente para visualización o edición.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "codigo": "JP001",
    "direccion": "Calle Principal 123, Ciudad",
    "pais": "Ecuador",
    "estado_actividad": "activo",
    "created_at": "2024-01-15T10:30:00.000Z",
    "correo": "juan@ejemplo.com"
  }
}
```

**Nota:** El campo `codigo` (nombre del casillero) es de solo lectura y no puede ser modificado por el cliente.

---

## 6. Actualizar Datos Personales

### `PUT /api/cliente/datos-personales`

Permite al cliente actualizar sus datos personales. **NO permite modificar el código del casillero.**

#### Request Body
```json
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez García",
  "direccion": "Av. Principal 456, Edificio Central",
  "pais": "Ecuador"
}
```

#### Validaciones:
- `nombre`: Requerido, string
- `apellido`: Requerido, string
- `direccion`: Opcional, string
- `pais`: Opcional, string

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Datos personales actualizados exitosamente"
}
```

#### Error: Campos Faltantes (400)
```json
{
  "success": false,
  "message": "Nombre y apellido son obligatorios"
}
```

---

## 7. Actualizar Correo Electrónico

### `PUT /api/cliente/correo`

Permite al cliente actualizar su correo electrónico. Valida que el correo no esté en uso por otro usuario.

#### Request Body
```json
{
  "correo": "nuevo_correo@ejemplo.com"
}
```

#### Validaciones:
- `correo`: Requerido, formato de email válido
- El correo no debe estar registrado por otro usuario

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Correo actualizado exitosamente"
}
```

#### Error: Correo Ya Registrado (400)
```json
{
  "success": false,
  "message": "El correo ya está registrado por otro usuario"
}
```

#### Error: Formato Inválido (400)
```json
{
  "success": false,
  "message": "El formato del correo es inválido"
}
```

---

## 8. Actualizar Contraseña

### `PUT /api/cliente/contrasena`

Permite al cliente actualizar su contraseña. Requiere verificación de la contraseña actual.

#### Request Body
```json
{
  "contrasena_actual": "MiContraseñaAntigua123",
  "nueva_contrasena": "MiNuevaContraseña456",
  "confirmar_contrasena": "MiNuevaContraseña456"
}
```

#### Validaciones:
- `contrasena_actual`: Requerido, debe coincidir con la contraseña actual
- `nueva_contrasena`: Requerido, debe cumplir con los requisitos de seguridad:
  - Mínimo 6 caracteres
  - Al menos 1 letra mayúscula (A-Z)
  - Al menos 1 letra minúscula (a-z)
  - Al menos 1 número (0-9)
  - Al menos 1 símbolo especial (!@#$%^&*(),.?":{}|<>_-+=[];'/~`)
- `confirmar_contrasena`: Requerido, debe coincidir con `nueva_contrasena`

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

#### Error: Contraseña Actual Incorrecta (400)
```json
{
  "success": false,
  "message": "La contraseña actual es incorrecta"
}
```

#### Error: Contraseñas No Coinciden (400)
```json
{
  "success": false,
  "message": "Las contraseñas nuevas no coinciden"
}
```

#### Error: Contraseña Muy Corta (400)
```json
{
  "success": false,
  "message": "La contraseña debe tener al menos 6 caracteres"
}
```

#### Error: Falta Mayúscula (400)
```json
{
  "success": false,
  "message": "La contraseña debe contener al menos una letra mayúscula"
}
```

#### Error: Falta Minúscula (400)
```json
{
  "success": false,
  "message": "La contraseña debe contener al menos una letra minúscula"
}
```

#### Error: Falta Número (400)
```json
{
  "success": false,
  "message": "La contraseña debe contener al menos un número"
}
```

#### Error: Falta Símbolo Especial (400)
```json
{
  "success": false,
  "message": "La contraseña debe contener al menos un símbolo especial (!@#$%^&*...)"
}
```

#### Ejemplo de Contraseña Válida:
- `MiPass123!` ✅
- `Segura2024#` ✅
- `Cliente@456` ✅

---

## 9. Obtener Resumen Financiero

### `GET /api/cliente/resumen-financiero`

Obtiene un resumen completo de la actividad financiera del cliente.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "total_ordenes": 5,
    "total_productos": 23,
    "total_articulos": 45,
    "subtotal": 2500.00,
    "comisiones": 250.00,
    "total_compras": 2750.00,
    "total_abonado": 2400.00,
    "saldo_pendiente": 350.00
  }
}
```

---

## 10. Obtener Órdenes del Cliente

### `GET /api/cliente/ordenes`

Obtiene todas las órdenes en las que el cliente ha participado con el resumen de cada una.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "nombre_orden": "Orden Enero 2024",
      "fecha_inicio": "2024-01-01",
      "fecha_fin": "2024-01-31",
      "estado": "activo",
      "total_productos": 10,
      "total_articulos": 20,
      "subtotal": 1000.00,
      "comisiones": 100.00,
      "total": 1100.00,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

## 11. Obtener Detalle de Orden

### `GET /api/cliente/ordenes/:id`

Obtiene el detalle completo de una orden específica, incluyendo productos y abonos.

#### Parámetros de URL
- `id`: ID de la orden

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 5,
    "nombre_orden": "Orden Enero 2024",
    "fecha_inicio": "2024-01-01",
    "fecha_fin": "2024-01-31",
    "estado": "activo",
    "productos": [
      {
        "id": 123,
        "cantidad_articulos": 3,
        "detalles": "Zapatos Nike",
        "valor_etiqueta": 120.00,
        "comision": 12.00,
        "imagen": "uploads/images/producto123.jpg",
        "observacion": null,
        "estado": "activo",
        "created_at": "2024-01-10T15:20:00.000Z"
      }
    ],
    "resumen": {
      "total_productos": 1,
      "total_articulos": 3,
      "subtotal": 120.00,
      "comisiones": 12.00,
      "total": 132.00
    },
    "abonos": [
      {
        "id": 45,
        "cantidad": 100.00,
        "fecha": "2024-01-11T14:20:00.000Z",
        "estado": "activo"
      }
    ],
    "total_abonado": 100.00,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error: Orden No Encontrada (404)
```json
{
  "success": false,
  "message": "Orden no encontrada"
}
```

---

## 12. Obtener Historial de Libras

### `GET /api/cliente/historial-libras`

Obtiene el historial de actualizaciones de libras del cliente en todas las órdenes.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "id_orden": 5,
      "nombre_orden": "Orden Enero 2024",
      "libras_anteriores": 10.5,
      "libras_nuevas": 15.3,
      "diferencia": 4.8,
      "observaciones": "Actualización manual de libras",
      "actualizado_por": "admin@ejemplo.com",
      "created_at": "2024-01-20T14:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

## 13. Obtener Saldo de Última Orden

### `GET /api/cliente/saldo-ultima-orden`

Obtiene el saldo del cliente específicamente en la última orden activa (estado "abierta").

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id_orden": 6,
    "nombre_orden": "Orden Febrero 2024",
    "estado_orden": "abierta",
    "fecha_inicio": "2024-02-01",
    "fecha_cierre": null,
    "valor_total": 500.00,
    "total_abonos": 300.00,
    "libras_acumuladas": 25.5,
    "saldo_pendiente": 200.00,
    "estado_pago": "activo",
    "fecha_limite_pago": "2024-03-15"
  }
}
```

#### Si no hay orden activa o el cliente no ha participado (404)
```json
{
  "success": false,
  "message": "No se encontró información de órdenes para este cliente"
}
```

**Nota:** Si existe una orden activa pero el cliente no ha participado, devuelve la orden con valores en 0.

---

## Códigos de Error Comunes

### 401 - No Autorizado
```json
{
  "success": false,
  "message": "Token no proporcionado" 
}
```

### 403 - Acceso Denegado
```json
{
  "success": false,
  "message": "Acceso denegado. Esta función es solo para clientes"
}
```

### 500 - Error del Servidor
```json
{
  "success": false,
  "message": "Error al obtener datos del cliente"
}
```

---

## Flujo de Uso Recomendado

### 1. Vista de Perfil Principal
- Llamar a `GET /api/cliente/perfil` para mostrar información básica
- Llamar a `GET /api/cliente/saldo` para mostrar el saldo actual

### 2. Sección de Historial
- Llamar a `GET /api/cliente/historial-compras` para mostrar todas las compras
- Llamar a `GET /api/cliente/historial-abonos` para mostrar todos los abonos

### 3. Configuración de Cuenta
- Llamar a `GET /api/cliente/datos-personales` para cargar el formulario
- Enviar `PUT /api/cliente/datos-personales` al guardar cambios de datos personales
- Enviar `PUT /api/cliente/correo` para actualizar el correo electrónico
- Enviar `PUT /api/cliente/contrasena` para cambiar la contraseña

### 4. Dashboard Financiero
- Llamar a `GET /api/cliente/resumen-financiero` para mostrar estadísticas generales
- Llamar a `GET /api/cliente/saldo-ultima-orden` para mostrar información de la orden actual

---

## Notas Importantes

1. **Autenticación:** Todas las rutas requieren un token JWT válido en el header `Authorization`.

2. **Rol de Cliente:** Solo los usuarios con `id_rol = 2` pueden acceder a estas rutas.

3. **Solo Lectura de Código:** El campo `codigo` (nombre del casillero) no puede ser modificado por el cliente a través de estas APIs.

4. **Estados de Abonos:** Los abonos pueden estar en estado `pendiente`, `verificado` o `rechazado`. Solo los verificados se aplican al saldo.

5. **Saldo Negativo:** Un `saldo_pendiente` negativo indica que el cliente tiene crédito a favor.

6. **Fechas:** Todas las fechas están en formato ISO 8601 (UTC).

7. **Actualización de Correo:** El sistema valida que el correo no esté en uso por otro usuario antes de permitir el cambio.

8. **Requisitos de Contraseña:** Todas las contraseñas (al crear cuenta o actualizar) deben cumplir con:
   - Mínimo 6 caracteres
   - Al menos 1 letra mayúscula (A-Z)
   - Al menos 1 letra minúscula (a-z)
   - Al menos 1 número (0-9)
   - Al menos 1 símbolo especial (!@#$%^&*(),.?":{}|<>_-+=[];'/~`)

9. **Verificación de Contraseña Actual:** Al cambiar la contraseña, se requiere la contraseña actual para autorizar el cambio, esto garantiza la seguridad de la cuenta.
