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

		// 2. Parse Payload (JSON or FormData)
		let ticketNumber = '';
		let transactionNumber = '';
		let note = '';
		let shouldArchive = false;

		const contentType = request.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			const body = await request.json();
			ticketNumber = String(body.ticketNumber || '').trim();
			transactionNumber = String(body.transactionNumber || '').trim();
			note = String(body.note || '').trim();
			shouldArchive = !!body.archive;
		} else {
			const formData = await request.formData();
			ticketNumber = (formData.get('ticketNumber') as string || '').trim();
			transactionNumber = (formData.get('transactionNumber') as string || '').trim();
			note = (formData.get('note') as string || '').trim();
			shouldArchive = formData.get('archive') === 'true' || formData.get('archive') === '1';
		}

		if (!ticketNumber) {
			return new Response(JSON.stringify({ error: 'El número de ticket es obligatorio.' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		if (!transactionNumber || !note) {
			return new Response(
				JSON.stringify({ error: 'Debes ingresar obligatoriamente tanto el número de transacción/nota como la descripción de la resolución.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		// 3. Connect to Database & Find Ticket
		await connectMongoose();
		const ticket = await TicketModel.findOne({ ticket_number: ticketNumber });

		if (!ticket) {
			return new Response(JSON.stringify({ error: 'Ticket no encontrado' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		if (ticket.archived) {
			return new Response(
				JSON.stringify({ error: 'Un ticket archivado no puede sufrir ningún cambio de ninguna forma.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		// 4. Build Internal History Entry & Resolution Update
		const now = new Date();
		let historyNote = note || (shouldArchive ? 'Se registró resolución y se archivó el ticket.' : 'Se registró resolución en espera del proveedor.');
		if (transactionNumber) {
			historyNote += ` — Nº Transacción: ${transactionNumber}`;
		}

		const historyItem = {
			status: 'finalizada' as const,
			note: historyNote,
			updated_by_user_id: session.sub,
			author_name: session.name,
			visibility: 'internal' as const,
			attachments: [],
			updated_at: now,
		};

		const updateFields: Record<string, any> = {
			status: 'finalizada',
			archived: shouldArchive,
			in_supplier_waiting: false,
		};

		if (shouldArchive) {
			updateFields.archivedAt = now;
		}

		if (transactionNumber) {
			updateFields.supplier_transaction_number = transactionNumber;
		}
		if (note) {
			updateFields.resolution_main_comment = note;
		}

		const updatedTicket = await TicketModel.findOneAndUpdate(
			{ ticket_number: ticketNumber },
			{
				$set: updateFields,
				$push: { history: historyItem },
			},
			{ new: true }
		);

		return new Response(
			JSON.stringify({
				success: true,
				ticket: {
					ticket_number: updatedTicket?.ticket_number,
					status: updatedTicket?.status,
					archived: updatedTicket?.archived,
					archivedAt: updatedTicket?.archivedAt,
				},
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error: any) {
		console.error('Error in upload-resolution API:', error);
		return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
