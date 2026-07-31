import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../lib/mongo';
import { StoreModel } from '../../../lib/models/Store';
import { getSession } from '../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	try {
		// Secure this API: only logged-in users (admins/techs) can manage stores
		const session = getSession(request);
		if (!session) {
			return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
		}

		await connectMongoose();
		const body = await request.json();
		const { client_code, name, ci, phone, city } = body;

		if (!client_code || !name || !ci || !phone || !city) {
			return new Response(
				JSON.stringify({ error: 'Todos los campos son obligatorios.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		// Check if store already exists with the same client_code
		const existing = await StoreModel.findOne({ client_code: client_code.trim() });
		if (existing) {
			return new Response(
				JSON.stringify({ error: 'Ya existe una tienda con este código de cliente.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		const newStore = await StoreModel.create({
			client_code: client_code.trim(),
			name: name.trim(),
			ci: ci.trim(),
			phone: phone.trim(),
			city: city.trim(),
		});

		return new Response(
			JSON.stringify({ success: true, store: newStore }),
			{ status: 201, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	} catch (error: any) {
		console.error('Error creating store:', error);
		return new Response(
			JSON.stringify({ error: error.message || 'Error interno del servidor.' }),
			{ status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	}
};
