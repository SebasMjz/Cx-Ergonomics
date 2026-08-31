import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongoose } from '../src/lib/mongo';
import { TicketModel } from '../src/lib/models/Ticket';
import { AuditLogModel } from '../src/lib/models/AuditLog';
import { DistributorRequestModel } from '../src/lib/models/DistributorRequest';
import { PointOfSaleModel } from '../src/lib/models/PointOfSale';
import { ProductModel } from '../src/lib/models/Product';
import { WallpaperModel } from '../src/lib/models/Wallpaper';
import { StoreModel } from '../src/lib/models/Store';
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
		['Stores', StoreModel],
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

	console.log('[Preservación] Los usuarios, Banners y FAQs se conservaron intactos.');

	console.log('\n--- Resiembra de Tienda y Tickets de datos.json ---');
	await runSeedStore();

	try {
		await mongoose.disconnect();
		console.log('Desconectado de MongoDB.');
	} catch (e) {
		/* ignore */
	}

	console.log('\nProceso de Limpieza y Resiembra finalizado con éxito.');
	process.exit(0);
}

main().catch((err) => {
	console.error('Error en clean-and-seed:', err);
	process.exit(1);
});
