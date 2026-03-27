const { buildDataRows, sendBrandedEmail } = require('./template');

const formatCantidad = (cantidad) => {
    const valor = Number(cantidad);
    if (Number.isNaN(valor)) {
        return cantidad;
    }

    return `$${valor.toFixed(2)}`;
};

const sendAbonoVerificationEmail = async ({
    correoDestino,
    estado,
    nombreCliente,
    codigoCliente,
    nombreOrden,
    cantidad,
    observaciones,
    verificadoPor
}) => {
    const isRejected = estado === 'rechazado';
    const safeNombre = nombreCliente || 'Cliente';
    const safeOrden = nombreOrden || 'Sin orden';
    const safeCodigo = codigoCliente || 'Sin codigo';
    const safeObservaciones = observaciones && observaciones.trim() !== ''
        ? observaciones.trim()
        : 'Sin observaciones';

    const detailsHtml = `
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">
            Tu comprobante de abono para la orden <strong>${safeOrden}</strong> fue
            <strong style="color:${isRejected ? '#B42318' : '#497413'};">${isRejected ? 'rechazado' : 'verificado'}</strong>.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
            ${buildDataRows([
                { label: 'Cliente', value: safeNombre },
                { label: 'Codigo', value: safeCodigo },
                { label: 'Orden', value: safeOrden },
                { label: 'Cantidad reportada', value: formatCantidad(cantidad) },
                { label: 'Procesado por', value: verificadoPor || 'Administracion' },
                { label: 'Observaciones', value: safeObservaciones }
            ])}
        </table>
    `;

    const text = [
        `${isRejected ? 'Comprobante rechazado' : 'Comprobante verificado'} - Sistema Cherry`,
        `Cliente: ${safeNombre}`,
        `Codigo: ${safeCodigo}`,
        `Orden: ${safeOrden}`,
        `Cantidad reportada: ${formatCantidad(cantidad)}`,
        `Procesado por: ${verificadoPor || 'Administracion'}`,
        `Observaciones: ${safeObservaciones}`,
        isRejected
            ? 'Por favor corrige el comprobante y vuelve a subirlo.'
            : 'Tu abono ya fue aplicado correctamente en el sistema.'
    ].join('\n');

    await sendBrandedEmail({
        to: correoDestino,
        subject: isRejected
            ? 'Comprobante de abono rechazado - Sistema Cherry'
            : 'Comprobante de abono verificado - Sistema Cherry',
        title: isRejected ? 'Comprobante rechazado' : 'Comprobante verificado',
        introText: isRejected
            ? `Hola ${safeNombre}, revisamos tu comprobante y no pudo ser aprobado.`
            : `Hola ${safeNombre}, te confirmamos que tu comprobante fue aprobado.`,
        detailsHtml,
        detailTextLines: [
            `Orden: ${safeOrden}`,
            `Cantidad reportada: ${formatCantidad(cantidad)}`,
            `Observaciones: ${safeObservaciones}`
        ],
        highlightText: isRejected
            ? 'Debes revisar las observaciones y cargar un nuevo comprobante.'
            : 'Tu abono fue acreditado y refleja el estado actualizado de tu pago.',
        closingText: isRejected
            ? 'Si necesitas ayuda, contacta al administrador que gestiona tu cuenta.'
            : 'Gracias por mantener tus pagos al dia.',
        footerText: 'Sistema Cherry · Verificacion de abonos',
        text
    });
};

module.exports = {
    sendAbonoVerificationEmail
};
