import mongoose, { Schema, type Document, type Model } from 'mongoose';

/**
 * Punto de venta físico mostrado en el mapa Leaflet de /puntos-de-venta.
 */
export interface IPointOfSale extends Document {
	name: string;
	address: string;
	city?: string;
	lat: number;
	lng: number;
	phone?: string;
	hours?: string;
	order: number;
	is_active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const PointOfSaleSchema = new Schema<IPointOfSale>(
	{
		name: { type: String, required: true, trim: true },
		address: { type: String, required: true, trim: true },
		city: { type: String, trim: true },
		lat: { type: Number, required: true },
		lng: { type: Number, required: true },
		phone: { type: String, trim: true },
		hours: { type: String, trim: true },
		order: { type: Number, default: 0 },
		is_active: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

export const PointOfSaleModel: Model<IPointOfSale> =
	(mongoose.models.PointOfSale as Model<IPointOfSale>) ||
	mongoose.model<IPointOfSale>('PointOfSale', PointOfSaleSchema);
