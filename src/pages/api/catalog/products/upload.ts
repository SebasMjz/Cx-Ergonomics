import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { requireAdmin, json } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ error: 'Debes seleccionar un archivo.' }, 400);
		}

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const uploadsRoot = process.env.UPLOADS_DIR
			? path.resolve(process.env.UPLOADS_DIR)
			: path.resolve(process.cwd(), 'uploads');
		const targetDir = path.join(uploadsRoot, 'products');

		fs.mkdirSync(targetDir, { recursive: true });

		const ext = path.extname(file.name).toLowerCase() || '.png';
		const filename = `${Date.now()}-${uuidv4()}${ext}`;
		const filePath = path.join(targetDir, filename);

		fs.writeFileSync(filePath, buffer);

		const relative = path.relative(uploadsRoot, filePath);
		const normalized = relative.split(path.sep).join('/');
		const publicPath = `/uploads/${normalized}`;

		const publicSiteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
		const publicUrl = new URL(publicPath, publicSiteUrl).toString();

		return new Response(JSON.stringify({
			url: publicUrl,
			path: publicPath,
			filename: filename,
			size: file.size,
			mimetype: file.type
		}), {
			status: 201,
			headers: { 'content-type': 'application/json; charset=utf-8' }
		});
	} catch (error: any) {
		console.error('Error in products upload API:', error);
		return json({ error: error?.message || 'Error al subir la imagen' }, 500);
	}
};
