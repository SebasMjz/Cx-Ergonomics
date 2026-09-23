import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../lib/mongo';
import { TicketModel } from '../../../lib/models/Ticket';
import { getSession } from '../../../lib/api';

export const GET: APIRoute = async ({ request, url }) => {
	try {
		// Only authenticated staff can use customer lookup
		const session = getSession(request);
		if (!session) {
			return new Response(JSON.stringify({ error: 'No autorizado' }), {
				status: 401,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		const ci = url.searchParams.get('ci')?.trim();
		if (!ci || ci.length < 3) {
			return new Response(JSON.stringify({ exists: false }), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		await connectMongoose();

		// Find the FIRST/EARLIEST ticket registered with this CI (canonical titular)
		const firstTicket = await TicketModel.findOne({
			'customer_details.ci': new RegExp(`^${ci.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
		})
			.sort({ createdAt: 1 })
			.lean();

		if (!firstTicket || !firstTicket.customer_details) {
			return new Response(JSON.stringify({ exists: false }), {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		return new Response(
			JSON.stringify({
				exists: true,
				customer: {
					name: firstTicket.customer_details.name || '',
					phone: firstTicket.customer_details.phone || '',
					ci: firstTicket.customer_details.ci || ci,
				},
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error) {
		console.error('Error in customer lookup:', error);
		return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
