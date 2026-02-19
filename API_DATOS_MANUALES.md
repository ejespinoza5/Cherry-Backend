# API - Gestión de Datos Manuales por Cliente y Orden

Esta documentación describe las APIs para ingresar y consultar los datos manuales de cada cliente en una orden específica.

## Campos Manuales

Los siguientes campos se gestionan manualmente **por cliente y por orden**:

- **`valor_total`** (DECIMAL): El valor total asignado al cliente en esta orden
- **`libras_acumuladas`** (DECIMAL): El peso acumulado en libras del cliente en esta orden
- **`link_excel`** (TEXT): URL del archivo de Google Sheets o Excel relacionado

---

## 1. Actualizar Datos Manuales

**Endpoint:** `PUT /api/ordenes/:id_orden/clientes/:id_cliente/datos-manuales`

**Descripción:** Actualiza los campos manuales de un cliente en una orden específica. Si el registro no existe, lo crea automáticamente.

**Autenticación:** Requiere token JWT

**Parámetros de URL:**
- `id_orden` (integer): ID de la orden
- `id_cliente` (integer): ID del cliente

**Body (JSON):**
```json
{
  "valor_total": 250.50,
  "libras_acumuladas": 35.5,
  "link_excel": "https://docs.google.com/spreadsheets/d/xxxxx"
}
```

**Campos opcionales:** Todos los campos en el body son opcionales. Puedes enviar solo los que deseas actualizar.

⚠️ **IMPORTANTE:** Solo se actualizan los campos que envíes. Los campos que no incluyas en el request **mantienen su valor anterior**. Por ejemplo:
- Si solo envías `libras_acumuladas: 42.5`, entonces solo ese campo se actualiza
- Los campos `valor_total` y `link_excel` **mantienen sus valores anteriores**

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
    "libras_acumuladas": "35.50",
    "link_excel": "https://docs.google.com/spreadsheets/d/xxxxx",
    "estado_pago": "pendiente"
  }
}
```

**Nota sobre saldo_pendiente:**
El `saldo_pendiente` se calcula como: `MAX(0, valor_total - total_abonos)`
- Si el cliente debe más: muestra la diferencia
- Si el cliente pagó todo o pagó de más: muestra 0 (nunca negativo)
- Ejemplo: valor_total=$250.50, total_abonos=$50 → saldo_pendiente=$200.50
- Ejemplo: valor_total=$250.50, total_abonos=$300 → saldo_pendiente=$0.00

**Respuesta de error (404 - Cliente no encontrado):**
```json
{
  "success": false,
  "message": "Cliente no encontrado"
}
```

**Respuesta de error (404 - Orden no encontrada):**
```json
{
  "success": false,
  "message": "Orden no encontrada"
}
```

**Ejemplo con cURL:**
```bash
curl -X PUT "http://localhost:3000/api/ordenes/5/clientes/1/datos-manuales" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "valor_total": 250.50,
    "libras_acumuladas": 35.5,
    "link_excel": "https://docs.google.com/spreadsheets/d/xxxxx"
  }'
```

**Ejemplo con JavaScript (fetch):**
```javascript
const actualizarDatosManuales = async (idOrden, idCliente) => {
  const response = await fetch(`http://localhost:3000/api/ordenes/${idOrden}/clientes/${idCliente}/datos-manuales`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valor_total: 250.50,
      libras_acumuladas: 35.5,
      link_excel: "https://docs.google.com/spreadsheets/d/xxxxx"
    })
  });
  
  const data = await response.json();
  console.log(data);
};
```

---

## 2. Obtener Datos del Cliente en una Orden

**Endpoint:** `GET /api/ordenes/:id_orden/clientes/:id_cliente`

**Descripción:** Obtiene todos los datos de un cliente en una orden específica, incluyendo los campos manuales.

**Autenticación:** Requiere token JWT

**Parámetros de URL:**
- `id_orden` (integer): ID de la orden
- `id_cliente` (integer): ID del cliente

**Respuesta exitosa (200):**
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
      "nombre": "Orden Enero 2024"
    },
    "total_compras": "150.00",
    "total_abonos": "50.00",
    "saldo_pendiente": "200.50",
    "valor_total": "250.50",
    "libras_acumuladas": "35.50",
    "link_excel": "https://docs.google.com/spreadsheets/d/xxxxx",
    "estado_pago": "pendiente"
  }
}
```

**Respuesta de error (404):**
```json
{
  "success": false,
  "message": "No se encontró el registro del cliente en esta orden"
}
```

**Ejemplo con cURL:**
```bash
curl -X GET "http://localhost:3000/api/ordenes/5/clientes/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ejemplo con JavaScript (fetch):**
```javascript
const obtenerDatosCliente = async (idOrden, idCliente) => {
  const response = await fetch(`http://localhost:3000/api/ordenes/${idOrden}/clientes/${idCliente}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(data);
};
```

---

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren un token JWT válido en el header `Authorization: Bearer TOKEN`

2. **Permisos**: Verifica que el usuario tenga los permisos necesarios para actualizar datos de órdenes

3. **Valores por defecto**: Si no se envía un campo, se utilizan los siguientes valores por defecto:
   - `valor_total`: 0
   - `libras_acumuladas`: 0
   - `link_excel`: null

4. **Creación automática**: El endpoint de actualización (PUT) crea automáticamente el registro si no existe la relación cliente-orden

5. **Validaciones**: Se valida la existencia del cliente y la orden antes de crear o actualizar datos

---

## Flujo de Trabajo Recomendado

1. **Crear o actualizar datos manuales:**
   ```
   PUT /api/ordenes/:id_orden/clientes/:id_cliente/datos-manuales
   ```

2. **Consultar datos actualizados:**
   ```
   GET /api/ordenes/:id_orden/clientes/:id_cliente
   ```

3. **Verificar el estado de pago** y otros campos calculados automáticamente

---

## Ejemplos de Uso Completo

### Escenario 1: Actualizar solo el valor total

```javascript
fetch(`http://localhost:3000/api/ordenes/5/clientes/1/datos-manuales`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    valor_total: 500.00
  })
});
```

### Escenario 2: Actualizar peso y link de Excel

```javascript
fetch(`http://localhost:3000/api/ordenes/5/clientes/1/datos-manuales`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    libras_acumuladas: 42.8,
    link_excel: "https://docs.google.com/spreadsheets/d/abc123"
  })
});
```

### Escenario 3: Actualizar todos los campos

```javascript
fetch(`http://localhost:3000/api/ordenes/5/clientes/1/datos-manuales`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    valor_total: 750.00,
    libras_acumuladas: 98.5,
    link_excel: "https://docs.google.com/spreadsheets/d/xyz789"
  })
});
```
