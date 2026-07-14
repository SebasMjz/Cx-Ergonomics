import mongoose, { Schema, type Document, type Model } from 'mongoose';

/**
 * Wallpaper descargable de CX. La propia `image` es el archivo de alta resolución
 * que se ofrece para descarga en /wallpapers.
 */
export interface IWallpaper extends Document {
	title: string;
	image: string;
	resolution?: string;
	order: number;
	is_active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const WallpaperSchema = new Schema<IWallpaper>(
	{
		title: { type: String, required: true, trim: true },
		image: { type: String, required: true, trim: true },
		resolution: { type: String, trim: true },
		order: { type: Number, default: 0 },
		is_active: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

export const WallpaperModel: Model<IWallpaper> =
	(mongoose.models.Wallpaper as Model<IWallpaper>) ||
	mongoose.model<IWallpaper>('Wallpaper', WallpaperSchema);
