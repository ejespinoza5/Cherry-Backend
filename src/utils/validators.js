/**
 * Validar formato de correo electrónico
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validar contraseña (mínimo 6 caracteres)
 */
const isValidPassword = (password) => {
    return password && password.length >= 6;
};

/**
 * Validar que un valor sea un número entero positivo
 */
const isPositiveInteger = (value) => {
    return Number.isInteger(parseInt(value)) && parseInt(value) > 0;
};

/**
 * Validar estado (activo o inactivo)
 */
const isValidEstado = (estado) => {
    return ['activo', 'inactivo'].includes(estado);
};

/**
 * Validar que el rol sea válido (1: admin, 2: cliente, 3: superAdmin)
 */
const isValidRol = (id_rol) => {
    return [1, 2, 3].includes(parseInt(id_rol));
};

module.exports = {
    isValidEmail,
    isValidPassword,
    isPositiveInteger,
    isValidEstado,
    isValidRol
};
