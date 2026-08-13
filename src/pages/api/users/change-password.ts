import type { APIRoute } from 'astro';
import { readCookieValue, verifyAuthToken, signAuthToken, buildAuthCookie } from '../../../lib/auth/jwt';
import { connectMongoose } from '../../../lib/mongo';
import { UserModel } from '../../../lib/models/User';

export const POST: APIRoute = async ({ request }) => {
	try {
		const token = readCookieValue(request.headers.get('cookie'), 'cx_auth');
		const session = token ? verifyAuthToken(token) : null;

		if (!session) {
			return new Response(JSON.stringify({ error: 'Acceso no autorizado.' }), {
				status: 401,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		const body = await request.json();
		const { newPassword } = body;

		if (!newPassword || newPassword.length < 6) {
			return new Response(JSON.stringify({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		await connectMongoose();

		const user = await UserModel.findById(session.sub);
		if (!user) {
			return new Response(JSON.stringify({ error: 'Usuario no encontrado.' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=utf-8' },
			});
		}

		// Update password and clear must_change_password flag
		user.password = newPassword;
		user.must_change_password = false;
		await user.save();

		// Issue updated JWT token without must_change_password flag
		const updatedToken = signAuthToken({
			sub: String(user._id),
			name: user.name,
			email: user.email,
			role: user.role,
			must_change_password: false,
		});

		return new Response(
			JSON.stringify({ success: true, message: 'Contraseña actualizada exitosamente.' }),
			{
				status: 200,
				headers: {
					'content-type': 'application/json; charset=utf-8',
					'set-cookie': buildAuthCookie(updatedToken),
				},
			}
		);
	} catch (error: any) {
		console.error('Error in change-password API:', error);
		return new Response(JSON.stringify({ error: error.message || 'Error al cambiar contraseña' }), {
			status: 500,
			headers: { 'content-type': 'application/json; charset=utf-8' },
		});
	}
};
