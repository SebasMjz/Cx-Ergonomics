import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { BannerModel } from '../../../../lib/models/Banner';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { id } = await request.json();
		if (!id) return json({ error: 'Falta el id del banner.' }, 400);

		await connectMongoose();
		const deleted = await BannerModel.findByIdAndDelete(id);
		if (!deleted) return json({ error: 'Banner no encontrado.' }, 404);

		return json({ success: true });
	} catch (error: any) {
		console.error('Error deleting banner:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
