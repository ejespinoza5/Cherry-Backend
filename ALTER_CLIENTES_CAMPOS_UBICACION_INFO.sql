-- Migracion para bases de datos existentes
-- Agrega campos adicionales para perfil de cliente en API /api/usuarios

ALTER TABLE clientes
ADD COLUMN ciudad VARCHAR(100) NULL AFTER direccion,
ADD COLUMN provincia VARCHAR(100) NULL AFTER ciudad,
ADD COLUMN informacion_adicional VARCHAR(255) NULL COMMENT 'Informacion adicional del cliente' AFTER pais;
