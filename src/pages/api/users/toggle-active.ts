import type { APIRoute } from 'astro';
import { readCookieValue, verifyAuthToken } from '../../../lib/auth/jwt';
import { connectMongoose } from '../../../lib/mongo';
import { UserModel } from '../../../lib/models/User';

export const POST: APIRoute = async ({ request }) => {
	try {
		const token = readCookieValue(request.headers.get('cookie'), 'cx_auth');
		const session = token ? verifyAuthToken(token) : null;

		if (!session || session.role !== 'admin') {
			return new Response(JSON.stringify({ error: 'Acceso no autorizado. Se requiere perfil Administrador.' }), {
				status: 403,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		const body = await request.json();
		const { userId } = body;

		if (!userId) {
			return new Response(JSON.stringify({ error: 'ID de usuario es obligatorio.' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		if (userId === session.sub) {
			return new Response(JSON.stringify({ error: 'No puedes desactivar tu propia cuenta.' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		await connectMongoose();

		const user = await UserModel.findById(userId);
		if (!user) {
			return new Response(JSON.stringify({ error: 'Usuario no encontrado.' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// Toggle status
		user.is_active = !user.is_active;
		await user.save();

		return new Response(
			JSON.stringify({
				success: true,
				is_active: user.is_active,
				message: `Usuario ${user.name} ${user.is_active ? 'activado' : 'desactivado'}.`,
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error: any) {
		console.error('Error in toggle-active user API:', error);
		return new Response(JSON.stringify({ error: error.message || 'Error al cambiar estado de usuario' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
