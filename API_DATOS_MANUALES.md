# API - Gestión de Datos Manuales por Cliente y Orden

Esta documentación describe las APIs para ingresar y consultar los datos manuales de cada cliente en una orden específica.

## Campos Manuales

Los siguientes campos se gestionan manualmente:

### Por Cliente y por Orden:
- **`valor_total`** (DECIMAL): El valor total asignado al cliente en esta orden específica
- **`libras_acumuladas`** (DECIMAL): El peso acumulado en libras del cliente en esta orden específica

### Por Cliente (compartido en todas las órdenes):
- **`link_excel`** (TEXT): URL del archivo de Google Sheets o Excel del cliente
  - ⚠️ **IMPORTANTE:** Este campo es del **cliente**, no de la orden
  - Al actualizar el link_excel, se actualiza para **todas las órdenes** del cliente
  - Cada cliente tiene un único link que aparece en todas sus órdenes

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

⚠️ **COMPORTAMIENTO DEL link_excel:**
- `valor_total` y `libras_acumuladas` son **específicos de esta orden**
- `link_excel` es **del cliente** y se comparte en **todas sus órdenes**
- Si actualizas el `link_excel` aquí, el nuevo link aparecerá en **todas las órdenes del cliente**
- **Ejemplo:** Cliente tiene Orden 1, 2 y 3. Si actualizas su link en Orden 1, el link también cambia en Orden 2 y 3

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

3. **Alcance de los campos**:
   - **Por orden** (`valor_total`, `libras_acumuladas`): Específicos de cada orden, pueden ser diferentes en cada una
   - **Por cliente** (`link_excel`): Único por cliente, compartido en todas sus órdenes
   - Al actualizar `link_excel` en cualquier orden, se actualiza para **todas las órdenes del cliente**

4. **Valores por defecto**: Si no se envía un campo al crear un nuevo registro:
   - `valor_total`: 0
   - `libras_acumuladas`: 0
   - `link_excel`: null (el que tenga el cliente)

5. **Creación automática**: El endpoint de actualización (PUT) crea automáticamente el registro si no existe la relación cliente-orden

6. **Validaciones**: Se valida la existencia del cliente y la orden antes de crear o actualizar datos

7. **link_excel global**: Si un cliente ID=1 tiene el link "http://excel.com/abc", al consultar cualquier orden de ese cliente siempre verás ese mismo link

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

### Escenario 4: Comportamiento del link_excel global

```javascript
// Cliente ID=1 tiene 3 órdenes: Orden 5, Orden 6, Orden 7

// 1. Actualizar link en Orden 5
await fetch(`http://localhost:3000/api/ordenes/5/clientes/1/datos-manuales`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    link_excel: "https://docs.google.com/spreadsheets/d/NUEVO_LINK"
  })
});

// 2. Al consultar Orden 6 (sin actualizar ahí), el link YA está actualizado
const orden6 = await fetch(`http://localhost:3000/api/ordenes/6/clientes/1`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Respuesta: link_excel = "https://docs.google.com/spreadsheets/d/NUEVO_LINK"

// 3. Lo mismo en Orden 7
const orden7 = await fetch(`http://localhost:3000/api/ordenes/7/clientes/1`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Respuesta: link_excel = "https://docs.google.com/spreadsheets/d/NUEVO_LINK"

// CONCLUSIÓN: Al actualizar el link en UNA orden, se actualiza en TODAS las órdenes del cliente
```
