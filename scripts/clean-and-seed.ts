import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongoose } from '../src/lib/mongo';
import { TicketModel } from '../src/lib/models/Ticket';
import { AuditLogModel } from '../src/lib/models/AuditLog';
import { DistributorRequestModel } from '../src/lib/models/DistributorRequest';
import { PointOfSaleModel } from '../src/lib/models/PointOfSale';
import { WallpaperModel } from '../src/lib/models/Wallpaper';
import { TagModel } from '../src/lib/models/Tag';
import { CategoryModel } from '../src/lib/models/Category';
import { BannerModel } from '../src/lib/models/Banner';
import { FaqModel } from '../src/lib/models/Faq';
import { SiteSettingsModel } from '../src/lib/models/SiteSettings';
import { runSeedStore } from './seed-store';

async function seedBanners() {
	const count = await BannerModel.countDocuments();
	if (count === 0) {
		console.log('-> Sembrando Banners de Inicio (YouTube)...');
		await BannerModel.create([
			{
				kicker: 'CX ERGONOMIC',
				title: 'DISEÑADO PARA RENDIR',
				subtitle:
					'Estaciones de trabajo ergonómicas construidas para acompañarte cada hora del día. Potencia, ajuste y precisión en cada detalle.',
				cta_text: 'VER CATÁLOGO',
				cta_link: '#catalog-section',
				source: 'youtube',
				video_id: 'nBMEoWlOjw0',
				order: 1,
				is_active: true,
			},
			{
				kicker: 'EXPERIENCIA CX',
				title: 'TU ESPACIO, TU REGLA',
				subtitle:
					'Cada componente está pensado para adaptarse a ti. Descubre la línea completa de mobiliario y accesorios inteligentes.',
				cta_text: 'EXPLORAR',
				cta_link: '#catalog-section',
				source: 'youtube',
				video_id: 'lHmrFqCvXxQ',
				order: 2,
				is_active: true,
			},
		]);
		console.log('   ✓ Banners creados.');
	} else {
		console.log(`   ✓ Banners ya existen (${count} encontrados).`);
	}
}

async function seedFaqs() {
	const count = await FaqModel.countDocuments();
	if (count === 0) {
		console.log('-> Sembrando Preguntas Frecuentes (FAQs)...');
		await FaqModel.create([
			{
				question: '¿Qué garantía tienen los productos CX?',
				answer: 'Todos nuestros productos cuentan con garantía oficial de fábrica. Puedes gestionar tu garantía fácilmente ingresando una solicitud en la sección de Soporte / RMA.',
				order: 1,
				is_active: true,
			},
			{
				question: '¿Hacen envíos a todo el país?',
				answer: 'Sí, realizamos envíos seguros y garantizados a toda Bolivia (La Paz, Santa Cruz, Cochabamba, Sucre y demás departamentos) mediante couriers aliados.',
				order: 2,
				is_active: true,
			},
			{
				question: '¿Cómo puedo ser distribuidor oficial?',
				answer: 'Completa el formulario en la pestaña "Distribuidores" o "Quiero ser Distribuidor" y nuestro equipo comercial te contactará a la brevedad con la lista de precios mayorista.',
				order: 3,
				is_active: true,
			},
			{
				question: '¿Dónde encuentro el número de serie de mi producto?',
				answer: 'El número de serie (S/N) se encuentra en la etiqueta adhesiva del empaque original o grabado directamente debajo de la base de tu mesa o brazo hidráulico.',
				order: 4,
				is_active: true,
			},
		]);
		console.log('   ✓ FAQs creadas.');
	} else {
		console.log(`   ✓ FAQs ya existen (${count} encontradas).`);
	}
}

async function seedPointsOfSale() {
	const count = await PointOfSaleModel.countDocuments();
	if (count === 0) {
		console.log('-> Sembrando Puntos de Venta...');
		await PointOfSaleModel.create([
			{
				name: 'CX Store La Paz',
				address: 'Av. 16 de Julio 1234, El Prado',
				city: 'La Paz',
				lat: -16.5008,
				lng: -68.1336,
				phone: '+591 70000001',
				hours: 'Lun-Vie 9:00-19:00',
				order: 1,
				is_active: true,
			},
			{
				name: 'CX Store Santa Cruz',
				address: 'Av. San Martín 456, Equipetrol',
				city: 'Santa Cruz',
				lat: -17.7639,
				lng: -63.1822,
				phone: '+591 70000002',
				hours: 'Lun-Sáb 9:00-20:00',
				order: 2,
				is_active: true,
			},
			{
				name: 'CX Store Cochabamba',
				address: 'Av. América 789',
				city: 'Cochabamba',
				lat: -17.3895,
				lng: -66.1568,
				phone: '+591 70000003',
				hours: 'Lun-Vie 9:00-18:30',
				order: 3,
				is_active: true,
			},
		]);
		console.log('   ✓ Puntos de venta creados.');
	} else {
		console.log(`   ✓ Puntos de venta ya existen (${count} encontrados).`);
	}
}

