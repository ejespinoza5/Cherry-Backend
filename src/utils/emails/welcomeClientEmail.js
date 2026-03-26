const { buildDataRows, sendBrandedEmail } = require('./template');

const sendWelcomeClient = async ({ correo, contraseña, nombre, codigo }) => {
    const safeName = nombre || 'Cliente';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">La administradora de Sistema Cherry creó tu cuenta para que puedas iniciar sesión.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Nombre', value: safeName },
                { label: 'Correo de acceso', value: correo },
                { label: 'Contraseña temporal', value: contraseña },
                { label: 'Código de cliente', value: codigo }
            ])}
        </table>
    `;

    const text = [
        `Bienvenido(a) ${safeName} a Sistema Cherry`,
        'La administradora creó tu cuenta para que puedas iniciar sesión.',
        `Correo de acceso: ${correo}`,
        `Contraseña temporal: ${contraseña}`,
        `Código de cliente: ${codigo}`,
        'Te recomendamos cambiar la contraseña en tu primer ingreso.'
    ].join('\n');

    await sendBrandedEmail({
        to: correo,
        subject: 'Bienvenido(a) a Sistema Cherry',
        title: `¡Bienvenido(a), ${safeName}!`,
        introText: 'Tu perfil de cliente fue registrado correctamente.',
        detailsHtml,
        detailTextLines: [
            `Correo de acceso: ${correo}`,
            `Contraseña temporal: ${contraseña}`,
            `Código de cliente: ${codigo}`
        ],
        highlightText: 'Te recomendamos cambiar la contraseña en tu primer ingreso.',
        closingText: 'Si tienes dudas, contacta a la administradora que gestiona tu cuenta.',
        footerText: 'Sistema Cherry · Cuenta de cliente',
        text
    });
};

module.exports = {
    sendWelcomeClient
};
