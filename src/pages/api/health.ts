import type { APIRoute } from 'astro';
import { getMongooseStatus } from '../../lib/mongo';

export const GET: APIRoute = async () => {
	const status = await getMongooseStatus();

	return new Response(JSON.stringify(status), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
		},
		status: status.connected ? 200 : 503,
	});
};