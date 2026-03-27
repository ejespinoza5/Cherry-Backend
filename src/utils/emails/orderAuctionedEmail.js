const { buildDataRows, sendBrandedEmail } = require('./template');

const formatMonto = (monto) => {
    const valor = Number(monto || 0);
    return `$${valor.toFixed(2)}`;
};

const sendOrderAuctionedEmail = async ({
    correoDestino,
    nombreCliente,
    codigoCliente,
    nombreOrden,
    valorAdeudado,
    abonosPerdidos,
    ordenCerrada
}) => {
    const fullName = nombreCliente || 'Cliente';
    const codigo = codigoCliente || 'Sin codigo';
    const orden = nombreOrden || 'Orden';
    const deudaTexto = formatMonto(valorAdeudado);
    const abonosPerdidosTexto = formatMonto(abonosPerdidos);

    const introText = ordenCerrada
        ? `Hola ${fullName}, la orden ${orden} fue cerrada y tu cuenta fue rematada por incumplimiento de pago.`
        : `Hola ${fullName}, tu cuenta fue rematada por incumplimiento de pago en la orden ${orden}.`;

    const highlightText = ordenCerrada
        ? 'La orden fue cerrada. Tus compras de esta orden fueron rematadas y los abonos realizados se perdieron.'
        : 'Tus compras de esta orden fueron rematadas y los abonos realizados se perdieron.';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">
            Registramos remate por no cancelar dentro del periodo de gracia.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Cliente', value: fullName },
                { label: 'Codigo', value: codigo },
                { label: 'Orden', value: orden },
                { label: 'Estado de la orden', value: ordenCerrada ? 'Cerrada' : 'En proceso de cierre' },
                { label: 'Valor adeudado', value: deudaTexto },
                { label: 'Abonos perdidos', value: abonosPerdidosTexto }
            ])}
        </table>
    `;

    const text = [
        `Remate de compras - ${orden}`,
        `Cliente: ${fullName}`,
        `Codigo: ${codigo}`,
        `Estado de la orden: ${ordenCerrada ? 'Cerrada' : 'En proceso de cierre'}`,
        `Valor adeudado: ${deudaTexto}`,
        `Abonos perdidos: ${abonosPerdidosTexto}`,
        highlightText
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: ordenCerrada
            ? 'Orden cerrada y compras rematadas - Sistema Cherry'
            : 'Compras rematadas por incumplimiento - Sistema Cherry',
        title: 'Compras rematadas',
        introText,
        detailsHtml,
        detailTextLines: [
            `Orden: ${orden}`,
            `Valor adeudado: ${deudaTexto}`,
            `Abonos perdidos: ${abonosPerdidosTexto}`
        ],
        highlightText,
        closingText: 'Para futuras ordenes, mantente al dia con tus pagos y registra tus abonos dentro del plazo.',
        footerText: 'Sistema Cherry · Notificacion de remate',
        text
    });
};

module.exports = {
    sendOrderAuctionedEmail
};
