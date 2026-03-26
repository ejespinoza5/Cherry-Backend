-- =====================================
-- TABLA RECUPERACION DE CONTRASENA (OTP)
-- =====================================
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  codigo_hash VARCHAR(255) NOT NULL,
  expira_en DATETIME NOT NULL,
  intentos INT DEFAULT 0,
  max_intentos INT DEFAULT 3,
  estado ENUM('pendiente','verificado','usado','expirado','bloqueado') DEFAULT 'pendiente',
  verificado_at DATETIME DEFAULT NULL,
  usado_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
  INDEX idx_password_resets_usuario_estado (id_usuario, estado),
  INDEX idx_password_resets_expira (expira_en)
);
