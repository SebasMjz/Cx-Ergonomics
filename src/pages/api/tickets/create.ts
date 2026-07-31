import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../lib/mongo';
import { TicketModel } from '../../../lib/models/Ticket';
import { getSession } from '../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	try {
		// 1. Parse Request Body
		const body = await request.json();
		const {
			customerName,
			customerCi,
			customerPhone,
			customerCity,
			customerDepartment,
			productSerialNumber,
			productName,
			productBrand,
			storeManagerName,
			storeManagerPhone,
			issueDescription,
			salesReceiptImage,
			evidenceVideo,
		} = body;

		// Validation
		if (
			!customerName ||
			!customerCi ||
			!customerPhone ||
			!customerCity ||
			!productSerialNumber ||
			!productName ||
			!productBrand ||
			!issueDescription ||
			!salesReceiptImage ||
			!evidenceVideo
		) {
			return new Response(
				JSON.stringify({ error: 'Todos los campos son obligatorios, incluyendo los archivos de factura y evidencia.' }),
				{
					status: 400,
					headers: { 'content-type': 'application/json; charset=utf-8' },
				}
			);
		}

		// Si lo registra un usuario logueado (admin/técnico en sucursal), el ticket entra
		// directamente "en proceso": el cliente trajo el producto y nosotros lo recibimos.
		const session = getSession(request);
		const isStaff = !!session;
		const initialStatus: 'recibida' | 'en proceso' = isStaff ? 'en proceso' : 'recibida';
		const initialNote = isStaff
			? `Solicitud registrada en sucursal por ${session!.name}. Producto recibido para revisión.`
			: 'Ticket registrado por el cliente';

		// 2. Connect to Database
		await connectMongoose();

		// 3. Generate Sequential Ticket Number (RMA-YYYY-XXXX) starting from 1001 for current year.
		//    Se calcula a partir del MÁXIMO existente (no del conteo): si un ticket se borra
		//    o se archiva, el conteo baja pero el número más alto sigue ocupado, lo que
		//    provocaba colisiones de clave única (E11000). Además reintentamos ante carrera.
		const year = new Date().getFullYear();

		/** Devuelve el siguiente número secuencial disponible para el año actual. */
		async function nextTicketNumber(): Promise<string> {
			const latest = await TicketModel.findOne({
				ticket_number: new RegExp(`^RMA-${year}-`),
			})
				.sort({ ticket_number: -1 })
				.collation({ locale: 'en_US', numericOrdering: true })
				.select('ticket_number')
				.lean();

			let nextSeq = 1001;
			if (latest?.ticket_number) {
				const parsed = parseInt(latest.ticket_number.split('-').pop() || '', 10);
				if (Number.isFinite(parsed)) {
					nextSeq = parsed + 1;
				}
			}
			return `RMA-${year}-${nextSeq}`;
		}

		// 4. Create Ticket (reintenta si otro request tomó el mismo número en paralelo)
		let newTicket;
		for (let attempt = 0; attempt < 5; attempt++) {
			const ticketNumber = await nextTicketNumber();
			try {
				newTicket = await TicketModel.create({
					ticket_number: ticketNumber,
					customer_details: {
						name: customerName,
						ci: customerCi,
						phone: customerPhone,
						city: customerCity,
						department: customerDepartment || '',
					},
					product_serial_number: productSerialNumber,
					product_name: productName,
					product_brand: productBrand,
					store_manager_name: storeManagerName || '',
					store_manager_phone: storeManagerPhone || '',
					sales_receipt_image: salesReceiptImage,
					issue_description: issueDescription,
					evidence_video: evidenceVideo,
					status: initialStatus,
					archived: false,
					history: [
						{
							status: initialStatus,
							note: initialNote,
							updated_by_user_id: session?.sub,
							visibility: 'internal',
							updated_at: new Date(),
						},
					],
				});
				break;
			} catch (err: any) {
				// 11000 = duplicate key. Solo reintentamos si chocó el ticket_number.
				if (err?.code === 11000 && err?.keyPattern?.ticket_number && attempt < 4) {
					continue;
				}
				throw err;
			}
		}

		if (!newTicket) {
			throw new Error('No se pudo generar un número de ticket único. Intenta nuevamente.');
		}

		return new Response(
			JSON.stringify({
				success: true,
				ticket: {
					ticket_number: newTicket.ticket_number,
					customer_name: newTicket.customer_details.name,
				},
			}),
			{
				status: 201,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error) {
		console.error('Error in ticket creation API:', error);
		
		// Handle duplicate name for the same CI pre-save validation error
		const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
		
		return new Response(
			JSON.stringify({ error: errorMessage }),
			{
				status: 500,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	}
};
