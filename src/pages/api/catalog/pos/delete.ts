import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { PointOfSaleModel } from '../../../../lib/models/PointOfSale';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { id } = await request.json();
		if (!id) return json({ error: 'Falta el id del punto de venta.' }, 400);

		await connectMongoose();
		const deleted = await PointOfSaleModel.findByIdAndDelete(id);
		if (!deleted) return json({ error: 'Punto de venta no encontrado.' }, 404);

		return json({ success: true });
	} catch (error: any) {
		console.error('Error deleting point of sale:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
