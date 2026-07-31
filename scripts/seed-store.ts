import 'dotenv/config';
import { connectMongoose } from '../src/lib/mongo';
import { StoreModel } from '../src/lib/models/Store';

async function run() {
	await connectMongoose();
	
	// Create a test store code TIENDA-C101
	const existing = await StoreModel.findOne({ client_code: 'TIENDA-C101' });
	if (!existing) {
		const store = await StoreModel.create({
			client_code: 'TIENDA-C101',
			name: 'Tienda Central Sopocachi',
			ci: 'NIT-999238910',
			phone: '70123456',
			city: 'La Paz'
		});
		console.log('Seeded store successfully:', store);
	} else {
		console.log('Store TIENDA-C101 already exists.');
	}
	process.exit(0);
}

run().catch(err => {
	console.error(err);
	process.exit(1);
});
