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
		const { ticketNumber, step_left_at_branch, step_sent_to_distributor, step_resolved } = body;

		if (!ticketNumber) {
			return new Response(JSON.stringify({ error: 'Número de ticket es obligatorio' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 3. Connect to Database
		await connectMongoose();

		// 4. Update Ticket Checkboxes
		const updateData: Record<string, boolean> = {};
		if (step_left_at_branch !== undefined) updateData.step_left_at_branch = !!step_left_at_branch;
		if (step_sent_to_distributor !== undefined) updateData.step_sent_to_distributor = !!step_sent_to_distributor;
		if (step_resolved !== undefined) updateData.step_resolved = !!step_resolved;

		const updatedTicket = await TicketModel.findOneAndUpdate(
			{ ticket_number: ticketNumber },
			{ $set: updateData },
			{ new: true }
		);

		if (!updatedTicket) {
			return new Response(JSON.stringify({ error: 'Ticket no encontrado' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		return new Response(
			JSON.stringify({
				success: true,
				ticket: {
					ticket_number: updatedTicket.ticket_number,
					step_left_at_branch: updatedTicket.step_left_at_branch,
					step_sent_to_distributor: updatedTicket.step_sent_to_distributor,
					step_resolved: updatedTicket.step_resolved,
				},
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error) {
		console.error('Error in update-steps API:', error);
		return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
