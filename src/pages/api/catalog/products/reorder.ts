import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { ProductModel } from '../../../../lib/models/Product';
import { json, requireAdmin } from '../../../../lib/api';

/** Recibe { orderedIds: string[] } y persiste el campo `order` según la posición. */
export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { orderedIds } = await request.json();
		if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
			return json({ error: 'Se requiere orderedIds (lista de ids).' }, 400);
		}

		await connectMongoose();
		await ProductModel.bulkWrite(
			orderedIds.map((id: string, index: number) => ({
				updateOne: { filter: { _id: id }, update: { $set: { order: index + 1 } } },
			}))
		);

		return json({ success: true });
	} catch (error: any) {
		console.error('Error reordering products:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
