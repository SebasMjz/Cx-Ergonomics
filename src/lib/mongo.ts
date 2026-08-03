import mongoose from 'mongoose';
import dns from 'node:dns';

const mongoUri = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.MONGODB_URI : undefined) ?? process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
const mongoDbName = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.MONGODB_DB : undefined) ?? process.env.MONGODB_DB ?? 'cx-importations';

// Only use custom DNS servers if using SRV (MongoDB Atlas). For internal Docker hostnames, rely on Docker DNS.
if (mongoUri.startsWith('mongodb+srv://')) {
	try {
		dns.setServers(['1.1.1.1', '8.8.8.8']);
	} catch (e) {
		console.warn('Failed to set custom DNS servers:', e);
	}
}

declare global {
	// eslint-disable-next-line no-var
	var __cxMongoosePromise: Promise<typeof mongoose> | undefined;
}

import { ensureDefaultAdminUser } from './auth/seedAdmin';

export async function connectMongoose() {
	if (!globalThis.__cxMongoosePromise) {
		mongoose.set('strictQuery', true);
		globalThis.__cxMongoosePromise = mongoose.connect(mongoUri, {
			dbName: mongoDbName,
		}).then(async (m) => {
			console.log(`[MongoDB] Connected successfully to ${mongoDbName}`);
			await ensureDefaultAdminUser();
			return m;
		}).catch((err) => {
			console.error(`[MongoDB Connection Error]: ${err.message}`);
			globalThis.__cxMongoosePromise = undefined; // Allow retrying on next request
			throw err;
		});
	}

	return globalThis.__cxMongoosePromise;
}

export async function getMongooseStatus() {
	try {
		await connectMongoose();
		const readyState = mongoose.connection.readyState;

		return {
			connected: readyState === 1,
			dbName: mongoDbName,
			readyState,
		};
	} catch (error) {
		return {
			connected: false,
			dbName: mongoDbName,
			readyState: mongoose.connection.readyState,
			error: error instanceof Error ? error.message : 'Unknown MongoDB error',
		};
	}
}