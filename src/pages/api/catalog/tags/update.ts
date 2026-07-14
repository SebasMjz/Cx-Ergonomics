import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { TagModel } from '../../../../lib/models/Tag';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { id, name, color, is_active } = await request.json();
		if (!id) return json({ error: 'Falta el id de la etiqueta.' }, 400);

		await connectMongoose();
		const tag = await TagModel.findById(id);
		if (!tag) return json({ error: 'Etiqueta no encontrada.' }, 404);

		if (name !== undefined) tag.name = name;
		if (color !== undefined) tag.color = color;
		if (is_active !== undefined) tag.is_active = is_active;

		await tag.save();
		return json({ success: true, tag });
	} catch (error: any) {
		console.error('Error updating tag:', error);
		if (error?.code === 11000) return json({ error: 'Ya existe una etiqueta con ese nombre.' }, 400);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