async function seedWallpapers() {
	const count = await WallpaperModel.countDocuments();
	if (count === 0) {
		console.log('-> Sembrando Fondos de Pantalla...');
		await WallpaperModel.create([
			{
				title: 'CX Workspace Dark',
				image: '/uploads/wallpapers/cx-dark.jpg',
				resolution: '1920x1080',
				order: 1,
				is_active: true,
			},
			{
				title: 'CX Ergonomic Lines',
				image: '/uploads/wallpapers/cx-lines.jpg',
				resolution: '2560x1440',
				order: 2,
				is_active: true,
			},
		]);
		console.log('   ✓ Fondos de pantalla creados.');
	} else {
		console.log(`   ✓ Fondos de pantalla ya existen (${count} encontrados).`);
	}
}

async function seedSettings() {
	const existing = await SiteSettingsModel.findOne();
	if (!existing) {
		console.log('-> Creando Configuración General del Sitio (SiteSettings)...');
		await SiteSettingsModel.create({
			whatsapp_number: '59170000000',
			whatsapp_number_products: '59170000000',
			contact_email: 'ventas@cxergonomic.com',
			distributor_intro:
				'Lleva los productos CX a tu ciudad. Completa el formulario y nuestro equipo comercial te contactará con precios mayoristas y condiciones exclusivas.',
			community_intro:
				'Conéctate con nosotros, comparte tu setup ergonómico y entérate de lanzamientos, ofertas y novedades.',
			socials: {
				instagram: 'https://instagram.com/cxergonomic',
				tiktok: 'https://tiktok.com/@cxergonomic',
				youtube: 'https://youtube.com/@cxergonomic',
				facebook: 'https://facebook.com/cxergonomic',
			},
		});
		console.log('   ✓ SiteSettings configurados.');
	} else {
		console.log('   ✓ SiteSettings ya configurados.');
	}
}

async function seedCategoriesAndTags() {
	const catCount = await CategoryModel.countDocuments();
	if (catCount === 0) {
		console.log('-> Sembrando Categorías base...');
		await CategoryModel.create([
			{
				name: 'Mesas Eléctricas',
				slug: 'mesas-electricas',
				description: 'Mesas ergonómicas regulables en altura para trabajo de pie o sentado.',
				is_active: true,
			},
			{
				name: 'Brazos de Monitor',
				slug: 'brazos-monitor',
				description: 'Brazos articulados para monitores individuales y duales con ajuste de gas.',
				is_active: true,
			},
			{
				name: 'Accesorios Ergonómicos',
				slug: 'accesorios-ergonomicos',
				description: 'Teclados, mouses y accesorios diseñados para máxima comodidad y postura.',
				is_active: true,
			},
		]);
		console.log('   ✓ Categorías base creadas.');
	}

	const tagCount = await TagModel.countDocuments();
	if (tagCount === 0) {
		console.log('-> Sembrando Etiquetas (Tags)...');
		await TagModel.create([
			{ name: 'NEW', slug: 'new', color: '#ffd400', order: 1 },
			{ name: 'PROMO', slug: 'promo', color: '#ff4d4d', order: 2 },
			{ name: 'TOP', slug: 'top', color: '#4ade80', order: 3 },
		]);
		console.log('   ✓ Etiquetas base creadas.');
	}
}

async function main() {
	console.log('===============================================================');
	console.log('       CX ERGONOMIC - SCRIPT 3 EN 1: LIMPIEZA & SEED TOTAL    ');
	console.log('===============================================================');
	await connectMongoose();

	// 1. LIMPIEZA SEGURA DE TABLAS TRANSACCIONALES
	console.log('\n[Paso 1/3] Limpieza de tickets y registros transaccionales...');
	const deletions: Array<[string, any]> = [
		['Tickets', TicketModel],
		['AuditLogs', AuditLogModel],
		['DistributorRequests', DistributorRequestModel],
	];

	for (const [label, Model] of deletions) {
		try {
			const res = await Model.deleteMany({});
			console.log(`   - ${label}: eliminados ${res.deletedCount}`);
		} catch (err) {
			console.error(`   Error limpiando ${label}:`, err);
		}
	}

	console.log('\n[Preservación Garantizada]:');
	console.log('   ✓ Usuarios: INTACTOS (no se tocan cuentas ni contraseñas).');
	console.log('   ✓ Tiendas: INTACTAS.');

	// 2. CONTENIDO BASE DEL SITIO (FAQs, Banners, Puntos de venta, Settings, etc.)
	console.log('\n[Paso 2/3] Verificando y subiendo contenido institucional...');
	await seedBanners();
	await seedFaqs();
	await seedPointsOfSale();
	await seedWallpapers();
	await seedSettings();
	await seedCategoriesAndTags();

	// 3. SUBIDA COMPLETA DE TICKETS DESDE DATOS.JSON
	console.log('\n[Paso 3/3] Resiembra de Tickets históricos desde datos.json...');
	await runSeedStore();

	try {
		await mongoose.disconnect();
		console.log('\nDesconectado de MongoDB.');
	} catch (e) {
		/* ignore */
	}

	console.log('\n===============================================================');
	console.log('  ¡PROCESO 3 EN 1 COMPLETADO EXITOSAMENTE CON TODO SUBIDO!    ');
	console.log('===============================================================');
	process.exit(0);
}

main().catch((err) => {
	console.error('Error en clean-and-seed:', err);
	process.exit(1);
});
