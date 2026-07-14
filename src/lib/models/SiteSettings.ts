import mongoose, { Schema, type Document, type Model } from 'mongoose';

/**
 * Configuración global del sitio (documento singleton). Centraliza el número de
 * WhatsApp / correo de contacto (usados por el formulario de distribuidor) y los
 * enlaces de redes mostrados en la sección Comunidad.
 */
export interface ISocials {
	instagram?: string;
	tiktok?: string;
	youtube?: string;
	facebook?: string;
	discord?: string;
}

export interface ISiteSettings extends Document {
	whatsapp_number: string;
	whatsapp_number_products: string;
	contact_email: string;
	socials: ISocials;
	distributor_intro?: string;
	community_intro?: string;
	// Días que un producto recién creado se muestra con la etiqueta NEW automática.
	new_badge_days: number;
	// Dirección / enlace de seguimiento que se envía al cliente por WhatsApp.
	rma_tracking_url?: string;
	// Políticas de cobertura de garantía mostradas al cliente antes del formulario RMA.
	rma_warranty_policy?: string;
	// Plantillas de WhatsApp del tablero RMA, una por columna/estado.
	// Variables disponibles: {ticket}, {cliente}, {url}
	rma_wa_msg_recibida?: string;
	rma_wa_msg_proceso?: string;
	rma_wa_msg_finalizada?: string;
	// Mensaje de rechazo. Variables: {ticket}, {cliente}, {url}, {motivo}
	rma_wa_msg_rechazo?: string;
	createdAt: Date;
	updatedAt: Date;
}

const SocialsSchema = new Schema<ISocials>(
	{
		instagram: { type: String, trim: true },
		tiktok: { type: String, trim: true },
		youtube: { type: String, trim: true },
		facebook: { type: String, trim: true },
		discord: { type: String, trim: true },
	},
	{ _id: false }
);

const SiteSettingsSchema = new Schema<ISiteSettings>(
	{
		// Solo dígitos, formato internacional sin '+', ej. 59170000000.
		whatsapp_number: { type: String, default: '', trim: true },
		whatsapp_number_products: { type: String, default: '', trim: true },
		contact_email: { type: String, default: '', trim: true },
		socials: { type: SocialsSchema, default: () => ({}) },
		distributor_intro: { type: String, trim: true },
		community_intro: { type: String, trim: true },
		new_badge_days: { type: Number, default: 30, min: 0 },
		rma_tracking_url: { type: String, default: '', trim: true },
		rma_warranty_policy: {
			type: String,
			trim: true,
			default: `POLÍTICA DE COBERTURA DE GARANTÍA

Antes de registrar tu solicitud, por favor lee con atención las condiciones de nuestra garantía.

QUÉ CUBRE LA GARANTÍA
• Defectos de fabricación en materiales y componentes.
• Fallas en mecanismos (motores, pistones, sistemas de elevación) bajo uso normal.
• Piezas que presenten mal funcionamiento dentro del período de garantía.

QUÉ NO CUBRE LA GARANTÍA
• Daños por mal uso, golpes, caídas, sobrecarga o uso distinto al recomendado.
• Desgaste normal por el uso (rayones, tela, acabados estéticos).
• Daños por humedad, líquidos, instalación o ensamblaje incorrecto.
• Productos manipulados, reparados o modificados por terceros.
• Productos sin factura de compra o con número de serie ilegible o adulterado.

REQUISITOS PARA SOLICITAR LA GARANTÍA
• Presentar la factura o comprobante de compra original.
• Indicar el número de serie (S/N) del producto.
• Adjuntar fotos y/o videos claros que evidencien la falla.

PROCESO
1. Registras tu solicitud con la evidencia requerida.
2. Nuestro equipo evalúa el caso y te contactamos por WhatsApp.
3. Si procede, coordinamos la revisión, reparación, reposición o solución correspondiente.

Los tiempos de respuesta pueden variar según la disponibilidad de repuestos y la evaluación técnica. Al continuar declaras haber leído y aceptado estas condiciones.`,
		},
		rma_wa_msg_recibida: {
			type: String,
			default:
				'Hola {cliente}, recibimos tu solicitud de garantía {ticket}. Puedes seguir el estado de tu caso aquí: {url}',
			trim: true,
		},
		rma_wa_msg_proceso: {
			type: String,
			default:
				'Hola {cliente}, tu RMA {ticket} fue aceptado. Ya puedes dejar tu producto en la sucursal. Seguimiento: {url}',
			trim: true,
		},
		rma_wa_msg_finalizada: {
			type: String,
			default:
				'Hola {cliente}, tu caso {ticket} ha sido finalizado. Gracias por tu paciencia. Detalles: {url}',
			trim: true,
		},
		rma_wa_msg_rechazo: {
			type: String,
			default:
				'Hola {cliente}, lamentamos informarte que tu solicitud {ticket} fue rechazada. Motivo: {motivo}. Si deseas, puedes adjuntar más evidencia en el mismo ticket aquí: {url}',
			trim: true,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

export const SiteSettingsModel: Model<ISiteSettings> =
	(mongoose.models.SiteSettings as Model<ISiteSettings>) ||
	mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);

/** Devuelve el documento de settings, creándolo con valores por defecto si no existe. */
export async function getSiteSettings() {
	let settings = await SiteSettingsModel.findOne();
	if (!settings) {
		settings = await SiteSettingsModel.create({});
	}
	return settings;
}
