# Ejemplos de Prueba - Sistema de Abonos

## 🧪 Escenarios de Prueba

### Prerrequisitos
- Tener un cliente creado (ejemplo: id_cliente = 1)
- Token de autenticación de Admin o SuperAdmin

---

## Escenario 1: Registro de Primer Abono

### Estado Inicial
```sql
-- Verificar saldo inicial del cliente
SELECT id, nombre, apellido, codigo, saldo FROM clientes WHERE id = 1;
-- Resultado esperado: saldo = 0.00
```

### Acción: Registrar abono de $500
```bash
curl -X POST http://localhost:3000/api/abonos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "id_cliente": 1,
    "cantidad": 500.00
  }'
```

### Respuesta Esperada
```json
{
  "success": true,
  "message": "Abono registrado exitosamente",
  "data": {
    "id": 1,
    "id_cliente": 1,
    "cantidad": 500.00,
    "estado": "activo",
    "cliente": {
      "nombre": "Juan",
      "apellido": "Pérez",
      "codigo": "CLIENTE001",
      "saldo_actual": 500.00
    }
  }
}
```

### Verificación
```sql
-- Verificar que el saldo se actualizó
SELECT id, nombre, saldo FROM clientes WHERE id = 1;
-- Resultado esperado: saldo = 500.00

-- Verificar registro en historial
SELECT * FROM historial_abono WHERE id_cliente = 1;
-- Debe haber 1 registro con cantidad = 500.00
```

---

## Escenario 2: Registrar Múltiples Abonos

### Abono #1: $300
```bash
curl -X POST http://localhost:3000/api/abonos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"id_cliente": 1, "cantidad": 300.00}'
```

### Abono #2: $200
```bash
curl -X POST http://localhost:3000/api/abonos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"id_cliente": 1, "cantidad": 200.00}'
```

### Abono #3: $150
```bash
curl -X POST http://localhost:3000/api/abonos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"id_cliente": 1, "cantidad": 150.00}'
```

### Verificación
```sql
-- Saldo debe ser la suma de todos los abonos
SELECT 
    c.nombre,
    c.saldo,
    COUNT(ha.id) as total_abonos,
    SUM(ha.cantidad) as suma_verificacion
FROM clientes c
LEFT JOIN historial_abono ha ON c.id = ha.id_cliente AND ha.estado = 'activo'
WHERE c.id = 1
GROUP BY c.id;

-- Resultado esperado:
-- saldo: 1150.00 (500 + 300 + 200 + 150)
-- total_abonos: 4
-- suma_verificacion: 1150.00
```

---

## Escenario 3: Actualizar Abono (Incrementar)

### Estado Actual
```bash
# Ver abono actual
curl -X GET http://localhost:3000/api/abonos/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Respuesta:
# {
#   "id": 1,
#   "cantidad": 500.00,
#   "cliente": { "saldo_actual": 1150.00 }
# }
```

### Acción: Actualizar de $500 a $700
```bash
curl -X PUT http://localhost:3000/api/abonos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "cantidad": 700.00
  }'
```

### Cálculo Esperado
- Cantidad anterior: $500.00
- Nueva cantidad: $700.00
- Diferencia: +$200.00
- Saldo anterior: $1150.00
- **Nuevo saldo: $1350.00** ($1150 + $200)

### Verificación
```sql
SELECT saldo FROM clientes WHERE id = 1;
-- Resultado esperado: 1350.00
```

---

## Escenario 4: Actualizar Abono (Disminuir)

### Acción: Actualizar de $700 a $400
```bash
curl -X PUT http://localhost:3000/api/abonos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "cantidad": 400.00
  }'
```

### Cálculo Esperado
- Cantidad anterior: $700.00
- Nueva cantidad: $400.00
- Diferencia: -$300.00
- Saldo anterior: $1350.00
- **Nuevo saldo: $1050.00** ($1350 - $300)

---

## Escenario 5: Consultar Historial de Cliente

### Acción
```bash
curl -X GET http://localhost:3000/api/abonos/cliente/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Respuesta Esperada
```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "cantidad": 150.00,
      "created_at": "2026-01-30T16:30:00.000Z",
      "creado_por": "admin@cherry.com"
    },
    {
      "id": 3,
      "cantidad": 200.00,
      "created_at": "2026-01-30T16:25:00.000Z",
      "creado_por": "admin@cherry.com"
    },
    {
      "id": 2,
      "cantidad": 300.00,
      "created_at": "2026-01-30T16:20:00.000Z",
      "creado_por": "admin@cherry.com"
    },
    {
      "id": 1,
      "cantidad": 400.00,
      "created_at": "2026-01-30T16:15:00.000Z",
      "creado_por": "admin@cherry.com"
    }
  ]
}
```

---

## Escenario 6: Eliminar Abono

### Estado Actual
- Abono #1: $400.00
- Saldo cliente: $1050.00

### Acción: Eliminar abono
```bash
curl -X DELETE http://localhost:3000/api/abonos/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Respuesta Esperada
```json
{
  "success": true,
  "message": "Abono eliminado exitosamente (saldo ajustado)"
}
```

