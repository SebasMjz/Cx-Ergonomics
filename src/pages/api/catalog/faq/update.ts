import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { FaqModel } from '../../../../lib/models/Faq';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const body = await request.json();
		const { id } = body;
		if (!id) return json({ error: 'Falta el id de la pregunta.' }, 400);

		await connectMongoose();
		const faq = await FaqModel.findById(id);
		if (!faq) return json({ error: 'Pregunta no encontrada.' }, 404);

		for (const field of ['question', 'answer', 'is_active'] as const) {
			if (body[field] !== undefined) (faq as any)[field] = body[field];
		}

		await faq.save();
		return json({ success: true, faq });
	} catch (error: any) {
		console.error('Error updating faq:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
