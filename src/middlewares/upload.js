const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Configurar almacenamiento en memoria para procesar con sharp
const storage = multer.memoryStorage();

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, webp)'), false);
    }
};

// Configurar multer para productos
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
});

// Filtro para comprobantes (acepta imágenes y PDF)
const comprobanteFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/(jpeg|jpg|png|webp)|application\/pdf/.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, webp) o PDF'), false);
    }
};

// Configurar multer para comprobantes (usar memoria para poder procesar con sharp)
const uploadComprobante = multer({
    storage: storage, // Usar memoria para procesar con sharp
    fileFilter: comprobanteFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo para comprobantes
    }
});

/**
 * Middleware para procesar y comprimir imagen con sharp
 */
const processImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        // Generar nombre único para la imagen
        const filename = `producto-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const filepath = path.join(__dirname, '../../uploads/images', filename);

        // Procesar imagen con sharp: redimensionar y comprimir
        await sharp(req.file.buffer)
            .resize(800, 800, { // Máximo 800x800px, mantiene aspecto
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 }) // Convertir a WebP con calidad 80%
            .toFile(filepath);

        // Guardar la ruta relativa de la imagen en req
        req.imageUrl = `/uploads/images/${filename}`;

        next();
    } catch (error) {
        console.error('Error al procesar imagen:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar la imagen',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Middleware para eliminar imagen del servidor
 */
const deleteImage = async (imagePath) => {
    try {
        if (!imagePath) return;

        // Extraer solo el nombre del archivo si viene una URL completa
        const filename = imagePath.split('/').pop();
        const filepath = path.join(__dirname, '../../uploads/images', filename);

        // Verificar si el archivo existe antes de eliminarlo
        await fs.access(filepath);
        await fs.unlink(filepath);
        
        console.log('Imagen eliminada:', filename);
    } catch (error) {
        // Si el archivo no existe, no hacer nada
        if (error.code !== 'ENOENT') {
            console.error('Error al eliminar imagen:', error);
        }
    }
};

/**
 * Middleware para procesar comprobante de pago
 * Comprime imágenes con sharp, guarda PDF sin procesar
 */
const processComprobante = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const uploadPath = path.join(__dirname, '../../uploads/comprobantes');
        await fs.mkdir(uploadPath, { recursive: true });

        // Si es PDF, guardar directamente sin procesar
        if (req.file.mimetype === 'application/pdf') {
            const filename = `comprobante-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
            const filepath = path.join(uploadPath, filename);
            
            await fs.writeFile(filepath, req.file.buffer);
            req.comprobanteUrl = `/uploads/comprobantes/${filename}`;
        } 
        // Si es imagen, procesar con sharp (comprimir y optimizar)
        else {
            const filename = `comprobante-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const filepath = path.join(uploadPath, filename);

            // Procesar imagen: redimensionar y comprimir
            await sharp(req.file.buffer)
                .resize(1200, 1200, { // Máximo 1200x1200px para comprobantes
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 85 }) // Convertir a WebP con calidad 85%
                .toFile(filepath);

            req.comprobanteUrl = `/uploads/comprobantes/${filename}`;
        }

        next();
    } catch (error) {
        console.error('Error al procesar comprobante:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar el comprobante',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

/**
 * Middleware para eliminar comprobante del servidor
 */
const deleteComprobante = async (comprobantePath) => {
    try {
        if (!comprobantePath) return;

        // Extraer solo el nombre del archivo si viene una URL completa
        const filename = comprobantePath.split('/').pop();
        const filepath = path.join(__dirname, '../../uploads/comprobantes', filename);

        // Verificar si el archivo existe antes de eliminarlo
        await fs.access(filepath);
        await fs.unlink(filepath);
        
        console.log('Comprobante eliminado:', filename);
    } catch (error) {
        // Si el archivo no existe, no hacer nada
        if (error.code !== 'ENOENT') {
            console.error('Error al eliminar comprobante:', error);
        }
    }
};

module.exports = {
    upload,
    processImage,
    deleteImage,
    uploadComprobante,
    processComprobante,
    deleteComprobante
};
