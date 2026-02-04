-- =====================================================
-- Script para actualizar estados de actividad de clientes
-- Agrega nuevos estados: activo, deudor, bloqueado, inactivo
-- =====================================================

-- Paso 1: Modificar el ENUM de estado_actividad
ALTER TABLE clientes 
MODIFY COLUMN estado_actividad ENUM('activo','deudor','bloqueado','inactivo') DEFAULT 'activo';

-- Paso 2: Actualizar estados automáticamente basado en el saldo actual
-- Saldo >= 0: ACTIVO
UPDATE clientes 
SET estado_actividad = 'activo' 
WHERE saldo >= 0 AND estado_actividad != 'inactivo';

-- Saldo negativo pero > -300: DEUDOR
UPDATE clientes 
SET estado_actividad = 'deudor' 
WHERE saldo < 0 AND saldo > -300 AND estado_actividad != 'inactivo';

-- Saldo <= -300: BLOQUEADO
UPDATE clientes 
SET estado_actividad = 'bloqueado' 
WHERE saldo <= -300 AND estado_actividad != 'inactivo';

-- Paso 3: Verificar los cambios
SELECT 
    estado_actividad,
    COUNT(*) as cantidad,
    MIN(saldo) as saldo_minimo,
    MAX(saldo) as saldo_maximo,
    AVG(saldo) as saldo_promedio
FROM clientes
GROUP BY estado_actividad;
