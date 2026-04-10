import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

/**
 * Fetches transactions based on user role and ID.
 */
export const getTransactions = async (req: any, res: Response) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let transactions;

        if (role === 'ADMIN') {
            transactions = await prisma.transaction.findMany({
                include: {
                    payer: {
                        select: { id: true, name: true, email: true, phoneNumber: true, profileImage: true }
                    },
                    payee: {
                        select: { id: true, name: true, email: true, phoneNumber: true, profileImage: true }
                    },
                    property: {
                        select: { 
                            id: true, 
                            title: true, 
                            assetType: true,
                            location: {
                                select: { city: true, subcity: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else if (role === 'OWNER' || role === 'AGENT') {
            transactions = await prisma.transaction.findMany({
                where: { payeeId: userId },
                include: {
                    payer: {
                        select: { id: true, name: true, email: true, phoneNumber: true, profileImage: true }
                    },
                    property: {
                        select: { 
                            id: true, 
                            title: true, 
                            assetType: true,
                            location: {
                                select: { city: true, subcity: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            // Default to CUSTOMER
            transactions = await prisma.transaction.findMany({
                where: { payerId: userId },
                include: {
                    payer: {
                        select: { id: true, name: true, email: true, phoneNumber: true, profileImage: true }
                    },
                    payee: {
                        select: { id: true, name: true, profileImage: true }
                    },
                    property: {
                        select: { 
                            id: true, 
                            title: true, 
                            assetType: true,
                            location: {
                                select: { city: true, subcity: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        res.json(transactions);
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};
