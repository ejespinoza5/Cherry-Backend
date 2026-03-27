const { buildDataRows, sendBrandedEmail } = require('./template');

const formatFecha = (fecha) => {
    if (!fecha) {
        return 'No definida';
    }

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) {
        return String(fecha);
    }

    return date.toISOString().slice(0, 16).replace('T', ' ');
};

const sendOrderClosingSoonEmail = async ({
    correoDestino,
    nombreCliente,
    nombreOrden,
    fechaCierreProgramada,
    tiktokUrl
}) => {
    const fullName = nombreCliente || 'Cliente';
    const orden = nombreOrden || 'Orden';
    const cierreTexto = formatFecha(fechaCierreProgramada);
    const tiktokHref = tiktokUrl || '#';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#0A2A66;">
            Hola ${fullName}, estamos llegando a la recta final. Tienes aproximadamente <strong style="color:#B54708;">3 días</strong> para realizar tus últimas compras o completar tus pagos antes del cierre oficial de la ${orden}.
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#0A2A66;font-weight:700;">
            No te pierdas los últimos lives en TikTok para asegurar tus productos favoritos.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Orden', value: orden },
                { label: 'Fecha de Cierre Programado', value: `<span style="color:#B54708;font-weight:700;">${cierreTexto}</span>` }
            ])}
        </table>
        <div style="text-align:center;margin:8px 0 16px 0;">
            <a href="${tiktokHref}" target="_blank" style="display:inline-block;background:#D92525;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1;padding:13px 20px;border-radius:10px;">
                Ir al Live de TikTok de Cherry
            </a>
        </div>
    `;

    const text = [
        `⏳ ¡Solo quedan 3 días! El cierre de ${orden} se acerca.`,
        `Hola ${fullName}, estamos llegando a la recta final. Tienes aproximadamente 3 días para realizar tus últimas compras o completar tus pagos antes del cierre oficial de la ${orden}.`,
        'No te pierdas los últimos lives en TikTok para asegurar tus productos favoritos.',
        `Orden: ${orden}`,
        `Fecha de Cierre Programado: ${cierreTexto}`,
        `Ir al Live de TikTok de Cherry: ${tiktokHref}`,
        'Si ya completaste tus compras y estas al dia, puedes ignorar este aviso. ¡Nos vemos en el live!'
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: `⏳ ¡Solo quedan 3 días! El cierre de ${orden} se acerca.`,
        title: '¡Últimos días de la orden!',
        introText: '',
        detailsHtml,
        detailTextLines: [
            `Orden: ${orden}`,
            `Fecha de Cierre Programado: ${cierreTexto}`
        ],
        highlightText: '<span style="color:#497413;font-weight:700;">Si ya completaste tus compras y estás al día, puedes ignorar este aviso. ¡Nos vemos en el live!</span>',
        closingText: '',
        footerText: 'Sistema Cherry · Aviso de cierre',
        text
    });
};

module.exports = {
    sendOrderClosingSoonEmail
};
