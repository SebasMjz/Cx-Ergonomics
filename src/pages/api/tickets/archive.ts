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
		const { ticketNumber, archived } = body;

		if (!ticketNumber || archived === undefined) {
			return new Response(JSON.stringify({ error: 'Número de ticket y estado de archivado son obligatorios' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		if (archived === false) {
			return new Response(JSON.stringify({ error: 'Los tickets archivados no se pueden regresar al tablero activo.' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 3. Connect to Database
		await connectMongoose();

		// 4. Update Ticket (Set archived)
		const ticket = await TicketModel.findOne({ ticket_number: ticketNumber });
		if (!ticket) {
			return new Response(JSON.stringify({ error: 'Ticket no encontrado' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		const historyItem = {
			status: ticket.status,
			note: `${session.name} ${archived ? 'archivó' : 'desarchivó'} el ticket #${ticketNumber}`,
			updated_by_user_id: session.sub,
			updated_at: new Date(),
		};

		const updatedTicket = await TicketModel.findOneAndUpdate(
			{ ticket_number: ticketNumber },
			{
				$set: { archived: !!archived },
				$push: { history: historyItem },
			},
			{ new: true }
		);

		if (!updatedTicket) {
			return new Response(JSON.stringify({ error: 'Ticket no encontrado al actualizar' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		return new Response(
			JSON.stringify({
				success: true,
				ticket: {
					ticket_number: updatedTicket.ticket_number,
					archived: updatedTicket.archived,
				},
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error) {
		console.error('Error in archive API:', error);
		return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
