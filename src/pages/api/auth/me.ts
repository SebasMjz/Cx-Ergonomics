import type { APIRoute } from 'astro';
import { readCookieValue, verifyAuthToken } from '../../../lib/auth/jwt';

export const GET: APIRoute = async ({ request }) => {
	const token = readCookieValue(request.headers.get('cookie'), 'cx_auth');
	const session = token ? verifyAuthToken(token) : null;

	if (!session) {
		return new Response(JSON.stringify({ authenticated: false }), {
			status: 401,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}

	return new Response(
		JSON.stringify({
			authenticated: true,
			user: {
				id: session.sub,
				name: session.name,
				email: session.email,
				role: session.role,
			},
		}),
		{
			status: 200,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		}
	);
};
