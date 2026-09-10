import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongoose } from '../src/lib/mongo';
import { TicketModel } from '../src/lib/models/Ticket';

export const DATA_SCRIPT_2 = [
	{
		"ID": "RMA-S008",
		"Fecha ingreso": "01/05/2026",
		"Cliente": "CYREX SCZ",
		"Cel": "-",
		"Producto": "Teclado AK820 PRO BGY",
		"Marca": "AJAZZ",
		"NUMERO DE VENTA": "CX",
		"SOLUCION CLIENTE CX": "PENDIENTE DE ENVIO A SCZ",
		"Nro de nota de devolucion": "-",
		"TIPO TRANSSACCION NEXTAR": "ENVIO REPARO",
		"Nro transaccion NEXTAR": 302,
		"Falla": "La Tecla W - E y Espacio se presiona doble",
		"Nro Serie": "SGAK820PRORFBCY250805331",
		"LINK DE VIDEO": "VIDEO",
		"RECIBE": "",
		"Estado ERIKA": "CERRADO"
	},
	{
		"ID": "RMA-S009",
		"Fecha ingreso": "18/05/2026",
		"Cliente": "Edison Vaca - CX",
		"Cel": 75073366,
		"Producto": "Mouse AJ139P V3 MC WHITE",
		"Marca": "AJAZZ",
		"NUMERO DE VENTA": "CX",
		"SOLUCION CLIENTE CX": "Se entrego uno NUEVO",
		"Nro de nota de devolucion": "-",
		"TIPO TRANSSACCION NEXTAR": "ENVIO REPARO",
		"Nro transaccion NEXTAR": 279,
		"Falla": "FALLA EN EL SENSOR",
		"Nro Serie": "BRAJ139PV3MCW260200220",
		"LINK DE VIDEO": "VIDEO",
		"RECIBE": "ALDAIR",
		"Estado ERIKA": "CERRADO"
	},
	{
		"ID": "RMA-S010",
		"Fecha ingreso": "23/05/2026",
		"Cliente": "CYREX SCZ",
		"Cel": "-",
		"Producto": "Brazo de Monitor DUAL",
		"Marca": "CX",
		"NUMERO DE VENTA": "Cyrex",
		"SOLUCION CLIENTE CX": "Se entrego uno NUEVO",
		"Nro de nota de devolucion": "-",
		"TIPO TRANSSACCION NEXTAR": "ENVIO REPARO",
		"Nro transaccion NEXTAR": 280,
		"Falla": "Uno de los brazos no soporta el peso de un monitor",
		"Nro Serie": 6956745110587,
		"LINK DE VIDEO": "",
		"RECIBE": "MILENA",
		"Estado ERIKA": "CERRADO"
	},
	{
		"ID": "RMA-S011",
		"Fecha ingreso": "12/06/2026",
		"Cliente": "(CYREX) Jefferson CX",
		"Cel": "-",
		"Producto": "Mouse AJ179 PRO White",
		"Marca": "AJAZZ",
		"NUMERO DE VENTA": "CX",
		"SOLUCION CLIENTE CX": "Descuento ajustado en balance CYREX",
		"Nro de nota de devolucion": 303,
		"TIPO TRANSSACCION NEXTAR": "ENVIO REPARO",
		"Nro transaccion NEXTAR": 304,
		"Falla": "El adaptador 2.4GHZ  no funciona",
		"Nro Serie": "YJAJ179PROW250900994",
		"LINK DE VIDEO": "",
		"RECIBE": "ALDAIR",
		"Estado ERIKA": "CERRADO"
	},
	{
		"ID": "RMA-S012",
		"Fecha ingreso": "29/06/2026",
		"Cliente": "CYREX SCZ",
		"Cel": "-",
		"Producto": "Mouse AJ139P V3 MC Black",
		"Marca": "AJAZZ",
		"NUMERO DE VENTA": "CX",
		"SOLUCION CLIENTE CX": "Se entrego uno NUEVO",
		"Nro de nota de devolucion": "-",
		"TIPO TRANSSACCION NEXTAR": "ENVIO REPARO",
		"Nro transaccion NEXTAR": 279,
		"Falla": "El sensor se desactiva cada 20 a 25 min y no responde",
		"Nro Serie": "BRAJ139PV3MCB260200234",
		"LINK DE VIDEO": "",
		"RECIBE": "ALDAIR",
		"Estado ERIKA": "CERRADO"
	},
	{
		"ID": "RMA-ED09",
		"Fecha ingreso": "10/07/2026",
		"Cliente": "Cyrex SUCRE",
		"Cel": "-",
		"Producto": "MOUSE AJ139 V3 MC WHITE",
		"Marca": "AJAZZ",
		"NUMERO DE VENTA": "CX",
		"SOLUCION CLIENTE CX": "Descuento ajustado en balance CYREX",
		"Nro de nota de devolucion": 299,
		"TIPO TRANSSACCION NEXTAR": "ENVIO REPARO",
		"Nro transaccion NEXTAR": 300,
		"Falla": "La Carga n el mouse no funciona , solo funciona conectado a Cable",
		"Nro Serie": "BRAJ139PV3MCW260200639",
		"LINK DE VIDEO": "",
		"RECIBE": "Miguel",
		"Estado ERIKA": "APROBADO"
	},
	{
		"ID": "RMA-ED10",
		"Fecha ingreso": "27/07/2026",
		"Cliente": "Arnold Miranda",
		"Cel": 70727989,
		"Producto": "Teclado AK820 White Blue Switch",
		"Marca": "AJAZZ",
		"NUMERO DE VENTA": "CX",
		"SOLUCION CLIENTE CX": "CREDITO A FAVOR SIG VENTA",
		"Nro de nota de devolucion": 291,
		"TIPO TRANSSACCION NEXTAR": "ENVIO REPARO",
		"Nro transaccion NEXTAR": 292,
		"Falla": "La tecla \"V\" no responde se realizo cambio de Switch y aun no responde",
		"Nro Serie": "SGAK820WCW260100161",
		"LINK DE VIDEO": "",
		"RECIBE": "Don Arnold",
		"Estado ERIKA": "APROBADO"
	},
	{
		"ID": "RMA-ED11",
		"Fecha ingreso": "20/07/2026",
		"Cliente": "CYREX STC",
		"Cel": "MIGUEL",
		"Producto": "Mouse A9 PLUS BLACK",
		"Marca": "ATK",
		"NUMERO DE VENTA": "Cyrex",
		"SOLUCION CLIENTE CX": "Descuento ajustado en balance CYREX",
		"Nro de nota de devolucion": 305,
		"TIPO TRANSSACCION NEXTAR": "ENVIO REPARO",
		"Nro transaccion NEXTAR": 306,
		"Falla": "El adaptador 2.4GHZ  no funciona",
		"Nro Serie": "B692P10691BS1",
		"LINK DE VIDEO": "",
		"RECIBE": "Miguel",
		"Estado ERIKA": "APROBADO"
	}
];

