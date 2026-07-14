import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { FaqModel } from '../../../../lib/models/Faq';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { question, answer, is_active } = await request.json();
		if (!question || !answer) return json({ error: 'Pregunta y respuesta son obligatorias.' }, 400);

		await connectMongoose();
		const last = await FaqModel.findOne().sort({ order: -1 }).select('order').lean();
		const faq = await FaqModel.create({
			question, answer,
			order: (last?.order ?? 0) + 1,
			is_active: is_active !== false,
		});

		return json({ success: true, faq }, 201);
	} catch (error: any) {
		console.error('Error creating faq:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
