const mongoose = require('mongoose');

async function run() {
	try {
		await mongoose.connect('mongodb://localhost:27017/cx-importations');
		console.log('Connected to DB');
		const schema = new mongoose.Schema({}, { strict: false });
		const Ticket = mongoose.model('Ticket', schema, 'tickets');
		const tickets = await Ticket.find().lean();
		console.log('TICKETS IN DB:');
		tickets.forEach(t => {
			console.log(`Ticket: ${t.ticket_number}, Status: ${t.status}, Archived: ${t.archived}`);
		});
		await mongoose.disconnect();
	} catch (e) {
		console.error(e);
	}
}

run();