function parseFecha(str: string): Date {
	if (!str || str.includes('00/00')) return new Date('2026-05-01');
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

export async function runScript2() {
	await connectMongoose();

	console.log(`--- Ejecutando script-2: Cargando ${DATA_SCRIPT_2.length} tickets de RMA ---`);

	let count = 0;
	let santaCruzCount = 0;
	let cochabambaCount = 0;
	let sucreCount = 0;

	for (const item of DATA_SCRIPT_2) {
		const ticketNumber = item.ID || `RMA-${Date.now()}-${count}`;
		const createdAt = parseFecha(item['Fecha ingreso']);
		const isRejected = (item['Estado ERIKA'] || '').toUpperCase().includes('RECHAZADO');
		const city = getCity(item, ticketNumber);

		if (city === 'Santa Cruz') santaCruzCount++;
		else if (city === 'Sucre') sucreCount++;
		else cochabambaCount++;

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
			evidence_video: item['LINK DE VIDEO'] && item['LINK DE VIDEO'] !== 'VIDEO' ? item['LINK DE VIDEO'] : '',
			status: isRejected ? 'rechazada' : 'finalizada',
			in_supplier_waiting: !isRejected,
			step_left_at_branch: true,
			step_sent_to_distributor: true,
			step_resolved: true,
			resolution_type: isRejected ? 'rechazo' : undefined,
			supplier_transaction_number: item['Nro transaccion NEXTAR'] ? String(item['Nro transaccion NEXTAR']) : '',
			supplier_solution: item['SOLUCION CLIENTE CX'] || '',
			client_solution: item['SOLUCION CLIENTE CX'] || '',
			resolution_main_comment: item.Falla || '',
			archived: false,
			history: [
				{
					status: isRejected ? 'rechazada' : 'finalizada',
					note: `Ticket importado mediante script-2 (${item['Estado ERIKA'] || 'Histórico'}). Recibe: ${item.RECIBE || 'N/A'}. Solución: ${item['SOLUCION CLIENTE CX'] || 'N/A'}.`,
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
		console.log(`[OK] Ticket ${ticketNumber} (${city}) guardado.`);
	}

	console.log(`\nResumen script-2: Se procesaron ${count} tickets con éxito.`);
	console.log(`- Santa Cruz: ${santaCruzCount}`);
	console.log(`- Sucre: ${sucreCount}`);
	console.log(`- Cochabamba: ${cochabambaCount}`);
}

if (process.argv[1] && (process.argv[1].endsWith('script-2.ts') || process.argv[1].endsWith('script-2.js'))) {
	runScript2()
		.then(async () => {
			await mongoose.disconnect();
			console.log('Desconectado de MongoDB. Proceso finalizado.');
			process.exit(0);
		})
		.catch(async (err) => {
			console.error('Error ejecutando script-2:', err);
			try {
				await mongoose.disconnect();
			} catch (_) {}
			process.exit(1);
		});
}
