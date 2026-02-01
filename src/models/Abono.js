const { pool } = require('../config/database');

class Abono {
    /**
     * Obtener todos los abonos con información del cliente
     */
    static async findAll() {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    ha.id, 
                    ha.id_cliente, 
                    ha.cantidad, 
                    ha.estado, 
                    ha.created_at, 
                    ha.updated_at,
                    ha.created_by,
                    ha.updated_by,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    c.saldo as cliente_saldo_actual,
                    u_created.correo as creado_por_correo,
                    u_updated.correo as actualizado_por_correo
                FROM historial_abono ha
                INNER JOIN clientes c ON ha.id_cliente = c.id
                LEFT JOIN usuarios u_created ON ha.created_by = u_created.id
                LEFT JOIN usuarios u_updated ON ha.updated_by = u_updated.id
                WHERE ha.estado = 'activo'
                ORDER BY ha.created_at DESC`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener abonos de un cliente específico
     */
    static async findByClienteId(id_cliente) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    ha.id, 
                    ha.id_cliente, 
                    ha.cantidad, 
                    ha.estado, 
                    ha.created_at, 
                    ha.updated_at,
                    ha.created_by,
                    ha.updated_by,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    c.saldo as cliente_saldo_actual,
                    u_created.correo as creado_por_correo,
                    u_updated.correo as actualizado_por_correo
                FROM historial_abono ha
                INNER JOIN clientes c ON ha.id_cliente = c.id
                LEFT JOIN usuarios u_created ON ha.created_by = u_created.id
                LEFT JOIN usuarios u_updated ON ha.updated_by = u_updated.id
                WHERE ha.id_cliente = ? AND ha.estado = 'activo'
                ORDER BY ha.created_at DESC`,
                [id_cliente]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener abono por ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    ha.id, 
                    ha.id_cliente, 
                    ha.cantidad, 
                    ha.estado, 
                    ha.created_at, 
                    ha.updated_at,
                    ha.created_by,
                    ha.updated_by,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    c.saldo as cliente_saldo_actual
                FROM historial_abono ha
                INNER JOIN clientes c ON ha.id_cliente = c.id
                WHERE ha.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Crear nuevo abono (usa transacción para actualizar saldo del cliente)
     */
    static async create(id_cliente, cantidad, created_by) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insertar abono en historial
            const [result] = await connection.query(
                'INSERT INTO historial_abono (id_cliente, cantidad, created_by) VALUES (?, ?, ?)',
                [id_cliente, cantidad, created_by]
            );

            // Actualizar saldo del cliente (acumular)
            await connection.query(
                'UPDATE clientes SET saldo = saldo + ?, updated_by = ? WHERE id = ?',
                [cantidad, created_by, id_cliente]
            );

            await connection.commit();
            return result.insertId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Actualizar abono (recalcula el saldo del cliente)
     */
    static async update(id, cantidad, updated_by) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Obtener abono anterior
            const [abonoAnterior] = await connection.query(
                'SELECT id_cliente, cantidad FROM historial_abono WHERE id = ?',
                [id]
            );

            if (abonoAnterior.length === 0) {
                throw new Error('ABONO_NOT_FOUND');
            }

            const { id_cliente, cantidad: cantidadAnterior } = abonoAnterior[0];
            const diferencia = cantidad - cantidadAnterior;

            // Actualizar abono
            await connection.query(
                'UPDATE historial_abono SET cantidad = ?, updated_by = ? WHERE id = ?',
                [cantidad, updated_by, id]
            );

            // Actualizar saldo del cliente (ajustar con la diferencia)
            await connection.query(
                'UPDATE clientes SET saldo = saldo + ?, updated_by = ? WHERE id = ?',
                [diferencia, updated_by, id_cliente]
            );

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Eliminar abono (cambia estado a inactivo y resta del saldo)
     */
    static async delete(id, updated_by) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Obtener abono
            const [abono] = await connection.query(
                'SELECT id_cliente, cantidad FROM historial_abono WHERE id = ? AND estado = "activo"',
                [id]
            );

            if (abono.length === 0) {
                throw new Error('ABONO_NOT_FOUND');
            }

            const { id_cliente, cantidad } = abono[0];

            // Cambiar estado a inactivo
            await connection.query(
                'UPDATE historial_abono SET estado = "inactivo", updated_by = ? WHERE id = ?',
                [updated_by, id]
            );

            // Restar del saldo del cliente
            await connection.query(
                'UPDATE clientes SET saldo = saldo - ?, updated_by = ? WHERE id = ?',
                [cantidad, updated_by, id_cliente]
            );

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Verificar si el cliente existe
     */
    static async clienteExists(id_cliente) {
        try {
            const [rows] = await pool.query(
                'SELECT id FROM clientes WHERE id = ? AND estado = "activo"',
                [id_cliente]
            );
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Abono;
