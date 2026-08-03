import { UserModel } from '../models/User';

export async function ensureDefaultAdminUser(): Promise<void> {
	try {
		const userCount = await UserModel.countDocuments();
		if (userCount === 0) {
			const email = (process.env.ADMIN_INITIAL_EMAIL || 'admin@cxergonomic.com').trim().toLowerCase();
			const password = process.env.ADMIN_INITIAL_PASSWORD || 'Admin123*';
			const name = 'CX Admin';

			console.log(`[Seed] No users found. Creating default admin user: ${email}`);
			await UserModel.create({
				name,
				email,
				password,
				role: 'admin',
				is_active: true,
			});
			console.log(`[Seed] Default admin user created successfully.`);
		}
	} catch (error) {
		console.error('[Seed] Error seeding default admin user:', error);
	}
}
