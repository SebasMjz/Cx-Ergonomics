import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../lib/mongo';
import { StoreModel } from '../../../lib/models/Store';
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
				JSON.stringify({ error: 'ID de tienda es obligatorio.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		const deletedStore = await StoreModel.findByIdAndDelete(id);
		if (!deletedStore) {
			return new Response(
				JSON.stringify({ error: 'Tienda no encontrada.' }),
				{ status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		return new Response(
			JSON.stringify({ success: true }),
			{ status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	} catch (error: any) {
		console.error('Error deleting store:', error);
		return new Response(
			JSON.stringify({ error: error.message || 'Error interno del servidor.' }),
			{ status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	}
};
