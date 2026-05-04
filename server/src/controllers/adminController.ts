import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

export const getVerificationHistory = async (req: any, res: Response) => {
    try {
        const history = await (prisma as any).adminVerification.findMany({
            where: {
                status: {
                    in: ['Verified', 'Rejected']
                }
            },
            include: {
                admin: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                document: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(history);
    } catch (error: any) {
        console.error('Error fetching verification history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getVerificationLogById = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const log = await (prisma as any).adminVerification.findUnique({
            where: { id },
            include: {
                admin: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                document: true
            }
        });

        if (!log) {
            return res.status(404).json({ error: 'Verification record not found' });
        }

        res.json(log);
    } catch (error: any) {
        console.error('Error fetching verification record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const viewVerificationDocument = async (req: Request, res: Response) => {
    try {
        const { logId } = req.params;
        const user = (req as any).user;

        if (user.role?.toUpperCase() !== 'ADMIN') {
            return res.status(403).json({ message: "Forbidden: Admin access only" });
        }

        const log = await (prisma as any).adminVerification.findUnique({ 
            where: { id: logId },
            include: { document: true }
        });
        
        if (!log || !log.document) {
            return res.status(404).json({ message: "Verification record or document not found" });
        }

        const doc = log.document;
        const publicId = doc.publicId;

        if (!publicId) {
            return res.status(400).json({ message: 'Record missing document reference' });
        }

        // Generate the signature (internal use)
        const rType = doc.resourceType || 'raw';
        
        let signedUrl = cloudinary.url(publicId, {
            sign_url: true,
            resource_type: rType,
            type: 'authenticated',
            secure: true
        });

        console.log(`[AdminDocProxy] Signature resolved (${rType}). Fetching bytes...`);

        let response;
        try {
            response = await axios({ 
                method: 'get', 
                url: signedUrl, 
                responseType: 'arraybuffer',
                timeout: 10000
            });
        } catch (fetchError: any) {
            const otherType = rType === 'raw' ? 'image' : 'raw';
            console.warn(`[AdminDocProxy] Fetch failed for ${rType}. Retrying as ${otherType}...`);
            
            signedUrl = cloudinary.url(publicId, {
                sign_url: true,
                resource_type: otherType,
                type: 'authenticated',
                secure: true
            });

            response = await axios({ 
                method: 'get', 
                url: signedUrl, 
                responseType: 'arraybuffer',
                timeout: 10000
            });
        }

        const contentType = response.headers['content-type'] || 'application/pdf';
        const buffer = Buffer.from(response.data);
        const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;

        return res.status(200).json({ dataUri });
    } catch (error: any) {
        console.error("[AdminDocProxy] Failure:", error.message);
        return res.status(500).json({ message: "Error retrieving document" });
    }
};
