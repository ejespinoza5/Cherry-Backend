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
    codigoCliente,
    nombreOrden,
    fechaCierreProgramada,
    tiktokUrl
}) => {
    const fullName = nombreCliente || 'Cliente';
    const codigo = codigoCliente || 'Sin codigo';
    const orden = nombreOrden || 'Orden';
    const cierreTexto = formatFecha(fechaCierreProgramada);

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">
            Te recordamos que faltan aproximadamente 3 dias para el cierre de esta orden.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Cliente', value: fullName },
                { label: 'Codigo', value: codigo },
                { label: 'Orden', value: orden },
                { label: 'Cierre programado', value: cierreTexto },
                {
                    label: 'TikTok Cherry',
                    value: `<a href="${tiktokUrl}" target="_blank" style="color:#D92525;font-weight:700;text-decoration:none;">Ver lives de TikTok</a>`
                }
            ])}
        </table>
    `;

    const text = [
        `Aviso de cierre proximo - ${orden}`,
        `Cliente: ${fullName}`,
        `Codigo: ${codigo}`,
        `Cierre programado: ${cierreTexto}`,
        'Mantente pendiente de los lives de TikTok para realizar tus compras antes del cierre.',
        `TikTok: ${tiktokUrl}`
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: `Aviso: la orden ${orden} cierra en 3 dias`,
        title: 'Aviso de cierre proximo',
        introText: `Hola ${fullName}, este es un recordatorio preventivo para que te organices antes del cierre de la orden.`,
        detailsHtml,
        detailTextLines: [
            `Orden: ${orden}`,
            `Cierre programado: ${cierreTexto}`,
            `TikTok: ${tiktokUrl}`
        ],
        highlightText: 'Mantente pendiente de los lives de TikTok para realizar tus compras antes del cierre.',
        closingText: 'Si ya completaste tus compras, ignora este aviso.',
        footerText: 'Sistema Cherry · Aviso de cierre',
        text
    });
};

module.exports = {
    sendOrderClosingSoonEmail
};
