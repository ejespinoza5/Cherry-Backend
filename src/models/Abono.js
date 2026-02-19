const { pool } = require('../config/database');

class Abono {
    /**
     * Obtener todos los abonos con información del cliente y orden
     */
    static async findAll() {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    ha.id, 
                    ha.id_cliente,
                    ha.id_orden,
                    ha.cantidad, 
                    ha.comprobante_pago,
                    ha.estado_verificacion,
                    ha.fecha_verificacion,
                    ha.verificado_by,
                    ha.observaciones_verificacion,
                    ha.estado, 
                    ha.created_at, 
                    ha.updated_at,
                    ha.created_by,
                    ha.updated_by,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    o.nombre_orden,
                    o.estado_orden,
                    u_created.correo as creado_por_correo,
                    u_updated.correo as actualizado_por_correo
                FROM historial_abono ha
                INNER JOIN clientes c ON ha.id_cliente = c.id
                INNER JOIN ordenes o ON ha.id_orden = o.id
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
                    ha.id_orden,
                    ha.cantidad,
                    ha.comprobante_pago,
                    ha.estado_verificacion,
                    ha.fecha_verificacion,
                    ha.verificado_by,
                    ha.observaciones_verificacion,
                    ha.estado, 
                    ha.created_at, 
                    ha.updated_at,
                    ha.created_by,
                    ha.updated_by,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    o.nombre_orden,
                    o.estado_orden,
                    u_created.correo as creado_por_correo,
                    u_updated.correo as actualizado_por_correo
                FROM historial_abono ha
                INNER JOIN clientes c ON ha.id_cliente = c.id
                INNER JOIN ordenes o ON ha.id_orden = o.id
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
                    ha.id_orden,
                    ha.cantidad,
                    ha.comprobante_pago,
                    ha.estado_verificacion,
                    ha.fecha_verificacion,
                    ha.verificado_by,
                    ha.observaciones_verificacion,
                    ha.estado, 
                    ha.created_at, 
                    ha.updated_at,
                    ha.created_by,
                    ha.updated_by,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    o.nombre_orden,
                    o.estado_orden
                FROM historial_abono ha
                INNER JOIN clientes c ON ha.id_cliente = c.id
                INNER JOIN ordenes o ON ha.id_orden = o.id
                WHERE ha.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Crear nuevo abono con comprobante (actualiza saldo en cliente_orden por orden)
     */
    static async create(id_cliente, id_orden, cantidad, comprobante_pago, created_by) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insertar abono en historial (estado_verificacion por defecto es 'pendiente')
            const [result] = await connection.query(
                `INSERT INTO historial_abono 
                 (id_cliente, id_orden, cantidad, comprobante_pago, created_by) 
                 VALUES (?, ?, ?, ?, ?)`,
                [id_cliente, id_orden, cantidad, comprobante_pago, created_by]
            );

            // NO actualizamos el saldo del cliente hasta que se verifique
            // El saldo solo se actualiza cuando estado_verificacion = 'verificado'

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
     * Actualizar abono (recalcula el saldo del cliente por orden)
     */
    static async update(id, cantidad, updated_by) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Obtener abono anterior
            const [abonoAnterior] = await connection.query(
                'SELECT id_cliente, id_orden, cantidad, estado_verificacion FROM historial_abono WHERE id = ?',
                [id]
            );

            if (abonoAnterior.length === 0) {
                throw new Error('ABONO_NOT_FOUND');
            }

            const { id_cliente, id_orden, cantidad: cantidadAnterior, estado_verificacion } = abonoAnterior[0];
            const diferencia = cantidad - cantidadAnterior;

            // Actualizar abono
            await connection.query(
                'UPDATE historial_abono SET cantidad = ?, updated_by = ? WHERE id = ?',
                [cantidad, updated_by, id]
            );

            // Si el abono ya está verificado, actualizar el saldo en cliente_orden
            if (estado_verificacion === 'verificado') {
                // Asegurar que existe el registro en cliente_orden
                await connection.query(
                    `INSERT INTO cliente_orden (id_cliente, id_orden, total_abonos) 
                     VALUES (?, ?, 0) 
                     ON DUPLICATE KEY UPDATE total_abonos = total_abonos`,
                    [id_cliente, id_orden]
                );

                // Actualizar saldo del cliente por orden (ajustar con la diferencia)
                await connection.query(
                    'UPDATE cliente_orden SET total_abonos = total_abonos + ? WHERE id_cliente = ? AND id_orden = ?',
                    [diferencia, id_cliente, id_orden]
                );
            }

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
     * Eliminar abono (cambia estado a inactivo y resta del saldo por orden si estaba verificado)
     */
    static async delete(id, updated_by) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Obtener abono
            const [abono] = await connection.query(
                'SELECT id_cliente, id_orden, cantidad, estado_verificacion FROM historial_abono WHERE id = ? AND estado = "activo"',
                [id]
            );

            if (abono.length === 0) {
                throw new Error('ABONO_NOT_FOUND');
            }

            const { id_cliente, id_orden, cantidad, estado_verificacion } = abono[0];

            // Cambiar estado a inactivo
            await connection.query(
                'UPDATE historial_abono SET estado = "inactivo", updated_by = ? WHERE id = ?',
                [updated_by, id]
            );

            // Si estaba verificado, restar del saldo en cliente_orden
            if (estado_verificacion === 'verificado') {
                await connection.query(
                    'UPDATE cliente_orden SET total_abonos = total_abonos - ? WHERE id_cliente = ? AND id_orden = ?',
                    [cantidad, id_cliente, id_orden]
                );
            }

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

    /**
     * Verificar si la orden existe
     */
    static async ordenExists(id_orden) {
        try {
            const [rows] = await pool.query(
                'SELECT id FROM ordenes WHERE id = ? AND estado = "activo"',
                [id_orden]
            );
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener abonos por orden
     */
    static async findByOrden(id_orden) {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    ha.id, 
                    ha.id_cliente,
                    ha.id_orden,
                    ha.cantidad,
                    ha.comprobante_pago,
                    ha.estado_verificacion,
                    ha.fecha_verificacion,
                    ha.verificado_by,
                    ha.observaciones_verificacion,
                    ha.estado, 
                    ha.created_at, 
                    ha.updated_at,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo
                FROM historial_abono ha
                INNER JOIN clientes c ON ha.id_cliente = c.id
                WHERE ha.id_orden = ? AND ha.estado = 'activo'
                ORDER BY ha.created_at DESC`,
                [id_orden]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener abonos pendientes de verificación
     */
    static async findPendingVerification() {
        try {
            const [rows] = await pool.query(
                `SELECT 
                    ha.id, 
                    ha.id_cliente,
                    ha.id_orden,
                    ha.cantidad,
                    ha.comprobante_pago,
                    ha.estado_verificacion,
                    ha.created_at,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.codigo as cliente_codigo,
                    o.nombre_orden,
                    o.estado_orden
                FROM historial_abono ha
                INNER JOIN clientes c ON ha.id_cliente = c.id
                INNER JOIN ordenes o ON ha.id_orden = o.id
                WHERE ha.estado = 'activo' AND ha.estado_verificacion = 'pendiente'
                ORDER BY ha.created_at ASC`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar comprobante de pago (actualiza el saldo en cliente_orden)
     */
    static async verificarComprobante(id, verificado_by, observaciones = null) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Obtener el abono
            const [abono] = await connection.query(
                'SELECT id_cliente, id_orden, cantidad, estado_verificacion FROM historial_abono WHERE id = ?',
                [id]
            );

            if (abono.length === 0) {
                throw new Error('ABONO_NOT_FOUND');
            }

            const { id_cliente, id_orden, cantidad, estado_verificacion } = abono[0];

            // Verificar que esté pendiente
            if (estado_verificacion !== 'pendiente') {
                throw new Error('ABONO_ALREADY_PROCESSED');
            }

            // Actualizar estado a verificado
            await connection.query(
                `UPDATE historial_abono 
                 SET estado_verificacion = 'verificado', 
                     fecha_verificacion = NOW(),
                     verificado_by = ?,
                     observaciones_verificacion = ?
                 WHERE id = ?`,
                [verificado_by, observaciones, id]
            );

            // Asegurar que existe el registro en cliente_orden
            await connection.query(
                `INSERT INTO cliente_orden (id_cliente, id_orden, total_abonos) 
                 VALUES (?, ?, 0) 
                 ON DUPLICATE KEY UPDATE total_abonos = total_abonos`,
                [id_cliente, id_orden]
            );

            // Actualizar el saldo en cliente_orden (sumar el abono verificado)
            await connection.query(
                'UPDATE cliente_orden SET total_abonos = total_abonos + ? WHERE id_cliente = ? AND id_orden = ?',
                [cantidad, id_cliente, id_orden]
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
     * Rechazar comprobante de pago
     */
    static async rechazarComprobante(id, verificado_by, observaciones) {
        try {
            // Obtener el abono
            const [abono] = await pool.query(
                'SELECT estado_verificacion FROM historial_abono WHERE id = ?',
                [id]
            );

            if (abono.length === 0) {
                throw new Error('ABONO_NOT_FOUND');
            }

            const { estado_verificacion } = abono[0];

            // Verificar que esté pendiente
            if (estado_verificacion !== 'pendiente') {
                throw new Error('ABONO_ALREADY_PROCESSED');
            }

            // Actualizar estado a rechazado
            const [result] = await pool.query(
                `UPDATE historial_abono 
                 SET estado_verificacion = 'rechazado', 
                     fecha_verificacion = NOW(),
                     verificado_by = ?,
                     observaciones_verificacion = ?
                 WHERE id = ?`,
                [verificado_by, observaciones, id]
            );

            return result.affectedRows > 0;

        } catch (error) {
            throw error;
        }
    }
}

module.exports = Abono;
