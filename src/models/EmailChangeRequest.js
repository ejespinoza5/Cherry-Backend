const { pool } = require('../config/database');

class EmailChangeRequest {
    static async create(idUsuario, nuevoCorreo, codigoHash, expiraEn) {
        const [result] = await pool.query(
            `INSERT INTO email_change_requests (id_usuario, nuevo_correo, codigo_hash, expira_en, intentos, max_intentos, estado)
             VALUES (?, ?, ?, ?, 0, 3, 'pendiente')`,
            [idUsuario, nuevoCorreo, codigoHash, expiraEn]
        );

        return result.insertId;
    }

    static async expireActiveByUser(idUsuario) {
        const [result] = await pool.query(
            `UPDATE email_change_requests
             SET estado = 'expirado'
             WHERE id_usuario = ? AND estado IN ('pendiente', 'verificado')`,
            [idUsuario]
        );

        return result.affectedRows;
    }

    static async findLatestPendingByUserAndEmail(idUsuario, nuevoCorreo) {
        const [rows] = await pool.query(
            `SELECT *
             FROM email_change_requests
             WHERE id_usuario = ? AND nuevo_correo = ? AND estado = 'pendiente'
             ORDER BY created_at DESC
             LIMIT 1`,
            [idUsuario, nuevoCorreo]
        );

        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM email_change_requests WHERE id = ? LIMIT 1',
            [id]
        );

        return rows[0];
    }

    static async incrementAttempts(id) {
        const [result] = await pool.query(
            'UPDATE email_change_requests SET intentos = intentos + 1 WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    }

    static async markBlocked(id) {
        const [result] = await pool.query(
            `UPDATE email_change_requests
             SET estado = 'bloqueado'
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async markExpired(id) {
        const [result] = await pool.query(
            `UPDATE email_change_requests
             SET estado = 'expirado'
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async markVerified(id) {
        const [result] = await pool.query(
            `UPDATE email_change_requests
             SET estado = 'verificado', verificado_at = NOW()
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async markUsed(id) {
        const [result] = await pool.query(
            `UPDATE email_change_requests
             SET estado = 'usado', usado_at = NOW()
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }
}

module.exports = EmailChangeRequest;
