import 'dotenv/config';
import { connectMongoose } from '../src/lib/mongo';
import { CategoryModel } from '../src/lib/models/Category';
import { ProductModel, slugify } from '../src/lib/models/Product';
import { UserModel } from '../src/lib/models/User';
import { TicketModel } from '../src/lib/models/Ticket';
import { BannerModel } from '../src/lib/models/Banner';
import { TagModel } from '../src/lib/models/Tag';
import { PointOfSaleModel } from '../src/lib/models/PointOfSale';
import { FaqModel } from '../src/lib/models/Faq';
import { WallpaperModel } from '../src/lib/models/Wallpaper';
import { SiteSettingsModel } from '../src/lib/models/SiteSettings';

const baseUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';

async function seedUsers() {
	const users = [
		{
			name: 'CX Admin',
			email: 'admin@cxergonomic.com',
			password: 'Admin123*',
			role: 'admin',
		},
		{
			name: 'CX Tech',
			email: 'tech@cxergonomic.com',
			password: 'Tech123*',
			role: 'technical',
		},
	];

	for (const user of users) {
		const existing = await UserModel.findOne({ email: user.email });
		if (!existing) {
			await UserModel.create(user);
		}
	}

	return users.map((user) => ({ email: user.email, password: user.password, role: user.role }));
}

async function seedCategories() {
	const categories = [
		{
			name: 'Mesas Electricas',
			slug: 'mesas-electricas',
			description: 'Mesas ergonomicas electricas para estaciones de trabajo.',
		},
		{
			name: 'Brazos Monitor',
			slug: 'brazos-monitor',
			description: 'Brazos articulados para monitores simples y dobles.',
		},
		{
			name: 'Accesorios Ergonomicos',
			slug: 'accesorios-ergonomicos',
			description: 'Accesorios y complementos para puestos de trabajo.',
		},
	];

	const storedCategories = new Map<string, { _id: string; name: string; slug: string }>();

	for (const category of categories) {
		const existing = await CategoryModel.findOne({ slug: category.slug });
		const document = existing ?? (await CategoryModel.create(category));
		storedCategories.set(category.slug, {
			_id: document._id.toString(),
			name: document.name,
			slug: document.slug,
		});
	}

	return storedCategories;
}

async function seedTags() {
	const tags = [
		{ name: 'NEW', slug: 'new', color: '#ffd400', order: 1 },
		{ name: 'PROMO', slug: 'promo', color: '#ff4d4d', order: 2 },
		{ name: 'TOP', slug: 'top', color: '#4ade80', order: 3 },
	];

	const stored = new Map<string, string>();
	for (const tag of tags) {
		const existing = await TagModel.findOne({ slug: tag.slug });
		const doc = existing ?? (await TagModel.create(tag));
		stored.set(tag.slug, doc._id.toString());
	}
	return stored;
}

