import type { APIRoute } from 'astro';
import { buildClearAuthCookie } from '../../../lib/auth/jwt';

export const POST: APIRoute = async () => {
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'set-cookie': buildClearAuthCookie(),
		},
	});
};
