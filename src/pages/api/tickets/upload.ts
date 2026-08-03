import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const POST: APIRoute = async ({ request, url }) => {
	try {
		const kind = url.searchParams.get('kind') || '';
		if (kind !== 'receipt' && kind !== 'video') {
			return new Response(JSON.stringify({ error: 'Missing or invalid kind. Use ?kind=receipt or ?kind=video.' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			});
		}

		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return new Response(JSON.stringify({ error: 'File is required.' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			});
		}

		// Read buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Determine target directory
		const targetDirName = kind === 'receipt' ? path.join('rma', 'receipts') : path.join('rma', 'videos');
		const uploadsRoot = process.env.UPLOADS_DIR
			? path.resolve(process.env.UPLOADS_DIR)
			: path.resolve(process.cwd(), 'uploads');
		const targetDir = path.join(uploadsRoot, targetDirName);

		// Ensure directory exists
		fs.mkdirSync(targetDir, { recursive: true });

		const ext = path.extname(file.name).toLowerCase();
		const filename = `${Date.now()}-${uuidv4()}${ext}`;
		const filePath = path.join(targetDir, filename);

		// Save file
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
		console.error('Error in Astro upload API:', error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' }
		});
	}
};
