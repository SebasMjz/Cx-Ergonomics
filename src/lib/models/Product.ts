import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IProductSpecs {
	material?: string;
	color?: string;
	weight_capacity?: string;
}

export interface ISpecRow {
	label: string;
	value: string;
}

export interface IProduct extends Document {
	name: string;
	slug: string;
	description: string;
	sku: string;
	category_id?: mongoose.Types.ObjectId;
	tag_ids: mongoose.Types.ObjectId[];
	specs?: IProductSpecs;
	highlights: string[];
	spec_table: ISpecRow[];
	images: string[];
	order: number;
	is_active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const ProductSpecsSchema = new Schema<IProductSpecs>(
	{
		material: { type: String, trim: true },
		color: { type: String, trim: true },
		weight_capacity: { type: String, trim: true },
	},
	{ _id: false }
);

const SpecRowSchema = new Schema<ISpecRow>(
	{
		label: { type: String, required: true, trim: true },
		value: { type: String, required: true, trim: true },
	},
	{ _id: false }
);

/** Convierte un nombre en un slug URL-safe (sin acentos ni símbolos). */
export function slugify(input: string) {
	return input
		.toString()
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

const ProductSchema = new Schema<IProduct>(
	{
		name: { type: String, required: true, trim: true },
		slug: { type: String, unique: true, trim: true, lowercase: true },
		description: { type: String, required: true },
		sku: { type: String, required: true, unique: true, trim: true },
		category_id: { type: Schema.Types.ObjectId, ref: 'Category' },
		tag_ids: { type: [Schema.Types.ObjectId], ref: 'Tag', default: [] },
		specs: { type: ProductSpecsSchema, default: undefined },
		highlights: { type: [String], default: [] },
		spec_table: { type: [SpecRowSchema], default: [] },
		images: { type: [String], default: [] },
		order: { type: Number, default: 0 },
		is_active: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

// Autogenera/normaliza el slug a partir del nombre cuando falta o cambia el nombre.
ProductSchema.pre('validate', function ensureSlug(next) {
	if (!this.slug && this.name) {
		this.slug = slugify(this.name);
	}
	next();
});

export const ProductModel: Model<IProduct> =
	(mongoose.models.Product as Model<IProduct>) || mongoose.model<IProduct>('Product', ProductSchema);
