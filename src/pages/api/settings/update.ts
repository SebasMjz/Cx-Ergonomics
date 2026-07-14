import type { APIRoute } from 'astro';
import { connectMongoose } from '../../../lib/mongo';
import { getSiteSettings } from '../../../lib/models/SiteSettings';
import { json, requireAdmin } from '../../../lib/api';

export const POST: APIRoute = async ({ request }) => {
	const auth = requireAdmin(request);
	if (auth.response) return auth.response;

	try {
		const body = await request.json();
		await connectMongoose();
		const settings = await getSiteSettings();

		if (body.whatsapp_number !== undefined) {
			// Normaliza: deja solo dígitos.
			settings.whatsapp_number = String(body.whatsapp_number).replace(/\D/g, '');
		}
		if (body.whatsapp_number_products !== undefined) {
			// Normaliza: deja solo dígitos.
			settings.whatsapp_number_products = String(body.whatsapp_number_products).replace(/\D/g, '');
		}
		if (body.contact_email !== undefined) settings.contact_email = body.contact_email;
		if (body.distributor_intro !== undefined) settings.distributor_intro = body.distributor_intro;
		if (body.community_intro !== undefined) settings.community_intro = body.community_intro;
		if (body.new_badge_days !== undefined) {
			const n = parseInt(String(body.new_badge_days), 10);
			settings.new_badge_days = Number.isFinite(n) && n >= 0 ? n : 30;
		}
		if (body.rma_tracking_url !== undefined) settings.rma_tracking_url = String(body.rma_tracking_url).trim();
		if (body.rma_warranty_policy !== undefined) settings.rma_warranty_policy = String(body.rma_warranty_policy);
		if (body.rma_wa_msg_recibida !== undefined) settings.rma_wa_msg_recibida = String(body.rma_wa_msg_recibida);
		if (body.rma_wa_msg_proceso !== undefined) settings.rma_wa_msg_proceso = String(body.rma_wa_msg_proceso);
		if (body.rma_wa_msg_finalizada !== undefined) settings.rma_wa_msg_finalizada = String(body.rma_wa_msg_finalizada);
		if (body.rma_wa_msg_rechazo !== undefined) settings.rma_wa_msg_rechazo = String(body.rma_wa_msg_rechazo);

		if (body.socials && typeof body.socials === 'object') {
			settings.socials = {
				instagram: body.socials.instagram ?? settings.socials?.instagram,
				tiktok: body.socials.tiktok ?? settings.socials?.tiktok,
				youtube: body.socials.youtube ?? settings.socials?.youtube,
				facebook: body.socials.facebook ?? settings.socials?.facebook,
				discord: body.socials.discord ?? settings.socials?.discord,
			};
		}

		await settings.save();
		return json({ success: true, settings });
	} catch (error: any) {
		console.error('Error updating site settings:', error);
		return json({ error: error?.message || 'Error interno del servidor' }, 500);
	}
};
