import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { createNotification } from './notificationController.js';

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
                        email: true,
                        profileImage: true,
                        chapaSubaccountId: true
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
            assetType: app.property.assetType,
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

        const existingApplication = await prisma.application.findFirst({
            where: {
                propertyId,
                customerId
            }
        });

        if (existingApplication) {
            return res.status(409).json({ error: 'You already have an application for this listing' });
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
                property: true,
                customer: true
            }
        });

        // Notify manager/owner
        await createNotification(
            property.ownerId,
            'New Application',
            `You have a new application from ${application.customer.name} for ${application.property.title}`,
            'APPLICATION',
            `/dashboard/owner?tab=applications`
        );

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
            data: { status },
            include: {
                property: true
            }
        });

        // Notify customer
        await createNotification(
            application.customerId,
            'Application Updated',
            `Your application for ${application.property.title} has been ${status}`,
            'APPLICATION',
            `/dashboard/customer`
        );

        res.json(application);
    } catch (error: any) {
        console.error('Error updating application status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
