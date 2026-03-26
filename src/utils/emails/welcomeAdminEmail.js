const { buildDataRows, sendBrandedEmail } = require('./template');

const sendWelcomeAdmin = async ({ correo, contraseña, nombre, apellido, rolNombre }) => {
    const fullName = [nombre, apellido].filter(Boolean).join(' ').trim() || 'Administrador';
    const rolTexto = rolNombre || 'Administrador';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">Se creó tu cuenta de ${rolTexto.toLowerCase()} en Sistema Cherry.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Nombre', value: fullName },
                { label: 'Correo de acceso', value: correo },
                { label: 'Contraseña temporal', value: contraseña },
                { label: 'Rol', value: rolTexto }
            ])}
        </table>
    `;

    const text = [
        `Bienvenido(a) ${fullName} a Sistema Cherry`,
        `Se creó tu cuenta de ${rolTexto}.`,
        `Correo de acceso: ${correo}`,
        `Contraseña temporal: ${contraseña}`,
        `Rol: ${rolTexto}`,
        'Por seguridad, cambia la contraseña en tu primer acceso.'
    ].join('\n');

    await sendBrandedEmail({
        to: correo,
        subject: `Bienvenido(a) - ${rolTexto} Sistema Cherry`,
        title: `¡Bienvenido(a), ${fullName}!`,
        introText: 'Tu cuenta administrativa está lista para usarse.',
        detailsHtml,
        detailTextLines: [
            `Correo de acceso: ${correo}`,
            `Contraseña temporal: ${contraseña}`,
            `Rol: ${rolTexto}`
        ],
        highlightText: 'Por seguridad, cambia la contraseña en tu primer acceso.',
        closingText: 'Si no reconoces esta alta de usuario, informa al superadministrador.',
        footerText: 'Sistema Cherry · Cuenta administrativa',
        text
    });
};

module.exports = {
    sendWelcomeAdmin
};
