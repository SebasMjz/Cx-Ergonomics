import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { WallpaperModel } from '../../../../lib/models/Wallpaper';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const body = await request.json();
		const { id } = body;
		if (!id) return json({ error: 'Falta el id del wallpaper.' }, 400);

		await connectMongoose();
		const wallpaper = await WallpaperModel.findById(id);
		if (!wallpaper) return json({ error: 'Wallpaper no encontrado.' }, 404);

		for (const field of ['title', 'image', 'resolution', 'is_active'] as const) {
			if (body[field] !== undefined) (wallpaper as any)[field] = body[field];
		}

		await wallpaper.save();
		return json({ success: true, wallpaper });
	} catch (error: any) {
		console.error('Error updating wallpaper:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
