-- =====================================
-- CAMBIO OBLIGATORIO DE CONTRASENA EN PRIMER LOGIN
-- =====================================
ALTER TABLE usuarios
ADD COLUMN requiere_cambio_password TINYINT(1) NOT NULL DEFAULT 0
COMMENT '1 = usuario debe cambiar su contrasena en el primer inicio de sesion';
