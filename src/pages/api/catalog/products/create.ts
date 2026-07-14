import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { ProductModel, slugify } from '../../../../lib/models/Product';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const body = await request.json();
		const {
			name,
			description,
			sku,
			category_id,
			tag_ids,
			specs,
			highlights,
			spec_table,
			images,
			is_active,
		} = body;

		if (!name || !description || !sku) {
			return json({ error: 'Nombre, descripción y SKU son obligatorios.' }, 400);
		}

		await connectMongoose();

		// Nuevo producto va al final del orden.
		const last = await ProductModel.findOne().sort({ order: -1 }).select('order').lean();
		const nextOrder = (last?.order ?? 0) + 1;

		// Garantiza slug único.
		let slug = slugify(String(name));
		if (await ProductModel.exists({ slug })) {
			slug = `${slug}-${Date.now().toString(36)}`;
		}

		const product = await ProductModel.create({
			name,
			slug,
			description,
			sku,
			category_id: category_id || undefined,
			tag_ids: Array.isArray(tag_ids) ? tag_ids : [],
			specs: specs || undefined,
			highlights: Array.isArray(highlights) ? highlights.filter(Boolean) : [],
			spec_table: Array.isArray(spec_table) ? spec_table.filter((r: any) => r?.label && r?.value) : [],
			images: Array.isArray(images) ? images : [],
			order: nextOrder,
			is_active: is_active !== false,
		});

		return json({ success: true, product }, 201);
	} catch (error: any) {
		console.error('Error creating product:', error);
		if (error?.code === 11000) {
			return json({ error: 'Ya existe un producto con ese SKU o slug.' }, 400);
		}
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
