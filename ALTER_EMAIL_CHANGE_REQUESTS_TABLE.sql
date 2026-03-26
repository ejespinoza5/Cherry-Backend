-- =====================================
-- VERIFICACION DE CAMBIO DE CORREO
-- =====================================
CREATE TABLE IF NOT EXISTS email_change_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nuevo_correo VARCHAR(100) NOT NULL,
  codigo_hash VARCHAR(255) NOT NULL,
  expira_en DATETIME NOT NULL,
  intentos INT DEFAULT 0,
  max_intentos INT DEFAULT 3,
  estado ENUM('pendiente','verificado','usado','expirado','bloqueado','cancelado') DEFAULT 'pendiente',
  verificado_at DATETIME DEFAULT NULL,
  usado_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_change_request_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
  INDEX idx_email_change_user_status (id_usuario, estado),
  INDEX idx_email_change_new_email_status (nuevo_correo, estado),
  INDEX idx_email_change_expira (expira_en)
);
