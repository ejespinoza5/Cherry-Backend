const { buildDataRows, sendBrandedEmail } = require('./template');

const formatMonto = (monto) => {
    const valor = Number(monto || 0);
    return `$${valor.toFixed(2)}`;
};

const formatFecha = (fecha) => {
    if (!fecha) {
        return 'No disponible';
    }

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) {
        return String(fecha);
    }

    return date.toISOString().slice(0, 16).replace('T', ' ');
};

const sendOrderCloseStatusEmail = async ({
    correoDestino,
    nombreCliente,
    codigoCliente,
    nombreOrden,
    estadoPago,
    saldoPendiente,
    totalAbonado,
    fechaCierre,
    fechaLimitePago
}) => {
    const fullName = nombreCliente || 'Cliente';
    const codigo = codigoCliente || 'Sin código';
    const orden = nombreOrden || 'Orden';
    const saldoTexto = formatMonto(saldoPendiente);
    const abonadoTexto = formatMonto(totalAbonado);
    const cierreTexto = formatFecha(fechaCierre);
    const enGracia = estadoPago === 'en_gracia';
    const estadoGraciaHtml = '<span style="color:#B54708;font-weight:700;">En Gracia (Pendiente de Remate)</span>';

    const introText = enGracia
        ? `Hola ${fullName}, la ${orden} ha finalizado oficialmente. Debido a que mantienes un saldo pendiente, tu mercancía ha pasado a un período de gracia excepcional.`
        : `Hola ${fullName}, la orden ${orden} fue cerrada y no tienes deuda pendiente en esta orden.`;

    const warningText = enGracia
        ? `Debes liquidar el saldo total antes de que se procese el remate manual. Si el administrador ejecuta el remate, perderás tus productos y los abonos realizados previamente (${abonadoTexto}).`
        : 'Excelente, tu estado en esta orden quedó al día.';

    const redesText = 'Mantente alerta también a nuestras otras redes sociales oficiales para novedades de próximos lives y anuncios importantes.';

    const detailsHtml = enGracia
        ? `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#0A2A66;">
            ${warningText}
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Orden', value: orden },
                { label: 'Saldo pendiente', value: saldoTexto },
                { label: 'Abono en riesgo', value: `<span style="color:#B42318;font-weight:700;">${abonadoTexto}</span>` },
                { label: 'Estado', value: estadoGraciaHtml }
            ])}
        </table>
    `
        : `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">
            Tu participación en la orden se cerró correctamente sin valores pendientes.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Cliente', value: fullName },
                { label: 'Código', value: codigo },
                { label: 'Orden', value: orden },
                { label: 'Estado de pago', value: 'Pagado' },
                { label: 'Saldo pendiente', value: saldoTexto },
                { label: 'Fecha de cierre', value: cierreTexto },
                { label: 'Fecha límite de pago', value: 'No aplica' }
            ])}
        </table>
    `;

    const text = enGracia
        ? [
            `ÚLTIMA OPORTUNIDAD: Tu orden entró en período de gracia - ${codigo}`,
            `Hola ${fullName}, la ${orden} ha finalizado oficialmente. Debido a que mantienes un saldo pendiente, tu mercancía ha pasado a un período de gracia excepcional.`,
            `Orden: ${orden}`,
            `Saldo pendiente: ${saldoTexto}`,
            `Abono en riesgo: ${abonadoTexto}`,
            'Estado: En Gracia (Pendiente de Remate)',
            warningText,
            'Evita la pérdida de tu inversión. Reporta tu pago ahora mismo.'
        ].join('\n')
        : [
            `Cierre de orden - ${orden}`,
            `Cliente: ${fullName}`,
            `Código: ${codigo}`,
            'Estado de pago: Pagado',
            `Saldo pendiente: ${saldoTexto}`,
            `Fecha de cierre: ${cierreTexto}`,
            'Fecha límite de pago: No aplica',
            warningText,
            redesText
        ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: enGracia
            ? `ÚLTIMA OPORTUNIDAD: Tu orden entró en período de gracia - ${codigo}`
            : 'Orden cerrada sin deuda - Sistema Cherry',
        title: enGracia ? 'Orden en Período de Gracia.' : 'Orden cerrada correctamente',
        introText,
        detailsHtml,
        detailTextLines: enGracia
            ? [
                `Orden: ${orden}`,
                `Saldo pendiente: ${saldoTexto}`,
                `Abono en riesgo: ${abonadoTexto}`,
                'Estado: En Gracia (Pendiente de Remate)'
            ]
            : [
                `Orden: ${orden}`,
                'Estado de pago: Pagado',
                `Saldo pendiente: ${saldoTexto}`,
                'Fecha límite de pago: No aplica',
                redesText
            ],
        highlightText: enGracia ? `<span style="color:#B42318;font-weight:700;">${warningText}</span>` : warningText,
        closingText: enGracia
            ? 'Evita la pérdida de tu inversión. Reporta tu pago ahora mismo.'
            : 'Gracias por mantener tus pagos al día en Sistema Cherry. Mantente pendiente de nuestras redes para nuevos lives.',
        footerText: 'Sistema Cherry · Cierre de orden',
        text
    });
};

module.exports = {
    sendOrderCloseStatusEmail
};
