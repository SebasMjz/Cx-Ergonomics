import { readCookieValue, verifyAuthToken, type AuthTokenPayload } from './auth/jwt';

/** Respuesta JSON estándar con charset utf-8. */
export function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8' },
	});
}

/** Devuelve la sesión verificada desde la cookie cx_auth, o null. */
export function getSession(request: Request): AuthTokenPayload | null {
	const token = readCookieValue(request.headers.get('cookie'), 'cx_auth');
	return token ? verifyAuthToken(token) : null;
}

/**
 * Exige una sesión con rol admin. Devuelve `{ session }` si pasa,
 * o `{ response }` con el error listo para retornar.
 */
export function requireAdmin(request: Request):
	| { session: AuthTokenPayload; response?: undefined }
	| { session?: undefined; response: Response } {
	const session = getSession(request);
	if (!session || session.role !== 'admin') {
		return {
			response: json({ error: 'Acceso no autorizado. Se requiere perfil Administrador.' }, 403),
		};
	}
	return { session };
}
