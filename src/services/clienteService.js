const Cliente = require('../models/Cliente');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');

class ClienteService {
    /**
     * Obtener perfil del cliente autenticado
     */
    static async getPerfilCliente(id_usuario) {
        try {
            const cliente = await Cliente.findByUsuario(id_usuario);
            
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            const usuario = await Usuario.findById(id_usuario);

            // Calcular saldo pendiente total sumando todas las órdenes
            const { pool } = require('../config/database');
            const [saldoResult] = await pool.query(
                `SELECT COALESCE(SUM(total_compras - total_abonos), 0) as saldo_total
                 FROM cliente_orden 
                 WHERE id_cliente = ? AND (total_compras - total_abonos) > 0`,
                [cliente.id]
            );

            return {
                id: cliente.id,
                nombre: cliente.nombre,
                apellido: cliente.apellido,
                codigo: cliente.codigo,
                direccion: cliente.direccion,
                saldo_pendiente: parseFloat(saldoResult[0].saldo_total || 0),
                correo: usuario.correo,
                estado: cliente.estado_actividad,
                created_at: cliente.created_at
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener todas las órdenes del cliente
     */
    static async getOrdenesCliente(id_usuario) {
        try {
            const cliente = await Cliente.findByUsuario(id_usuario);
            
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            const ordenes = await Cliente.getOrdenesConProductos(cliente.id);
            return ordenes;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener detalle de una orden específica
     */
    static async getOrdenDetalle(id_usuario, id_orden) {
        try {
            const cliente = await Cliente.findByUsuario(id_usuario);
            
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            const detalle = await Cliente.getDetalleOrden(cliente.id, id_orden);
            
            if (!detalle) {
                throw new Error('Orden no encontrada');
            }

            return detalle;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener resumen financiero del cliente
     */
    static async getResumenFinanciero(id_usuario) {
        try {
            const cliente = await Cliente.findByUsuario(id_usuario);
            
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            const resumen = await Cliente.getResumenFinanciero(cliente.id);
            return resumen;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener saldo del cliente en una orden específica
     */
    static async getSaldoOrden(id_usuario, id_orden) {
        try {
            const cliente = await Cliente.findByUsuario(id_usuario);

            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            const ClienteOrden = require('../models/ClienteOrden');
            const registro = await ClienteOrden.findByClienteAndOrden(cliente.id, id_orden);

            if (!registro) {
                throw new Error('No tienes registro en esta orden');
            }

            const valorTotal    = parseFloat(registro.valor_total   || 0);
            const totalAbonos   = parseFloat(registro.total_abonos  || 0);
            const saldoPendiente = parseFloat((valorTotal - totalAbonos).toFixed(2));

            return {
                orden: {
                    id:           registro.id_orden,
                    nombre:       registro.nombre_orden,
                },
                valor_total:      valorTotal,
                total_abonos:     totalAbonos,
                saldo_pendiente:  saldoPendiente,
                saldo_al_cierre:  parseFloat(registro.saldo_al_cierre  || 0),
                libras_acumuladas: parseFloat(registro.libras_acumuladas || 0),
                estado_pago:      registro.estado_pago,
                fecha_limite_pago: registro.fecha_limite_pago,
                estado: saldoPendiente > 0 ? 'debe'
                      : saldoPendiente < 0 ? 'a_favor'
                      : 'al_dia'
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener historial de compras del cliente
     */
    static async getHistorialCompras(id_usuario) {
        try {
            const cliente = await Cliente.findByUsuario(id_usuario);
            
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            const historial = await Cliente.getHistorialCompras(cliente.id);
            
            return historial;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener historial de abonos del cliente (tanto aceptados como rechazados)
     */
    static async getHistorialAbonos(id_usuario) {
        try {
            const cliente = await Cliente.findByUsuario(id_usuario);
            
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            const Abono = require('../models/Abono');
            const abonos = await Abono.findByClienteId(cliente.id);
            
            return abonos.map(abono => ({
                id: abono.id,
                orden: {
                    id: abono.id_orden,
                    nombre: abono.nombre_orden,
                    estado: abono.estado_orden
                },
                cantidad: parseFloat(abono.cantidad),
                comprobante: abono.comprobante_pago,
                estado_verificacion: abono.estado_verificacion,
                fecha_verificacion: abono.fecha_verificacion,
                observaciones: abono.observaciones_verificacion,
                verificado_por: abono.creado_por_correo,
                fecha_creacion: abono.created_at
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener saldo total del cliente
     */
    static async getSaldo(id_usuario) {
        try {
            const cliente = await Cliente.findByUsuario(id_usuario);
            
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            const saldo = await Cliente.getSaldoTotal(cliente.id);
            return saldo;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener datos personales del cliente
     */
    static async getDatosPersonales(id_usuario) {
        try {
            const cliente = await Cliente.findByUsuario(id_usuario);
            
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            const datos = await Cliente.getDatosPersonales(cliente.id);
            return datos;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar datos personales del cliente
     */
    static async updateDatosPersonales(id_usuario, data) {
        try {
            const cliente = await Cliente.findByUsuario(id_usuario);
            
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            const actualizado = await Cliente.updateDatosPersonales(cliente.id, data);
            
            if (!actualizado) {
                throw new Error('No se pudo actualizar los datos personales');
            }

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar correo del cliente
     */
    static async updateCorreo(id_usuario, nuevoCorreo) {
        try {
            const Usuario = require('../models/Usuario');
            
            // Verificar que el correo no esté en uso por otro usuario
            const correoExiste = await Usuario.emailExists(nuevoCorreo, id_usuario);
            if (correoExiste) {
                throw new Error('El correo ya está registrado por otro usuario');
            }

            const actualizado = await Usuario.updateEmail(id_usuario, nuevoCorreo);
            
            if (!actualizado) {
                throw new Error('No se pudo actualizar el correo');
            }

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar contraseña del cliente
     */
    static async updateContrasena(id_usuario, contrasenaActual, nuevaContrasena) {
        try {
            const Usuario = require('../models/Usuario');
            const bcrypt = require('bcryptjs');
            
            // Obtener contraseña actual hasheada
            const contrasenaHasheada = await Usuario.getPassword(id_usuario);
            
            if (!contrasenaHasheada) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar que la contraseña actual sea correcta
            const contrasenaValida = await bcrypt.compare(contrasenaActual, contrasenaHasheada);
            
            if (!contrasenaValida) {
                throw new Error('La contraseña actual es incorrecta');
            }

            // Hashear la nueva contraseña
            const nuevaContrasenaHasheada = await bcrypt.hash(nuevaContrasena, 10);
            
            // Actualizar contraseña
            const actualizado = await Usuario.updatePassword(id_usuario, nuevaContrasenaHasheada);
            
            if (!actualizado) {
                throw new Error('No se pudo actualizar la contraseña');
            }

            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ClienteService;
