import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const createProperty = async (req: any, res: Response) => {
    try {


        const userId = req.user?.id;

        if (!userId) {
            console.error("No userId found in request!");
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {
            title, description, assetType, listingType, price,
            propertyType, bedrooms, bathrooms, area,
            brand, model, year, fuelType, transmission, mileage,
            location
        } = req.body;

        // Parse location safely
        let parsedLocation: any = {};
        try {
            parsedLocation = typeof location === 'string' ? JSON.parse(location) : (location || {});
        } catch (e) {
            console.error('Error parsing location string:', e);
        }

        // 1. Create Location record
        const newLocation = await prisma.location.create({
            data: {
                city: parsedLocation.city || req.body.city,
                subcity: parsedLocation.subcity || req.body.subCity,
                region: parsedLocation.region || req.body.region,
                village: parsedLocation.village || req.body.village,
                lat: parsedLocation.lat ? parseFloat(parsedLocation.lat) : null,
                lng: parsedLocation.lng ? parseFloat(parsedLocation.lng) : null
            }
        });

        // 2. Prepare Property Data
        const propertyData: any = {
            title,
            description,
            assetType: assetType === 'Home' ? 'HOME' : 'CAR',
            listingType: (Array.isArray(listingType) ? listingType : [listingType]).map((t: string) => t.toUpperCase()),
            price: parseFloat(price),
            ownerId: userId,
            listedById: userId,
            locationId: newLocation.id,
            status: 'AVAILABLE'
        };

        if (assetType === 'Home') {
            propertyData.propertyType = propertyType || req.body.category;
            propertyData.bedrooms = parseInt(bedrooms) || 0;
            propertyData.bathrooms = parseInt(bathrooms) || 0;
            propertyData.area = parseFloat(area) || 0;

        } else {
            propertyData.brand = brand;
            propertyData.model = model;
            propertyData.year = parseInt(year) || 0;
            propertyData.fuelType = fuelType;
            propertyData.transmission = transmission;
            propertyData.mileage = parseInt(mileage) || 0;
        }

        const property = await prisma.property.create({
            data: propertyData,
            include: {
                location: true,
                images: true
            }
        });

        const files = req.files as { [fieldname: string]: any[] } | undefined;

        if (files) {
            // Handle Property Images
            const propertyImages = files['images'] || [];
            if (propertyImages.length > 0) {
                const imageRecords = propertyImages.map((file: any, index: number) => ({
                    url: file.path,
                    propertyId: property.id,
                    isMain: index === 0
                }));

                await prisma.propertyImage.createMany({
                    data: imageRecords
                });
            }

            // Handle Ownership Document
            const ownershipDocs = files['ownershipDocument'] || [];
            if (ownershipDocs.length > 0) {
                const doc = ownershipDocs[0];
                await prisma.document.create({
                    data: {
                        type: 'OWNERSHIP_PROOF',
                        url: doc.path,
                        userId: userId,
                        propertyId: property.id,
                        verified: false
                    }
                });
            }

            // Handle Owner Photo (Identification Photo for Verification)
            const ownerPhotos = files['ownerPhoto'] || [];
            if (ownerPhotos.length > 0) {
                const photo = ownerPhotos[0];
                const updatedUser = await prisma.user.update({
                    where: { id: userId },
                    data: { verificationPhoto: photo.path } as any
                });
            }
        }

        const updatedProperty = await prisma.property.findUnique({
            where: { id: property.id },
            include: {
                location: true,
                images: true,
                ownershipDocuments: true
            }
        });

        res.status(201).json(updatedProperty);
    } catch (error: any) {
        console.error('CRITICAL ERROR creating property:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};

export const getProperties = async (req: Request, res: Response) => {
    try {
        const properties = await prisma.property.findMany({
            include: {
                location: true,
                images: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(properties);
    } catch (error: any) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPropertyById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({
            where: { id },
            include: {
                location: true,
                images: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        role: true
                    }
                }
            }
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json(property);
    } catch (error: any) {
        console.error('Error fetching property details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProperty = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // Check ownership
        const existing = await prisma.property.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Property not found' });
        if (existing.ownerId !== userId) return res.status(403).json({ error: 'Forbidden' });

        const {
            title, description, listingType, price,
            propertyType, bedrooms, bathrooms, area,
            brand, model, year, fuelType, transmission, mileage,
            location, amenities
        } = req.body;

        // Parse location
        let parsedLocation: any = {};
        try {
            parsedLocation = typeof location === 'string' ? JSON.parse(location) : (location || {});
        } catch (e) { /* ignore */ }

        // Update Location if locationId exists
        if (existing.locationId && Object.keys(parsedLocation).length > 0) {
            await prisma.location.update({
                where: { id: existing.locationId },
                data: {
                    city: parsedLocation.city,
                    subcity: parsedLocation.subcity,
                    region: parsedLocation.region,
                    village: parsedLocation.village,
                    lat: parsedLocation.lat ? parseFloat(parsedLocation.lat) : undefined,
                    lng: parsedLocation.lng ? parseFloat(parsedLocation.lng) : undefined,
                }
            });
        }

        // Build update data
        const updateData: any = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (price) updateData.price = parseFloat(price);
        if (listingType) updateData.listingType = (Array.isArray(listingType) ? listingType : [listingType]).map((t: string) => t.toUpperCase());
        if (propertyType) updateData.propertyType = propertyType;
        if (bedrooms) updateData.bedrooms = parseInt(bedrooms);
        if (bathrooms) updateData.bathrooms = parseInt(bathrooms);
        if (area) updateData.area = parseFloat(area);
        if (brand) updateData.brand = brand;
        if (model) updateData.model = model;
        if (year) updateData.year = parseInt(year);
        if (fuelType) updateData.fuelType = fuelType;
        if (transmission) updateData.transmission = transmission;
        if (mileage) updateData.mileage = parseInt(mileage);
        if (amenities) {
            try {
                updateData.amenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
            } catch { }
        }

        const updated = await prisma.property.update({
            where: { id },
            data: updateData,
            include: { location: true, images: true }
        });

        // Add new images if provided
        const files = req.files as { [fieldname: string]: any[] } | undefined;
        if (files?.['images']?.length) {
            const imageRecords = files['images'].map((file: any, index: number) => ({
                url: file.path,
                propertyId: id,
                isMain: index === 0 && updated.images.length === 0 // Only set main if no existing images
            }));
            await prisma.propertyImage.createMany({ data: imageRecords });
        }

        res.json(updated);
    } catch (error: any) {
        console.error('Error updating property:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

export const deleteProperty = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const existing = await prisma.property.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Property not found' });
        if (existing.ownerId !== userId) return res.status(403).json({ error: 'Forbidden' });

        await prisma.property.delete({ where: { id } });
        res.json({ message: 'Property deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting property:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

