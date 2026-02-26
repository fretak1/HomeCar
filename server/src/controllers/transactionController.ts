import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { userId } = req.query as any;
        const where: any = {};

        // In a real app, transactions might be linked to User or Property
        // For now, let's assume we fetch them if the user is involved
        // This is a simplified implementation
        if (userId) {
            // where.userId = userId;
        }

        // Just returning an empty array for now as we don't have Transaction model in prisma yet
        // OR we can use the Lease model as a base for transactions if that's the intent

        /* 
        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        */

        res.json([]);
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
