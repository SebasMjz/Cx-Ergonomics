import { createHmac, timingSafeEqual } from 'crypto';

export interface AuthTokenPayload {
	sub: string;
	name: string;
	email: string;
	role: 'admin' | 'technical';
	must_change_password?: boolean;
	iat: number;
	exp: number;
}

const encoder = new TextEncoder();

function base64UrlEncode(input: Buffer | Uint8Array | string) {
	const buffer = typeof input === 'string' ? Buffer.from(input) : Buffer.from(input);
	return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input: string) {
	const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
	const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
	return Buffer.from(normalized + padding, 'base64');
}

function getSecret() {
	return process.env.JWT_SECRET || 'cx-ergonomic-dev-secret';
}

function getExpirationSeconds() {
	const rawValue = process.env.JWT_EXPIRES_IN || '7d';
	const match = rawValue.match(/^(\d+)([smhd])$/i);

	if (!match) {
		return 60 * 60 * 24 * 7;
	}

	const value = Number(match[1]);
	const unit = match[2].toLowerCase();
	const multipliers: Record<string, number> = {
		s: 1,
		m: 60,
		h: 60 * 60,
		d: 60 * 60 * 24,
	};

	return value * multipliers[unit];
}

export function signAuthToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>) {
	const issuedAt = Math.floor(Date.now() / 1000);
	const expiresIn = getExpirationSeconds();
	const tokenPayload: AuthTokenPayload = {
		...payload,
		iat: issuedAt,
		exp: issuedAt + expiresIn,
	};

	const header = { alg: 'HS256', typ: 'JWT' };
	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
	const data = `${encodedHeader}.${encodedPayload}`;
	const signature = createHmac('sha256', getSecret()).update(data).digest();

	return `${data}.${base64UrlEncode(signature)}`;
}

export function verifyAuthToken(token: string) {
	const [encodedHeader, encodedPayload, signature] = token.split('.');

	if (!encodedHeader || !encodedPayload || !signature) {
		return null;
	}

	const data = `${encodedHeader}.${encodedPayload}`;
	const expectedSignature = createHmac('sha256', getSecret()).update(data).digest();
	const receivedSignature = base64UrlDecode(signature);

	if (receivedSignature.length !== expectedSignature.length) {
		return null;
	}

	if (!timingSafeEqual(receivedSignature, expectedSignature)) {
		return null;
	}

	try {
		const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as AuthTokenPayload;
		const now = Math.floor(Date.now() / 1000);

		if (payload.exp <= now) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
}

export function buildAuthCookie(token: string) {
	const maxAge = getExpirationSeconds();
	const secure = process.env.NODE_ENV === 'production';

	return [
		`cx_auth=${token}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		`Max-Age=${maxAge}`,
		secure ? 'Secure' : null,
	]
		.filter(Boolean)
		.join('; ');
}

export function buildClearAuthCookie() {
	const secure = process.env.NODE_ENV === 'production';

	return [
		'cx_auth=',
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		'Max-Age=0',
		secure ? 'Secure' : null,
	]
		.filter(Boolean)
		.join('; ');
}

export function readCookieValue(cookieHeader: string | null, name: string) {
	if (!cookieHeader) {
		return null;
	}

	const parts = cookieHeader.split(';').map((part) => part.trim());
	for (const part of parts) {
		const [cookieName, ...cookieValueParts] = part.split('=');
		if (cookieName === name) {
			return cookieValueParts.join('=') || null;
		}
	}

	return null;
}
