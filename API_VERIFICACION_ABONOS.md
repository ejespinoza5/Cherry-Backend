# API - Verificación de Abonos por Orden

Esta documentación describe las APIs para consultar y gestionar los abonos de clientes en una orden específica, con filtros por estado de verificación y paginación.

---

## 1. Obtener Clientes con Abonos por Orden

**Endpoint:** `GET /api/abonos/ordenes/:id_orden/clientes`

**Descripción:** Obtiene la lista de clientes con sus abonos en una orden específica. Permite filtrar por estado de verificación y soporta paginación.

**Autenticación:** Requiere token JWT (Admin o SuperAdmin)

**Parámetros de URL:**
- `id_orden` (integer): ID de la orden

**Query Parameters (Opcionales):**
- `estado` (string): Filtrar por estado de verificación
  - Valores: `pendiente`, `verificado`, `rechazado`
  - Si no se envía, muestra todos los estados
- `page` (integer): Número de página (default: 1)
- `limit` (integer): Registros por página (default: 10, máximo: 100)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id_cliente": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLI001",
      "estado_actividad": "activo",
      "valor_total": "500.00",
      "total_abonos": "250.00",
      "saldo_pendiente": "250.00",
      "estado_pago": "pendiente",
      "abonos": [
        {
          "id_abono": 10,
          "cantidad": "150.00",
          "comprobante_pago": "uploads/comprobantes/1234567890.jpg",
          "estado_verificacion": "pendiente",
          "fecha_verificacion": null,
          "verificado_by": null,
          "observaciones_verificacion": null,
          "fecha_abono": "2024-02-15T10:30:00.000Z"
        },
        {
          "id_abono": 8,
          "cantidad": "100.00",
          "comprobante_pago": "uploads/comprobantes/0987654321.jpg",
          "estado_verificacion": "verificado",
          "fecha_verificacion": "2024-02-14T15:20:00.000Z",
          "verificado_by": "admin@example.com",
          "observaciones_verificacion": "Comprobante válido",
          "fecha_abono": "2024-02-14T09:15:00.000Z"
        }
      ]
    },
    {
      "id_cliente": 2,
      "nombre": "María",
      "apellido": "García",
      "codigo": "CLI002",
      "estado_actividad": "activo",
      "valor_total": "300.00",
      "total_abonos": "100.00",
      "saldo_pendiente": "200.00",
      "estado_pago": "pendiente",
      "abonos": [
        {
          "id_abono": 12,
          "cantidad": "100.00",
          "comprobante_pago": "uploads/comprobantes/1111111111.jpg",
          "estado_verificacion": "pendiente",
          "fecha_verificacion": null,
          "verificado_by": null,
          "observaciones_verificacion": null,
          "fecha_abono": "2024-02-16T08:00:00.000Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

**Respuesta de error (400 - Parámetros inválidos):**
```json
{
  "success": false,
  "message": "Estado de verificación inválido. Use: pendiente, verificado o rechazado"
}
```

**Respuesta de error (404 - Orden no encontrada):**
```json
{
  "success": false,
  "message": "Orden no encontrada"
}
```

**Ejemplo con cURL (Todos los estados):**
```bash
curl -X GET "http://localhost:3000/api/abonos/ordenes/5/clientes" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ejemplo con cURL (Solo pendientes):**
```bash
curl -X GET "http://localhost:3000/api/abonos/ordenes/5/clientes?estado=pendiente&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ejemplo con cURL (Solo verificados):**
```bash
curl -X GET "http://localhost:3000/api/abonos/ordenes/5/clientes?estado=verificado&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ejemplo con cURL (Solo rechazados):**
```bash
curl -X GET "http://localhost:3000/api/abonos/ordenes/5/clientes?estado=rechazado" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ejemplo con JavaScript (fetch):**
```javascript
const obtenerClientesConAbonos = async (idOrden, estado = null, page = 1, limit = 10) => {
  let url = `http://localhost:3000/api/abonos/ordenes/${idOrden}/clientes?page=${page}&limit=${limit}`;
  
  if (estado) {
    url += `&estado=${estado}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(data);
};

// Ejemplos de uso
await obtenerClientesConAbonos(5); // Todos los estados
await obtenerClientesConAbonos(5, 'pendiente'); // Solo pendientes
await obtenerClientesConAbonos(5, 'verificado', 2, 20); // Página 2, 20 por página
```

---

## 2. Obtener Contador de Estados de Verificación

**Endpoint:** `GET /api/abonos/ordenes/:id_orden/contador-estados`

**Descripción:** Obtiene un resumen con el conteo de abonos por cada estado de verificación en una orden específica.

**Autenticación:** Requiere token JWT (Admin o SuperAdmin)

**Parámetros de URL:**
- `id_orden` (integer): ID de la orden

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id_orden": 5,
    "nombre_orden": "Orden Enero 2024",
    "contador_verificacion": {
      "pendiente": 15,
      "verificado": 42,
      "rechazado": 3,
      "total": 60
    }
  }
}
```

**Respuesta de error (400 - ID inválido):**
```json
{
  "success": false,
  "message": "ID de orden inválido"
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
curl -X GET "http://localhost:3000/api/abonos/ordenes/5/contador-estados" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ejemplo con JavaScript (fetch):**
```javascript
const obtenerContadorEstados = async (idOrden) => {
  const response = await fetch(`http://localhost:3000/api/abonos/ordenes/${idOrden}/contador-estados`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(data);
  
  // Ejemplo de uso de los datos
  const { contador_verificacion } = data.data;
  console.log(`Pendientes: ${contador_verificacion.pendiente}`);
  console.log(`Verificados: ${contador_verificacion.verificado}`);
  console.log(`Rechazados: ${contador_verificacion.rechazado}`);
  console.log(`Total: ${contador_verificacion.total}`);
};
```

---

## Notas Importantes

1. **Autenticación**: Ambos endpoints requieren un token JWT válido con rol de Admin o SuperAdmin

2. **Paginación**: 
   - El límite por página no puede exceder 100 registros
   - Si no se especifica `page`, se usa 1 por defecto
   - Si no se especifica `limit`, se usa 10 por defecto

3. **Estados de verificación**:
   - `pendiente`: Abono subido pero aún no verificado
   - `verificado`: Comprobante de pago verificado y aprobado
   - `rechazado`: Comprobante de pago rechazado

4. **Agrupación**: En el endpoint de clientes con abonos, los abonos se agrupan por cliente, mostrando todos los abonos de cada cliente dentro de un solo objeto

5. **Ordenamiento**: Los abonos se ordenan por fecha de creación descendente (más recientes primero)

---

## Flujo de Trabajo Recomendado

### Para Dashboard de Verificación:

1. **Obtener contador de estados:**
   ```
   GET /api/abonos/ordenes/:id_orden/contador-estados
   ```
   Esto te dará las estadísticas generales para mostrar en el dashboard

2. **Obtener clientes con abonos pendientes:**
   ```
   GET /api/abonos/ordenes/:id_orden/clientes?estado=pendiente&page=1&limit=20
   ```
   Para trabajar en la verificación de los comprobantes pendientes

3. **Ver historial de verificados:**
   ```
   GET /api/abonos/ordenes/:id_orden/clientes?estado=verificado&page=1&limit=20
   ```

4. **Revisar rechazados:**
   ```
   GET /api/abonos/ordenes/:id_orden/clientes?estado=rechazado&page=1&limit=20
   ```

---

## Ejemplo Completo de Integración

```javascript
// Componente de ejemplo para mostrar clientes con abonos pendientes
class VerificacionAbonosComponent {
  constructor(idOrden) {
    this.idOrden = idOrden;
    this.token = localStorage.getItem('token');
  }

  // Cargar estadísticas iniciales
  async cargarEstadisticas() {
    const response = await fetch(
      `http://localhost:3000/api/abonos/ordenes/${this.idOrden}/contador-estados`,
      {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }
    );
    
    const { data } = await response.json();
    this.mostrarEstadisticas(data.contador_verificacion);
  }

  // Cargar clientes con abonos según estado
  async cargarClientesPorEstado(estado, page = 1) {
    const response = await fetch(
      `http://localhost:3000/api/abonos/ordenes/${this.idOrden}/clientes?estado=${estado}&page=${page}&limit=20`,
      {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }
    );
    
    const result = await response.json();
    this.mostrarClientes(result.data, result.pagination);
  }

  // Mostrar estadísticas en el dashboard
  mostrarEstadisticas(contador) {
    document.getElementById('pendientes-count').textContent = contador.pendiente;
    document.getElementById('verificados-count').textContent = contador.verificado;
    document.getElementById('rechazados-count').textContent = contador.rechazado;
    document.getElementById('total-count').textContent = contador.total;
  }

  // Mostrar clientes en la tabla
  mostrarClientes(clientes, pagination) {
    const tbody = document.getElementById('clientes-tbody');
    tbody.innerHTML = '';
    
    clientes.forEach(cliente => {
      cliente.abonos.forEach((abono, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          ${index === 0 ? `
            <td rowspan="${cliente.abonos.length}">${cliente.codigo}</td>
            <td rowspan="${cliente.abonos.length}">${cliente.nombre} ${cliente.apellido}</td>
            <td rowspan="${cliente.abonos.length}">${cliente.saldo_al_cierre}</td>
          ` : ''}
          <td>${abono.cantidad}</td>
          <td><img src="${abono.comprobante_pago}" alt="Comprobante" width="50"></td>
          <td><span class="badge badge-${this.getBadgeClass(abono.estado_verificacion)}">${abono.estado_verificacion}</span></td>
          <td>${new Date(abono.fecha_abono).toLocaleDateString()}</td>
          <td>
            ${abono.estado_verificacion === 'pendiente' ? `
              <button onclick="verificar(${abono.id_abono})">Verificar</button>
              <button onclick="rechazar(${abono.id_abono})">Rechazar</button>
            ` : ''}
          </td>
        `;
        tbody.appendChild(row);
      });
    });
    
    this.mostrarPaginacion(pagination);
  }

  getBadgeClass(estado) {
    const classes = {
      'pendiente': 'warning',
      'verificado': 'success',
      'rechazado': 'danger'
    };
    return classes[estado] || 'secondary';
  }

  mostrarPaginacion(pagination) {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = `
      Página ${pagination.page} de ${pagination.totalPages} 
      (Total: ${pagination.total} registros)
    `;
  }

  // Inicializar
  async init() {
    await this.cargarEstadisticas();
    await this.cargarClientesPorEstado('pendiente', 1);
  }
}

// Uso
const componente = new VerificacionAbonosComponent(5);
componente.init();
```

---

## Casos de Uso

### Caso 1: Mostrar solo clientes con abonos pendientes de verificar
```javascript
const response = await fetch(
  'http://localhost:3000/api/abonos/ordenes/5/clientes?estado=pendiente',
  { headers: { 'Authorization': `Bearer ${token}` }}
);
```

### Caso 2: Dashboard con estadísticas
```javascript
// Primero obtener el contador
const statsResponse = await fetch(
  'http://localhost:3000/api/abonos/ordenes/5/contador-estados',
  { headers: { 'Authorization': `Bearer ${token}` }}
);
const stats = await statsResponse.json();

// Mostrar badges con las cantidades
console.log(`🟡 Pendientes: ${stats.data.contador_verificacion.pendiente}`);
console.log(`🟢 Verificados: ${stats.data.contador_verificacion.verificado}`);
console.log(`🔴 Rechazados: ${stats.data.contador_verificacion.rechazado}`);
```

### Caso 3: Paginación para grandes volúmenes de datos
```javascript
// Cargar página 2 con 50 registros por página
const response = await fetch(
  'http://localhost:3000/api/abonos/ordenes/5/clientes?estado=verificado&page=2&limit=50',
  { headers: { 'Authorization': `Bearer ${token}` }}
);
```
