import path from 'path';

/**
 * Obtiene la ruta raíz para archivos subidos de RMA (Tickets, recibos, fotos S/N, videos de evidencia).
 * Por defecto usa process.env.UPLOADS_DIR o /app/uploads
 */
export function getUploadsRoot(): string {
	if (process.env.UPLOADS_DIR) {
		return path.resolve(process.env.UPLOADS_DIR);
	}
	return path.resolve(process.cwd(), 'uploads');
}

/**
 * Obtiene la ruta raíz para archivos subidos del Catálogo (Productos, Categorías, Banners, Wallpapers).
 * Por defecto usa process.env.CATALOG_UPLOADS_DIR o /app/catalogo
 */
export function getCatalogUploadsRoot(): string {
	if (process.env.CATALOG_UPLOADS_DIR) {
		return path.resolve(process.env.CATALOG_UPLOADS_DIR);
	}
	if (process.env.UPLOADS_DIR) {
		const parent = path.dirname(process.env.UPLOADS_DIR);
		return path.join(parent, 'catalogo');
	}
	return path.resolve(process.cwd(), 'catalogo');
}
