import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectMongoose } from '../src/lib/mongo';
import { TicketModel } from '../src/lib/models/Ticket';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseFecha(str: string): Date {
	if (!str || str.includes('00/00')) return new Date('2025-12-17');
	const parts = str.split('/');
	if (parts.length === 3) {
		const day = parseInt(parts[0], 10);
		const month = parseInt(parts[1], 10) - 1;
		const year = parseInt(parts[2], 10);
		return new Date(year, month, day);
	}
	return new Date();
}

function getCity(item: any, ticketNumber: string): string {
	const clientName = (item.Cliente || '').toUpperCase();
	const upperId = ticketNumber.toUpperCase();

	if (
		clientName.includes('SANTA CRUZ') ||
		clientName.includes('SCZ') ||
		clientName.includes('STC') ||
		upperId.includes('SANTA') ||
		upperId.startsWith('RMA-S')
	) {
		return 'Santa Cruz';
	}

	if (clientName.includes('SUCRE')) {
		return 'Sucre';
	}

	if (clientName.includes('ANTEZANA') || clientName.includes('AMERICA') || clientName.includes('CBBA')) {
		return 'Cochabamba';
	}

	return 'Cochabamba';
}

export async function runSeedStore() {
	await connectMongoose();

	const datosPath = path.join(__dirname, 'datos.json');
	if (!fs.existsSync(datosPath)) {
		console.error('No se encontró el archivo datos.json en:', datosPath);
		return;
	}

	const rawData = fs.readFileSync(datosPath, 'utf-8');
	const datos = JSON.parse(rawData);

	console.log(`Cargando ${datos.length} tickets de datos.json directamente a "En Espera del Proveedor"...`);

	let count = 0;
	let santaCruzCount = 0;
	let cochabambaCount = 0;
	let sucreCount = 0;

	for (const item of datos) {
		const ticketNumber = item.ID || `RMA-${Date.now()}-${count}`;
		const createdAt = parseFecha(item['Fecha ingreso']);
		const isRejected = (item['Estado ERIKA'] || '').toUpperCase().includes('RECHAZADO');
		const city = getCity(item, ticketNumber);

		if (city === 'Santa Cruz') santaCruzCount++;
		else if (city === 'Sucre') sucreCount++;
		else cochabambaCount++;

		const video = item['LINK DE VIDEO'] && item['LINK DE VIDEO'] !== 'VIDEO' && item['LINK DE VIDEO'] !== 'Video' ? item['LINK DE VIDEO'] : '';

		const ticketData = {
			ticket_number: ticketNumber,
			customer_details: {
				name: item.Cliente || 'Cliente Cyrex',
				ci: 'NIT-CYREX',
				phone: item.Cel && item.Cel !== '-' ? String(item.Cel) : '70000000',
				city: city,
			},
			product_serial_number: item['Nro Serie'] ? String(item['Nro Serie']) : 'SN-HISTORICO',
			product_name: item.Producto || 'Producto',
			product_brand: item.Marca || 'AJAZZ',
			sales_receipt_image: '/img/logos/logo cx.png',
			issue_description: item.Falla || 'Falla reportada en registro histórico',
			evidence_video: video,
			status: isRejected ? 'rechazada' : 'finalizada',
			in_supplier_waiting: !isRejected,
			step_left_at_branch: true,
			step_sent_to_distributor: true,
			step_resolved: true,
			resolution_type: isRejected ? 'rechazo' : undefined,
			supplier_transaction_number: item['Nro transaccion NEXTAR'] ? String(item['Nro transaccion NEXTAR']) : '',
			supplier_solution: item['SOLUCION CLIENTE CX'] || item.Resultado || '',
			client_solution: item['SOLUCION CLIENTE CX'] || '',
			resolution_main_comment: item.Comentario || item.Falla || '',
			archived: false,
			history: [
				{
					status: isRejected ? 'rechazada' : 'finalizada',
					note: `Ticket importado del registro histórico (${item['Estado ERIKA'] || 'Histórico'}). Recibe: ${item.RECIBE || 'N/A'}. Solución: ${item['SOLUCION CLIENTE CX'] || item.Resultado || 'N/A'}. Puesto en espera del proveedor en ${city}.`,
					updated_by_user_id: 'system',
					author_name: 'Sistema Histórico',
					visibility: 'internal',
					attachments: [],
					updated_at: createdAt,
				},
			],
			createdAt,
			updatedAt: new Date(),
		};

		await TicketModel.findOneAndUpdate(
			{ ticket_number: ticketNumber },
			{ $set: ticketData },
			{ upsert: true, new: true }
		);
		count++;
	}

	console.log(`Se sembraron ${count} tickets históricos con éxito:`);
	console.log(`- Cochabamba: ${cochabambaCount}`);
	console.log(`- Santa Cruz: ${santaCruzCount}`);
	console.log(`- Sucre: ${sucreCount}`);
}

if (process.argv[1] && (process.argv[1].endsWith('seed-store.ts') || process.argv[1].endsWith('seed-store.js'))) {
	runSeedStore()
		.then(() => {
			console.log('Seed de datos.json completado.');
			process.exit(0);
		})
		.catch((err) => {
			console.error('Error ejecutando seed-store:', err);
			process.exit(1);
		});
}