async function seedProducts(
	categories: Map<string, { _id: string; name: string; slug: string }>,
	tags: Map<string, string>
) {
	const categoryEntries = {
		mesas: categories.get('mesas-electricas'),
		brazos: categories.get('brazos-monitor'),
		accesorios: categories.get('accesorios-ergonomicos'),
	};

	if (!categoryEntries.mesas || !categoryEntries.brazos || !categoryEntries.accesorios) {
		throw new Error('No se pudieron resolver las categorias del seed.');
	}

	const products = [
		{
			name: 'Mesa Pro Lift 160',
			description: 'Mesa electrica de doble motor con memoria de alturas.',
			sku: 'MESA-PRO-LIFT-160',
			category_id: categoryEntries.mesas._id,
			tag_ids: [tags.get('new'), tags.get('top')].filter(Boolean),
			highlights: ['Doble motor silencioso', 'Memoria de 4 alturas', 'Rango 62-128 cm'],
			spec_table: [
				{ label: 'Material', value: 'Acero / MDF' },
				{ label: 'Color', value: 'Negro' },
				{ label: 'Carga máxima', value: '120 kg' },
				{ label: 'Motor', value: 'Doble motor' },
			],
			specs: { material: 'Acero / MDF', color: 'Negro', weight_capacity: '120 kg' },
			images: [
				`${baseUrl}/uploads/products/mesa-pro-lift-160-1.jpg`,
				`${baseUrl}/uploads/products/mesa-pro-lift-160-2.jpg`,
			],
		},
		{
			name: 'Mesa X2 Compact',
			description: 'Mesa electrica compacta para home office y recepcion.',
			sku: 'MESA-X2-COMPACT',
			category_id: categoryEntries.mesas._id,
			tag_ids: [tags.get('promo')].filter(Boolean),
			highlights: ['Ideal para espacios reducidos', 'Ajuste electrico'],
			spec_table: [
				{ label: 'Material', value: 'Acero / MDF' },
				{ label: 'Color', value: 'Blanco' },
				{ label: 'Carga máxima', value: '80 kg' },
			],
			specs: { material: 'Acero / MDF', color: 'Blanco', weight_capacity: '80 kg' },
			images: [`${baseUrl}/uploads/products/mesa-x2-compact-1.jpg`],
		},
		{
			name: 'Brazo Orion Duo',
			description: 'Brazo articulado doble para dos monitores de 27 pulgadas.',
			sku: 'BRAZO-ORION-DUO',
			category_id: categoryEntries.brazos._id,
			tag_ids: [tags.get('top')].filter(Boolean),
			highlights: ['Soporta 2 monitores', 'Rotacion 360°', 'Gestion de cables'],
			spec_table: [
				{ label: 'Material', value: 'Aluminio' },
				{ label: 'Color', value: 'Negro' },
				{ label: 'Carga máxima', value: '2 x 9 kg' },
			],
			specs: { material: 'Aluminio', color: 'Negro', weight_capacity: '2 x 9 kg' },
			images: [`${baseUrl}/uploads/products/brazo-orion-duo-1.jpg`],
		},
		{
			name: 'Brazo Nova Single',
			description: 'Brazo simple con ajuste de inclinacion y rotacion 360 grados.',
			sku: 'BRAZO-NOVA-SINGLE',
			category_id: categoryEntries.brazos._id,
			tag_ids: [],
			highlights: ['Ajuste de inclinacion', 'Instalacion sencilla'],
			spec_table: [
				{ label: 'Material', value: 'Acero' },
				{ label: 'Color', value: 'Gris' },
				{ label: 'Carga máxima', value: '8 kg' },
			],
			specs: { material: 'Acero', color: 'Gris', weight_capacity: '8 kg' },
			images: [`${baseUrl}/uploads/products/brazo-nova-single-1.jpg`],
		},
		{
			name: 'Organizador Ergo Tray',
			description: 'Bandeja y organizador para mejorar la gestion del espacio.',
			sku: 'ERGO-TRAY-001',
			category_id: categoryEntries.accesorios._id,
			tag_ids: [tags.get('new')].filter(Boolean),
			highlights: ['Optimiza el espacio', 'Material resistente'],
			spec_table: [
				{ label: 'Material', value: 'Polimero reforzado' },
				{ label: 'Color', value: 'Negro' },
			],
			specs: { material: 'Polimero reforzado', color: 'Negro' },
			images: [`${baseUrl}/uploads/products/ergo-tray-1.jpg`],
		},
	];

	let order = 1;
	for (const product of products) {
		const existing = await ProductModel.findOne({ sku: product.sku });
		if (!existing) {
			await ProductModel.create({ ...product, slug: slugify(product.name), order });
		}
		order += 1;
	}
}

async function seedPointsOfSale() {
	const points = [
		{ name: 'CX Store La Paz', address: 'Av. 16 de Julio 1234, El Prado', city: 'La Paz', lat: -16.5008, lng: -68.1336, phone: '+591 70000001', hours: 'Lun-Vie 9:00-19:00', order: 1 },
		{ name: 'CX Store Santa Cruz', address: 'Av. San Martin 456, Equipetrol', city: 'Santa Cruz', lat: -17.7639, lng: -63.1822, phone: '+591 70000002', hours: 'Lun-Sab 9:00-20:00', order: 2 },
		{ name: 'CX Store Cochabamba', address: 'Av. America 789', city: 'Cochabamba', lat: -17.3895, lng: -66.1568, phone: '+591 70000003', hours: 'Lun-Vie 9:00-18:30', order: 3 },
	];
	for (const p of points) {
		const existing = await PointOfSaleModel.findOne({ name: p.name });
		if (!existing) await PointOfSaleModel.create(p);
	}
}

