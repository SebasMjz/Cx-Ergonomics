const mongoose = require('mongoose');

async function run() {
	try {
		await mongoose.connect('mongodb://127.0.0.1:27017/cx-importations');
		console.log('Connected to Database');
		const schema = new mongoose.Schema({}, { strict: false });
		const Ticket = mongoose.model('Ticket', schema, 'tickets');
		
		const result = await Ticket.updateMany({ archived: { $ne: true } }, { $set: { archived: false } });
		console.log(`Migration complete. Updated ${result.modifiedCount} tickets to archived: false.`);
		
		await mongoose.disconnect();
	} catch (e) {
		console.error(e);
	}
}

run();
