const { buildDataRows, sendBrandedEmail } = require('./template');

const formatMonto = (monto) => {
    const valor = Number(monto);
    if (Number.isNaN(valor)) {
        return monto;
    }

    return `$${valor.toFixed(2)}`;
};

const formatFecha = (fecha) => {
    if (!fecha) {
        return null;
    }

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString().slice(0, 10);
};

const sendDebtReminderEmail = async ({
    correoDestino,
    nombreCliente,
    codigoCliente,
    estadoActividad,
    deudaTotal,
    nombreOrden,
    totalCompraOrden,
    fechaFinOrden
}) => {
    const fullName = nombreCliente || 'Cliente';
    const codigo = codigoCliente || 'Sin codigo';
    const orden = nombreOrden || 'Orden pendiente';
    const deudaTexto = formatMonto(deudaTotal);
    const totalCompraTexto = formatMonto(totalCompraOrden);
    const estadoTexto = (estadoActividad || 'deudor').toLowerCase();
    const isBlocked = estadoTexto === 'bloqueado';
    const fechaLimite = formatFecha(fechaFinOrden) || 'Contacta hoy a administración para confirmar la fecha exacta de cierre';
    const estadoColor = isBlocked ? '#B42318' : '#B54708';
    const estadoEtiqueta = isBlocked ? 'Bloqueado / En riesgo de remate' : 'Deudor';

    const title = isBlocked ? 'AVISO DE BLOQUEO Y REMATE' : 'Regularización de cuenta';
    const subject = isBlocked
        ? `¡AVISO CRÍTICO! Riesgo de remate de productos - ${codigo}`
        : `Recordatorio de saldo pendiente - ${codigo}`;

    const introText = isBlocked
        ? `Hola ${fullName}, tu cuenta se encuentra BLOQUEADA.`
        : `Hola ${fullName}, te informamos que registras un saldo pendiente de ${deudaTexto}.`;

    const bodyText = isBlocked
        ? `Si la deuda no es cancelada antes del cierre de la orden (${fechaLimite}), tus productos serán liberados para REMATE sin derecho a reclamo posterior.`
        : 'Por favor, realiza tu abono para mantener los beneficios de tu cuenta y asegurar que tus próximas compras se procesen sin demoras.';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#0A2A66;font-weight:${isBlocked ? '400' : '700'};">
            ${bodyText}
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:${isBlocked ? '#B42318' : '#B54708'};font-weight:700;">
            ${isBlocked ? 'Aún estás a tiempo de recuperar tu mercancía. Realiza el pago de inmediato.' : 'Evita pasar a estado bloqueado realizando tu abono hoy.'}
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Cliente', value: fullName },
                { label: 'Código', value: codigo },
                { label: 'Estado de actividad', value: `<span style="color:${estadoColor};font-weight:700;">${estadoEtiqueta}</span>` },
                { label: 'Orden con deuda', value: orden },
                { label: 'Total de compra', value: isBlocked ? null : totalCompraTexto },
                { label: 'Deuda total', value: deudaTexto },
                {
                    label: 'Fecha límite de pago',
                    value: isBlocked
                        ? `<span style="color:#B42318;font-weight:700;">${fechaLimite}</span>`
                        : fechaLimite
                }
            ])}
        </table>
    `;

    const text = [
        title,
        `Cliente: ${fullName}`,
        `Código: ${codigo}`,
        `Estado de actividad: ${estadoEtiqueta}`,
        `Orden con deuda: ${orden}`,
        ...(isBlocked ? [] : [`Total de compra: ${totalCompraTexto}`]),
        `Deuda total: ${deudaTexto}`,
        `Fecha límite de pago: ${fechaLimite}`,
        bodyText,
        isBlocked
            ? 'Aún estás a tiempo de recuperar tu mercancía. Realiza el pago de inmediato.'
            : 'Evita pasar a estado bloqueado realizando tu abono hoy.'
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject,
        title,
        introText,
        detailsHtml,
        detailTextLines: [
            `Orden con deuda: ${orden}`,
            ...(isBlocked ? [] : [`Total de compra: ${totalCompraTexto}`]),
            `Deuda total: ${deudaTexto}`,
            `Fecha límite de pago: ${fechaLimite}`
        ],
        highlightText: isBlocked
            ? 'Si no cancelas antes del cierre de la orden, tus productos entrarán en remate.'
            : '',
        closingText: isBlocked
            ? ''
            : '',
        footerText: 'Sistema Cherry · Recordatorio de deuda',
        text
    });
};

module.exports = {
    sendDebtReminderEmail
};
