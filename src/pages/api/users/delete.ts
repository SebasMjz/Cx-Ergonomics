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
			return new Response(JSON.stringify({ error: 'Acceso no autorizado' }), {
				status: 403,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 2. Parse Request Body
		const body = await request.json();
		const { userId } = body;

		if (!userId) {
			return new Response(JSON.stringify({ error: 'ID de usuario es obligatorio' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// Prevent self-deletion
		if (userId === session.sub) {
			return new Response(JSON.stringify({ error: 'No puedes eliminar tu propio usuario' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// 3. Connect to Database
		await connectMongoose();

		// 4. Delete User
		const deletedUser = await UserModel.findByIdAndDelete(userId);

		if (!deletedUser) {
			return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: `Usuario ${deletedUser.name} eliminado con éxito`,
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			}
		);
	} catch (error) {
		console.error('Error in user deletion API:', error);
		return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
