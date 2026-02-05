const ProductoService = require('../services/productoService');
const PDFService = require('../services/pdfService');
const { deleteImage } = require('../middlewares/upload');

/**
 * Obtener todos los productos
 */
const getAllProductos = async (req, res) => {
    try {
        const { id_orden, id_cliente } = req.query;

        const filters = {};
        if (id_orden) filters.id_orden = id_orden;
        if (id_cliente) filters.id_cliente = id_cliente;

        const productos = await ProductoService.getAllProductos(filters);

        res.json({
            success: true,
            data: productos,
            count: productos.length
        });

    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener producto por ID
 */
const getProductoById = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await ProductoService.getProductoById(id);

        res.json({
            success: true,
            data: producto
        });

    } catch (error) {
        console.error('Error al obtener producto:', error);

        if (error.message === 'PRODUCT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Crear nuevo producto
 */
const createProducto = async (req, res) => {
    try {
        const { 
            id_cliente, 
            id_orden, 
            cantidad_articulos, 
            detalles, 
            valor_etiqueta, 
            comision,
            observacion, 
            estado 
        } = req.body;
        const createdBy = req.user.id;

        // Si se subió una imagen, usar la ruta procesada por sharp
        const imagen_producto = req.imageUrl || req.body.imagen_producto || null;

        const producto = await ProductoService.createProducto(
            { 
                id_cliente, 
                id_orden, 
                cantidad_articulos, 
                detalles, 
                valor_etiqueta, 
                comision,
                imagen_producto, 
                observacion, 
                estado 
            },
            createdBy
        );

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: producto
        });

    } catch (error) {
        console.error('Error al crear producto:', error);

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'La orden especificada no existe o está inactiva'
            });
        }

        if (error.message === 'CLIENT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'El cliente especificado no existe o está inactivo'
            });
        }

        if (error.message === 'CLIENT_BLOCKED') {
            return res.status(403).json({
                success: false,
                message: 'El cliente está bloqueado por exceder el límite de deuda permitido ($300). No puede realizar nuevas compras.'
            });
        }

        if (error.message === 'INVALID_QUANTITY') {
            return res.status(400).json({
                success: false,
                message: 'La cantidad de artículos debe ser al menos 1'
            });
        }

        if (error.message === 'DETAILS_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'Los detalles del producto son requeridos'
            });
        }

        if (error.message === 'INVALID_PRICE') {
            return res.status(400).json({
                success: false,
                message: 'El valor de la etiqueta no puede ser negativo'
            });
        }

        if (error.message === 'INVALID_COMMISSION') {
            return res.status(400).json({
                success: false,
                message: 'La comisión no puede ser negativa'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Actualizar producto
 */
const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            id_cliente, 
            id_orden, 
            cantidad_articulos, 
            detalles, 
            valor_etiqueta, 
            comision,
            observacion, 
            estado 
        } = req.body;
        const updatedBy = req.user.id;

        // Si se subió una nueva imagen
        let imagen_producto = req.body.imagen_producto;
        if (req.imageUrl) {
            // Obtener el producto actual para eliminar la imagen antigua
            const productoActual = await ProductoService.getProductoById(id);
            if (productoActual.imagen_producto) {
                await deleteImage(productoActual.imagen_producto);
            }
            imagen_producto = req.imageUrl;
        }

        const producto = await ProductoService.updateProducto(
            id,
            { 
                id_cliente, 
                id_orden, 
                cantidad_articulos, 
                detalles, 
                valor_etiqueta, 
                comision,
                imagen_producto, 
                observacion, 
                estado 
            },
            updatedBy
        );

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: producto
        });

    } catch (error) {
        console.error('Error al actualizar producto:', error);

        if (error.message === 'PRODUCT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'La orden especificada no existe o está inactiva'
            });
        }

        if (error.message === 'CLIENT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'El cliente especificado no existe o está inactivo'
            });
        }

        if (error.message === 'INVALID_QUANTITY') {
            return res.status(400).json({
                success: false,
                message: 'La cantidad de artículos debe ser al menos 1'
            });
        }

        if (error.message === 'DETAILS_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'Los detalles del producto son requeridos'
            });
        }

        if (error.message === 'INVALID_PRICE') {
            return res.status(400).json({
                success: false,
                message: 'El valor de la etiqueta no puede ser negativo'
            });
        }

        if (error.message === 'INVALID_COMMISSION') {
            return res.status(400).json({
                success: false,
                message: 'La comisión no puede ser negativa'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Eliminar producto (soft delete)
 */
const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBy = req.user.id;

        // Obtener el producto para eliminar su imagen
        const producto = await ProductoService.getProductoById(id);
        
        const result = await ProductoService.deleteProducto(id, deletedBy);

        // Eliminar la imagen del servidor si existe
        if (producto.imagen_producto) {
            await deleteImage(producto.imagen_producto);
        }

        res.json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error('Error al eliminar producto:', error);

        if (error.message === 'PRODUCT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener resumen de productos por cliente en una orden
 */
const getResumenPorCliente = async (req, res) => {
    try {
        const { id_orden, id_cliente } = req.params;
        const resumen = await ProductoService.getResumenPorCliente(id_orden, id_cliente);

        res.json({
            success: true,
            data: resumen
        });

    } catch (error) {
        console.error('Error al obtener resumen:', error);

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        if (error.message === 'CLIENT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener productos agrupados por cliente en una orden
 */
const getProductosAgrupadosPorCliente = async (req, res) => {
    try {
        const { id_orden } = req.params;
        const clientes = await ProductoService.getProductosAgrupadosPorCliente(id_orden);

        res.json({
            success: true,
            data: {
                id_orden: parseInt(id_orden),
                total_clientes: clientes.length,
                clientes: clientes
            }
        });

    } catch (error) {
        console.error('Error al obtener productos agrupados:', error);

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener productos agrupados',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Obtener productos de un cliente específico en una orden específica
 */
const getProductosPorCliente = async (req, res) => {
    try {
        const { id_cliente, id_orden } = req.params;
        const data = await ProductoService.getProductosPorCliente(id_cliente, id_orden);

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Error al obtener productos del cliente:', error);

        if (error.message === 'CLIENT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        if (error.message === 'NO_PRODUCTS_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron productos para este cliente en esta orden'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener productos del cliente',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Generar PDF de productos de un cliente en una orden
 */
const generarPDFProductosCliente = async (req, res) => {
    try {
        const { id_cliente, id_orden } = req.params;
        
        // Obtener los datos del cliente y sus productos
        const data = await ProductoService.getProductosPorCliente(id_cliente, id_orden);

        // Generar el PDF
        const pdfBuffer = await PDFService.generarPDFProductosCliente(data);

        // Configurar headers para la descarga del PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=productos_cliente_${id_cliente}_orden_${id_orden}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Enviar el PDF
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error al generar PDF:', error);

        if (error.message === 'CLIENT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        if (error.message === 'ORDER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        if (error.message === 'NO_PRODUCTS_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron productos para este cliente en esta orden'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al generar PDF',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

module.exports = {
    getAllProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto,
    getResumenPorCliente,
    getProductosAgrupadosPorCliente,
    getProductosPorCliente,
    generarPDFProductosCliente
};
