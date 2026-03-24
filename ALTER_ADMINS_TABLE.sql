-- Migracion para bases de datos existentes
-- Crea tabla admins para guardar nombre y apellido de administradores
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT,
  CONSTRAINT fk_admin_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
  CONSTRAINT fk_admin_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
  CONSTRAINT fk_admin_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios(id)
);

CREATE INDEX idx_admins_usuario
ON admins (id_usuario);

-- Crear perfil para admins/superadmins existentes sin registro en admins
INSERT INTO admins (id_usuario, nombre, apellido, estado, created_by)
SELECT u.id, 'Admin', '', 'activo', u.id
FROM usuarios u
LEFT JOIN admins a ON a.id_usuario = u.id
WHERE u.id_rol IN (1, 3)
  AND u.estado = 'activo'
  AND a.id IS NULL;
