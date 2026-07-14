import mongoose, { Schema, type Document, type Model } from 'mongoose';

/**
 * Banner de video estilo Corsair (hero).
 * Soporta dos fuentes de video:
 *  - 'youtube': reproduce un video incrustado por su ID (campo `video_id`).
 *  - 'file':    reproduce un archivo alojado en nuestro servidor (campo `video_url`).
 * En ambos casos el video va silenciado (autoplay + loop, sin sonido).
 */
export type BannerSource = 'youtube' | 'file' | 'image';

export interface IBanner extends Document {
	kicker?: string;
	title: string;
	subtitle?: string;
	cta_text?: string;
	cta_link?: string;
	source: BannerSource;
	video_id?: string;
	video_url?: string;
	image_url?: string;
	poster?: string;
	order: number;
	is_active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
	{
		kicker: { type: String, trim: true },
		title: { type: String, required: true, trim: true },
		subtitle: { type: String, trim: true },
		cta_text: { type: String, trim: true },
		cta_link: { type: String, trim: true },
		source: {
			type: String,
			enum: ['youtube', 'file', 'image'],
			required: true,
			default: 'youtube',
		},
		video_id: { type: String, trim: true },
		video_url: { type: String, trim: true },
		image_url: { type: String, trim: true },
		poster: { type: String, trim: true },
		order: { type: Number, default: 0 },
		is_active: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

export const BannerModel: Model<IBanner> =
	(mongoose.models.Banner as Model<IBanner>) ||
	mongoose.model<IBanner>('Banner', BannerSchema);
