import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getApplications = async (req: Request, res: Response) => {
    try {
        const { managerId, customerId } = req.query as any;
        const where: any = {};

        if (managerId) {
            where.managerId = managerId;
        }

        if (customerId) {
            where.customerId = customerId;
        }

        const applications = await prisma.application.findMany({
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
                        email: true,
                        profileImage: true
                    }
                },
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to match the frontend expectation
        const mappedApplications = applications.map(app => ({
            id: app.id,
            propertyId: app.propertyId,
            propertyTitle: app.property.title,
            propertyImage: app.property.images.find(img => img.isMain)?.url || app.property.images[0]?.url,
            propertyLocation: app.property.location ? `${app.property.location.city}, ${app.property.location.subcity}` : 'Unknown',
            status: app.status,
            message: app.message,
            date: app.createdAt.toLocaleDateString(),
            price: app.property.price,
            listingType: app.property.listingType[0]?.toLowerCase() || 'rent',
            customerId: app.customerId,
            managerId: app.managerId,
            customer: app.customer,
            manager: app.manager
        }));

        res.json(mappedApplications);
    } catch (error: any) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addApplication = async (req: Request, res: Response) => {
    try {
        const { propertyId, message } = req.body;
        const customerId = (req as any).user.id;

        // Fetch property to get the owner/manager
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { ownerId: true }
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const application = await prisma.application.create({
            data: {
                propertyId,
                message,
                customerId,
                managerId: property.ownerId,
                status: 'pending'
            },
            include: {
                property: {
                    include: {
                        images: true,
                        location: true
                    }
                },
                customer: true
            }
        });

        res.status(201).json(application);
    } catch (error: any) {
        console.error('Error adding application:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'accepted', 'rejected', etc.

        const application = await prisma.application.update({
            where: { id },
            data: { status }
        });

        res.json(application);
    } catch (error: any) {
        console.error('Error updating application status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
