import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { PointOfSaleModel } from '../../../../lib/models/PointOfSale';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { name, address, city, lat, lng, phone, hours, is_active } = await request.json();
		if (!name || !address || lat == null || lng == null) {
			return json({ error: 'Nombre, dirección y coordenadas (lat/lng) son obligatorios.' }, 400);
		}

		await connectMongoose();
		const last = await PointOfSaleModel.findOne().sort({ order: -1 }).select('order').lean();
		const pos = await PointOfSaleModel.create({
			name, address, city, lat, lng, phone, hours,
			order: (last?.order ?? 0) + 1,
			is_active: is_active !== false,
		});

		return json({ success: true, pos }, 201);
	} catch (error: any) {
		console.error('Error creating point of sale:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
