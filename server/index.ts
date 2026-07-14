import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { connectMongoose } from '../src/lib/mongo';
import { uploadsRouter, uploadsRoot } from '../src/lib/uploads/router';

async function loadAstroHandler() {
	const entryPath = path.resolve(process.cwd(), 'dist', 'server', 'entry.mjs');

	if (!fs.existsSync(entryPath)) {
		throw new Error('Astro build not found. Run `npm run build` first.');
	}

	// On Windows the ESM loader requires a file:// URL, not a bare "C:\..." path.
	const module = await import(pathToFileURL(entryPath).href);
	return module.handler || module.default || module;
}

async function startServer() {
	await connectMongoose();
	const astroHandler = await loadAstroHandler();

	const app = express();
	app.use('/uploads', express.static(uploadsRoot, { fallthrough: false }));
	app.use(uploadsRouter);

	app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
		return res.status(400).json({ error: err.message });
	});

	app.use((req, res) => astroHandler(req, res));

	const port = Number(process.env.PORT) || 4321;
	app.listen(port, () => {
		console.log(`Server listening on http://localhost:${port}`);
	});
}

startServer().catch((error) => {
	console.error('Failed to start server:', error);
	process.exit(1);
});
