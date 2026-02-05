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

                // HEADER - Logo y título
                const logoPath = path.join(__dirname, '../../public/images/logo_cherry.png');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 50, 45, { width: 80 });
                }

                doc.fontSize(24)
                   .fillColor(primaryColor)
                   .font('Helvetica-Bold')
                   .text('CHERRY', 140, 55);

                doc.fontSize(10)
                   .fillColor(textColor)
                   .font('Helvetica')
                   .text('Sistema de Gestión de Productos', 140, 82);

                // Línea decorativa
                doc.moveTo(50, 110)
                   .lineTo(562, 110)
                   .strokeColor(primaryColor)
                   .lineWidth(2)
                   .stroke();

                // TÍTULO DEL DOCUMENTO
                doc.fontSize(18)
                   .fillColor(secondaryColor)
                   .font('Helvetica-Bold')
                   .text('DETALLE DE PRODUCTOS', 50, 130, { align: 'center' });

                // INFORMACIÓN DEL CLIENTE
                let yPosition = 170;
                
                doc.rect(50, yPosition, 512, 90)
                   .fillAndStroke(lightGray, borderColor);

                doc.fontSize(12)
                   .fillColor(primaryColor)
                   .font('Helvetica-Bold')
                   .text('INFORMACIÓN DEL CLIENTE', 60, yPosition + 10);

                yPosition += 30;
                doc.fontSize(10)
                   .fillColor(textColor)
                   .font('Helvetica-Bold')
                   .text('Cliente:', 60, yPosition)
                   .font('Helvetica')
                   .text(`${data.cliente.nombre} ${data.cliente.apellido}`, 140, yPosition);

                yPosition += 15;
                doc.font('Helvetica-Bold')
                   .text('Código:', 60, yPosition)
                   .font('Helvetica')
                   .text(data.cliente.codigo || 'N/A', 140, yPosition);

                yPosition += 15;
                doc.fillColor(textColor)
                   .font('Helvetica-Bold')
                   .text('Dirección:', 60, yPosition)
                   .font('Helvetica')
                   .text(data.cliente.direccion || 'N/A', 140, yPosition, { width: 400 });

                // TABLA DE PRODUCTOS
                yPosition = 280;

                // Encabezado de tabla
                doc.rect(50, yPosition, 512, 25)
                   .fillAndStroke(primaryColor, primaryColor);

                doc.fontSize(9)
                   .fillColor('#FFFFFF')
                   .font('Helvetica-Bold')
                   .text('Imagen', 55, yPosition + 8, { width: 50, align: 'center' })
                   .text('Cant.', 110, yPosition + 8, { width: 30, align: 'center' })
                   .text('Detalle', 145, yPosition + 8, { width: 155 })
                   .text('Precio', 305, yPosition + 8, { width: 65, align: 'right' })
                   .text('Comisión', 375, yPosition + 8, { width: 70, align: 'right' })
                   .text('Total', 450, yPosition + 8, { width: 100, align: 'right' });

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
                               .text('Precio', 305, yPosition + 8, { width: 65, align: 'right' })
                               .text('Comisión', 375, yPosition + 8, { width: 70, align: 'right' })
                               .text('Total', 450, yPosition + 8, { width: 100, align: 'right' });

                            yPosition += 25;
                            altRow = false;
                        }

                        const rowHeight = producto.imagen_producto ? 80 : 30;
                        
                        // Fondo alternado
                        if (altRow) {
                            doc.rect(50, yPosition, 512, rowHeight)
                               .fillAndStroke(lightGray, borderColor);
                        } else {
                            doc.rect(50, yPosition, 512, rowHeight)
                               .stroke(borderColor);
                        }

                        const textYPosition = producto.imagen_producto ? yPosition + 30 : yPosition + 10;
                        const subtotal = producto.valor_etiqueta * producto.cantidad_articulos;
                        const total = subtotal + producto.comision;

                        // Imagen del producto (si existe)
                        if (producto.imagen_producto) {
                            const imageBuffer = imagenesCache.get(producto.imagen_producto);
                            
                            if (imageBuffer) {
                                try {
                                    doc.image(imageBuffer, 55, yPosition + 5, { 
                                        width: 50, 
                                        height: 70,
                                        fit: [50, 70],
                                        align: 'center',
                                        valign: 'center'
                                    });
                                } catch (error) {
                                    // Si falla, mostrar rectángulo con texto
                                    doc.rect(55, yPosition + 5, 50, 70)
                                       .stroke('#DDDDDD');
                                    doc.fontSize(7)
                                       .fillColor('#999999')
                                       .font('Helvetica')
                                       .text('Sin imagen', 55, yPosition + 32, { width: 50, align: 'center' });
                                }
                            } else {
                                // Si no se pudo convertir la imagen, mostrar rectángulo con texto
                                doc.rect(55, yPosition + 5, 50, 70)
                                   .stroke('#DDDDDD');
                                doc.fontSize(7)
                                   .fillColor('#999999')
                                   .font('Helvetica')
                                   .text('Sin imagen', 55, yPosition + 32, { width: 50, align: 'center' });
                            }
                        } else {
                            // Sin imagen en BD, mostrar rectángulo vacío
                            doc.rect(55, yPosition + 5, 50, 70)
                               .stroke('#DDDDDD');
                            doc.fontSize(7)
                               .fillColor('#999999')
                               .font('Helvetica')
                               .text('Sin imagen', 55, yPosition + 32, { width: 50, align: 'center' });
                        }

                        // Datos del producto
                        doc.fontSize(9)
                           .fillColor(textColor)
                           .font('Helvetica-Bold')
                           .text(producto.cantidad_articulos, 110, textYPosition, { width: 30, align: 'center' });

                        doc.font('Helvetica')
                           .text(producto.detalles, 145, textYPosition, { 
                               width: 155, 
                               height: rowHeight - 20 
                           });

                        doc.text(`$${producto.valor_etiqueta.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                               305, textYPosition, { width: 65, align: 'right' });
                        
                        doc.text(`$${producto.comision.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                               375, textYPosition, { width: 70, align: 'right' });
                        
                        doc.font('Helvetica-Bold')
                           .text(`$${total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                               450, textYPosition, { width: 100, align: 'right' });

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
                   .font('Helvetica')
                   .text(`$${parseFloat(data.subtotal_general).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                       450, yPosition + 6, { width: 100, align: 'right' });

                yPosition += 20;

                // Impuesto
                doc.rect(350, yPosition, 212, 20)
                   .stroke(borderColor);
                doc.font('Helvetica-Bold')
                   .text(`Impuesto (${data.impuesto}):`, 360, yPosition + 6)
                   .font('Helvetica')
                   .text(`$${parseFloat(data.impuesto_aplicado).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                       450, yPosition + 6, { width: 100, align: 'right' });

                yPosition += 20;

                // Total con impuestos
                doc.rect(350, yPosition, 212, 20)
                   .stroke(borderColor);
                doc.font('Helvetica-Bold')
                   .text('Total con Impuestos:', 360, yPosition + 6)
                   .font('Helvetica')
                   .text(`$${parseFloat(data.total_con_impuestos).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 
                       450, yPosition + 6, { width: 100, align: 'right' });

                yPosition += 20;

                // Comisiones
                doc.rect(350, yPosition, 212, 20)
                   .stroke(borderColor);
                doc.font('Helvetica-Bold')
                   .text('Total Comisiones:', 360, yPosition + 6)
                   .font('Helvetica')
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
                   .font('Helvetica')
                   .text(`Documento generado el ${new Date().toLocaleDateString('es-CO', { 
                       year: 'numeric', 
                       month: 'long', 
                       day: 'numeric',
                       hour: '2-digit',
                       minute: '2-digit'
                   })}`, 50, yPosition, { align: 'center', width: 512 });

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFService;
