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
		const { ticketNumber, status, orderedNumbers, clientTransactionNumber, supplierTransactionNumber } = body;

		if (!ticketNumber || !status) {
			return new Response(JSON.stringify({ error: 'Número de ticket y estado son obligatorios' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		if (status !== 'recibida' && status !== 'en proceso' && status !== 'en revision' && status !== 'finalizada' && status !== 'rechazada') {
			return new Response(JSON.stringify({ error: 'Estado de ticket inválido' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 2b. Datos de resolución obligatorios al finalizar o rechazar
		const resolutionLabels: Record<string, string> = {
			rechazo: 'Rechazo',
			descuento: 'Descuento',
			reponer: 'Reponer',
		};
		let resolutionUpdate: Record<string, string> = {};

		// 3. Connect to Database
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

		if (status === 'finalizada' || status === 'rechazada') {
			const resolutionType = status === 'rechazada'
				? 'rechazo'
				: String(body.resolutionType || ticket.resolution_type || '').trim();
			const mainComment = String(body.mainComment || ticket.resolution_main_comment || '').trim();
			const supplierSolution = String(body.supplierSolution || ticket.supplier_solution || '').trim();
			const supplierTransaction = String(supplierTransactionNumber || ticket.supplier_transaction_number || '').trim();

			// Si se está cambiando de estado o guardando resolución (y no es solo un clic en 'Poner en espera')
			if (!body.inSupplierWaiting && (body.resolutionType || !ticket.resolution_type)) {
				if (!resolutionLabels[resolutionType]) {
					return new Response(
						JSON.stringify({ error: 'Debes seleccionar un tipo de resolución válido (Rechazo, Descuento o Reponer).' }),
						{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
					);
				}
				if (!mainComment) {
					return new Response(
						JSON.stringify({ error: 'El comentario o motivo de resolución es obligatorio.' }),
						{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
					);
				}
			}

			if (resolutionType) resolutionUpdate.resolution_type = resolutionType;
			if (mainComment) resolutionUpdate.resolution_main_comment = mainComment;
			if (supplierSolution) resolutionUpdate.supplier_solution = supplierSolution;
			if (supplierTransaction) resolutionUpdate.supplier_transaction_number = supplierTransaction;
		}

		// Validación: No está permitido mover un ticket a un estado anterior de manera manual
		const statusOrderMap: Record<string, number> = {
			recibida: 0,
			'en revision': 1,
			'en proceso': 2,
			finalizada: 3,
			rechazada: 3,
		};

		const currentIndex = statusOrderMap[ticket.status] ?? 0;
		const targetIndex = statusOrderMap[status] ?? 0;

		if (targetIndex < currentIndex) {
			return new Response(
				JSON.stringify({ error: 'No está permitido mover un ticket a un estado anterior de manera manual.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		// Enforce mandatory steps if updating status to finalizada and not rejected
		if (status === 'finalizada' && !body.inSupplierWaiting && !ticket.in_supplier_waiting) {
			const resType = String(body.resolutionType || ticket.resolution_type || '').trim();
			if (resType !== 'rechazo') {
				if (!ticket.step_left_at_branch || !ticket.step_sent_to_distributor || !ticket.step_resolved) {
					return new Response(
						JSON.stringify({
							error: 'Debes completar los 3 pasos obligatorios en los detalles del ticket (Producto dejado en sucursal, Producto mandado con distribuidor y Producto dado solución) antes de finalizar este ticket.'
						}),
						{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
					);
				}
			}
		}

		// 4. Update Ticket and Push History Entry
		const phaseLabels = {
			recibida: 'Nuevas solicitudes',
			'en revision': 'En revisión',
			'en proceso': 'En proceso',
			finalizada: 'Finalizadas',
			rechazada: 'Rechazadas',
		};
		const statusLabel = phaseLabels[status as keyof typeof phaseLabels];
		let note = ticket.status === status
			? `${session.name} editó la resolución del ticket #${ticketNumber}`
			: `${session.name} actualizó a "${statusLabel}" el ticket #${ticketNumber}`;
		if (status === 'finalizada' || status === 'rechazada') {
			note += ` — Resolución: ${resolutionLabels[resolutionUpdate.resolution_type]}. ${resolutionUpdate.resolution_main_comment}`;
		}

		const now = new Date();
		const historyItems: any[] = [
			{
				status,
				note,
				updated_by_user_id: session.sub,
				visibility: 'internal',
				updated_at: now,
			},
		];

		// En un rechazo, dejamos también una nota EXTERNA visible para el cliente en su
		// vista de seguimiento, con el motivo. Así sabe por qué se rechazó y puede reenviar
		// evidencia en el mismo ticket.
		if ((status === 'finalizada' || status === 'rechazada') && resolutionUpdate.resolution_type === 'rechazo') {
			historyItems.push({
				status,
				note: `Tu solicitud fue rechazada. Motivo: ${resolutionUpdate.resolution_main_comment}`,
				updated_by_user_id: session.sub,
				visibility: 'external',
				updated_at: new Date(now.getTime() + 1),
			});
		}

		const setFields: Record<string, any> = { status, ...resolutionUpdate };
		if (typeof body.inSupplierWaiting === 'boolean') {
			setFields.in_supplier_waiting = body.inSupplierWaiting;
		}

		if (body.inSupplierWaiting === true) {
			note = `${session.name} puso en espera del proveedor el ticket #${ticketNumber}`;
			historyItems[0].note = note;
		}

		const updatedTicket = await TicketModel.findOneAndUpdate(
			{ ticket_number: ticketNumber },
			{
				$set: setFields,
				$push: { history: { $each: historyItems } },
			},
			{ new: true }
		);

		if (!updatedTicket) {
			return new Response(JSON.stringify({ error: 'Ticket no encontrado' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// Update order values if orderedNumbers is provided without modifying updatedAt on other tickets
		if (Array.isArray(orderedNumbers) && orderedNumbers.length > 0) {
			const bulkOps = orderedNumbers.map((num, index) => ({
				updateOne: {
					filter: { ticket_number: num },
					update: { $set: { order: index } }
				}
			}));
			await TicketModel.collection.bulkWrite(bulkOps);
		}

		return new Response(
			JSON.stringify({
				success: true,
				ticket: {
					ticket_number: updatedTicket.ticket_number,
					status: updatedTicket.status,
				},
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error) {
		console.error('Error in update-status API:', error);
		return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
