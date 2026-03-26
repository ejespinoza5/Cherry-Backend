const { sendRecoveryCode } = require('./emails/recoveryEmail');
const { sendWelcomeClient } = require('./emails/welcomeClientEmail');
const { sendWelcomeAdmin } = require('./emails/welcomeAdminEmail');

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
}

module.exports = EmailService;
