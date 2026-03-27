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
    saldoOrden,
    fechaFinOrden
}) => {
    const fullName = nombreCliente || 'Cliente';
    const codigo = codigoCliente || 'Sin codigo';
    const orden = nombreOrden || 'Orden pendiente';
    const deudaTexto = formatMonto(deudaTotal);
    const saldoOrdenTexto = formatMonto(saldoOrden);
    const estadoTexto = (estadoActividad || 'deudor').toLowerCase();
    const isBlocked = estadoTexto === 'bloqueado';
    const fechaLimite = formatFecha(fechaFinOrden) || 'Contacta hoy a administracion para confirmar la fecha exacta de cierre';
    const estadoColor = isBlocked ? '#B42318' : '#B54708';
    const estadoEtiqueta = isBlocked ? 'Bloqueado / En riesgo de remate' : 'Deudor';

    const introText = isBlocked
        ? `AVISO CRITICO: Tu cuenta se encuentra bloqueada. Debes pagar antes del ${fechaLimite} para evitar el remate de tus productos.`
        : `Te informamos que tu cuenta registra un saldo pendiente de ${deudaTexto}. Para mantener los beneficios de tu cuenta, regulariza tu pago a la brevedad.`;

    const warningText = isBlocked
        ? `AVISO CRITICO: Si la deuda no es cancelada antes del cierre de la orden (${fechaLimite}), tus productos seran liberados para ${'<strong style="color:#B42318;">REMATE</strong>'} sin derecho a reclamo posterior.`
        : 'Regulariza tu saldo para evitar bloqueos y asegurar que tus proximas compras se procesen sin demoras.';

    const consecuenciaText = isBlocked
        ? 'Tienes hasta la fecha de cierre de la orden para recuperar tu mercancia.'
        : 'Evita superar el limite de deuda para no pasar a estado bloqueado.';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">
            ${isBlocked
                ? `Tu cuenta esta en estado bloqueado y requiere accion inmediata para evitar el remate de tus compras.`
                : `Registramos saldo pendiente en tu cuenta. Debes cancelar el valor adeudado para evitar penalizaciones.`}
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#B42318;font-weight:700;">
            ${warningText}
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#68473D;">
            ${consecuenciaText}
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Cliente', value: fullName },
                { label: 'Codigo', value: codigo },
                { label: 'Estado de actividad', value: `<span style="color:${estadoColor};font-weight:700;">${estadoEtiqueta}</span>` },
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
        `Estado de actividad: ${estadoEtiqueta}`,
        `Orden con deuda: ${orden}`,
        `Saldo de la orden: ${saldoOrdenTexto}`,
        `Deuda total: ${deudaTexto}`,
        `Fecha limite de pago: ${fechaLimite}`,
        warningText,
        consecuenciaText
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: 'Recordatorio de deuda pendiente - Sistema Cherry',
        title: 'Recordatorio de pago pendiente',
        introText: `Hola ${fullName}, ${introText}`,
        detailsHtml,
        detailTextLines: [
            `Orden con deuda: ${orden}`,
            `Saldo de la orden: ${saldoOrdenTexto}`,
            `Deuda total: ${deudaTexto}`,
            `Fecha limite de pago: ${fechaLimite}`
        ],
        highlightText: isBlocked
            ? 'Si no cancelas antes del cierre de la orden, tus productos entraran en remate.'
            : 'Paga cuanto antes para mantener tu cuenta habilitada y evitar restricciones.',
        closingText: isBlocked
            ? 'Aun estas a tiempo de regularizar tu cuenta y evitar el remate.'
            : 'Reporta tu abono apenas realices el pago para actualizar tu estado.',
        footerText: 'Sistema Cherry · Recordatorio de deuda',
        text
    });
};

module.exports = {
    sendDebtReminderEmail
};
