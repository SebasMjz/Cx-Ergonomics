import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IDistributorRequest extends Document {
	company: string;
	name: string;
	email: string;
	phone: string;
	city: string;
	message?: string;
	createdAt: Date;
	updatedAt: Date;
}

const DistributorRequestSchema = new Schema<IDistributorRequest>(
	{
		company: { type: String, required: true, trim: true },
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, trim: true },
		phone: { type: String, required: true, trim: true },
		city: { type: String, required: true, trim: true },
		message: { type: String, trim: true },
	},
	{
		timestamps: true,
	}
);

export const DistributorRequestModel: Model<IDistributorRequest> =
	(mongoose.models.DistributorRequest as Model<IDistributorRequest>) ||
	mongoose.model<IDistributorRequest>('DistributorRequest', DistributorRequestSchema);
