import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../lib/mongo';
import { StoreModel } from '../../../lib/models/Store';

export const GET: APIRoute = async ({ url }) => {
	try {
		const code = (url.searchParams.get('code') || '').trim();
		if (!code) {
			return new Response(
				JSON.stringify({ error: 'El código de cliente es obligatorio.' }),
				{ status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		await connectMongoose();
		const store = await StoreModel.findOne({ client_code: { $regex: new RegExp(`^${code}$`, 'i') } }).lean();

		if (!store) {
			return new Response(
				JSON.stringify({ error: 'Código de cliente no encontrado.' }),
				{ status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } }
			);
		}

		return new Response(
			JSON.stringify({ success: true, store }),
			{ status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	} catch (error: any) {
		console.error('Error fetching store details:', error);
		return new Response(
			JSON.stringify({ error: 'Error interno del servidor.' }),
			{ status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } }
		);
	}
};