async function seedFaqs() {
	const faqs = [
		{ question: '¿Qué garantía tienen los productos CX?', answer: 'Todos nuestros productos cuentan con garantía oficial. Puedes registrar una solicitud desde la sección de Soporte (RMA).', order: 1 },
		{ question: '¿Hacen envíos a todo el país?', answer: 'Sí, realizamos envíos a todo Bolivia a través de couriers aliados. Los tiempos varían según la ciudad.', order: 2 },
		{ question: '¿Cómo puedo ser distribuidor?', answer: 'Completa el formulario en la sección "Quiero ser Distribuidor" y nuestro equipo comercial te contactará.', order: 3 },
		{ question: '¿Dónde encuentro el número de serie?', answer: 'El número de serie (S/N) está en la etiqueta adhesiva debajo de tu mesa o brazo de monitor.', order: 4 },
	];
	for (const f of faqs) {
		const existing = await FaqModel.findOne({ question: f.question });
		if (!existing) await FaqModel.create(f);
	}
}

async function seedWallpapers() {
	const wallpapers = [
		{ title: 'CX Workspace Dark', image: `${baseUrl}/uploads/wallpapers/cx-dark.jpg`, resolution: '1920x1080', order: 1 },
		{ title: 'CX Ergonomic Lines', image: `${baseUrl}/uploads/wallpapers/cx-lines.jpg`, resolution: '2560x1440', order: 2 },
	];
	for (const w of wallpapers) {
		const existing = await WallpaperModel.findOne({ title: w.title });
		if (!existing) await WallpaperModel.create(w);
	}
}

async function seedSettings() {
	const existing = await SiteSettingsModel.findOne();
	if (!existing) {
		await SiteSettingsModel.create({
			whatsapp_number: '59170000000',
			whatsapp_number_products: '59170000000',
			contact_email: 'ventas@cxergonomic.com',
			distributor_intro: 'Lleva los productos CX a tu ciudad. Completa el formulario y nuestro equipo comercial te contactará con precios mayoristas y condiciones.',
			community_intro: 'Conecta con nosotros, comparte tu setup y entérate de lanzamientos, promos y novedades.',
			socials: {
				instagram: 'https://instagram.com/cxergonomic',
				tiktok: 'https://tiktok.com/@cxergonomic',
				youtube: 'https://youtube.com/@cxergonomic',
				facebook: 'https://facebook.com/cxergonomic',
			},
		});
	}
}

