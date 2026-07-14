import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { WallpaperModel } from '../../../../lib/models/Wallpaper';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { title, image, resolution, is_active } = await request.json();
		if (!title || !image) return json({ error: 'Título e imagen son obligatorios.' }, 400);

		await connectMongoose();
		const last = await WallpaperModel.findOne().sort({ order: -1 }).select('order').lean();
		const wallpaper = await WallpaperModel.create({
			title, image, resolution,
			order: (last?.order ?? 0) + 1,
			is_active: is_active !== false,
		});

		return json({ success: true, wallpaper }, 201);
	} catch (error: any) {
		console.error('Error creating wallpaper:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
