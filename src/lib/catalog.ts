/** Utilidades compartidas para el catálogo (badges de etiquetas y "NEW" automático). */

/** Negro o blanco según el color de fondo, para máximo contraste del texto. */
export function contrastColor(hex: string) {
	const c = (hex || '#ffffff').replace('#', '');
	const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
	const r = parseInt(full.substring(0, 2), 16) || 0;
	const g = parseInt(full.substring(2, 4), 16) || 0;
	const b = parseInt(full.substring(4, 6), 16) || 0;
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#000' : '#fff';
}

export interface BadgeView {
	name: string;
	color: string;
}

/** ¿El producto sigue dentro de la ventana "NEW" automática? (days <= 0 lo desactiva) */
export function isNewProduct(createdAt: Date | string | undefined, days: number) {
	if (!days || days <= 0 || !createdAt) return false;
	const created = new Date(createdAt).getTime();
	if (Number.isNaN(created)) return false;
	return Date.now() - created <= days * 24 * 60 * 60 * 1000;
}

/**
 * Devuelve los badges a mostrar para un producto: sus etiquetas manuales más,
 * si corresponde, una etiqueta NEW automática (sin duplicar si ya tiene una NEW).
 */
export function productBadges(
	tagDocs: Array<{ name: string; slug?: string; color: string }>,
	createdAt: Date | string | undefined,
	newBadgeDays: number
): BadgeView[] {
	const badges: BadgeView[] = (tagDocs || []).map((t) => ({ name: t.name, color: t.color }));
	const hasNew = badges.some((b) => b.name.trim().toUpperCase() === 'NEW');
	if (!hasNew && isNewProduct(createdAt, newBadgeDays)) {
		badges.unshift({ name: 'NEW', color: '#ffd400' });
	}
	return badges;
}
