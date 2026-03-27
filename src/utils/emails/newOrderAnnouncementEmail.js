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

const sendNewOrderAnnouncementEmail = async ({
    correoDestino,
    nombreCliente,
    codigoCliente,
    nombreOrden,
    fechaInicio,
    fechaFin,
    tiktokUrl
}) => {
    const fullName = nombreCliente || 'Cliente';
    const codigo = codigoCliente || 'Sin codigo';
    const orden = nombreOrden || 'Nueva orden';
    const inicioTexto = formatFecha(fechaInicio);
    const finTexto = formatFecha(fechaFin);
    const redesTexto = 'Mantente alerta tambien a nuestras otras redes sociales oficiales para enterarte de novedades y horarios.';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">
            Se abrio una nueva orden y ya puedes prepararte para comprar en los lives.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Cliente', value: fullName },
                { label: 'Codigo', value: codigo },
                { label: 'Orden', value: orden },
                { label: 'Fecha de inicio', value: inicioTexto },
                { label: 'Fecha de fin', value: finTexto },
                {
                    label: 'TikTok Cherry',
                    value: `<a href="${tiktokUrl}" target="_blank" style="color:#D92525;font-weight:700;text-decoration:none;">Ir al live de TikTok</a>`
                }
            ])}
        </table>
    `;

    const text = [
        `Nueva orden disponible: ${orden}`,
        `Cliente: ${fullName}`,
        `Codigo: ${codigo}`,
        `Fecha de inicio: ${inicioTexto}`,
        `Fecha de fin: ${finTexto}`,
        'Mantente pendiente de los lives de TikTok para realizar tus compras.',
        redesTexto,
        `TikTok: ${tiktokUrl}`
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: `Nueva orden activa - ${orden}`,
        title: 'Nueva orden disponible',
        introText: `Hola ${fullName}, ya puedes participar en la nueva orden ${orden}.`,
        detailsHtml,
        detailTextLines: [
            `Orden: ${orden}`,
            `Fecha de inicio: ${inicioTexto}`,
            `Fecha de fin: ${finTexto}`,
            redesTexto,
            `TikTok: ${tiktokUrl}`
        ],
        highlightText: `Mantente pendiente de los lives de TikTok para realizar tus compras. ${redesTexto}`,
        closingText: 'Nos vemos en los lives para que puedas apartar tus productos a tiempo. Sigue tambien nuestras otras redes oficiales.',
        footerText: 'Sistema Cherry · Aviso de nueva orden',
        text
    });
};

module.exports = {
    sendNewOrderAnnouncementEmail
};
