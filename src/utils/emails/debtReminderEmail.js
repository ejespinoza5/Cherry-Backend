const { buildDataRows, sendBrandedEmail } = require('./template');

const formatMonto = (monto) => {
    const valor = Number(monto);
    if (Number.isNaN(valor)) {
        return monto;
    }

    return `$${valor.toFixed(2)}`;
};

const sendDebtReminderEmail = async ({
    correoDestino,
    nombreCliente,
    codigoCliente,
    estadoActividad,
    deudaTotal,
    nombreOrden,
    saldoOrden,
    fechaLimitePago
}) => {
    const fullName = nombreCliente || 'Cliente';
    const codigo = codigoCliente || 'Sin codigo';
    const orden = nombreOrden || 'Orden pendiente';
    const deudaTexto = formatMonto(deudaTotal);
    const saldoOrdenTexto = formatMonto(saldoOrden);
    const estadoTexto = (estadoActividad || 'deudor').toLowerCase();
    const fechaLimite = fechaLimitePago
        ? new Date(fechaLimitePago).toISOString().slice(0, 10)
        : 'Sin fecha limite registrada';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">
            Registramos saldo pendiente en tu cuenta. Debes cancelar el valor adeudado para evitar penalizaciones.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Cliente', value: fullName },
                { label: 'Codigo', value: codigo },
                { label: 'Estado de actividad', value: estadoTexto },
                { label: 'Orden con deuda', value: orden },
                { label: 'Saldo de la orden', value: saldoOrdenTexto },
                { label: 'Deuda total', value: deudaTexto },
                { label: 'Fecha limite de pago', value: fechaLimite }
            ])}
        </table>
    `;

    const text = [
        'Recordatorio de pago pendiente - Sistema Cherry',
        `Cliente: ${fullName}`,
        `Codigo: ${codigo}`,
        `Estado de actividad: ${estadoTexto}`,
        `Orden con deuda: ${orden}`,
        `Saldo de la orden: ${saldoOrdenTexto}`,
        `Deuda total: ${deudaTexto}`,
        `Fecha limite de pago: ${fechaLimite}`,
        'Si no cancelas a tiempo, puedes perder los abonos realizados y tus compras pueden pasar a remate.'
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: 'Recordatorio de deuda pendiente - Sistema Cherry',
        title: 'Recordatorio de pago pendiente',
        introText: `Hola ${fullName}, este es un recordatorio importante sobre tu deuda pendiente.`,
        detailsHtml,
        detailTextLines: [
            `Orden con deuda: ${orden}`,
            `Saldo de la orden: ${saldoOrdenTexto}`,
            `Deuda total: ${deudaTexto}`
        ],
        highlightText: 'Si no cancelas, pierdes tus abonos realizados y tus compras pueden ser rematadas.',
        closingText: 'Realiza el pago cuanto antes y reporta tu abono para evitar bloqueos o remates.',
        footerText: 'Sistema Cherry · Recordatorio de deuda',
        text
    });
};

module.exports = {
    sendDebtReminderEmail
};
