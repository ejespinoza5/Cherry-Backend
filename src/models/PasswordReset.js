const { pool } = require('../config/database');

class PasswordReset {
    static async create(idUsuario, codigoHash, expiraEn) {
        const [result] = await pool.query(
            `INSERT INTO password_resets (id_usuario, codigo_hash, expira_en, intentos, max_intentos, estado)
             VALUES (?, ?, ?, 0, 3, 'pendiente')`,
            [idUsuario, codigoHash, expiraEn]
        );

        return result.insertId;
    }

    static async expireActiveCodesByUser(idUsuario) {
        const [result] = await pool.query(
            `UPDATE password_resets
             SET estado = 'expirado'
             WHERE id_usuario = ? AND estado IN ('pendiente', 'verificado')`,
            [idUsuario]
        );

        return result.affectedRows;
    }

    static async findLatestByUserId(idUsuario) {
        const [rows] = await pool.query(
            `SELECT *
             FROM password_resets
             WHERE id_usuario = ?
             ORDER BY created_at DESC
             LIMIT 1`,
            [idUsuario]
        );

        return rows[0];
    }

    static async findLatestPendingByUserId(idUsuario) {
        const [rows] = await pool.query(
            `SELECT *
             FROM password_resets
             WHERE id_usuario = ? AND estado = 'pendiente'
             ORDER BY created_at DESC
             LIMIT 1`,
            [idUsuario]
        );

        return rows[0];
    }

    static async findLatestVerifiedByUserId(idUsuario) {
        const [rows] = await pool.query(
            `SELECT *
             FROM password_resets
             WHERE id_usuario = ? AND estado = 'verificado'
             ORDER BY verificado_at DESC, created_at DESC
             LIMIT 1`,
            [idUsuario]
        );

        return rows[0];
    }

    static async incrementAttempts(id) {
        const [result] = await pool.query(
            'UPDATE password_resets SET intentos = intentos + 1 WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    }

    static async markBlocked(id) {
        const [result] = await pool.query(
            `UPDATE password_resets
             SET estado = 'bloqueado'
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async markExpired(id) {
        const [result] = await pool.query(
            `UPDATE password_resets
             SET estado = 'expirado'
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async markVerified(id) {
        const [result] = await pool.query(
            `UPDATE password_resets
             SET estado = 'verificado', verificado_at = NOW()
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async markUsed(id) {
        const [result] = await pool.query(
            `UPDATE password_resets
             SET estado = 'usado', usado_at = NOW()
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }
}

module.exports = PasswordReset;
