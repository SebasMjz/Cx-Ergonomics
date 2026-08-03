import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

export const GET: APIRoute = ({ params, request }) => {
	try {
		const uploadsRoot = process.env.UPLOADS_DIR
			? path.resolve(process.env.UPLOADS_DIR)
			: path.resolve(process.cwd(), 'uploads');

		const filePath = path.resolve(uploadsRoot, params.path || '');

		// Secure directory traversal check
		if (!filePath.startsWith(uploadsRoot) || !fs.existsSync(filePath)) {
			return new Response('File Not Found', { status: 404 });
		}

		const stat = fs.statSync(filePath);
		const fileSize = stat.size;
		const ext = path.extname(filePath).toLowerCase();

		let contentType = 'application/octet-stream';
		if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
		else if (ext === '.png') contentType = 'image/png';
		else if (ext === '.webp') contentType = 'image/webp';
		else if (ext === '.gif') contentType = 'image/gif';
		else if (ext === '.svg') contentType = 'image/svg+xml';
		else if (ext === '.mp4') contentType = 'video/mp4';
		else if (ext === '.webm') contentType = 'video/webm';
		else if (ext === '.mov') contentType = 'video/quicktime';

		const range = request.headers.get('range');
		if (range && (contentType.startsWith('video/') || contentType.startsWith('audio/'))) {
			const parts = range.replace(/bytes=/, '').split('-');
			const start = parseInt(parts[0], 10);
			const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
			const chunksize = end - start + 1;

			const fileStream = fs.createReadStream(filePath, { start, end });
			const stream = new ReadableStream({
				start(controller) {
					fileStream.on('data', (chunk) => controller.enqueue(chunk));
					fileStream.on('end', () => controller.close());
					fileStream.on('error', (err) => controller.error(err));
				},
			});

			return new Response(stream, {
				status: 206,
				headers: {
					'Content-Range': `bytes ${start}-${end}/${fileSize}`,
					'Accept-Ranges': 'bytes',
					'Content-Length': chunksize.toString(),
					'Content-Type': contentType,
				},
			});
		}

		const buffer = fs.readFileSync(filePath);
		return new Response(buffer, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Content-Length': fileSize.toString(),
				'Accept-Ranges': 'bytes',
				'Cache-Control': 'public, max-age=31536000',
			},
		});
	} catch (e: any) {
		return new Response(`Error: ${e.message}`, { status: 500 });
	}
};
