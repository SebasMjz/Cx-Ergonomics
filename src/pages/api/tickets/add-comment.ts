import type { APIRoute } from 'astro';
import { readCookieValue, verifyAuthToken } from '../../../lib/auth/jwt';
import { connectMongoose } from '../../../lib/mongo';
import { TicketModel } from '../../../lib/models/Ticket';

export const POST: APIRoute = async ({ request }) => {
	try {
		// 1. Verify User Session
		const token = readCookieValue(request.headers.get('cookie'), 'cx_auth');
		const session = token ? verifyAuthToken(token) : null;

		if (!session) {
			return new Response(JSON.stringify({ error: 'Acceso no autorizado' }), {
				status: 401,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 2. Parse Request Body
		const body = await request.json();
		const { ticketNumber, note } = body;
		// 'external' = visible para el cliente en la vista de seguimiento. Por defecto interno.
		const visibility = body.visibility === 'external' ? 'external' : 'internal';
		const attachments = Array.isArray(body.attachments)
			? body.attachments.filter((a: unknown) => typeof a === 'string')
			: [];

		if (!ticketNumber || !note) {
			return new Response(JSON.stringify({ error: 'Número de ticket y comentario son obligatorios' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 3. Connect to Database
		await connectMongoose();

		// 4. Find the ticket to get current status
		const ticket = await TicketModel.findOne({ ticket_number: ticketNumber });
		if (!ticket) {
			return new Response(JSON.stringify({ error: 'Ticket no encontrado' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 5. Add Comment to History Array
		const historyItem = {
			status: ticket.status,
			note: note.trim(),
			updated_by_user_id: session.sub,
			visibility,
			attachments,
			author_name: session.name,
			updated_at: new Date(),
		};

		await TicketModel.findOneAndUpdate(
			{ ticket_number: ticketNumber },
			{
				$push: { history: historyItem },
			},
			{ new: true }
		);

		return new Response(
			JSON.stringify({
				success: true,
				comment: {
					status: historyItem.status,
					note: historyItem.note,
					visibility: historyItem.visibility,
					attachments: historyItem.attachments,
					updated_at: historyItem.updated_at,
					userName: session.name,
				},
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error) {
		console.error('Error in add-comment API:', error);
		return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
