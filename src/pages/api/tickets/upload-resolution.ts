import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
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

		// 2. Parse Multipart Form Data
		const formData = await request.formData();
		const ticketNumber = (formData.get('ticketNumber') as string || '').trim();
		const transactionNumber = (formData.get('transactionNumber') as string || '').trim();
		const note = (formData.get('note') as string || '').trim();
		const file = formData.get('file') as File | null;

		if (!ticketNumber) {
			return new Response(JSON.stringify({ error: 'El número de ticket es obligatorio.' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 3. Handle File Upload if provided
		let publicUrl = '';
		if (file && file.size > 0) {
			const ext = path.extname(file.name).toLowerCase();
			const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.gif'];
			if (!allowedExts.includes(ext)) {
				return new Response(
					JSON.stringify({ error: 'Formato de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) o documentos PDF.' }),
					{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
				);
			}

			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			const uploadsRoot = process.env.UPLOADS_DIR
				? path.resolve(process.env.UPLOADS_DIR)
				: path.resolve(process.cwd(), 'uploads');
			const targetDir = path.join(uploadsRoot, 'rma', 'resolutions');

			fs.mkdirSync(targetDir, { recursive: true });

			const filename = `${Date.now()}-${uuidv4()}${ext}`;
			const filePath = path.join(targetDir, filename);

			fs.writeFileSync(filePath, buffer);

			const relative = path.relative(uploadsRoot, filePath);
			const normalized = relative.split(path.sep).join('/');
			publicUrl = `/uploads/${normalized}`;
		}

		// 4. Connect to Database & Find Ticket
		await connectMongoose();
		const ticket = await TicketModel.findOne({ ticket_number: ticketNumber });

		if (!ticket) {
			return new Response(JSON.stringify({ error: 'Ticket no encontrado' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 5. Build Internal History Entry & Resolution Update
		const now = new Date();
		let historyNote = note || 'Se adjuntó resolución y se archivó el ticket.';
		if (transactionNumber) {
			historyNote += ` — Nº Transacción: ${transactionNumber}`;
		}

		const attachments = publicUrl ? [publicUrl] : [];

		const historyItem = {
			status: 'finalizada' as const,
			note: historyNote,
			updated_by_user_id: session.sub,
			author_name: session.name,
			visibility: 'internal' as const, // Guardar en interno, sin enviar al chat público del cliente
			attachments,
			updated_at: now,
		};

		const updateFields: Record<string, any> = {
			status: 'finalizada',
			archived: true,
		};

		if (transactionNumber) {
			updateFields.client_transaction_number = transactionNumber;
		}
		if (note && !ticket.resolution_main_comment) {
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
