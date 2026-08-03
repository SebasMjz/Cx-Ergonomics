import type { APIRoute } from 'astro';
import { getMongooseStatus, connectMongoose } from '../../lib/mongo';
import { CategoryModel } from '../../lib/models/Category';
import { ProductModel } from '../../lib/models/Product';
import { BannerModel } from '../../lib/models/Banner';
import { TicketModel } from '../../lib/models/Ticket';
import { UserModel } from '../../lib/models/User';
import { PointOfSaleModel } from '../../lib/models/PointOfSale';

export const GET: APIRoute = async () => {
	const status = await getMongooseStatus();

	let collections: Record<string, number> = {};
	if (status.connected) {
		try {
			await connectMongoose();
			collections = {
				categories: await CategoryModel.countDocuments(),
				products: await ProductModel.countDocuments(),
				banners: await BannerModel.countDocuments(),
				tickets: await TicketModel.countDocuments(),
				users: await UserModel.countDocuments(),
				pointsOfSale: await PointOfSaleModel.countDocuments(),
			};
		} catch (e: any) {
			console.error('Error counting documents:', e);
		}
	}

	return new Response(JSON.stringify({ ...status, collections }, null, 2), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
		},
		status: status.connected ? 200 : 503,
	});
};