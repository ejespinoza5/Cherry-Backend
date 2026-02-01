/**
 * Script para crear el usuario SuperAdministrador inicial
 * Este script debe ejecutarse una vez después de crear la base de datos
 */

const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function createSuperAdmin() {
    try {
        console.log('🚀 Iniciando creación de superAdministrador...\n');

        // Datos del superAdministrador
        const correo = 'superadmin@cherry.com';
        const contraseña = 'Super@2026'; // Cambiar por una contraseña segura
        const id_rol = 3; // SuperAdministrador

        // Verificar si ya existe
        const [existing] = await pool.query(
            'SELECT id FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (existing.length > 0) {
            console.log('⚠️  El usuario superAdministrador ya existe.');
            process.exit(0);
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contraseña, salt);

        // Insertar superAdministrador
        const [result] = await pool.query(
            'INSERT INTO usuarios (correo, contraseña, id_rol, estado) VALUES (?, ?, ?, ?)',
            [correo, hashedPassword, id_rol, 'activo']
        );

        console.log('✅ SuperAdministrador creado exitosamente!');
        console.log(`📧 Correo: ${correo}`);
        console.log(`🔑 Contraseña: ${contraseña}`);
        console.log(`🆔 ID: ${result.insertId}`);
        console.log(`\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login!\n`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error al crear superAdministrador:', error);
        process.exit(1);
    }
}

createSuperAdmin();
