import type { APIRoute } from 'astro';
import { readCookieValue, verifyAuthToken } from '../../../lib/auth/jwt';
import { connectMongoose } from '../../../lib/mongo';
import { UserModel } from '../../../lib/models/User';

export const POST: APIRoute = async ({ request }) => {
	try {
		// 1. Verify User Session & Role
		const token = readCookieValue(request.headers.get('cookie'), 'cx_auth');
		const session = token ? verifyAuthToken(token) : null;

		if (!session || session.role !== 'admin') {
			return new Response(JSON.stringify({ error: 'Acceso no autorizado. Se requiere perfil Administrador.' }), {
				status: 403,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 2. Parse Request Body
		const body = await request.json();
		const { name, email, password, role } = body;

		if (!name || !email || !password || !role) {
			return new Response(JSON.stringify({ error: 'Todos los campos son obligatorios' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		if (role !== 'admin' && role !== 'technical') {
			return new Response(JSON.stringify({ error: 'Perfil de usuario inválido (admin o technical)' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 3. Connect to Database
		await connectMongoose();

		// Check duplicate email
		const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			return new Response(JSON.stringify({ error: 'El correo electrónico ya está registrado.' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 4. Create User
		const newUser = await UserModel.create({
			name,
			email: email.toLowerCase(),
			password,
			role,
			is_active: true,
		});

		return new Response(
			JSON.stringify({
				success: true,
				user: {
					id: newUser._id,
					name: newUser.name,
					email: newUser.email,
					role: newUser.role,
				},
			}),
			{
				status: 201,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error: any) {
		console.error('Error in user creation API:', error);
		return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
