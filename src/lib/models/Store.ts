import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IStore extends Document {
	client_code: string;
	name: string;
	ci: string;
	phone: string;
	city: string;
	createdAt: Date;
	updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
	{
		client_code: { type: String, required: true, unique: true, trim: true },
		name: { type: String, required: true, trim: true },
		ci: { type: String, required: true, trim: true },
		phone: { type: String, required: true, trim: true },
		city: { type: String, required: true, trim: true },
	},
	{
		timestamps: true,
	}
);

export const StoreModel: Model<IStore> =
	(mongoose.models.Store as Model<IStore>) ||
	mongoose.model<IStore>('Store', StoreSchema);
