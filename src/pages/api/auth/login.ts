import type { APIRoute } from 'astro';
import bcrypt from 'bcrypt';
import { connectMongoose } from '../../../lib/mongo';
import { UserModel } from '../../../lib/models/User';
import { buildAuthCookie, signAuthToken } from '../../../lib/auth/jwt';

export const POST: APIRoute = async ({ request }) => {
	try {
		const payload = await request.json();
		const email = String(payload?.email || '').trim().toLowerCase();
		const password = String(payload?.password || '');

		if (!email || !password) {
			return new Response(JSON.stringify({ error: 'Email y contrasena son obligatorios.' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		await connectMongoose();
		const user = await UserModel.findOne({ email }).lean();

		if (!user || !user.password) {
			return new Response(JSON.stringify({ error: 'Credenciales invalidas.' }), {
				status: 401,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		const isValid = await bcrypt.compare(password, user.password);
		if (!isValid) {
			return new Response(JSON.stringify({ error: 'Credenciales invalidas.' }), {
				status: 401,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		if (!user.is_active) {
			return new Response(JSON.stringify({ error: 'Usuario inactivo.' }), {
				status: 403,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		const token = signAuthToken({
			sub: String(user._id),
			name: user.name,
			email: user.email,
			role: user.role,
			must_change_password: !!user.must_change_password,
		});

		return new Response(
			JSON.stringify({
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					role: user.role,
					must_change_password: !!user.must_change_password,
				},
				token,
			}),
			{
				status: 200,
				headers: {
					'content-type': 'application/json; charset=utf-8',
					'set-cookie': buildAuthCookie(token),
				},
			}
		);
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Solicitud invalida.' }), {
			status: 400,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
