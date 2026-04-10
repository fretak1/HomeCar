import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { createNotification } from './notificationController.js';

export const getLeases = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { userId } = req.query as any;
        const where: any = {};

        if (userId) {
            // If explicit userId provided, show leases for that user
            // If it's the user's own ID and they are an agent, also show managed property leases
            if (userId === user.id && user.role === 'AGENT') {
                where.OR = [
                    { ownerId: userId },
                    { customerId: userId },
                    { property: { listedById: userId } }
                ];
            } else {
                where.OR = [
                    { ownerId: userId },
                    { customerId: userId }
                ];
            }
        } else if (user.role === 'ADMIN') {
            // Admin with no userId sees all leases
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

        const totalPrice = parseFloat(data.totalPrice);
        const recurringAmount = data.recurringAmount ? parseFloat(data.recurringAmount) : null;

        // Check for existing active lease for this property/owner/customer
        const existingActive = await prisma.lease.findFirst({
            where: {
                propertyId: data.propertyId,
                customerId: data.tenantId || data.customerId,
                ownerId: data.ownerId,
                status: 'ACTIVE'
            }
        });

        if (existingActive) {
            return res.status(400).json({ error: 'An active lease already exists for this property and tenant.' });
        }

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
            },
            include: {
                property: {
                    include: { location: true, images: true }
                },
                owner: true,
                customer: true
            }
        });

        // Fetch creator details for the notification
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { name: true }
        });
        const creatorName = dbUser?.name || 'Someone';
        const creatorRole = user.role === 'AGENT' ? 'Agent' : 'Owner';

        await createNotification(
            lease.customerId,
            'New Lease Offer',
            `${creatorRole} ${creatorName} has created a new lease offer for ${lease.property.title}`,
            'LEASE',
            `/dashboard/customer`
        );

        // If Agent created it, also notify the owner to accept
        if (user.role === 'AGENT') {
            await createNotification(
                lease.ownerId,
                'New Lease Proposal',
                `Agent ${creatorName} has created a lease proposal for your property: ${lease.property.title}. Please review and accept.`,
                'LEASE',
                `/dashboard/owner?tab=leases`
            );
        }

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
            data: { status },
            include: {
                property: {
                    include: { location: true, images: true }
                }
            }
        });

        if (status === 'ACTIVE' && lease.propertyId) {
            await prisma.property.update({
                where: { id: lease.propertyId },
                data: { status: 'RENTED' }
            });
        }

        if (status === 'TERMINATED' && lease.propertyId && lease.customerId) {
            await prisma.application.deleteMany({
                where: { 
                    propertyId: lease.propertyId, 
                    customerId: lease.customerId 
                }
            });
        }

        // Notify customer
        await createNotification(
            lease.customerId,
            'Lease Status Updated',
            `Your lease for ${lease.property.title} is now ${status}`,
            'LEASE',
            `/dashboard/customer`
        );

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

        const existingLease = await prisma.lease.findUnique({
            where: { id },
            include: { property: true }
        });
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
            data,
            include: {
                property: {
                    include: { location: true, images: true, listedBy: true }
                },
                customer: true,
                owner: true
            }
        });

        // Notify the appropriate party
        if (role === 'owner') {
            await createNotification(
                lease.customerId,
                'Lease Accepted by Owner',
                `The owner has accepted the lease for ${lease.property.title}`,
                'LEASE',
                `/dashboard/customer`
            );
        } else if (role === 'customer') {
            await createNotification(
                lease.ownerId,
                'Lease Accepted by Customer',
                `${lease.customer.name} has accepted the lease for ${lease.property.title}`,
                'LEASE',
                `/dashboard/owner?tab=leases`
            );
        }

        // Notify parties if activated
        if (lease.status === 'ACTIVE') {
            await prisma.property.update({
                where: { id: lease.propertyId },
                data: { status: 'RENTED' }
            });

            const message = `Lease for ${lease.property.title} is now ACTIVE!`;
            await createNotification(lease.customerId, 'Lease Activated', message, 'LEASE', `/dashboard/customer`);
            await createNotification(lease.ownerId, 'Lease Activated', message, 'LEASE', `/dashboard/owner?tab=leases`);

            // Notify Agent if they were the ones who listed it
            if (lease.property.listedById !== lease.ownerId) {
                await createNotification(
                    lease.property.listedById,
                    'Lease Successfully Activated',
                    `The lease for your listing "${lease.property.title}" has been accepted by both parties and is now ACTIVE.`,
                    'LEASE',
                    `/dashboard/agent`
                );
            }
        }

        res.json(lease);
    } catch (error: any) {
        console.error('Error accepting lease:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const requestLeaseCancellation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const user = (req as any).user;

        const lease = await prisma.lease.findUnique({
            where: { id },
            include: { property: true, owner: true, customer: true }
        });

        if (!lease) return res.status(404).json({ error: 'Lease not found' });

        const updateData: any = {};
        if (role === 'owner') updateData.ownerCancelled = true;
        if (role === 'customer') updateData.customerCancelled = true;

        // Determine new status
        if (
            (updateData.ownerCancelled || lease.ownerCancelled) &&
            (updateData.customerCancelled || lease.customerCancelled)
        ) {
            updateData.status = 'CANCELLED';
        } else {
            // First person requested cancellation
            updateData.status = 'CANCELLATION_PENDING';
        }

        const updatedLease = await prisma.lease.update({
            where: { id },
            data: updateData,
            include: { 
                property: {
                    include: { location: true, images: true }
                }, 
                owner: true, 
                customer: true 
            }
        });

        // Notifications
        if (updatedLease.status === 'CANCELLED') {
            const msg = `Lease for ${updatedLease.property.title} has been officially CANCELLED by mutual agreement.`;
            await createNotification(updatedLease.customerId, 'Lease Cancelled', msg, 'LEASE', '/dashboard/customer');
            await createNotification(updatedLease.ownerId, 'Lease Cancelled', msg, 'LEASE', '/dashboard/owner?tab=leases');
            
            // Re-open the property if it was rented
            if (updatedLease.propertyId) {
                await prisma.property.update({
                    where: { id: updatedLease.propertyId },
                    data: { status: 'AVAILABLE' }
                });
            }
        } else {
            // Just one party requested
            const requesterName = user.name || (role === 'owner' ? 'The Owner' : 'The Customer');
            const targetId = role === 'owner' ? updatedLease.customerId : updatedLease.ownerId;
            const targetPath = role === 'owner' ? '/dashboard/customer' : '/dashboard/owner?tab=leases';
            
            await createNotification(
                targetId,
                'Cancellation Requested',
                `${requesterName} has requested to cancel the lease for ${updatedLease.property.title}. Your mutual agreement is required.`,
                'LEASE',
                targetPath
            );
        }

        res.json(updatedLease);
    } catch (error: any) {
        console.error('Error requesting lease cancellation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
