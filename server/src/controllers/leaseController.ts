import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getLeases = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { userId } = req.query as any;
        const where: any = {};

        if (user.role === 'ADMIN') {
            if (userId) {
                where.OR = [
                    { ownerId: userId },
                    { customerId: userId }
                ];
            }
        } else if (user.role === 'AGENT') {
            // Agents see their personal leases + leases for properties they manage
            where.OR = [
                { ownerId: user.id },
                { customerId: user.id },
                { property: { listedById: user.id } }
            ];
        } else {
            // Normal users only see their own leases
            where.OR = [
                { ownerId: user.id },
                { customerId: user.id }
            ];
        }

        const leases = await prisma.lease.findMany({
            where,
            include: {
                property: {
                    include: {
                        images: true,
                        location: true
                    }
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        chapaSubaccountId: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(leases);
    } catch (error: any) {
        console.error('Error fetching leases:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createLease = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user = (req as any).user;
        const isOwnerCreator = user?.role === 'OWNER';

        // ensure numeric types where needed
        const totalPrice = parseFloat(data.totalPrice);
        const recurringAmount = data.recurringAmount ? parseFloat(data.recurringAmount) : null;

        const lease = await prisma.lease.create({
            data: {
                leaseType: data.leaseType,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                totalPrice,
                recurringAmount,
                terms: data.terms,
                propertyId: data.propertyId,
                customerId: data.tenantId || data.customerId,
                ownerId: data.ownerId,
                ownerAccepted: isOwnerCreator ? true : false,
                customerAccepted: false,
                status: 'PENDING'
            }
        });
        res.status(201).json(lease);
    } catch (error: any) {
        console.error('Error creating lease:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateLeaseStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const lease = await prisma.lease.update({
            where: { id },
            data: { status }
        });

        res.json(lease);
    } catch (error: any) {
        console.error('Error updating lease status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const acceptLease = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const existingLease = await prisma.lease.findUnique({ where: { id } });
        if (!existingLease) {
            return res.status(404).json({ error: 'Lease not found' });
        }

        const data: any = {};
        if (role === 'owner') data.ownerAccepted = true;
        if (role === 'customer') data.customerAccepted = true;

        // Automatically activate if both parties have accepted
        if (
            (data.ownerAccepted || existingLease.ownerAccepted) &&
            (data.customerAccepted || existingLease.customerAccepted)
        ) {
            data.status = 'ACTIVE';
        }

        const lease = await prisma.lease.update({
            where: { id },
            data
        });

        res.json(lease);
    } catch (error: any) {
        console.error('Error accepting lease:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
