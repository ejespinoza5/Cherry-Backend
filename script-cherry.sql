-- =====================================
-- TABLA ROLES
-- =====================================
CREATE TABLE rol (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================
-- TABLA USUARIOS
-- =====================================
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contraseña VARCHAR(255) NOT NULL,
  id_rol INT NOT NULL,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_rol
    FOREIGN KEY (id_rol) REFERENCES rol(id)
);

-- =====================================
-- TABLA CLIENTES
-- =====================================
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  codigo VARCHAR(50) UNIQUE,
  direccion VARCHAR(255),
  saldo DECIMAL(10,2) DEFAULT 0.00,
  estado_actividad ENUM('activo','deudor','bloqueado','inactivo') DEFAULT 'activo',
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT,
  CONSTRAINT fk_cliente_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
  CONSTRAINT fk_cliente_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
  CONSTRAINT fk_cliente_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios(id)
);

-- =====================================
-- TABLA ORDENES (LIVES)
-- =====================================
CREATE TABLE ordenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_orden VARCHAR(150) NOT NULL,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME,
  fecha_cierre DATETIME,
  impuesto DECIMAL(5,2) DEFAULT 0.08,
  estado_orden ENUM('abierta','cerrada','en_periodo_gracia') DEFAULT 'abierta',
  tipo_cierre ENUM('manual','automatico') DEFAULT NULL,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT,
  closed_by INT,
  CONSTRAINT fk_orden_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
  CONSTRAINT fk_orden_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios(id),
  CONSTRAINT fk_orden_closed_by
    FOREIGN KEY (closed_by) REFERENCES usuarios(id)
);

-- =====================================
-- TABLA PRODUCTOS (COMPRAS)
-- =====================================
CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  id_orden INT NOT NULL,
  cantidad_articulos INT NOT NULL,
  detalles TEXT NOT NULL,
  valor_etiqueta DECIMAL(10,2) NOT NULL,
  comision DECIMAL(10,2) DEFAULT 3.00,
  imagen_producto VARCHAR(255),
  observacion TEXT,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT,
  CONSTRAINT fk_producto_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
  CONSTRAINT fk_producto_orden
    FOREIGN KEY (id_orden) REFERENCES ordenes(id),
  CONSTRAINT fk_producto_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
  CONSTRAINT fk_producto_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios(id)
);

-- =====================================
-- TABLA HISTORIAL DE ABONOS
-- =====================================
CREATE TABLE historial_abono (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT,
  CONSTRAINT fk_abono_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
  CONSTRAINT fk_abono_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
  CONSTRAINT fk_abono_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios(id)
);

-- =====================================
-- TABLA CIERRE DE ORDEN (SNAPSHOT)
-- =====================================
CREATE TABLE cierre_orden (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_orden INT NOT NULL UNIQUE,
  subtotal DECIMAL(10,2) NOT NULL,
  impuestos DECIMAL(10,2) NOT NULL,
  comisiones DECIMAL(10,2) NOT NULL,
  total_final DECIMAL(10,2) NOT NULL,
  fecha_cierre DATETIME NOT NULL,
  fecha_limite_pago DATETIME NOT NULL COMMENT 'Fecha límite para pago (cierre + 48h)',
  tipo_cierre ENUM('manual','automatico') NOT NULL,
  total_clientes INT DEFAULT 0,
  clientes_pagados INT DEFAULT 0,
  clientes_pendientes INT DEFAULT 0,
  clientes_rematados INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  CONSTRAINT fk_cierre_orden
    FOREIGN KEY (id_orden) REFERENCES ordenes(id),
  CONSTRAINT fk_cierre_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

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
-- INDICES RECOMENDADOS
-- =====================================
CREATE INDEX idx_productos_cliente_orden
ON productos (id_cliente, id_orden);

CREATE INDEX idx_historial_abono_cliente
ON historial_abono (id_cliente);

CREATE INDEX idx_cliente_orden_estado
ON cliente_orden (id_orden, estado_pago);

CREATE INDEX idx_cliente_orden_cliente
ON cliente_orden (id_cliente);

CREATE INDEX idx_ordenes_estado
ON ordenes (estado_orden, fecha_fin);

CREATE INDEX idx_productos_rematados_cliente
ON productos_rematados (id_cliente);

CREATE INDEX idx_historial_incump_cliente
ON historial_incumplimientos (id_cliente, afecta_credito);

