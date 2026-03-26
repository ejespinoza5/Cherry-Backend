const nodemailer = require('nodemailer');
const path = require('path');

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
        const logoPath = path.join(__dirname, '../../public/images/logo_cherry.png');

        const html = `
            <div style="margin:0;padding:24px 0;background:#FEF2F2;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #f3dada;border-radius:14px;overflow:hidden;">
                    <tr>
                        <td style="padding:24px 24px 12px 24px;background:linear-gradient(135deg,#FEF2F2 0%,#ffffff 100%);text-align:center;border-bottom:1px solid #f0dddd;">
                            <img src="cid:cherry-logo" alt="Cherry" style="max-width:165px;height:auto;display:inline-block;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px;font-family:'Trebuchet MS',Verdana,Arial,sans-serif;color:#68473D;">
                            <h2 style="margin:0 0 10px 0;font-size:24px;line-height:1.25;color:#D92525;">Recuperacion de contrasena</h2>
                            <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">Recibimos una solicitud para restablecer tu contrasena en Sistema Cherry.</p>
                            <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;">Ingresa este codigo de verificacion:</p>

                            <div style="margin:14px 0 16px 0;padding:14px 18px;text-align:center;background:#FEF2F2;border:1px dashed #D92525;border-radius:10px;">
                                <span style="display:inline-block;font-size:34px;font-weight:700;letter-spacing:8px;color:#D92525;">${codigo}</span>
                            </div>

                            <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#497413;font-weight:600;">Este codigo expira en 15 minutos.</p>
                            <p style="margin:0;font-size:14px;line-height:1.6;color:#68473D;">Si no solicitaste este cambio, ignora este correo. Tu cuenta seguira protegida.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 24px;background:#fff7f7;border-top:1px solid #f0dddd;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#68473D;text-align:center;">
                            Sistema Cherry · Seguridad de cuenta
                        </td>
                    </tr>
                </table>
            </div>
        `;

        const text = [
            'Recuperacion de contrasena - Sistema Cherry',
            `Codigo de verificacion: ${codigo}`,
            'Este codigo expira en 15 minutos.',
            'Si no solicitaste este cambio, ignora este correo.'
        ].join('\n');

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: correoDestino,
            subject: 'Codigo de recuperacion - Sistema Cherry',
            text,
            html,
            attachments: [
                {
                    filename: 'logo_cherry.png',
                    path: logoPath,
                    cid: 'cherry-logo'
                }
            ]
        });
    }
}

module.exports = EmailService;
