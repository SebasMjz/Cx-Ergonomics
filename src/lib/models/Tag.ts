import mongoose, { Schema, type Document, type Model } from 'mongoose';

/**
 * Etiqueta de producto (independiente de la categoría): NEW, PROMO, AGOTADO, etc.
 * Se asigna a los productos vía `tag_ids` y se renderiza como badge de color.
 */
export interface ITag extends Document {
	name: string;
	slug: string;
	color: string;
	order: number;
	is_active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
	{
		name: { type: String, required: true, unique: true, trim: true },
		slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
		// Color hex de fondo del badge (texto se calcula en el front según contraste).
		color: { type: String, default: '#ffffff', trim: true },
		order: { type: Number, default: 0 },
		is_active: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

export const TagModel: Model<ITag> =
	(mongoose.models.Tag as Model<ITag>) || mongoose.model<ITag>('Tag', TagSchema);
