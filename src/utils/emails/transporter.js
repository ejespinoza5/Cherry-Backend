const nodemailer = require('nodemailer');

const createTransporter = () => {
    const {
        EMAIL_SERVICE,
        EMAIL_HOST,
        EMAIL_PORT,
        EMAIL_SECURE,
        EMAIL_USER,
        EMAIL_PASSWORD
    } = process.env;

    const normalizedService = (EMAIL_SERVICE || '').trim().toLowerCase();
    const normalizedUser = (EMAIL_USER || '').trim();
    let normalizedPassword = (EMAIL_PASSWORD || '').trim();

    // Gmail muestra la App Password en grupos con espacios. SMTP requiere el valor continuo.
    if (normalizedService === 'gmail' || normalizedUser.endsWith('@gmail.com')) {
        normalizedPassword = normalizedPassword.replace(/\s+/g, '');
    }

    if (!normalizedUser || !normalizedPassword) {
        throw new Error('EMAIL_CONFIG_MISSING');
    }

    if (normalizedService) {
        return nodemailer.createTransport({
            service: normalizedService,
            auth: {
                user: normalizedUser,
                pass: normalizedPassword
            }
        });
    }

    return nodemailer.createTransport({
        host: EMAIL_HOST,
        port: Number(EMAIL_PORT || 587),
        secure: EMAIL_SECURE === 'true',
        auth: {
            user: normalizedUser,
            pass: normalizedPassword
        }
    });
};

module.exports = {
    createTransporter
};
