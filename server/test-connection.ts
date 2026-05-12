import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function test() {
    console.log('🚀 Starting Connection Test (Port 443 Bypass)...');
    
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('❌ Error: DATABASE_URL not found in .env');
        return;
    }

    const pool = new Pool({ connectionString: url });

    try {
        const start = Date.now();
        const res = await pool.query('SELECT NOW()');
        const duration = Date.now() - start;
        
        console.log('✅ SUCCESS! Connected to Neon over Port 443.');
        console.log('🕒 Database Time:', res.rows[0].now);
        console.log('⚡ Latency:', duration, 'ms');
    } catch (err) {
        console.error('❌ CONNECTION FAILED!');
        console.error(err);
    } finally {
        await pool.end();
    }
}

test();
