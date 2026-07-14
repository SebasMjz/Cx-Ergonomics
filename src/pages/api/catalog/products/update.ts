import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../../lib/mongo';
import { ProductModel } from '../../../../lib/models/Product';
import { json, requireAdmin } from '../../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const body = await request.json();
		const { id } = body;
		if (!id) return json({ error: 'Falta el id del producto.' }, 400);

		await connectMongoose();

		const product = await ProductModel.findById(id);
		if (!product) return json({ error: 'Producto no encontrado.' }, 404);

		const fields = [
			'name', 'description', 'sku',
			'category_id', 'tag_ids', 'specs', 'highlights', 'spec_table', 'images', 'is_active',
		] as const;

		for (const field of fields) {
			if (body[field] === undefined) continue;
			if (field === 'category_id') {
				(product as any).category_id = body.category_id || undefined;
			} else if (field === 'tag_ids') {
				product.tag_ids = Array.isArray(body.tag_ids) ? body.tag_ids : [];
			} else if (field === 'highlights') {
				product.highlights = Array.isArray(body.highlights) ? body.highlights.filter(Boolean) : [];
			} else if (field === 'spec_table') {
				product.spec_table = Array.isArray(body.spec_table)
					? body.spec_table.filter((r: any) => r?.label && r?.value)
					: [];
			} else if (field === 'images') {
				product.images = Array.isArray(body.images) ? body.images : [];
			} else {
				(product as any)[field] = body[field];
			}
		}

		await product.save();
		return json({ success: true, product });
	} catch (error: any) {
		console.error('Error updating product:', error);
		if (error?.code === 11000) {
			return json({ error: 'Ya existe un producto con ese SKU o slug.' }, 400);
		}
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
