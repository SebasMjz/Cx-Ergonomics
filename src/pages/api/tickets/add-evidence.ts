import type { APIRoute } from 'astro';
import { readCookieValue, verifyAuthToken } from '../../../lib/auth/jwt';
import { connectMongoose } from '../../../lib/mongo';
import { TicketModel } from '../../../lib/models/Ticket';

export const POST: APIRoute = async ({ request }) => {
	try {
		const token = readCookieValue(request.headers.get('cookie'), 'cx_auth');
		const session = token ? verifyAuthToken(token) : null;
		if (!session) {
			return new Response(JSON.stringify({ error: 'Acceso no autorizado' }), {
				status: 401,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		const { ticketNumber, evidenceUrl } = await request.json();
		if (!ticketNumber || !evidenceUrl) {
			return new Response(JSON.stringify({ error: 'Número de ticket y URL de evidencia son requeridos' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		await connectMongoose();
		const ticket = await TicketModel.findOne({ ticket_number: ticketNumber });
		if (!ticket) {
			return new Response(JSON.stringify({ error: 'Ticket no encontrado' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		const currentEv = (ticket.evidence_video || '').split(',').filter(Boolean);
		currentEv.push(evidenceUrl);
		ticket.evidence_video = currentEv.join(',');

		await ticket.save();

		return new Response(
			JSON.stringify({
				success: true,
				evidence_video: ticket.evidence_video,
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (err: any) {
		console.error('Error in add-evidence API:', err);
		return new Response(JSON.stringify({ error: err.message }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