async function seedTickets() {
	const tickets = [
		{
			ticket_number: 'RMA-2026-1001',
			customer_details: { name: 'Carla M.', ci: 'V-12345678', phone: '70000001', city: 'La Paz', department: 'La Paz' },
			product_serial_number: 'MESA-PRO-2026-001',
			sales_receipt_image: `${baseUrl}/uploads/rma/receipts/receipt-1001.jpg`,
			issue_description: 'Mesa electrica sin respuesta en panel.',
			evidence_video: `${baseUrl}/uploads/rma/videos/video-1001.mp4`,
			status: 'recibida',
			history: [{ status: 'recibida', note: 'Ticket ingresado', updated_at: new Date() }],
		},
		{
			ticket_number: 'RMA-2026-1002',
			customer_details: { name: 'Javier H.', ci: 'V-87654321', phone: '70000002', city: 'Santa Cruz de la Sierra', department: 'Santa Cruz' },
			product_serial_number: 'BRAZO-ORION-2026-204',
			sales_receipt_image: `${baseUrl}/uploads/rma/receipts/receipt-1002.jpg`,
			issue_description: 'Brazo monitor con desgaste en bisagra.',
			evidence_video: `${baseUrl}/uploads/rma/videos/video-1002.mp4`,
			status: 'en proceso',
			history: [
				{ status: 'recibida', note: 'Ticket ingresado', updated_at: new Date() },
				{ status: 'en proceso', note: 'Tecnico asignado', updated_at: new Date() },
			],
		},
		{
			ticket_number: 'RMA-2026-1003',
			customer_details: { name: 'Laura V.', ci: 'V-11223344', phone: '70000003', city: 'Cochabamba', department: 'Cochabamba' },
			product_serial_number: 'MESA-X2-2026-080',
			sales_receipt_image: `${baseUrl}/uploads/rma/receipts/receipt-1003.jpg`,
			issue_description: 'Control remoto sin energia.',
			evidence_video: `${baseUrl}/uploads/rma/videos/video-1003.mp4`,
			status: 'finalizada',
			resolution_type: 'reponer',
			resolution_main_comment: 'Se repone el control remoto por defecto de fábrica cubierto por garantía.',
			client_solution: 'Se entregó un control remoto nuevo al cliente.',
			supplier_solution: 'El proveedor reconoció el lote defectuoso y repuso la pieza.',
			history: [
				{ status: 'recibida', note: 'Ticket ingresado', updated_at: new Date() },
				{ status: 'finalizada', note: 'Garantia cerrada', updated_at: new Date() },
			],
		},
		{
			ticket_number: 'RMA-2026-1004',
			customer_details: { name: 'Mario R.', ci: 'V-99887766', phone: '70000004', city: 'El Alto', department: 'La Paz' },
			product_serial_number: 'MESA-PRO-2026-045',
			sales_receipt_image: `${baseUrl}/uploads/rma/receipts/receipt-1004.jpg`,
			issue_description: 'Ruido en motor al subir.',
			evidence_video: `${baseUrl}/uploads/rma/videos/video-1004.mp4`,
			status: 'recibida',
			history: [{ status: 'recibida', note: 'Ticket ingresado', updated_at: new Date() }],
		},
	];

	for (const ticket of tickets) {
		const existing = await TicketModel.findOne({ ticket_number: ticket.ticket_number });
		if (!existing) {
			await TicketModel.create(ticket);
		}
	}
}

async function seedBanners() {
	const banners = [
		{
			kicker: 'CX ERGONOMIC',
			title: 'DISEÑADO PARA RENDIR',
			subtitle:
				'Estaciones de trabajo ergonomicas construidas para acompanarte cada hora del dia. Potencia, ajuste y precision en cada detalle.',
			cta_text: 'VER CATALOGO',
			cta_link: '#catalog-section',
			source: 'youtube' as const,
			video_id: '2ZhY7LfpkqQ',
			order: 1,
		},
		{
			kicker: 'EXPERIENCIA CX',
			title: 'TU ESPACIO, TU REGLA',
			subtitle:
				'Cada componente esta pensado para adaptarse a ti. Descubre la linea completa de mobiliario y accesorios inteligentes.',
			cta_text: 'EXPLORAR',
			cta_link: '#catalog-section',
			source: 'youtube' as const,
			video_id: 'BcrrVq7sTAk',
			order: 2,
		},
	];

	for (const banner of banners) {
		const existing = await BannerModel.findOne({ order: banner.order });
		if (!existing) {
			await BannerModel.create(banner);
		}
	}
}

async function run() {
	await connectMongoose();
	const credentials = await seedUsers();
	const categories = await seedCategories();
	const tags = await seedTags();
	await seedProducts(categories, tags);
	await seedTickets();
	await seedBanners();
	await seedPointsOfSale();
	await seedFaqs();
	await seedWallpapers();
	await seedSettings();

	console.log('Seed completado. Credenciales:');
	console.log(`Categorias creadas/validadas: ${categories.size}`);
	for (const entry of credentials) {
		console.log(`- ${entry.role}: ${entry.email} / ${entry.password}`);
	}
	process.exit(0);
}

run().catch((error) => {
	console.error('Error en seed:', error);
	process.exit(1);
});
