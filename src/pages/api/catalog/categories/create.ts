import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { CategoryModel } from '../../../../lib/models/Category';
import { slugify } from '../../../../lib/models/Product';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { name, description, image, is_active } = await request.json();
		if (!name) return json({ error: 'El nombre de la categoría es obligatorio.' }, 400);

		await connectMongoose();

		let slug = slugify(String(name));
		if (await CategoryModel.exists({ slug })) {
			slug = `${slug}-${Date.now().toString(36)}`;
		}

		const category = await CategoryModel.create({
			name,
			slug,
			description: description || '',
			image: image || '',
			is_active: is_active !== false,
		});

		return json({ success: true, category }, 201);
	} catch (error: any) {
		console.error('Error creating category:', error);
		if (error?.code === 11000) return json({ error: 'Ya existe una categoría con ese nombre o slug.' }, 400);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
