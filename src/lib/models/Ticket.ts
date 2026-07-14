import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type TicketStatus = 'recibida' | 'en proceso' | 'finalizada';

export type ResolutionType = 'rechazo' | 'descuento' | 'reponer';

export interface ICustomerDetails {
	name: string;
	ci: string;
	phone: string;
	city: string;
	department: string;
}

export interface ITicketHistoryItem {
	status: TicketStatus;
	note?: string;
	updated_by_user_id?: string;
	// 'internal' = solo visible para el equipo en el tablero.
	// 'external' = visible para el cliente en la vista pública de seguimiento.
	visibility: 'internal' | 'external';
	// Adjuntos (imágenes/videos) que acompañan al comentario; el cliente puede subir
	// más evidencia desde la vista de seguimiento usando su número de ticket.
	attachments?: string[];
	// true cuando el comentario lo dejó el cliente desde la vista pública.
	from_client?: boolean;
	// Nombre mostrado cuando no hay usuario interno (p. ej. el cliente).
	author_name?: string;
	updated_at: Date;
}

export interface ITicket extends Document {
	ticket_number: string;
	customer_details: ICustomerDetails;
	product_serial_number: string;
	sales_receipt_image: string;
	issue_description: string;
	evidence_video: string;
	status: TicketStatus;
	// Datos de resolución (se completan al finalizar el ticket; usados en reportes).
	resolution_type?: ResolutionType;
	// Comentario principal: motivo / resumen de la solución. Se muestra en reportes.
	resolution_main_comment?: string;
	// Solución entregada al cliente.
	client_solution?: string;
	// Solución que nos dio el proveedor (puede registrarse antes o después que la del cliente).
	supplier_solution?: string;
	history: ITicketHistoryItem[];
	archived: boolean;
	order?: number;
	createdAt: Date;
	updatedAt: Date;
}

const CustomerDetailsSchema = new Schema<ICustomerDetails>(
	{
		name: { type: String, required: true, trim: true },
		ci: { type: String, required: true, trim: true },
		phone: { type: String, required: true, trim: true },
		city: { type: String, required: true, trim: true },
		department: { type: String, required: true, trim: true },
	},
	{ _id: false }
);

const TicketHistorySchema = new Schema<ITicketHistoryItem>(
	{
		status: {
			type: String,
			enum: ['recibida', 'en proceso', 'finalizada'],
			required: true,
		},
		note: { type: String },
		updated_by_user_id: { type: String },
		visibility: { type: String, enum: ['internal', 'external'], default: 'internal' },
		attachments: { type: [String], default: [] },
		from_client: { type: Boolean, default: false },
		author_name: { type: String },
		updated_at: { type: Date, required: true, default: () => new Date() },
	},
	{ _id: false }
);

const TicketSchema = new Schema<ITicket>(
	{
		ticket_number: { type: String, required: true, unique: true, trim: true },
		customer_details: { type: CustomerDetailsSchema, required: true },
		product_serial_number: { type: String, required: true, trim: true },
		sales_receipt_image: { type: String, required: true },
		issue_description: { type: String, required: true },
		evidence_video: { type: String, required: true },
		status: {
			type: String,
			enum: ['recibida', 'en proceso', 'finalizada'],
			default: 'recibida',
		},
		resolution_type: {
			type: String,
			enum: ['rechazo', 'descuento', 'reponer'],
		},
		resolution_main_comment: { type: String, trim: true },
		client_solution: { type: String, trim: true },
		supplier_solution: { type: String, trim: true },
		history: { type: [TicketHistorySchema], default: [] },
		archived: { type: Boolean, default: false },
		order: { type: Number, default: 0 },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

TicketSchema.pre('save', async function enforceSecondaryIdentity(next) {
	if (!this.isNew) {
		return next();
	}

	try {
		const Ticket = this.constructor as Model<ITicket>;
		const existing = await Ticket.findOne({
			'customer_details.ci': this.customer_details.ci,
		}).lean();

		if (existing) {
			const existingName = (existing.customer_details.name || '').trim().toLowerCase();
			const incomingName = (this.customer_details.name || '').trim().toLowerCase();

			if (existingName && incomingName && existingName !== incomingName) {
				return next(
					new Error('Customer CI already exists with a different name. Please review.')
				);
			}
		}

		return next();
	} catch (error) {
		return next(error as Error);
	}
});

export const TicketModel: Model<ITicket> =
	(mongoose.models.Ticket as Model<ITicket>) || mongoose.model<ITicket>('Ticket', TicketSchema);
