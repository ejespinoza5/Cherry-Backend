const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

/**
 * Script para inicializar roles y usuario administrador
 * Este script hashea automáticamente la contraseña antes de insertarla
 */

const initDatabase = async () => {
    let connection;
    
    try {
        console.log('🔧 Iniciando configuración de la base de datos...\n');
        
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // =====================================
        // 1. INSERTAR ROLES
        // =====================================
        console.log('📋 Insertando roles...');
        
        const [rolesExist] = await connection.query('SELECT COUNT(*) as count FROM rol');
        
        if (rolesExist[0].count === 0) {
            await connection.query(`
                INSERT INTO rol (id, nombre, estado) VALUES
                (1, 'Administrador', 'activo'),
                (2, 'Cliente', 'activo'),
                (3, 'SuperAdministrador', 'activo')
            `);
            console.log('✅ Roles insertados: Administrador (1), Cliente (2) y SuperAdministrador (3)\n');
        } else {
            console.log('⚠️  Los roles ya existen, saltando...\n');
        }

        // =====================================
        // 2. INSERTAR USUARIO ADMINISTRADOR
        // =====================================
        console.log('👤 Creando usuario administrador...');
        
        // CONFIGURA AQUÍ LA CONTRASEÑA DEL ADMINISTRADOR
        const adminEmail = 'admin@cherry.com';
        const adminPassword = 'admin123'; // ⬅️ CAMBIA ESTA CONTRASEÑA
        
        // Verificar si el admin ya existe
        const [adminExists] = await connection.query(
            'SELECT id FROM usuarios WHERE correo = ?',
            [adminEmail]
        );
        
        if (adminExists.length === 0) {
            // Hashear la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);
            
            // Insertar usuario
            await connection.query(`
                INSERT INTO usuarios (correo, contraseña, id_rol, estado) 
                VALUES (?, ?, 3, 'activo')
            `, [adminEmail, hashedPassword]);
            
            console.log('✅ Usuario administrador creado:');
            console.log(`   📧 Correo: ${adminEmail}`);
            console.log(`   🔑 Contraseña: ${adminPassword}`);
            console.log(`   🔐 Hash: ${hashedPassword}\n`);
        } else {
            console.log('⚠️  El usuario administrador ya existe, saltando...\n');
        }

        // Confirmar transacción
        await connection.commit();
        
        console.log('🎉 Base de datos inicializada correctamente!\n');
        console.log('═══════════════════════════════════════════════');
        console.log('Puedes iniciar sesión con:');
        console.log(`  Correo: ${adminEmail}`);
        console.log(`  Contraseña: ${adminPassword}`);
        console.log('═══════════════════════════════════════════════\n');
        
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('❌ Error al inicializar la base de datos:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
        process.exit(0);
    }
};

// Ejecutar script
initDatabase();
