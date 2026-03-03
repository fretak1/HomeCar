import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { createNotification } from './notificationController.js';

export const getMaintenanceRequests = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const where: any = {};

        if (user.role === 'OWNER') {
            where.property = { ownerId: user.id };
        } else if (user.role === 'AGENT') {
            where.property = { listedById: user.id };
        } else if (user.role === 'CUSTOMER') {
            where.customerId = user.id;
        } else if (user.role === 'ADMIN') {
            // Admin sees everything
        }

        const requests = await prisma.maintenanceRequest.findMany({
            where,
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        images: true,
                        owner: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to match frontend expectations
        const mappedRequests = requests.map(req => ({
            id: req.id,
            propertyId: req.propertyId,
            propertyTitle: req.property.title,
            category: req.category,
            description: req.description,
            status: req.status,
            date: req.createdAt.toLocaleDateString(),
            images: req.images,
            image: req.images[0], // For backward compatibility if needed
            property: req.property,
            customer: req.customer,
            customerId: req.customerId
        }));

        res.json(mappedRequests);
    } catch (error: any) {
        console.error('Error fetching maintenance requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addMaintenanceRequest = async (req: Request, res: Response) => {
    try {
        const { propertyTitle, image, images, ...data } = req.body;

        const imagesArray = images || (image ? [image] : []);

        const request = await prisma.maintenanceRequest.create({
            data: {
                ...data,
                images: imagesArray,
                customerId: (req as any).user.id // Assign to current user
            },
            include: {
                property: true,
                customer: true
            }
        });

        // Notify property owner
        await createNotification(
            request.property.ownerId,
            'New Maintenance Request',
            `${request.customer.name} submitted a ${request.category} request for ${request.property.title}`,
            'MAINTENANCE',
            `/dashboard/owner?tab=maintenance`
        );

        res.status(201).json(request);
    } catch (error: any) {
        console.error('Error creating maintenance request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateMaintenanceStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const request = await prisma.maintenanceRequest.update({
            where: { id },
            data: { status },
            include: {
                property: true,
                customer: true
            }
        });

        // Refined notification logic:
        const normalizedStatus = status.toLowerCase();

        if (normalizedStatus === 'inprogress') {
            // Notify customer that it's being worked on
            await createNotification(
                request.customerId,
                'Maintenance In Progress',
                `Your maintenance request for ${request.property.title} is now being worked on.`,
                'MAINTENANCE',
                `/dashboard/customer`
            );
        } else if (normalizedStatus === 'completed') {
            // Notify owner that customer marked it as fixed
            await createNotification(
                request.property.ownerId,
                'Maintenance Completed',
                `${request.customer.name} marked the maintenance request for ${request.property.title} as completed.`,
                'MAINTENANCE',
                `/dashboard/owner?tab=maintenance`
            );
        }

        res.json(request);
    } catch (error: any) {
        console.error('Error updating maintenance status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
