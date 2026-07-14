import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ICategory extends Document {
	name: string;
	slug: string;
	description?: string;
	image?: string;
	is_active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
	{
		name: { type: String, required: true, unique: true, trim: true },
		slug: { type: String, required: true, unique: true, trim: true },
		description: { type: String },
		image: { type: String, trim: true },
		is_active: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

export const CategoryModel: Model<ICategory> =
	(mongoose.models.Category as Model<ICategory>) ||
	mongoose.model<ICategory>('Category', CategorySchema);
