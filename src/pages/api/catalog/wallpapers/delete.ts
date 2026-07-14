import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { WallpaperModel } from '../../../../lib/models/Wallpaper';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const { id } = await request.json();
		if (!id) return json({ error: 'Falta el id del wallpaper.' }, 400);

		await connectMongoose();
		const deleted = await WallpaperModel.findByIdAndDelete(id);
		if (!deleted) return json({ error: 'Wallpaper no encontrado.' }, 404);

		return json({ success: true });
	} catch (error: any) {
		console.error('Error deleting wallpaper:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
