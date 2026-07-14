import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { TagModel } from '../../../../lib/models/Tag';
import { ProductModel } from '../../../../lib/models/Product';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { id } = await request.json();
		if (!id) return json({ error: 'Falta el id de la etiqueta.' }, 400);

		await connectMongoose();
		const deleted = await TagModel.findByIdAndDelete(id);
		if (!deleted) return json({ error: 'Etiqueta no encontrada.' }, 404);

		// Quita la etiqueta de todos los productos que la tuvieran asignada.
		await ProductModel.updateMany({ tag_ids: id }, { $pull: { tag_ids: id } });

		return json({ success: true });
	} catch (error: any) {
		console.error('Error deleting tag:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
