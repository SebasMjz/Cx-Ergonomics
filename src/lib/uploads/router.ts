import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

export type UploadTarget = 'products' | 'wallpapers' | 'receipts' | 'videos';

type UploadRequest = express.Request & { uploadTarget?: UploadTarget };

type UploadTargetConfig = {
	dir: string;
	kind: 'image' | 'video';
};

const uploadTargets: Record<UploadTarget, UploadTargetConfig> = {
	products: { dir: 'products', kind: 'image' },
	wallpapers: { dir: 'wallpapers', kind: 'image' },
	receipts: { dir: path.join('rma', 'receipts'), kind: 'image' },
	videos: { dir: path.join('rma', 'videos'), kind: 'video' },
};

export const uploadsRoot = path.resolve(process.cwd(), 'uploads');

function ensureDir(targetDir: string) {
	fs.mkdirSync(targetDir, { recursive: true });
}

function getBaseUrl() {
	return process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
}

function toPublicPath(filePath: string) {
	const relative = path.relative(uploadsRoot, filePath);
	const normalized = relative.split(path.sep).join('/');
	return `/uploads/${normalized}`;
}

function buildPublicUrl(publicPath: string) {
	return new URL(publicPath, getBaseUrl()).toString();
}

function setUploadTarget(target: UploadTarget): express.RequestHandler {
	return (req, _res, next) => {
		(req as UploadRequest).uploadTarget = target;
		next();
	};
}

function resolveRmaTarget(): express.RequestHandler {
	return (req, res, next) => {
		const kind = String(req.query.kind || '').trim().toLowerCase();

		if (kind === 'receipt') {
			(req as UploadRequest).uploadTarget = 'receipts';
			return next();
		}

		if (kind === 'video') {
			(req as UploadRequest).uploadTarget = 'videos';
			return next();
		}

		return res.status(400).json({
			error: 'Missing or invalid kind. Use ?kind=receipt or ?kind=video.',
		});
	};
}

const storage = multer.diskStorage({
	destination: (req, _file, cb) => {
		const targetKey = (req as UploadRequest).uploadTarget;
		if (!targetKey) {
			return cb(new Error('Upload target not set.'), uploadsRoot);
		}

		const target = uploadTargets[targetKey];
		const targetDir = path.join(uploadsRoot, target.dir);
		ensureDir(targetDir);
		return cb(null, targetDir);
	},
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		const filename = `${Date.now()}-${uuidv4()}${ext}`;
		cb(null, filename);
	},
});

const upload = multer({
	storage,
	fileFilter: (req, file, cb) => {
		const targetKey = (req as UploadRequest).uploadTarget;
		if (!targetKey) {
			return cb(new Error('Upload target not set.'));
		}

		const target = uploadTargets[targetKey];
		const isImage = file.mimetype.startsWith('image/');
		const isVideo = file.mimetype.startsWith('video/');

		if (target.kind === 'image' && !isImage) {
			return cb(new Error('Only image files are allowed.'));
		}

		if (target.kind === 'video' && !isVideo) {
			return cb(new Error('Only video files are allowed.'));
		}

		return cb(null, true);
	},
});

function handleSingleUpload(req: UploadRequest, res: express.Response) {
	if (!req.file) {
		return res.status(400).json({ error: 'File is required.' });
	}

	const publicPath = toPublicPath(req.file.path);
	const publicUrl = buildPublicUrl(publicPath);

	return res.status(201).json({
		url: publicUrl,
		path: publicPath,
		filename: req.file.filename,
		size: req.file.size,
		mimetype: req.file.mimetype,
	});
}

export const uploadsRouter = express.Router();

uploadsRouter.post(
	'/api/catalog/products/upload',
	setUploadTarget('products'),
	upload.single('file'),
	handleSingleUpload
);

uploadsRouter.post(
	'/api/catalog/wallpapers/upload',
	setUploadTarget('wallpapers'),
	upload.single('file'),
	handleSingleUpload
);

uploadsRouter.post(
	'/api/rma/tickets/upload',
	resolveRmaTarget(),
	upload.single('file'),
	handleSingleUpload
);

uploadsRouter.post(
	'/api/tickets/upload',
	resolveRmaTarget(),
	upload.single('file'),
	handleSingleUpload
);

