const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class PDFService {
    /**
     * Convertir imagen WebP a JPEG buffer
     */
    static async convertirImagenParaPDF(imagePath) {
        try {
            if (!fs.existsSync(imagePath)) {
                return null;
            }

            if (imagePath.toLowerCase().endsWith('.webp')) {
                // Convertir WebP a JPEG
                const buffer = await sharp(imagePath)
                    .resize(50, 70, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 85 })
                    .toBuffer();
                return buffer;
            } else {
                // JPEG o PNG - redimensionar para optimizar
                const buffer = await sharp(imagePath)
                    .resize(50, 70, { fit: 'inside', withoutEnlargement: true })
                    .toBuffer();
                return buffer;
            }
        } catch (error) {
            return null;
        }
    }

    /**
     * Generar PDF de productos de un cliente
     */
    static async generarPDFProductosCliente(data) {
        // Pre-procesar todas las imágenes ANTES de generar el PDF
        const imagenesCache = new Map();
        
        for (const orden of data.ordenes) {
            for (const producto of orden.productos) {
                if (producto.imagen_producto && !imagenesCache.has(producto.imagen_producto)) {
                    let imagenRelativa = producto.imagen_producto;
                    if (imagenRelativa.startsWith('/')) {
                        imagenRelativa = imagenRelativa.substring(1);
                    }
                    const imagePath = path.join(__dirname, '../../', imagenRelativa);
                    const imageBuffer = await this.convertirImagenParaPDF(imagePath);
                    imagenesCache.set(producto.imagen_producto, imageBuffer);
                }
            }
        }

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ 
                    margin: 50,
                    size: 'LETTER'
                });

                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => {
                    // Limpiar caché de imágenes
                    imagenesCache.clear();
                    resolve(Buffer.concat(chunks));
                });
                doc.on('error', reject);

                // Colores basados en el logo Cherry (rosa/fucsia)
                const primaryColor = '#E91E63'; // Rosa principal
                const secondaryColor = '#C2185B'; // Rosa oscuro
                const textColor = '#333333';
                const lightGray = '#F5F5F5';
                const borderColor = '#DDDDDD';

                // HEADER - Logo más grande y a la derecha
                const logoPath = path.join(__dirname, '../../public/images/logo_cherry.png');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 70, 30, { width: 120 });
                }

                // Título centrado y más grande
                doc.fontSize(16)
                   .fillColor(primaryColor)
                   .font('Helvetica-Bold')
                   .text('Sistema de Gestión de Productos', 160, 50, { align: 'center', width: 352 });

                // Banda decorativa con degradado
                doc.rect(50, 85, 512, 35)
                   .fillAndStroke(primaryColor, primaryColor);

                doc.fontSize(20)
                   .fillColor('#FFFFFF')
                   .font('Helvetica-Bold')
                   .text('FACTURA GENERADA', 50, 95, { align: 'center', width: 512 });

                // Fecha de emisión
                doc.fontSize(9)
                   .fillColor(textColor)
                   .font('Helvetica')
                   .text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO', { 
                       year: 'numeric', 
                       month: 'long', 
                       day: 'numeric'
                   })}`, 50, 130, { align: 'right', width: 512 });

                // INFORMACIÓN DEL CLIENTE - 2 columnas
                let yPosition = 155;
                
                doc.rect(50, yPosition, 512, 85)
                   .fillAndStroke(lightGray, borderColor);

                doc.fontSize(12)
                   .fillColor(primaryColor)
                   .font('Helvetica-Bold')
                   .text('INFORMACIÓN DEL CLIENTE', 60, yPosition + 10);

                // Columna izquierda
                yPosition += 35;
                doc.fontSize(10)
                   .fillColor(textColor)
                   .font('Helvetica-Bold')
                   .text('Cliente:', 60, yPosition)
                   .font('Helvetica')
                   .text(`${data.cliente.nombre} ${data.cliente.apellido}`, 120, yPosition);

                yPosition += 18;
                doc.font('Helvetica-Bold')
                   .text('Código:', 60, yPosition)
                   .font('Helvetica')
                   .text(data.cliente.codigo || 'N/A', 120, yPosition);

                // Columna derecha
                const rightColX = 310;
                yPosition = 190; // Resetear a la misma altura que columna izquierda
                
                doc.font('Helvetica-Bold')
                   .text('Dirección:', rightColX, yPosition)
                   .font('Helvetica')
                   .text(data.cliente.direccion || 'N/A', rightColX + 70, yPosition, { width: 180 });

                yPosition += 18;
                doc.font('Helvetica-Bold')
                   .text('Correo:', rightColX, yPosition)
                   .font('Helvetica')
                   .text(data.cliente.correo || 'N/A', rightColX + 70, yPosition, { width: 180 });

                // TABLA DE PRODUCTOS
                yPosition = 260;

                // Encabezado de tabla
                doc.rect(50, yPosition, 512, 25)
                   .fillAndStroke(primaryColor, primaryColor);

                doc.fontSize(9)
                   .fillColor('#FFFFFF')
                   .font('Helvetica-Bold')
                   .text('Imagen', 55, yPosition + 8, { width: 50, align: 'center' })
                   .text('Cant.', 110, yPosition + 8, { width: 30, align: 'center' })
                   .text('Detalle', 145, yPosition + 8, { width: 155 })
                   .text('Fecha', 305, yPosition + 8, { width: 45, align: 'center' })
                   .text('Precio', 355, yPosition + 8, { width: 50, align: 'right' })
                   .text('Com.', 410, yPosition + 8, { width: 45, align: 'right' })
                   .text('Total', 460, yPosition + 8, { width: 55, align: 'right' });

                yPosition += 25;

                // Productos
                let altRow = false;
                for (const orden of data.ordenes) {
                    for (const producto of orden.productos) {
                        // Verificar si necesitamos nueva página
                        if (yPosition > 680) {
                            doc.addPage();
                            yPosition = 50;
                            
                            // Re-dibujar encabezado de tabla
                            doc.rect(50, yPosition, 512, 25)
                               .fillAndStroke(primaryColor, primaryColor);

                            doc.fontSize(9)
                               .fillColor('#FFFFFF')
                               .font('Helvetica-Bold')
                               .text('Imagen', 55, yPosition + 8, { width: 50, align: 'center' })
                               .text('Cant.', 110, yPosition + 8, { width: 30, align: 'center' })
                               .text('Detalle', 145, yPosition + 8, { width: 155 })
                               .text('Fecha', 305, yPosition + 8, { width: 45, align: 'center' })
                               .text('Precio', 355, yPosition + 8, { width: 50, align: 'right' })
                               .text('Com.', 410, yPosition + 8, { width: 45, align: 'right' })
                               .text('Total', 460, yPosition + 8, { width: 55, align: 'right' });

                            yPosition += 25;
                            altRow = false;
                        }

                        const rowHeight = producto.imagen_producto ? 60 : 25;
                        
                        // Fondo alternado
                        if (altRow) {
                            doc.rect(50, yPosition, 512, rowHeight)
                               .fillAndStroke(lightGray, borderColor);
                        } else {
                            doc.rect(50, yPosition, 512, rowHeight)
                               .stroke(borderColor);
                        }

                        // Centrar texto verticalmente en la fila
                        const textYPosition = producto.imagen_producto ? yPosition + 26 : yPosition + 8;
                        const subtotal = producto.valor_etiqueta * producto.cantidad_articulos;
                        const total = subtotal + producto.comision;

                        // Imagen del producto (si existe)
                        if (producto.imagen_producto) {
                            const imageBuffer = imagenesCache.get(producto.imagen_producto);
                            
                            if (imageBuffer) {
                                try {
                                    doc.image(imageBuffer, 55, yPosition + 3, { 
                                        width: 50, 
                                        height: 54,
                                        fit: [50, 54],
                                        align: 'center',
                                        valign: 'center'
                                    });
                                } catch (error) {
                                    // Si falla, no mostrar nada (espacio vacío)
                                }
                            } else {
                                // Si no se pudo convertir la imagen, dejar espacio vacío
                            }
                        } else {
                            // Sin imagen en BD, dejar espacio vacío
                        }

                        // Datos del producto
                        doc.fontSize(9)
                           .fillColor(textColor)
                           .font('Helvetica-Bold')
                           .text(producto.cantidad_articulos, 110, textYPosition, { width: 30, align: 'center' });

                        doc.font('Helvetica')
                           .text(producto.detalles, 145, textYPosition, { 
                               width: 155,
                               ellipsis: true,
                               height: rowHeight - 20 
                           });

                        // Fecha formateada
                        const fecha = new Date(producto.created_at);
                        const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
                        doc.fontSize(8)
                           .fillColor(textColor)
                           .text(fechaFormateada, 305, textYPosition, { width: 45, align: 'center' });

                        doc.fontSize(9)
                           .text(`$${producto.valor_etiqueta.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                               355, textYPosition, { width: 50, align: 'right' });
                        
                        doc.text(`$${producto.comision.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                               410, textYPosition, { width: 45, align: 'right' });
                        
                        doc.font('Helvetica-Bold')
                           .text(`$${total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                               460, textYPosition, { width: 55, align: 'right' });

                        yPosition += rowHeight;
                        altRow = !altRow;
                    }
                }

                // TOTALES
                yPosition += 10;

                // Verificar si hay espacio para totales (necesitamos ~160px)
                if (yPosition > 600) {
                    doc.addPage();
                    yPosition = 50;
                }

                // Subtotal
                doc.rect(350, yPosition, 212, 20)
                   .stroke(borderColor);
                doc.fontSize(10)
                   .fillColor(textColor)
                   .font('Helvetica-Bold')
                   .text('Subtotal:', 360, yPosition + 6)
                   .text(`$${parseFloat(data.subtotal_general).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                       450, yPosition + 6, { width: 100, align: 'right' });

                yPosition += 20;

                // Impuesto
                doc.rect(350, yPosition, 212, 20)
                   .stroke(borderColor);
                doc.font('Helvetica-Bold')
                   .text(`Impuesto (${data.impuesto}):`, 360, yPosition + 6)
                   .text(`$${parseFloat(data.impuesto_aplicado).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                       450, yPosition + 6, { width: 100, align: 'right' });

                yPosition += 20;

                // Total con impuestos
                doc.rect(350, yPosition, 212, 20)
                   .stroke(borderColor);
                doc.font('Helvetica-Bold')
                   .text('Total con Impuestos:', 360, yPosition + 6)
                   .text(`$${parseFloat(data.total_con_impuestos).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                       450, yPosition + 6, { width: 100, align: 'right' });

                yPosition += 20;

                // Comisiones
                doc.rect(350, yPosition, 212, 20)
                   .stroke(borderColor);
                doc.font('Helvetica-Bold')
                   .text('Total Comisiones:', 360, yPosition + 6)
                   .text(`$${parseFloat(data.total_comisiones_general).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                       450, yPosition + 6, { width: 100, align: 'right' });

                yPosition += 20;

                // TOTAL FINAL - Centrado vertical perfecto
                doc.rect(350, yPosition, 212, 30)
                   .fillAndStroke(secondaryColor, secondaryColor);
                doc.fontSize(12)
                   .fillColor('#FFFFFF')
                   .font('Helvetica-Bold')
                   .text('TOTAL:', 360, yPosition + 10)
                   .text(`$${parseFloat(data.total_general).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                       450, yPosition + 10, { width: 100, align: 'right' });

                // RESUMEN
                yPosition += 45;
                doc.fontSize(9)
                   .fillColor(textColor)
                   .font('Helvetica')
                   .text(`Total de productos: ${data.total_productos}`, 50, yPosition);

                // FOOTER - Dinámico
                yPosition += 25;
                doc.fontSize(8)
                   .fillColor('#999999')
                   .font('Helvetica-Oblique')
                   .text('Documento generado por Cherry', 50, yPosition, { align: 'center', width: 512 });

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFService;
