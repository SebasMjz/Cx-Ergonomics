import type { APIRoute } from 'astro';
import { readCookieValue, verifyAuthToken } from '../../../lib/auth/jwt';
import { connectMongoose } from '../../../lib/mongo';
import { TicketModel } from '../../../lib/models/Ticket';
import { UserModel } from '../../../lib/models/User';

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

		const activeTickets = await TicketModel.find({ archived: { $ne: true } })
			.sort({ order: 1, updatedAt: -1 })
			.lean();

		const archivedTickets = await TicketModel.find({ archived: true })
			.sort({ updatedAt: -1 })
			.lean();

		const users = await UserModel.find().lean();
		const userMap = users.reduce((acc, u) => {
			acc[u._id.toString()] = u.name;
			return acc;
		}, {} as Record<string, string>);

		return new Response(JSON.stringify({
			activeTickets,
			archivedTickets,
			userMap
		}), {
			status: 200,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error?.message || 'Error al obtener tickets' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
