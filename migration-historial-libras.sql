-- =====================================
-- MIGRACIÓN: Agregar tabla historial_actualizacion_libras
-- Fecha: 2026-02-20
-- Descripción: Tabla para registrar el historial de actualizaciones
--              manuales de libras por cliente y orden
-- =====================================

USE cherry;

-- Crear tabla de historial de actualizaciones de libras
CREATE TABLE IF NOT EXISTS historial_actualizacion_libras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  id_orden INT NOT NULL,
  libras_anterior DECIMAL(10,2) NOT NULL COMMENT 'Valor anterior de libras',
  libras_nueva DECIMAL(10,2) NOT NULL COMMENT 'Nuevo valor de libras',
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_por INT NOT NULL COMMENT 'ID del usuario que hizo la actualización',
  observaciones TEXT COMMENT 'Notas opcionales sobre el cambio',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_libras_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
  CONSTRAINT fk_hist_libras_orden
    FOREIGN KEY (id_orden) REFERENCES ordenes(id),
  CONSTRAINT fk_hist_libras_usuario
    FOREIGN KEY (actualizado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear índices para optimizar consultas
CREATE INDEX idx_historial_libras_cliente_orden
ON historial_actualizacion_libras (id_cliente, id_orden);

CREATE INDEX idx_historial_libras_fecha
ON historial_actualizacion_libras (fecha_actualizacion);

-- Mensaje de confirmación
SELECT 'Migración completada: Tabla historial_actualizacion_libras creada exitosamente' AS resultado;
