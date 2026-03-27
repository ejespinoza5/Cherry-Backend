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
    valorTotalCompra,
    deudaAlCierre,
    valorAdeudado,
    abonosPerdidos
}) => {
    const fullName = nombreCliente || 'Cliente';
    const codigo = codigoCliente || 'Sin código';
    const orden = nombreOrden || 'Orden';
    const totalCompraTexto = formatMonto(valorTotalCompra);
    const deudaTexto = formatMonto(deudaAlCierre ?? valorAdeudado);
    const abonosPerdidosTexto = formatMonto(abonosPerdidos);

    const introText = `Hola ${fullName}, te informamos que, tras haber finalizado el período de gracia sin registrar el pago total de la deuda, se ha procedido al remate oficial de tus productos correspondientes a la ${orden}.`;

    const highlightText = `De acuerdo con nuestras políticas de incumplimiento, los abonos realizados por un valor de ${abonosPerdidosTexto} han sido registrados como pérdida y no son reembolsables.`;

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">
            Acta oficial emitida por Sistema Cherry sobre remate ejecutado.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Orden', value: orden },
                { label: 'Valor Total de la Compra', value: totalCompraTexto },
                { label: 'Deuda al Cierre', value: deudaTexto },
                { label: 'Abonos Perdidos', value: `<span style="color:#B42318;font-weight:700;">${abonosPerdidosTexto}</span>` }
            ])}
        </table>
    `;

    const text = [
        `Notificación Final: Remate de productos ejecutado - ${codigo}`,
        introText,
        `Orden: ${orden}`,
        `Valor Total de la Compra: ${totalCompraTexto}`,
        `Deuda al Cierre: ${deudaTexto}`,
        `Abonos Perdidos: ${abonosPerdidosTexto}`,
        highlightText
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: `Notificación Final: Remate de productos ejecutado - ${codigo}`,
        title: 'Acta de Remate de Mercancía',
        introText,
        detailsHtml,
        detailTextLines: [
            `Orden: ${orden}`,
            `Valor Total de la Compra: ${totalCompraTexto}`,
            `Deuda al Cierre: ${deudaTexto}`,
            `Abonos Perdidos: ${abonosPerdidosTexto}`
        ],
        highlightText: `<span style="color:#B42318;font-weight:700;">${highlightText}</span>`,
        closingText: 'Tu cuenta ha sido restablecida para futuras órdenes. Te invitamos a mantener tus pagos al día en próximas ocasiones para evitar la pérdida de tu inversión.',
        footerText: 'Sistema Cherry · Notificación de remate',
        text
    });
};

module.exports = {
    sendOrderAuctionedEmail
};
