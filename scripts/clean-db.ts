import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

import { connectMongoose } from '../src/lib/mongo';
import { TicketModel } from '../src/lib/models/Ticket';
import { AuditLogModel } from '../src/lib/models/AuditLog';
import { DistributorRequestModel } from '../src/lib/models/DistributorRequest';
import { PointOfSaleModel } from '../src/lib/models/PointOfSale';
import { ProductModel } from '../src/lib/models/Product';
import { BannerModel } from '../src/lib/models/Banner';
import { WallpaperModel } from '../src/lib/models/Wallpaper';
import { StoreModel } from '../src/lib/models/Store';
import { TagModel } from '../src/lib/models/Tag';
import { CategoryModel } from '../src/lib/models/Category';
import { FaqModel } from '../src/lib/models/Faq';
import mongoose from 'mongoose';
import { UserModel } from '../src/lib/models/User';
import { uploadsRoot as defaultUploadsRoot } from '../src/lib/uploads/router';

function askConfirmation(message: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<boolean>((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes' || answer.trim().toLowerCase() === 'y');
    });
  });
}

function safeRmDir(target: string) {
  if (!target) return false;
  try {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to remove', target, err);
    return false;
  }
}

function ensureDir(target: string) {
  try {
    fs.mkdirSync(target, { recursive: true });
  } catch (e) {
    /* ignore */
  }
}

async function main() {
  const adminEmail = (process.env.ADMIN_INITIAL_EMAIL || '').trim().toLowerCase();
  if (!adminEmail) {
    console.error('ERROR: ADMIN_INITIAL_EMAIL not set in .env');
    process.exit(1);
  }

  console.log('Esta acción eliminará datos de la base y archivos de uploads.');
  console.log(`Se conservará únicamente el usuario: ${adminEmail}`);
  console.log('Colecciones que se eliminarán: Tickets, AuditLog, DistributorRequest, PointOfSale, Product, Wallpaper, Store, Tag, Category');
  console.log('Se conservarán: Banners, Faqs y SiteSettings (mensajes personalizados y políticas).');
  console.log('También se eliminarán los ficheros en las carpetas de uploads y (si está) CATALOG_UPLOADS_DIR.');

  const confirmed = await askConfirmation('¿Continuar? (yes/no): ');
  if (!confirmed) {
    console.log('Operación cancelada por el usuario.');
    process.exit(0);
  }

  await connectMongoose();

  const deletions: Array<[string, any]> = [
    ['Tickets', TicketModel],
    ['AuditLogs', AuditLogModel],
    ['DistributorRequests', DistributorRequestModel],
    ['PointsOfSale', PointOfSaleModel],
    ['Products', ProductModel],
    // Note: Banners and Faqs are intentionally preserved per request
    ['Wallpapers', WallpaperModel],
    ['Stores', StoreModel],
    ['Tags', TagModel],
    ['Categories', CategoryModel],
    // Faqs preserved
  ];

  for (const [label, Model] of deletions) {
    try {
      const before = await Model.countDocuments();
      if (before === 0) {
        console.log(`${label}: 0 documentos (skip)`);
        continue;
      }
      const res = await Model.deleteMany({});
      console.log(`${label}: eliminados ${res.deletedCount ?? before}`);
    } catch (err) {
      console.error(`Error limpiando ${label}:`, err);
    }
  }

  // Usuarios: mantener sólo el admin del .env
  try {
    const usersBefore = await UserModel.countDocuments();
    await UserModel.deleteMany({ email: { $ne: adminEmail } });
    const usersAfter = await UserModel.countDocuments();
    console.log(`Usuarios: antes=${usersBefore} ahora=${usersAfter} (se mantiene ${adminEmail})`);
  } catch (err) {
    console.error('Error limpiando usuarios:', err);
  }

  // Eliminar archivos en uploads
  try {
    const uploadsRoot = defaultUploadsRoot;
    const removedUploads = safeRmDir(uploadsRoot);
    if (removedUploads) {
      console.log(`Carpeta de uploads eliminada: ${uploadsRoot}`);
      // recrear estructura vacía útil
      ensureDir(path.join(uploadsRoot, 'products'));
      ensureDir(path.join(uploadsRoot, 'wallpapers'));
      ensureDir(path.join(uploadsRoot, 'rma', 'receipts'));
      ensureDir(path.join(uploadsRoot, 'rma', 'videos'));
      console.log('Estructura básica de uploads recreada.');
    } else {
      console.log(`No se encontró carpeta de uploads en: ${uploadsRoot}`);
    }
  } catch (err) {
    console.error('Error limpiando uploads:', err);
  }

  // Si existe CATALOG_UPLOADS_DIR eliminar su contenido también
  try {
    const catalogDir = process.env.CATALOG_UPLOADS_DIR ? path.resolve(process.env.CATALOG_UPLOADS_DIR) : undefined;
    if (catalogDir) {
      const removedCatalog = safeRmDir(catalogDir);
      if (removedCatalog) {
        console.log(`Carpeta de catálogo eliminada: ${catalogDir}`);
        ensureDir(catalogDir);
      } else {
        console.log(`No se encontró carpeta de catálogo en: ${catalogDir}`);
      }
    }
  } catch (err) {
    console.error('Error limpiando CATALOG_UPLOADS_DIR:', err);
  }

  try {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB.');
  } catch (e) {
    console.warn('Error desconectando de MongoDB:', e);
  }

  console.log('Limpieza completada.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error en limpieza:', err);
  process.exit(1);
});
