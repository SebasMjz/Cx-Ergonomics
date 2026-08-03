import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { BannerModel } from '../../../../lib/models/Banner';
import { json, requireAdmin } from '../../../../lib/api';

import { extractYoutubeId } from '../../../../lib/youtube';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const body = await request.json();
		const { id } = body;
		if (!id) return json({ error: 'Falta el id del banner.' }, 400);

		await connectMongoose();
		const banner = await BannerModel.findById(id);
		if (!banner) return json({ error: 'Banner no encontrado.' }, 404);

		for (const field of ['kicker', 'title', 'subtitle', 'cta_text', 'cta_link', 'source', 'video_id', 'video_url', 'image_url', 'poster', 'is_active'] as const) {
			if (body[field] !== undefined) {
				let val = body[field];
				if (field === 'video_id' && (body.source === 'youtube' || banner.source === 'youtube')) {
					val = extractYoutubeId(val);
				}
				(banner as any)[field] = val;
			}
		}
		await banner.save();
		return json({ success: true, banner });
	} catch (error: any) {
		console.error('Error updating banner:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
