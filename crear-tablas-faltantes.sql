-- =====================================
-- CREAR TABLAS FALTANTES DEL SISTEMA DE CIERRE
-- =====================================

USE cherry;

-- =====================================
-- TABLA ESTADO CLIENTE POR ORDEN
-- =====================================
CREATE TABLE cliente_orden (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  id_orden INT NOT NULL,
  total_compras DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total de productos comprados',
  total_abonos DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total abonos realizados',
  saldo_al_cierre DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Saldo cuando se cerró la orden',
  estado_pago ENUM('activo','pagado','pendiente','en_gracia','rematado','perdido') DEFAULT 'activo',
  fecha_cierre DATETIME COMMENT 'Fecha en que se cerró esta orden',
  fecha_limite_pago DATETIME COMMENT 'Fecha límite para pagar después del cierre',
  abonos_post_cierre DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Abonos realizados después del cierre',
  fecha_pago_completo DATETIME COMMENT 'Fecha en que completó el pago',
  fecha_remate DATETIME COMMENT 'Fecha en que se remataron sus productos',
  observaciones TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cliente_orden_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
  CONSTRAINT fk_cliente_orden_orden
    FOREIGN KEY (id_orden) REFERENCES ordenes(id),
  UNIQUE KEY unique_cliente_orden (id_cliente, id_orden)
);

-- =====================================
-- TABLA PRODUCTOS REMATADOS
-- =====================================
CREATE TABLE productos_rematados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT NOT NULL,
  id_cliente INT NOT NULL,
  id_orden INT NOT NULL,
  valor_producto DECIMAL(10,2) NOT NULL,
  abonos_perdidos DECIMAL(10,2) NOT NULL COMMENT 'Monto de abonos que perdió el cliente',
  motivo ENUM('incumplimiento_pago','otros') DEFAULT 'incumplimiento_pago',
  fecha_remate DATETIME NOT NULL,
  observaciones TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  CONSTRAINT fk_remate_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id),
  CONSTRAINT fk_remate_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
  CONSTRAINT fk_remate_orden
    FOREIGN KEY (id_orden) REFERENCES ordenes(id),
  CONSTRAINT fk_remate_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- =====================================
-- TABLA HISTORIAL DE INCUMPLIMIENTOS
-- =====================================
CREATE TABLE historial_incumplimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  id_orden INT NOT NULL,
  tipo_incumplimiento ENUM('pago_tardio','no_pago','remate') NOT NULL,
  monto_adeudado DECIMAL(10,2) NOT NULL,
  monto_perdido DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Abonos perdidos en remates',
  fecha_incumplimiento DATETIME NOT NULL,
  afecta_credito BOOLEAN DEFAULT TRUE,
  observaciones TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_incump_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
  CONSTRAINT fk_incump_orden
    FOREIGN KEY (id_orden) REFERENCES ordenes(id)
);

-- =====================================
-- CREAR INDICES
-- =====================================
CREATE INDEX idx_cliente_orden_estado
ON cliente_orden (id_orden, estado_pago);

CREATE INDEX idx_cliente_orden_cliente
ON cliente_orden (id_cliente);

CREATE INDEX idx_productos_rematados_cliente
ON productos_rematados (id_cliente);

CREATE INDEX idx_historial_incump_cliente
ON historial_incumplimientos (id_cliente, afecta_credito);

-- =====================================
-- VERIFICACIÓN
-- =====================================
SELECT 'Tablas creadas exitosamente' as Resultado;
SHOW TABLES;