### Cálculo Esperado
- Saldo anterior: $1050.00
- Cantidad a restar: $400.00
- **Nuevo saldo: $650.00** ($1050 - $400)

### Verificación
```sql
-- Verificar saldo ajustado
SELECT saldo FROM clientes WHERE id = 1;
-- Resultado esperado: 650.00

-- Verificar que el abono cambió a inactivo
SELECT id, cantidad, estado FROM historial_abono WHERE id = 1;
-- estado debe ser 'inactivo'

-- Verificar abonos activos
SELECT COUNT(*) FROM historial_abono WHERE id_cliente = 1 AND estado = 'activo';
-- Debe ser 3 (porque eliminamos 1 de 4)
```

---

## Escenario 7: Validaciones y Errores

### Error: Cliente no existe
```bash
curl -X POST http://localhost:3000/api/abonos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"id_cliente": 9999, "cantidad": 100.00}'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Cliente no encontrado"
}
```

### Error: Cantidad negativa
```bash
curl -X POST http://localhost:3000/api/abonos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"id_cliente": 1, "cantidad": -100.00}'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "La cantidad debe ser un número positivo"
}
```

### Error: Sin token de autenticación
```bash
curl -X POST http://localhost:3000/api/abonos \
  -H "Content-Type: application/json" \
  -d '{"id_cliente": 1, "cantidad": 100.00}'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Token no proporcionado"
}
```

### Error: Usuario sin permisos (Cliente intentando crear abono)
```bash
# Con token de un usuario Cliente
curl -X POST http://localhost:3000/api/abonos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_DE_CLIENTE" \
  -d '{"id_cliente": 1, "cantidad": 100.00}'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Acceso denegado. Se requieren permisos de administrador"
}
```

---

## 🔍 Queries SQL para Auditoría

### Ver todos los abonos con información completa
```sql
SELECT 
    ha.id,
    ha.cantidad,
    ha.estado,
    ha.created_at,
    c.nombre as cliente,
    c.codigo,
    c.saldo as saldo_actual_cliente,
    u_created.correo as registrado_por,
    u_updated.correo as actualizado_por
FROM historial_abono ha
INNER JOIN clientes c ON ha.id_cliente = c.id
LEFT JOIN usuarios u_created ON ha.created_by = u_created.id
LEFT JOIN usuarios u_updated ON ha.updated_by = u_updated.id
ORDER BY ha.created_at DESC;
```

### Verificar integridad de saldos
```sql
-- El saldo debe coincidir con la suma de abonos activos
SELECT 
    c.id,
    c.nombre,
    c.saldo as saldo_registrado,
    COALESCE(SUM(ha.cantidad), 0) as suma_abonos_activos,
    c.saldo - COALESCE(SUM(ha.cantidad), 0) as diferencia
FROM clientes c
LEFT JOIN historial_abono ha ON c.id = ha.id_cliente AND ha.estado = 'activo'
GROUP BY c.id
HAVING diferencia != 0; -- Debe retornar 0 filas si todo está correcto
```

### Clientes con más abonos
```sql
SELECT 
    c.id,
    c.nombre,
    c.codigo,
    c.saldo,
    COUNT(ha.id) as total_abonos,
    SUM(ha.cantidad) as total_abonado
FROM clientes c
LEFT JOIN historial_abono ha ON c.id = ha.id_cliente AND ha.estado = 'activo'
GROUP BY c.id
ORDER BY total_abonos DESC
LIMIT 10;
```

---

## 📊 Resultados de Ejemplo Completo

Después de ejecutar todos los escenarios, el estado final sería:

| Cliente | Abonos Activos | Suma Abonos | Saldo | Estado |
|---------|----------------|-------------|-------|--------|
| Juan Pérez | 3 | $650.00 | $650.00 | ✅ Correcto |

**Historial:**
- Abono #1: $400.00 ❌ INACTIVO (eliminado)
- Abono #2: $300.00 ✅ ACTIVO
- Abono #3: $200.00 ✅ ACTIVO
- Abono #4: $150.00 ✅ ACTIVO

**Suma abonos activos:** $300 + $200 + $150 = **$650.00** ✅

---

## 🎯 Checklist de Pruebas

- [ ] Crear abono incrementa el saldo correctamente
- [ ] Crear múltiples abonos acumula el saldo
- [ ] Actualizar abono recalcula el saldo (incremento)
- [ ] Actualizar abono recalcula el saldo (decremento)
- [ ] Eliminar abono resta del saldo y cambia estado a inactivo
- [ ] Validación: Cliente no existe devuelve error 404
- [ ] Validación: Cantidad negativa devuelve error 400
- [ ] Validación: Sin token devuelve error 401
- [ ] Validación: Usuario sin permisos devuelve error 403
- [ ] Consultar historial muestra todos los abonos del cliente
- [ ] La suma de abonos activos coincide con el saldo del cliente
