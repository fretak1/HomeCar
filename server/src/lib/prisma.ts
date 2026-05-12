import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL?.trim();

if (!url) {
    throw new Error('DATABASE_URL is not set in server/.env');
}

// PrismaNeon (which is PrismaNeonAdapterFactory) takes a config object directly
// — it creates the Pool internally when connect() is called.
// Do NOT pass a pre-built Pool; that was the old API.
const adapter = new PrismaNeon({ connectionString: url });

declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

const prisma: PrismaClient =
    globalThis.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}

export default prisma;
