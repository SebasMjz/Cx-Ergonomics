import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { BannerModel } from '../../../../lib/models/Banner';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const b = await request.json();
		if (!b.title) return json({ error: 'El título es obligatorio.' }, 400);
		if (!['youtube', 'file', 'image'].includes(b.source)) return json({ error: 'Fuente inválida.' }, 400);

		await connectMongoose();
		const last = await BannerModel.findOne().sort({ order: -1 }).select('order').lean();
		const banner = await BannerModel.create({
			kicker: b.kicker, title: b.title, subtitle: b.subtitle, cta_text: b.cta_text, cta_link: b.cta_link,
			source: b.source, video_id: b.video_id, video_url: b.video_url, image_url: b.image_url, poster: b.poster,
			order: (last?.order ?? 0) + 1,
			is_active: b.is_active !== false,
		});
		return json({ success: true, banner }, 201);
	} catch (error: any) {
		console.error('Error creating banner:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
