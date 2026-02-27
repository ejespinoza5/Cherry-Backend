-- =====================================================
-- MIGRACIÓN: De productos_rematados a clientes_rematados
-- =====================================================
-- Fecha: 2026-02-27
-- Descripción: El sistema ya no ingresa productos individuales, 
--              solo valores totales por cliente. Por tanto, el remate
--              es por CLIENTE completo, no por productos individuales.
-- =====================================================

-- Paso 1: Crear nueva tabla clientes_rematados
CREATE TABLE IF NOT EXISTS clientes_rematados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  id_orden INT NOT NULL,
  valor_adeudado DECIMAL(10,2) NOT NULL COMMENT 'Valor total que debía el cliente',
  abonos_perdidos DECIMAL(10,2) NOT NULL COMMENT 'Monto de abonos que perdió el cliente',
  motivo ENUM('incumplimiento_pago','otros') DEFAULT 'incumplimiento_pago',
  fecha_remate DATETIME NOT NULL,
  observaciones TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  CONSTRAINT fk_remate_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
  CONSTRAINT fk_remate_orden
    FOREIGN KEY (id_orden) REFERENCES ordenes(id),
  CONSTRAINT fk_remate_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
  UNIQUE KEY unique_cliente_orden_remate (id_cliente, id_orden)
);

-- Paso 2: Crear índices
CREATE INDEX IF NOT EXISTS idx_clientes_rematados_cliente
ON clientes_rematados (id_cliente);

CREATE INDEX IF NOT EXISTS idx_clientes_rematados_orden
ON clientes_rematados (id_orden);

-- Paso 3: Migrar datos de productos_rematados a clientes_rematados
-- Agrupa por cliente y orden, sumando todos los valores de productos
INSERT INTO clientes_rematados (id_cliente, id_orden, valor_adeudado, abonos_perdidos, motivo, fecha_remate, observaciones, created_by)
SELECT 
    pr.id_cliente,
    pr.id_orden,
    SUM(pr.valor_producto) as valor_adeudado,
    SUM(pr.abonos_perdidos) as abonos_perdidos,
    pr.motivo,
    MIN(pr.fecha_remate) as fecha_remate,
    CONCAT('Migrado automáticamente. Total productos rematados: ', COUNT(*)) as observaciones,
    pr.created_by
FROM productos_rematados pr
GROUP BY pr.id_cliente, pr.id_orden, pr.motivo, pr.created_by
ON DUPLICATE KEY UPDATE 
    valor_adeudado = VALUES(valor_adeudado),
    abonos_perdidos = VALUES(abonos_perdidos);

-- Paso 4: (OPCIONAL) Eliminar tabla productos_rematados
-- ⚠️ ADVERTENCIA: Esto eliminará permanentemente la tabla productos_rematados
-- Solo ejecuta esto si estás seguro y ya migraste los datos correctamente
-- DROP TABLE IF EXISTS productos_rematados;

-- Alternativa: Renombrar la tabla vieja por si necesitas consultarla después
-- RENAME TABLE productos_rematados TO productos_rematados_old;

-- Paso 5: Eliminar índice viejo (si productos_rematados fue eliminada)
-- DROP INDEX IF EXISTS idx_productos_rematados_cliente;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Consulta para verificar que los datos se migraron correctamente:
-- 
-- SELECT 
--     cr.*,
--     c.nombre,
--     c.apellido,
--     c.codigo,
--     o.nombre_orden
-- FROM clientes_rematados cr
-- INNER JOIN clientes c ON cr.id_cliente = c.id
-- INNER JOIN ordenes o ON cr.id_orden = o.id
-- ORDER BY cr.created_at DESC
-- LIMIT 20;
--
-- Comparar conteos:
-- SELECT COUNT(*) as total_productos_rematados FROM productos_rematados;
-- SELECT COUNT(*) as total_clientes_rematados FROM clientes_rematados;
