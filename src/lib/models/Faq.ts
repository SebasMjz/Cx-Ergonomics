import mongoose, { Schema, type Document, type Model } from 'mongoose';

/** Pregunta frecuente mostrada en /faq como acordeón. */
export interface IFaq extends Document {
	question: string;
	answer: string;
	order: number;
	is_active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const FaqSchema = new Schema<IFaq>(
	{
		question: { type: String, required: true, trim: true },
		answer: { type: String, required: true },
		order: { type: Number, default: 0 },
		is_active: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

export const FaqModel: Model<IFaq> =
	(mongoose.models.Faq as Model<IFaq>) || mongoose.model<IFaq>('Faq', FaqSchema);
