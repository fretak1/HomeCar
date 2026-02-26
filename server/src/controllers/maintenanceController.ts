import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

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
            }
        });
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
            data: { status }
        });

        res.json(request);
    } catch (error: any) {
        console.error('Error updating maintenance status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
