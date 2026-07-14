import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { TagModel } from '../../../../lib/models/Tag';
import { slugify } from '../../../../lib/models/Product';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { name, color, is_active } = await request.json();
		if (!name) return json({ error: 'El nombre de la etiqueta es obligatorio.' }, 400);

		await connectMongoose();

		let slug = slugify(String(name));
		if (await TagModel.exists({ slug })) {
			slug = `${slug}-${Date.now().toString(36)}`;
		}

		const last = await TagModel.findOne().sort({ order: -1 }).select('order').lean();
		const tag = await TagModel.create({
			name,
			slug,
			color: color || '#ffffff',
			order: (last?.order ?? 0) + 1,
			is_active: is_active !== false,
		});

		return json({ success: true, tag }, 201);
	} catch (error: any) {
		console.error('Error creating tag:', error);
		if (error?.code === 11000) return json({ error: 'Ya existe una etiqueta con ese nombre.' }, 400);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
