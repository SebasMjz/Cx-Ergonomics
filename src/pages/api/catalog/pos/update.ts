import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { PointOfSaleModel } from '../../../../lib/models/PointOfSale';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const body = await request.json();
		const { id } = body;
		if (!id) return json({ error: 'Falta el id del punto de venta.' }, 400);

		await connectMongoose();
		const pos = await PointOfSaleModel.findById(id);
		if (!pos) return json({ error: 'Punto de venta no encontrado.' }, 404);

		for (const field of ['name', 'address', 'city', 'lat', 'lng', 'phone', 'hours', 'is_active'] as const) {
			if (body[field] !== undefined) (pos as any)[field] = body[field];
		}

		await pos.save();
		return json({ success: true, pos });
	} catch (error: any) {
		console.error('Error updating point of sale:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
