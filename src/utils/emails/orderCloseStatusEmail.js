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
    fechaCierre,
    fechaLimitePago
}) => {
    const fullName = nombreCliente || 'Cliente';
    const codigo = codigoCliente || 'Sin codigo';
    const orden = nombreOrden || 'Orden';
    const saldoTexto = formatMonto(saldoPendiente);
    const cierreTexto = formatFecha(fechaCierre);
    const limiteTexto = formatFecha(fechaLimitePago);
    const enGracia = estadoPago === 'en_gracia';

    const introText = enGracia
        ? `Hola ${fullName}, la orden ${orden} fue cerrada y tu cuenta quedo con saldo pendiente.`
        : `Hola ${fullName}, la orden ${orden} fue cerrada y no tienes deuda pendiente en esta orden.`;

    const warningText = enGracia
        ? 'Tu orden esta en periodo de gracia. Debes cancelar antes de la fecha limite para evitar remate de tus compras y perdida de abonos.'
        : 'Excelente, tu estado en esta orden quedo al dia.';

    const redesText = 'Mantente alerta a nuestras otras redes sociales oficiales para novedades de proximos lives y anuncios importantes.';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">${enGracia
            ? 'Tu orden continua en periodo de gracia hasta regularizar tu pago.'
            : 'Tu participacion en la orden se cerro correctamente sin valores pendientes.'}
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Cliente', value: fullName },
                { label: 'Codigo', value: codigo },
                { label: 'Orden', value: orden },
                { label: 'Estado de pago', value: enGracia ? 'En gracia' : 'Pagado' },
                { label: 'Saldo pendiente', value: saldoTexto },
                { label: 'Fecha de cierre', value: cierreTexto },
                { label: 'Fecha limite de pago', value: enGracia ? limiteTexto : 'No aplica' }
            ])}
        </table>
    `;

    const text = [
        `Cierre de orden - ${orden}`,
        `Cliente: ${fullName}`,
        `Codigo: ${codigo}`,
        `Estado de pago: ${enGracia ? 'En gracia' : 'Pagado'}`,
        `Saldo pendiente: ${saldoTexto}`,
        `Fecha de cierre: ${cierreTexto}`,
        `Fecha limite de pago: ${enGracia ? limiteTexto : 'No aplica'}`,
        warningText,
        redesText
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: enGracia
            ? 'Orden cerrada en periodo de gracia - Sistema Cherry'
            : 'Orden cerrada sin deuda - Sistema Cherry',
        title: enGracia ? 'Orden cerrada en gracia' : 'Orden cerrada correctamente',
        introText,
        detailsHtml,
        detailTextLines: [
            `Orden: ${orden}`,
            `Estado de pago: ${enGracia ? 'En gracia' : 'Pagado'}`,
            `Saldo pendiente: ${saldoTexto}`,
            `Fecha limite de pago: ${enGracia ? limiteTexto : 'No aplica'}`,
            redesText
        ],
        highlightText: `${warningText} ${redesText}`,
        closingText: enGracia
            ? 'Reporta tu abono cuanto antes para evitar remate automatico de tus compras y mantente pendiente de nuestras redes.'
            : 'Gracias por mantener tus pagos al dia en Sistema Cherry. Mantente pendiente de nuestras redes para nuevos lives.',
        footerText: 'Sistema Cherry · Cierre de orden',
        text
    });
};

module.exports = {
    sendOrderCloseStatusEmail
};
