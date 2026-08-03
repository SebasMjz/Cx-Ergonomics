import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

export const GET: APIRoute = ({ params }) => {
	try {
		const uploadsRoot = process.env.UPLOADS_DIR
			? path.resolve(process.env.UPLOADS_DIR)
			: path.resolve(process.cwd(), 'uploads');

		const filePath = path.resolve(uploadsRoot, params.path || '');
		
		// Secure directory traversal check
		if (!filePath.startsWith(uploadsRoot) || !fs.existsSync(filePath)) {
			return new Response('File Not Found', { status: 404 });
		}

		const buffer = fs.readFileSync(filePath);
		const ext = path.extname(filePath).toLowerCase();

		let contentType = 'application/octet-stream';
		if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
		else if (ext === '.png') contentType = 'image/png';
		else if (ext === '.webp') contentType = 'image/webp';
		else if (ext === '.gif') contentType = 'image/gif';
		else if (ext === '.mp4') contentType = 'video/mp4';
		else if (ext === '.webm') contentType = 'video/webm';
		else if (ext === '.mov') contentType = 'video/quicktime';

		return new Response(buffer, {
			headers: { 
				'content-type': contentType,
				'cache-control': 'public, max-age=31536000'
			}
		});
	} catch (e: any) {
		return new Response(`Error: ${e.message}`, { status: 500 });
	}
};
