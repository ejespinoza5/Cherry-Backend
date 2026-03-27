ALTER TABLE ordenes
ADD COLUMN aviso_cierre_3d_enviado_at DATETIME NULL COMMENT 'Marca de envio del aviso automatico de cierre en 3 dias' AFTER fecha_cierre;
