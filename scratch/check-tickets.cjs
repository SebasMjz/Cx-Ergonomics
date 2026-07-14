const mongoose = require('mongoose');

async function run() {
	try {
		await mongoose.connect('mongodb://127.0.0.1:27017/cx-importations');
		console.log('Connected to DB');
		const schema = new mongoose.Schema({}, { strict: false });
		const Ticket = mongoose.model('Ticket', schema, 'tickets');
		
		const activeCount = await Ticket.countDocuments({ archived: { $ne: true } });
		const archivedCount = await Ticket.countDocuments({ archived: true });
		console.log('Active count:', activeCount);
		console.log('Archived count:', archivedCount);
		
		const activeList = await Ticket.find({ archived: { $ne: true } }).lean();
		const archivedList = await Ticket.find({ archived: true }).lean();
		
		console.log('Active tickets:');
		activeList.forEach(t => console.log(` - ${t.ticket_number}`));
		console.log('Archived tickets:');
		archivedList.forEach(t => console.log(` - ${t.ticket_number}`));
		
		await mongoose.disconnect();
	} catch (e) {
		console.error(e);
	}
}

run();
