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
    const isBlocked = estadoTexto === 'bloqueado';
    const fechaLimite = fechaLimitePago
        ? new Date(fechaLimitePago).toISOString().slice(0, 10)
        : 'Sin fecha limite registrada';

    const warningText = isBlocked
        ? 'Tu cuenta esta bloqueada y no puedes hacer compras hasta que tu estado baje al menos a deudor.'
        : 'Si no cancelas a tiempo, puedes perder los abonos realizados y tus compras pueden pasar a remate.';

    const reglaBloqueoTexto = isBlocked
        ? 'Cuando un cliente supera $300 de deuda y no ha abonado, el sistema lo bloquea automaticamente.'
        : 'Evita superar $300 de deuda sin abonos para no pasar a estado bloqueado.';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">
            Registramos saldo pendiente en tu cuenta. Debes cancelar el valor adeudado para evitar penalizaciones.
        </p>
        <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#B42318;font-weight:700;">
            ${warningText}
        </p>
        <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#68473D;">
            ${reglaBloqueoTexto}
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
        warningText,
        reglaBloqueoTexto,
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
            `Deuda total: ${deudaTexto}`,
            warningText
        ],
        highlightText: `${warningText} Si no cancelas, pierdes tus abonos realizados y tus compras pueden ser rematadas.`,
        closingText: 'Realiza el pago cuanto antes y reporta tu abono. Si hoy estas bloqueado, al reducir la deuda podras volver al estado deudor y recuperar compras.',
        footerText: 'Sistema Cherry · Recordatorio de deuda',
        text
    });
};

module.exports = {
    sendDebtReminderEmail
};
