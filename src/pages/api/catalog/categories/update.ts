import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { CategoryModel } from '../../../../lib/models/Category';
import { slugify } from '../../../../lib/models/Product';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { id, name, description, image, is_active } = await request.json();
		if (!id) return json({ error: 'Falta el id de la categoría.' }, 400);

		await connectMongoose();
		const category = await CategoryModel.findById(id);
		if (!category) return json({ error: 'Categoría no encontrada.' }, 404);

		if (name !== undefined) {
			category.name = name;
			category.slug = slugify(String(name));
		}
		if (description !== undefined) category.description = description;
		if (image !== undefined) category.image = image;
		if (is_active !== undefined) category.is_active = is_active;

		await category.save();
		return json({ success: true, category });
	} catch (error: any) {
		console.error('Error updating category:', error);
		if (error?.code === 11000) return json({ error: 'Ya existe una categoría con ese nombre o slug.' }, 400);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
