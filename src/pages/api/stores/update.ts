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
		const { id, client_code, name, ci, phone, city } = body;

		if (!id || !client_code || !name || !ci || !phone || !city) {
			return new Response(
				JSON.stringify({ error: 'Todos los campos son obligatorios.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		// Check duplicate client_code for other store
		const duplicate = await StoreModel.findOne({ client_code: client_code.trim(), _id: { $ne: id } });
		if (duplicate) {
			return new Response(
				JSON.stringify({ error: 'Ya existe otra tienda con este código de cliente.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		const updatedStore = await StoreModel.findByIdAndUpdate(
			id,
			{
				client_code: client_code.trim(),
				name: name.trim(),
				ci: ci.trim(),
				phone: phone.trim(),
				city: city.trim(),
			},
			{ new: true }
		);

		if (!updatedStore) {
			return new Response(
				JSON.stringify({ error: 'Tienda no encontrada.' }),
				{ status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		return new Response(
			JSON.stringify({ success: true, store: updatedStore }),
			{ status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	} catch (error: any) {
		console.error('Error updating store:', error);
		return new Response(
			JSON.stringify({ error: error.message || 'Error interno del servidor.' }),
			{ status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	}
};
