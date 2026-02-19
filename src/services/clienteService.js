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
}

module.exports = ClienteService;
