const { sendRecoveryCode } = require('./emails/recoveryEmail');
const { sendWelcomeClient } = require('./emails/welcomeClientEmail');
const { sendWelcomeAdmin } = require('./emails/welcomeAdminEmail');
const { sendEmailChangeVerificationCode } = require('./emails/emailChangeVerificationEmail');
const { sendAbonoVerificationEmail } = require('./emails/abonoVerificationEmail');
const { sendDebtReminderEmail } = require('./emails/debtReminderEmail');

class EmailService {
    static async sendRecoveryCode(correoDestino, codigo) {
        return sendRecoveryCode(correoDestino, codigo);
    }

    static async sendWelcomeClient({ correo, contraseña, nombre, codigo }) {
        return sendWelcomeClient({ correo, contraseña, nombre, codigo });
    }

    static async sendWelcomeAdmin({ correo, contraseña, nombre, apellido, rolNombre }) {
        return sendWelcomeAdmin({ correo, contraseña, nombre, apellido, rolNombre });
    }

    static async sendEmailChangeVerificationCode(correoDestino, codigo) {
        return sendEmailChangeVerificationCode(correoDestino, codigo);
    }

    static async sendAbonoVerificationEmail(data) {
        return sendAbonoVerificationEmail(data);
    }

    static async sendDebtReminderEmail(data) {
        return sendDebtReminderEmail(data);
    }
}

module.exports = EmailService;
