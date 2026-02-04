const { pool } = require('../config/database');

class Producto {
    /**
     * Crear nuevo producto
     */
    static async create(data) {
        try {
            const { 
                id_cliente, 
                id_orden, 
                cantidad_articulos, 
                detalles, 
                valor_etiqueta, 
                comision,
                imagen_producto, 
                observacion, 
                estado, 
                created_by 
            } = data;
            
            const [result] = await pool.query(
                `INSERT INTO productos (id_cliente, id_orden, cantidad_articulos, detalles, valor_etiqueta, comision, imagen_producto, observacion, estado, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id_cliente, 
                    id_orden, 
                    cantidad_articulos, 
                    detalles, 
                    valor_etiqueta, 
                    comision || 3.00,
                    imagen_producto || null, 
                    observacion || null, 
                    estado || 'activo', 
                    created_by
                ]
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar producto por ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.query(
                `SELECT p.*, 
                        c.nombre as cliente_nombre, 
                        c.apellido as cliente_apellido,
                        c.codigo as cliente_codigo,
                        o.nombre_orden,
                        u1.correo as creado_por_correo, 
                        u2.correo as actualizado_por_correo
                 FROM productos p
                 INNER JOIN clientes c ON p.id_cliente = c.id
                 INNER JOIN ordenes o ON p.id_orden = o.id
                 LEFT JOIN usuarios u1 ON p.created_by = u1.id
                 LEFT JOIN usuarios u2 ON p.updated_by = u2.id
                 WHERE p.id = ? AND p.estado = 'activo'`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener todos los productos con filtros
     */
    static async findAll(filters = {}) {
        try {
            let query = `
                SELECT p.*, 
                       c.nombre as cliente_nombre, 
                       c.apellido as cliente_apellido,
                       c.codigo as cliente_codigo,
                       o.nombre_orden,
                       u1.correo as creado_por_correo, 
                       u2.correo as actualizado_por_correo
                FROM productos p
                INNER JOIN clientes c ON p.id_cliente = c.id
                INNER JOIN ordenes o ON p.id_orden = o.id
                LEFT JOIN usuarios u1 ON p.created_by = u1.id
                LEFT JOIN usuarios u2 ON p.updated_by = u2.id
                WHERE p.estado = 'activo'
            `;
            const params = [];

            if (filters.id_orden) {
                query += ' AND p.id_orden = ?';
                params.push(filters.id_orden);
            }

            if (filters.id_cliente) {
                query += ' AND p.id_cliente = ?';
                params.push(filters.id_cliente);
            }

            query += ' ORDER BY p.created_at DESC';

            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar producto
     */
    static async update(id, data, updated_by) {
        try {
            const { 
                id_cliente, 
                id_orden, 
                cantidad_articulos, 
                detalles, 
                valor_etiqueta, 
                comision,
                imagen_producto, 
                observacion, 
                estado 
            } = data;
            
            const [result] = await pool.query(
                `UPDATE productos 
                 SET id_cliente = ?, id_orden = ?, cantidad_articulos = ?, detalles = ?, 
                     valor_etiqueta = ?, comision = ?, imagen_producto = ?, observacion = ?, 
                     estado = ?, updated_by = ? 
                 WHERE id = ?`,
                [
                    id_cliente, 
                    id_orden, 
                    cantidad_articulos, 
                    detalles, 
                    valor_etiqueta, 
                    comision,
                    imagen_producto, 
                    observacion, 
                    estado, 
                    updated_by, 
                    id
                ]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Eliminar producto (soft delete)
     */
    static async delete(id, deleted_by) {
        try {
            const [result] = await pool.query(
                'UPDATE productos SET estado = ?, updated_by = ? WHERE id = ?',
                ['inactivo', deleted_by, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener resumen de productos por cliente en una orden
     */
    static async getResumenPorCliente(id_orden, id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    COUNT(p.id) as total_productos,
                    SUM(p.cantidad_articulos) as total_articulos,
                    SUM(p.valor_etiqueta * p.cantidad_articulos) as subtotal,
                    SUM(p.comision) as total_comisiones
                 FROM productos p
                 WHERE p.id_orden = ? AND p.id_cliente = ? AND p.estado = 'activo'`,
                [id_orden, id_cliente]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar si la orden existe y está activa
     */
    static async ordenExists(id_orden) {
        try {
            const [rows] = await pool.query(
                'SELECT id FROM ordenes WHERE id = ? AND estado = ?',
                [id_orden, 'activo']
            );
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar si el cliente existe y está activo
     */
    static async clienteExists(id_cliente) {
        try {
            const [rows] = await pool.query(
                'SELECT id FROM clientes WHERE id = ? AND estado = ?',
                [id_cliente, 'activo']
            );
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener productos agrupados por cliente en una orden
     */
    static async getProductosAgrupadosPorCliente(id_orden) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    c.id as cliente_id,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    c.direccion as cliente_direccion,
                    c.saldo as cliente_saldo,
                    c.estado_actividad as cliente_estado_actividad,
                    p.id as producto_id,
                    p.cantidad_articulos,
                    p.detalles,
                    p.valor_etiqueta,
                    p.comision,
                    p.imagen_producto,
                    p.observacion,
                    p.created_at as producto_created_at
                FROM clientes c
                INNER JOIN productos p ON c.id = p.id_cliente
                WHERE p.id_orden = ? AND p.estado = 'activo' AND c.estado = 'activo'
                ORDER BY c.nombre, c.apellido, p.created_at DESC`,
                [id_orden]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener todos los productos de un cliente específico en una orden específica
     */
    static async getProductosPorCliente(id_cliente, id_orden) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    c.id as cliente_id,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    c.direccion as cliente_direccion,
                    c.saldo as cliente_saldo,
                    c.estado_actividad as cliente_estado_actividad,
                    o.id as orden_id,
                    o.nombre_orden,
                    o.impuesto as orden_impuesto,
                    p.id as producto_id,
                    p.cantidad_articulos,
                    p.detalles,
                    p.valor_etiqueta,
                    p.comision,
                    p.imagen_producto,
                    p.observacion,
                    p.created_at as producto_created_at
                FROM clientes c
                INNER JOIN productos p ON c.id = p.id_cliente
                INNER JOIN ordenes o ON p.id_orden = o.id
                WHERE c.id = ? AND o.id = ? AND p.estado = 'activo' AND c.estado = 'activo' AND o.estado = 'activo'
                ORDER BY o.created_at DESC, p.created_at DESC`,
                [id_cliente, id_orden]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Producto;
