const { sendBrandedEmail } = require('./template');

const sendEmailChangeVerificationCode = async (correoDestino, codigo) => {
    const detailsHtml = `
        <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;">Usa este código para confirmar el cambio de correo:</p>
        <div style="margin:14px 0 16px 0;padding:14px 18px;text-align:center;background:#FEF2F2;border:1px dashed #D92525;border-radius:10px;">
            <span style="display:inline-block;font-size:34px;font-weight:700;letter-spacing:8px;color:#D92525;">${codigo}</span>
        </div>
    `;

    const text = [
        'Verificación de cambio de correo - Sistema Cherry',
        `Código de verificación: ${codigo}`,
        'Este código expira en 15 minutos.',
        'Si no solicitaste este cambio, ignora este correo.'
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: 'Código para cambio de correo - Sistema Cherry',
        title: 'Verificación de correo',
        introText: 'Recibimos una solicitud para cambiar el correo de tu cuenta en Sistema Cherry.',
        detailsHtml,
        detailTextLines: [
            `Código de verificación: ${codigo}`
        ],
        highlightText: 'Este código expira en 15 minutos.',
        closingText: 'Si no solicitaste este cambio, ignora este mensaje.',
        footerText: 'Sistema Cherry · Seguridad de cuenta',
        text
    });
};

module.exports = {
    sendEmailChangeVerificationCode
};
