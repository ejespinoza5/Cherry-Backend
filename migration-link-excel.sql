-- =====================================================
-- MIGRACIÓN: Mover link_excel de cliente_orden a clientes
-- =====================================================
-- Fecha: 2026-02-19
-- Descripción: El link_excel ahora es del cliente (compartido en todas las órdenes)
--              en lugar de ser por orden individual
-- =====================================================

-- Paso 1: Agregar columna link_excel a la tabla clientes
ALTER TABLE clientes 
ADD COLUMN link_excel TEXT COMMENT 'Link de Excel del cliente (compartido en todas las órdenes)' 
AFTER direccion;

-- Paso 2: Migrar datos existentes
-- Si un cliente tiene múltiples órdenes con diferentes links, 
-- se tomará el link de la orden más reciente (última actualización)
UPDATE clientes c
SET link_excel = (
    SELECT co.link_excel
    FROM cliente_orden co
    WHERE co.id_cliente = c.id
        AND co.link_excel IS NOT NULL
        AND co.link_excel != ''
    ORDER BY co.updated_at DESC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM cliente_orden co 
    WHERE co.id_cliente = c.id 
        AND co.link_excel IS NOT NULL
        AND co.link_excel != ''
);

-- Paso 3: Eliminar columna link_excel de cliente_orden
-- NOTA: Este paso elimina la columna. Si quieres mantener un backup, 
--       puedes comentar esta línea y renombrar la columna a link_excel_old
ALTER TABLE cliente_orden 
DROP COLUMN link_excel;

-- Alternativa (si quieres mantener backup antes de eliminar):
-- ALTER TABLE cliente_orden 
-- CHANGE COLUMN link_excel link_excel_old TEXT COMMENT 'Obsoleto - movido a tabla clientes';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Consulta para verificar que los datos se migraron correctamente:
-- SELECT 
--     c.id as id_cliente,
--     c.nombre,
--     c.apellido,
--     c.link_excel as link_en_clientes,
--     COUNT(co.id) as total_ordenes
-- FROM clientes c
-- LEFT JOIN cliente_orden co ON c.id = co.id_cliente
-- WHERE c.link_excel IS NOT NULL
-- GROUP BY c.id;
