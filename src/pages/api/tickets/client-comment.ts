import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../lib/mongo';
import { TicketModel } from '../../../lib/models/Ticket';

/**
 * Endpoint PÚBLICO: el cliente, desde la vista de seguimiento (identificado por su
 * número de ticket), puede dejar un comentario y adjuntar más evidencia en el mismo
 * ticket. Se registra siempre como nota EXTERNA y marcada como del cliente.
 */
export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const ticketNumber = String(body.ticketNumber || '').trim();
		const note = String(body.note || '').trim();
		const attachments = Array.isArray(body.attachments)
			? body.attachments.filter((a: unknown) => typeof a === 'string')
			: [];

		if (!ticketNumber || (!note && attachments.length === 0)) {
			return new Response(
				JSON.stringify({ error: 'Escribe un comentario o adjunta al menos un archivo.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		await connectMongoose();

		const ticket = await TicketModel.findOne({ ticket_number: ticketNumber });
		if (!ticket) {
			return new Response(JSON.stringify({ error: 'No encontramos ese número de ticket.' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		const historyItem = {
			status: ticket.status,
			note: note || 'El cliente adjuntó nueva evidencia.',
			visibility: 'external' as const,
			from_client: true,
			author_name: ticket.customer_details?.name || 'Cliente',
			attachments,
			updated_at: new Date(),
		};

		const updateData: any = {
			$push: { history: historyItem }
		};

		if (ticket.status === 'finalizada') {
			updateData.$set = {
				status: 'recibida',
				step_resolved: false,
			};
			updateData.$unset = {
				resolution_type: '',
				resolution_main_comment: '',
				client_solution: '',
				supplier_solution: '',
			};
		}

		await TicketModel.updateOne(
			{ ticket_number: ticketNumber },
			updateData
		);

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	} catch (error) {
		console.error('Error in client-comment API:', error);
		return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
