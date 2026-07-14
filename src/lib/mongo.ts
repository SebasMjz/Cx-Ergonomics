import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
const mongoDbName = process.env.MONGODB_DB ?? 'cx-importations';

declare global {
	// eslint-disable-next-line no-var
	var __cxMongoosePromise: Promise<typeof mongoose> | undefined;
}

export async function connectMongoose() {
	if (!globalThis.__cxMongoosePromise) {
		mongoose.set('strictQuery', true);
		globalThis.__cxMongoosePromise = mongoose.connect(mongoUri, {
			dbName: mongoDbName,
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