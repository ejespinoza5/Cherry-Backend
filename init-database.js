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
        const adminPassword = 'admin123'; 
        
        // Verificar si el admin ya existe
        const [adminExists] = await connection.query(
            'SELECT id, id_rol, estado FROM usuarios WHERE correo = ?',
            [adminEmail]
        );

        let adminUserId;

        if (adminExists.length === 0) {
            // Hashear la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            // Insertar usuario
            const [adminResult] = await connection.query(`
                INSERT INTO usuarios (correo, contraseña, id_rol, estado) 
                VALUES (?, ?, 3, 'activo')
            `, [adminEmail, hashedPassword]);

            adminUserId = adminResult.insertId;

            console.log('✅ Usuario administrador creado:');
            console.log(`   📧 Correo: ${adminEmail}`);
            console.log(`   🔑 Contraseña: ${adminPassword}`);
            console.log(`   🔐 Hash: ${hashedPassword}\n`);
        } else {
            adminUserId = adminExists[0].id;

            // Asegurar que el usuario base quede como superadmin activo
            await connection.query(
                `UPDATE usuarios
                 SET id_rol = 3,
                     estado = 'activo'
                 WHERE id = ?`,
                [adminUserId]
            );

            console.log('⚠️  El usuario administrador ya existe; se validará perfil en admins...\n');
        }

        // Asegurar registro en tabla admins para el usuario administrador
        const [adminProfile] = await connection.query(
            'SELECT id FROM admins WHERE id_usuario = ?',
            [adminUserId]
        );

        if (adminProfile.length === 0) {
            await connection.query(
                `INSERT INTO admins (id_usuario, nombre, apellido, estado, created_by)
                 VALUES (?, ?, ?, 'activo', ?)`,
                [adminUserId, 'Super', 'Admin', adminUserId]
            );
            console.log('✅ Registro creado en tabla admins.\n');
        } else {
            await connection.query(
                `UPDATE admins
                 SET nombre = ?,
                     apellido = ?,
                     estado = 'activo',
                     updated_by = ?,
                     updated_at = NOW()
                 WHERE id_usuario = ?`,
                ['Super', 'Admin', adminUserId, adminUserId]
            );
            console.log('✅ Registro de admins verificado/actualizado.\n');
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
