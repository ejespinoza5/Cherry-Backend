const { sendRecoveryCode } = require('./emails/recoveryEmail');
const { sendWelcomeClient } = require('./emails/welcomeClientEmail');
const { sendWelcomeAdmin } = require('./emails/welcomeAdminEmail');
const { sendEmailChangeVerificationCode } = require('./emails/emailChangeVerificationEmail');
const { sendAbonoVerificationEmail } = require('./emails/abonoVerificationEmail');
const { sendDebtReminderEmail } = require('./emails/debtReminderEmail');
const { sendOrderCloseStatusEmail } = require('./emails/orderCloseStatusEmail');
const { sendOrderAuctionedEmail } = require('./emails/orderAuctionedEmail');
const { sendNewOrderAnnouncementEmail } = require('./emails/newOrderAnnouncementEmail');
const { sendOrderClosingSoonEmail } = require('./emails/orderClosingSoonEmail');

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

    static async sendOrderCloseStatusEmail(data) {
        return sendOrderCloseStatusEmail(data);
    }

    static async sendOrderAuctionedEmail(data) {
        return sendOrderAuctionedEmail(data);
    }

    static async sendNewOrderAnnouncementEmail(data) {
        return sendNewOrderAnnouncementEmail(data);
    }

    static async sendOrderClosingSoonEmail(data) {
        return sendOrderClosingSoonEmail(data);
    }
}

module.exports = EmailService;
