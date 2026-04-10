import { PrismaClient } from '@prisma/client';
import cloudinary from './src/config/cloudinary.js';
import axios from 'axios';

const prisma = new PrismaClient();

async function testFetch() {
    console.log("Fetching a document from DB...");
    const doc = await prisma.document.findFirst({
        where: { type: 'OWNERSHIP_PROOF' }
    });

    if (!doc) {
        console.log("No document found!");
        return;
    }

    console.log("Document found:", doc);

    try {
        const signedUrl = cloudinary.url(doc.publicId, {
            sign_url: true,
            resource_type: doc.resourceType || 'raw',
            type: 'authenticated',
            secure: true
        });

        console.log("Generated Signed URL:", signedUrl);

        console.log("Fetching from Cloudinary...");
        const response = await axios({
            method: 'get',
            url: signedUrl,
            responseType: 'arraybuffer',
            timeout: 10000
        });

        console.log(`Success! Fetched ${response.data.byteLength} bytes.`);
    } catch (error: any) {
        console.error("Fetch failed!");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data?.toString());
        } else {
            console.error(error.message);
        }
    }
}

testFetch().catch(console.error).finally(() => prisma.$disconnect());
