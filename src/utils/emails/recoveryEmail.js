const { sendBrandedEmail } = require('./template');

const sendRecoveryCode = async (correoDestino, codigo) => {
    const detailsHtml = `
        <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;">Ingresa este código de verificación:</p>
        <div style="margin:14px 0 16px 0;padding:14px 18px;text-align:center;background:#FEF2F2;border:1px dashed #D92525;border-radius:10px;">
            <span style="display:inline-block;font-size:34px;font-weight:700;letter-spacing:8px;color:#D92525;">${codigo}</span>
        </div>
    `;

    const text = [
        'Recuperación de contraseña - Sistema Cherry',
        `Código de verificación: ${codigo}`,
        'Este código expira en 15 minutos.',
        'Si no solicitaste este cambio, ignora este correo.'
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: 'Código de recuperación - Sistema Cherry',
        title: 'Recuperación de contraseña',
        introText: 'Recibimos una solicitud para restablecer tu contraseña en Sistema Cherry.',
        detailsHtml,
        detailTextLines: [
            `Código de verificación: ${codigo}`
        ],
        highlightText: 'Este código expira en 15 minutos.',
        closingText: 'Si no solicitaste este cambio, ignora este correo. Tu cuenta seguirá protegida.',
        footerText: 'Sistema Cherry · Seguridad de cuenta',
        text
    });
};

module.exports = {
    sendRecoveryCode
};
