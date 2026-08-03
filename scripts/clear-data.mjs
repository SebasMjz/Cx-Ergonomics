import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

/**
 * SCRIPT DE LIMPIEZA DE DATOS (RESET DEL SISTEMA)
 * 
 * Este script elimina:
 * - Todos los tickets creados en la base de datos.
 * - Todos los usuarios excepto la cuenta principal del Administrador (CX Admin / admin).
 * - Todos los archivos y fotos de evidencias subidas en 'uploads/rma/'.
 * 
 * MANTIENE e IGNORA:
 * - La cuenta principal de Administrador (CX Admin).
 * - La plantilla y configuración del mensaje de WhatsApp.
 * - Ajustes del sitio web y banners estáticos.
 * 
 * PARA EJECUTAR ESTE SCRIPT (SOLO CUANDO DESEES LIMPIAR EL SISTEMA):
 * node scripts/clear-data.mjs
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cx-ergonomics';

async function resetSystemData() {
	console.log('🔄 Conectando a la base de datos MongoDB...');
	try {
		await mongoose.connect(MONGODB_URI);
		console.log('✅ Conexión establecida.');

		// 1. Eliminar Tickets
		console.log('🧹 Limpiando colección de tickets...');
		const ticketsCollection = mongoose.connection.collection('tickets');
		const deletedTickets = await ticketsCollection.deleteMany({});
		console.log(`✓ Se eliminaron ${deletedTickets.deletedCount} tickets.`);

		// 2. Eliminar Usuarios excepto Administrador Principal ('admin')
		console.log('🧹 Limpiando usuarios secundarios (Preservando CX Admin)...');
		const usersCollection = mongoose.connection.collection('users');
		const deletedUsers = await usersCollection.deleteMany({
			username: { $ne: 'admin' },
			role: { $ne: 'admin' }
		});
		console.log(`✓ Se eliminaron ${deletedUsers.deletedCount} usuarios secundarios.`);

		// 3. Eliminar Archivos y Evidencias en uploads/rma/
		const uploadsDir = process.env.UPLOADS_DIR
			? path.resolve(process.env.UPLOADS_DIR)
			: path.resolve(process.cwd(), 'uploads');
		const rmaUploadsDir = path.join(uploadsDir, 'rma');

		if (fs.existsSync(rmaUploadsDir)) {
			console.log(`🧹 Eliminando archivos de evidencias en ${rmaUploadsDir}...`);
			fs.rmSync(rmaUploadsDir, { recursive: true, force: true });
			fs.mkdirSync(rmaUploadsDir, { recursive: true });
			console.log('✓ Archivos de evidencias eliminados correctamente.');
		}

		console.log('\n🎉 ¡Limpieza del sistema completada con éxito!');
		console.log('📌 Se han preservado los ajustes del sitio, la plantilla de WhatsApp y la cuenta principal CX Admin.');

	} catch (error) {
		console.error('❌ Error durante la ejecución del script de limpieza:', error);
	} finally {
		await mongoose.disconnect();
		process.exit(0);
	}
}

resetSystemData();
