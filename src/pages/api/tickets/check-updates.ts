import type { APIRoute } from 'astro';
import { readCookieValue, verifyAuthToken } from '../../../lib/auth/jwt';
import { connectMongoose } from '../../../lib/mongo';
import { TicketModel } from '../../../lib/models/Ticket';

export const GET: APIRoute = async ({ request }) => {
	try {
		const token = readCookieValue(request.headers.get('cookie'), 'cx_auth');
		const session = token ? verifyAuthToken(token) : null;

		if (!session) {
			return new Response(JSON.stringify({ error: 'Acceso no autorizado' }), {
				status: 401,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		await connectMongoose();

		// Fetch count and latest update timestamp (very fast, zero overhead query)
		const latestTicket = await TicketModel.findOne({}, { updatedAt: 1 })
			.sort({ updatedAt: -1 })
			.lean();

		const activeCount = await TicketModel.countDocuments({ archived: { $ne: true } });
		const lastUpdated = latestTicket ? new Date(latestTicket.updatedAt).getTime() : 0;

		return new Response(
			JSON.stringify({
				count: activeCount,
				lastUpdated,
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error?.message || 'Error al verificar actualizaciones' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
