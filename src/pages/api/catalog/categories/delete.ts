import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { CategoryModel } from '../../../../lib/models/Category';
import { ProductModel } from '../../../../lib/models/Product';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { id } = await request.json();
		if (!id) return json({ error: 'Falta el id de la categoría.' }, 400);

		await connectMongoose();

		// Check if any product is using this category
		const count = await ProductModel.countDocuments({ category_id: id });
		if (count > 0) {
			return json({ error: `No se puede eliminar la categoría porque hay ${count} producto(s) asociado(s) a ella. Modifica o elimina los productos primero.` }, 400);
		}

		const deleted = await CategoryModel.findByIdAndDelete(id);
		if (!deleted) return json({ error: 'Categoría no encontrada.' }, 404);

		return json({ success: true });
	} catch (error: any) {
		console.error('Error deleting category:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
