import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
// Resolves to server/.env whether running from server/src/ or server/dist/
const envPath = path.resolve(path.dirname(__filename), '../../.env');

dotenv.config({ path: envPath });
