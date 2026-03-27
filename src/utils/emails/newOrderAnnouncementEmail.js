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
    const codigo = codigoCliente || 'Sin código';
    const orden = nombreOrden || 'Nueva orden';
    const inicioTexto = formatFecha(fechaInicio);
    const finTexto = formatFecha(fechaFin);
    const redesTexto = 'Síguenos en nuestras redes para no perderte los horarios de transmisión.';
    const tiktokHref = tiktokUrl || '#';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">
            Una nueva temporada de compras ha comenzado. Ya puedes prepararte para participar en nuestros próximos Lives y asegurar tus productos favoritos.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Cliente', value: fullName },
                { label: 'Código', value: codigo },
                { label: 'Orden', value: orden },
                { label: 'Fecha de Inicio', value: inicioTexto },
                { label: 'Fecha de Cierre', value: finTexto }
            ])}
        </table>
        <div style="text-align:center;margin:8px 0 18px 0;">
            <a href="${tiktokHref}" target="_blank" style="display:inline-block;background:#D92525;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1;padding:13px 20px;border-radius:10px;">
                Ir al Live de TikTok de Cherry
            </a>
        </div>
    `;

    const text = [
        `🍒 ¡Ya puedes comprar! Nueva orden abierta: ${orden}`,
        `Cliente: ${fullName}`,
        `Código: ${codigo}`,
        `Orden: ${orden}`,
        `Fecha de Inicio: ${inicioTexto}`,
        `Fecha de Cierre: ${finTexto}`,
        'Ir al Live de TikTok de Cherry:',
        tiktokHref,
        redesTexto,
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: `🍒 ¡Ya puedes comprar! Nueva orden abierta: ${orden}`,
        title: '¡Nueva orden disponible!',
        introText: `Hola ${fullName},`,
        detailsHtml,
        detailTextLines: [
            `Cliente: ${fullName}`,
            `Código: ${codigo}`,
            `Orden: ${orden}`,
            `Fecha de Inicio: ${inicioTexto}`,
            `Fecha de Cierre: ${finTexto}`,
            `Ir al Live de TikTok de Cherry: ${tiktokHref}`,
            redesTexto,
        ],
        highlightText: '',
        closingText: redesTexto,
        footerText: 'Sistema Cherry · Aviso de nueva orden',
        text
    });
};

module.exports = {
    sendNewOrderAnnouncementEmail
};
