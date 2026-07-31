import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../lib/mongo';
import { DistributorRequestModel } from '../../../lib/models/DistributorRequest';

export const POST: APIRoute = async ({ request }) => {
	try {
		await connectMongoose();
		const body = await request.json();
		const { company, name, email, phone, city, message } = body;

		if (!company || !name || !email || !phone || !city) {
			return new Response(
				JSON.stringify({ error: 'Todos los campos excepto el mensaje son obligatorios.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		const newRequest = await DistributorRequestModel.create({
			company,
			name,
			email,
			phone,
			city,
			message: message || '',
		});

		return new Response(
			JSON.stringify({ success: true, request: newRequest }),
			{ status: 201, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	} catch (error: any) {
		console.error('Error creating distributor request:', error);
		return new Response(
			JSON.stringify({ error: error.message || 'Error interno del servidor.' }),
			{ status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	}
};
