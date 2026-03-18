-- Migracion para bases de datos existentes
-- 1) Agrega el campo fecha_abono
ALTER TABLE historial_abono
ADD COLUMN fecha_abono DATE NULL AFTER cantidad;

-- 2) Rellena registros existentes con la fecha de creacion
UPDATE historial_abono
SET fecha_abono = DATE(created_at)
WHERE fecha_abono IS NULL;

-- 3) Deja el campo obligatorio
ALTER TABLE historial_abono
MODIFY COLUMN fecha_abono DATE NOT NULL COMMENT 'Fecha en la que se realizo el abono';

-- 4) Indice recomendado para filtros por fecha
CREATE INDEX idx_historial_abono_fecha_abono
ON historial_abono (fecha_abono);
