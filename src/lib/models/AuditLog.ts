import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAuditLog extends Document {
	ticket_id?: string;
	user_id?: string;
	action: string;
	details?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
	{
		ticket_id: { type: String },
		user_id: { type: String },
		action: { type: String, required: true },
		details: { type: Schema.Types.Mixed },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

export const AuditLogModel: Model<IAuditLog> =
	(mongoose.models.AuditLog as Model<IAuditLog>) ||
	mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
