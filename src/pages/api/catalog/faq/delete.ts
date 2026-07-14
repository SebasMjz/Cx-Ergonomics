import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { FaqModel } from '../../../../lib/models/Faq';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { id } = await request.json();
		if (!id) return json({ error: 'Falta el id de la pregunta.' }, 400);

		await connectMongoose();
		const deleted = await FaqModel.findByIdAndDelete(id);
		if (!deleted) return json({ error: 'Pregunta no encontrada.' }, 404);

		return json({ success: true });
	} catch (error: any) {
		console.error('Error deleting faq:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
