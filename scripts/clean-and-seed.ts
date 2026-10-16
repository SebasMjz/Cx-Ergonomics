import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongoose } from '../src/lib/mongo';
import { TicketModel } from '../src/lib/models/Ticket';
import { AuditLogModel } from '../src/lib/models/AuditLog';
import { DistributorRequestModel } from '../src/lib/models/DistributorRequest';
import { PointOfSaleModel } from '../src/lib/models/PointOfSale';
import { ProductModel } from '../src/lib/models/Product';
import { WallpaperModel } from '../src/lib/models/Wallpaper';
import { TagModel } from '../src/lib/models/Tag';
import { CategoryModel } from '../src/lib/models/Category';
import { runSeedStore } from './seed-store';

async function main() {
	console.log('--- Iniciando Limpieza y Resiembrado con datos.json ---');
	await connectMongoose();

	const deletions: Array<[string, any]> = [
		['Tickets', TicketModel],
		['AuditLogs', AuditLogModel],
		['DistributorRequests', DistributorRequestModel],
		['PointsOfSale', PointOfSaleModel],
		['Products', ProductModel],
		['Wallpapers', WallpaperModel],
		['Tags', TagModel],
		['Categories', CategoryModel],
	];

	for (const [label, Model] of deletions) {
		try {
			const res = await Model.deleteMany({});
			console.log(`[Limpieza] ${label}: eliminados ${res.deletedCount}`);
		} catch (err) {
			console.error(`Error limpiando ${label}:`, err);
		}
	}

	console.log('\n[Preservación Garantizada]:');
	console.log('✓ Usuarios: NO se tocan (se conservan todas las cuentas y contraseñas).');
	console.log('✓ Tiendas: NO se tocan.');
	console.log('✓ Banners: NO se tocan (se conservan los banners existentes).');
	console.log('✓ FAQs: NO se tocan (se conservan todas las preguntas frecuentes).');

	console.log('\n--- Resiembra de Tickets de datos.json ---');
	await runSeedStore();

	const bannerCount = await BannerModel.countDocuments();
	if (bannerCount === 0) {
		console.log('\n--- Creando Banners de Inicio por defecto (YouTube) ---');
		await BannerModel.create([
			{
				kicker: 'CX ERGONOMIC',
				title: 'DISEÑADO PARA RENDIR',
				subtitle:
					'Estaciones de trabajo ergonomicas construidas para acompanarte cada hora del dia. Potencia, ajuste y precision en cada detalle.',
				cta_text: 'VER CATALOGO',
				cta_link: '#catalog-section',
				source: 'youtube',
				video_id: 'nBMEoWlOjw0',
				order: 1,
				is_active: true,
			},
			{
				kicker: 'EXPERIENCIA CX',
				title: 'TU ESPACIO, TU REGLA',
				subtitle:
					'Cada componente esta pensado para adaptarse a ti. Descubre la linea completa de mobiliario y accesorios inteligentes.',
				cta_text: 'EXPLORAR',
				cta_link: '#catalog-section',
				source: 'youtube',
				video_id: 'lHmrFqCvXxQ',
				order: 2,
				is_active: true,
			},
		]);
		console.log('Banners de YouTube creados exitosamente.');
	}

	try {
		await mongoose.disconnect();
		console.log('Desconectado de MongoDB.');
	} catch (e) {
		/* ignore */
	}

	console.log('\nProceso de Limpieza y Resiembra de tickets finalizado con éxito.');
	process.exit(0);
}

main().catch((err) => {
	console.error('Error en clean-and-seed:', err);
	process.exit(1);
});
