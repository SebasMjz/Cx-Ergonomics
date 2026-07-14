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
		const { ticketNumber } = body;

		if (!ticketNumber) {
			return new Response(JSON.stringify({ error: 'Número de ticket es obligatorio' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 3. Connect to Database
		await connectMongoose();

		// 4. Delete Ticket
		const deletedTicket = await TicketModel.findOneAndDelete({ ticket_number: ticketNumber });

		if (!deletedTicket) {
			return new Response(JSON.stringify({ error: 'Ticket no encontrado' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: `Ticket #${ticketNumber} eliminado con éxito`,
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error) {
		console.error('Error in delete API:', error);
		return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
