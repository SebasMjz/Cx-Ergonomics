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

const baseUrl = '';

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
			image: `${baseUrl}/uploads/products/1024-6.png`,
		},
		{
			name: 'Brazos Monitor',
			slug: 'brazos-monitor',
			description: 'Brazos articulados para monitores simples y dobles.',
			image: `${baseUrl}/uploads/products/3-3-1-Photoroom-1024x1024.png`,
		},
		{
			name: 'Accesorios Ergonomicos',
			slug: 'accesorios-ergonomicos',
			description: 'Accesorios y complementos para puestos de trabajo.',
			image: `${baseUrl}/uploads/products/4_436194dd-03ac-4c8f-a977-ad3139f101d2-1-Photoroom-1024x1024.webp`,
		},
	];

	const storedCategories = new Map<string, { _id: string; name: string; slug: string }>();

	for (const category of categories) {
		const document = await CategoryModel.findOneAndUpdate(
			{ slug: category.slug },
			category,
			{ upsert: true, new: true }
		);
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
			description: 'Mesa electrica de doble motor con memoria de alturas y panel digital inteligente.',
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
				`${baseUrl}/uploads/products/1024-6.png`,
				`${baseUrl}/uploads/products/1500_26aaf2a2-54b8-4f47-9c41-e0d1c57b9692-Photoroom-1024x1024.png`,
			],
		},
		{
			name: 'Mesa X2 Compact',
			description: 'Mesa electrica compacta ideal para espacios reducidos y home office moderno.',
			sku: 'MESA-X2-COMPACT',
			category_id: categoryEntries.mesas._id,
			tag_ids: [tags.get('promo')].filter(Boolean),
			highlights: ['Ideal para espacios reducidos', 'Ajuste electrico suave', 'Tablero texturizado'],
			spec_table: [
				{ label: 'Material', value: 'Acero / MDF' },
				{ label: 'Color', value: 'Blanco' },
				{ label: 'Carga máxima', value: '80 kg' },
			],
			specs: { material: 'Acero / MDF', color: 'Blanco', weight_capacity: '80 kg' },
			images: [
				`${baseUrl}/uploads/products/2_1783430678000-Photoroom-1-1024x1024.png`,
				`${baseUrl}/uploads/products/descarga-9-1024x1024.png`,
			],
		},
		{
			name: 'Mesa E-Fit Ajustable',
			description: 'Escritorio regulable de alta performance con sensor de colisión integrado.',
			sku: 'MESA-EFIT-AJUSTABLE',
			category_id: categoryEntries.mesas._id,
			tag_ids: [tags.get('new')].filter(Boolean),
			highlights: ['Sensor anticolisión', 'Ajuste ultra silencioso', 'Estructura reforzada'],
			spec_table: [
				{ label: 'Material', value: 'Acero / Madera premium' },
				{ label: 'Color', value: 'Gris Carbón' },
				{ label: 'Carga máxima', value: '100 kg' },
			],
			specs: { material: 'Acero / Madera premium', color: 'Gris Carbón', weight_capacity: '100 kg' },
			images: [
				`${baseUrl}/uploads/products/atk-leviatan-00-59440dc59ee592e75017560510565986-1024-1024-Photoroom-1.png`,
			],
		},
		{
			name: 'Brazo Orion Duo',
			description: 'Brazo articulado doble de movimiento hidráulico para dos monitores de hasta 27 pulgadas.',
			sku: 'BRAZO-ORION-DUO',
			category_id: categoryEntries.brazos._id,
			tag_ids: [tags.get('top')].filter(Boolean),
			highlights: ['Soporta 2 monitores', 'Rotación 360°', 'Gestión de cables integrada', 'Pistón a gas'],
			spec_table: [
				{ label: 'Material', value: 'Aluminio de aviación' },
				{ label: 'Color', value: 'Negro Mate' },
				{ label: 'Carga máxima', value: '2 x 9 kg' },
			],
			specs: { material: 'Aluminio de aviación', color: 'Negro Mate', weight_capacity: '2 x 9 kg' },
			images: [
				`${baseUrl}/uploads/products/3-3-1-Photoroom-1024x1024.png`,
				`${baseUrl}/uploads/products/71yLlt4fVdL-Photoroom-1024x1024.png`,
			],
		},
		{
			name: 'Brazo Nova Single',
			description: 'Soporte articulado individual con ajuste milimétrico de inclinación y rotación 360 grados.',
			sku: 'BRAZO-NOVA-SINGLE',
			category_id: categoryEntries.brazos._id,
			tag_ids: [],
			highlights: ['Ajuste de inclinación fluido', 'Instalación rápida mediante prensa o pasacables'],
			spec_table: [
				{ label: 'Material', value: 'Acero / Aluminio' },
				{ label: 'Color', value: 'Gris espacial' },
				{ label: 'Carga máxima', value: '8 kg' },
			],
			specs: { material: 'Acero / Aluminio', color: 'Gris espacial', weight_capacity: '8 kg' },
			images: [
				`${baseUrl}/uploads/products/4-Photoroom-1.png`,
				`${baseUrl}/uploads/products/image-removebg-preview-29.png`,
			],
		},
		{
			name: 'Brazo Triton Ultimate',
			description: 'El brazo de monitor definitivo para pantallas de gran formato y ultra-wide.',
			sku: 'BRAZO-TRITON-ULTIMATE',
			category_id: categoryEntries.brazos._id,
			tag_ids: [tags.get('top')].filter(Boolean),
			highlights: ['Soporta pantallas ultra-wide', 'Ajuste de tensión visible', 'Puertos USB en base'],
			spec_table: [
				{ label: 'Material', value: 'Aluminio reforzado' },
				{ label: 'Color', value: 'Plata satinado' },
				{ label: 'Carga máxima', value: '14 kg' },
			],
			specs: { material: 'Aluminio reforzado', color: 'Plata satinado', weight_capacity: '14 kg' },
			images: [
				`${baseUrl}/uploads/products/large_sJYldIKttpvjGYgb2mQHP3610FeweseHWwuWU0Vz.png`,
			],
		},
		{
			name: 'Organizador Ergo Tray',
			description: 'Bandeja organizadora colgante para optimizar el espacio debajo del escritorio.',
			sku: 'ERGO-TRAY-001',
			category_id: categoryEntries.accesorios._id,
			tag_ids: [tags.get('new')].filter(Boolean),
			highlights: ['Optimiza el espacio de trabajo', 'Material resistente anticorrosivo', 'Fácil anclaje'],
			spec_table: [
				{ label: 'Material', value: 'Polímero de alta resistencia' },
				{ label: 'Color', value: 'Negro' },
			],
			specs: { material: 'Polímero de alta resistencia', color: 'Negro' },
			images: [
				`${baseUrl}/uploads/products/4_436194dd-03ac-4c8f-a977-ad3139f101d2-1-Photoroom-1024x1024.webp`,
			],
		},
		{
			name: 'Soporte Premium VESA',
			description: 'Adaptador VESA universal reforzado para monitores sin orificios de fábrica.',
			sku: 'SOPORTE-PREMIUM-VESA',
			category_id: categoryEntries.accesorios._id,
			tag_ids: [],
			highlights: ['Universal para pantallas sin VESA', 'Brazos acolchados anti-rayaduras', 'Fácil armado'],
			spec_table: [
				{ label: 'Material', value: 'Acero estructural' },
				{ label: 'Color', value: 'Negro satinado' },
			],
			specs: { material: 'Acero estructural', color: 'Negro satinado' },
			images: [
				`${baseUrl}/uploads/products/D_NQ_NP_688036-CBT84407241239_052025-O.webp`,
			],
		},
		{
			name: 'Bandeja de Cables Tech',
			description: 'Canaleta metálica de gestión de cableado para mantener un setup limpio y ordenado.',
			sku: 'BANDEJA-CABLES-TECH',
			category_id: categoryEntries.accesorios._id,
			tag_ids: [tags.get('promo')].filter(Boolean),
			highlights: ['Gran capacidad de cableado', 'Instalación sin perforar', 'Diseño ventilado'],
			spec_table: [
				{ label: 'Material', value: 'Acero al carbono' },
				{ label: 'Color', value: 'Negro mate' },
			],
			specs: { material: 'Acero al carbono', color: 'Negro mate' },
			images: [
				`${baseUrl}/uploads/products/X82PROHE_8c35fae2-3e7e-4ea9-b96b-dc017d40ac51-11-1024x1024.png`,
				`${baseUrl}/uploads/products/X82PROHE_8c35fae2-3e7e-4ea9-b96b-dc017d40ac51-18-1024x1024.png`,
			],
		},
	];

	let order = 1;
	for (const product of products) {
		await ProductModel.findOneAndUpdate(
			{ sku: product.sku },
			{ ...product, slug: slugify(product.name), order },
			{ upsert: true, new: true }
		);
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
			video_id: 'nBMEoWlOjw0',
			order: 1,
			is_active: true,
		},
		{
			kicker: 'EXPERIENCIA CX',
			title: 'TU ESPACIO, TU REGLA',
			subtitle:
				'Cada componente esta pensado para adaptarse a ti. Descubre la linea completa de mobiliario y accesorios inteligentes.',
			cta_text: 'EXPLORAR',
			cta_link: '#catalog-section',
			source: 'youtube' as const,
			video_id: 'lHmrFqCvXxQ',
			order: 2,
			is_active: true,
		},
	];

	for (const banner of banners) {
		await BannerModel.findOneAndUpdate(
			{ order: banner.order },
			banner,
			{ upsert: true, new: true }
		);
	}
}

async function run() {
	await connectMongoose();
	const credentials = await seedUsers();
	await seedBanners();
	await seedFaqs();
	await seedSettings();

	console.log('Seed completado exitosamente con configuraciones iniciales.');
	console.log('Credenciales de acceso:');
	for (const entry of credentials) {
		console.log(`- ${entry.role}: ${entry.email} / ${entry.password}`);
	}
	process.exit(0);
}

run().catch((error) => {
	console.error('Error en seed:', error);
	process.exit(1);
});
