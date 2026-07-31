import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../lib/mongo';
import { DistributorRequestModel } from '../../../lib/models/DistributorRequest';
import { getSession } from '../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	try {
		const session = getSession(request);
		if (!session) {
			return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
		}

		await connectMongoose();
		const body = await request.json();
		const { id } = body;

		if (!id) {
			return new Response(
				JSON.stringify({ error: 'ID de solicitud es obligatorio.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		const deleted = await DistributorRequestModel.findByIdAndDelete(id);
		if (!deleted) {
			return new Response(
				JSON.stringify({ error: 'Solicitud no encontrada.' }),
				{ status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		return new Response(
			JSON.stringify({ success: true }),
			{ status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	} catch (error: any) {
		console.error('Error deleting distributor request:', error);
		return new Response(
			JSON.stringify({ error: error.message || 'Error interno del servidor.' }),
			{ status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	}
};
