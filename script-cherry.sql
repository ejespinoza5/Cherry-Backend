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
  estado_actividad ENUM('activo','inactivo') DEFAULT 'activo',
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
  impuesto DECIMAL(5,2) DEFAULT 0.08,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT,
  CONSTRAINT fk_orden_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
  CONSTRAINT fk_orden_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios(id)
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  CONSTRAINT fk_cierre_orden
    FOREIGN KEY (id_orden) REFERENCES ordenes(id),
  CONSTRAINT fk_cierre_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- =====================================
-- INDICES RECOMENDADOS
-- =====================================
CREATE INDEX idx_productos_cliente_orden
ON productos (id_cliente, id_orden);

CREATE INDEX idx_historial_abono_cliente
ON historial_abono (id_cliente);

