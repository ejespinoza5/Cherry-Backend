-- Migracion para bases de datos existentes
-- Crea tabla para historial de cambios manuales de compra
CREATE TABLE IF NOT EXISTS historial_actualizacion_compra_manual (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  id_orden INT NOT NULL,
  valor_total_anterior DECIMAL(10,2) NOT NULL,
  valor_total_nuevo DECIMAL(10,2) NOT NULL,
  libras_anterior DECIMAL(10,2) NOT NULL,
  libras_nueva DECIMAL(10,2) NOT NULL,
  link_excel_anterior TEXT,
  link_excel_nuevo TEXT,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_por INT NOT NULL COMMENT 'ID del usuario que hizo la actualizacion',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_compra_manual_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
  CONSTRAINT fk_hist_compra_manual_orden
    FOREIGN KEY (id_orden) REFERENCES ordenes(id),
  CONSTRAINT fk_hist_compra_manual_usuario
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id)
);

-- Compatibilidad: si la tabla existe con estructura anterior, ajustar columnas
ALTER TABLE historial_actualizacion_compra_manual
  ADD COLUMN IF NOT EXISTS libras_anterior DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER valor_total_nuevo,
  ADD COLUMN IF NOT EXISTS libras_nueva DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER libras_anterior;

ALTER TABLE historial_actualizacion_compra_manual
  DROP COLUMN IF EXISTS observaciones_anterior,
  DROP COLUMN IF EXISTS observaciones_nueva;

CREATE INDEX idx_hist_compra_manual_cliente_orden
ON historial_actualizacion_compra_manual (id_cliente, id_orden, fecha_actualizacion);

CREATE INDEX idx_hist_compra_manual_fecha
ON historial_actualizacion_compra_manual (fecha_actualizacion);
