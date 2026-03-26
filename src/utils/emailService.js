const nodemailer = require('nodemailer');

class EmailService {
    static createTransporter() {
        const {
            EMAIL_SERVICE,
            EMAIL_HOST,
            EMAIL_PORT,
            EMAIL_SECURE,
            EMAIL_USER,
            EMAIL_PASSWORD
        } = process.env;

        const normalizedService = (EMAIL_SERVICE || '').trim().toLowerCase();
        const normalizedUser = (EMAIL_USER || '').trim();
        let normalizedPassword = (EMAIL_PASSWORD || '').trim();

        // Gmail muestra la App Password en grupos con espacios. SMTP requiere el valor continuo.
        if (normalizedService === 'gmail' || normalizedUser.endsWith('@gmail.com')) {
            normalizedPassword = normalizedPassword.replace(/\s+/g, '');
        }

        if (!normalizedUser || !normalizedPassword) {
            throw new Error('EMAIL_CONFIG_MISSING');
        }

        if (normalizedService) {
            return nodemailer.createTransport({
                service: normalizedService,
                auth: {
                    user: normalizedUser,
                    pass: normalizedPassword
                }
            });
        }

        return nodemailer.createTransport({
            host: EMAIL_HOST,
            port: Number(EMAIL_PORT || 587),
            secure: EMAIL_SECURE === 'true',
            auth: {
                user: normalizedUser,
                pass: normalizedPassword
            }
        });
    }

    static async sendRecoveryCode(correoDestino, codigo) {
        const transporter = this.createTransporter();

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
                <h2 style="color: #1c2833;">Recuperacion de contrasena</h2>
                <p>Hemos recibido una solicitud para recuperar tu contrasena.</p>
                <p>Tu codigo de verificacion es:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 16px 0;">${codigo}</div>
                <p>Este codigo expira en 15 minutos.</p>
                <p>Si no solicitaste este cambio, ignora este correo.</p>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: correoDestino,
            subject: 'Codigo de recuperacion - Sistema Cherry',
            html
        });
    }
}

module.exports = EmailService;
