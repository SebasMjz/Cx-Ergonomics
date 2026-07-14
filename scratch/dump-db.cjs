const mongoose = require('mongoose');

async function run() {
	try {
		await mongoose.connect('mongodb://127.0.0.1:27017/cx-importations');
		console.log('Connected to Database');
		const schema = new mongoose.Schema({}, { strict: false });
		const Ticket = mongoose.model('Ticket', schema, 'tickets');
		
		const all = await Ticket.find().lean();
		console.log(`Total tickets found: ${all.length}`);
		all.forEach(t => {
			console.log(`- ID: ${t._id}, Number: ${t.ticket_number}, Status: ${t.status}, Archived: ${t.archived} (${typeof t.archived})`);
		});
		
		await mongoose.disconnect();
	} catch (e) {
		console.error(e);
	}
}

run();
