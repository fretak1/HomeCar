import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1';

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
            location, amenities
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
            status: 'AVAILABLE',
            amenities: [],
            isVerified: req.user?.role === 'AGENT'
        };

        if (amenities) {
            try {
                propertyData.amenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
            } catch (e) {
                console.error('Error parsing amenities:', e);
            }
        }

        if (assetType === 'Home') {
            propertyData.propertyType = propertyType || req.body.category;
            propertyData.bedrooms = parseInt(bedrooms) || 0;
            propertyData.bathrooms = parseInt(bathrooms) || 0;
            propertyData.area = parseFloat(area) || 0;

        } else {
            propertyData.brand = brand?.trim();
            propertyData.model = model?.trim();
            propertyData.year = parseInt(year) || 0;
            propertyData.fuelType = fuelType?.trim();
            propertyData.transmission = transmission?.trim();
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

            console.log("Ownership Doc:", ownershipDocs[0]);

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

        // --- AI Retrain Trigger (Every 5 Rule) ---
        try {
            const count = await prisma.property.count();
            if (count % 5 === 0) {
                console.log(`[AI] Reached ${count} properties. Triggering background retraining...`);
                // Non-blocking trigger
                axios.post(`${AI_SERVICE_URL}/retrain`).catch(err => {
                    console.error('[AI] Retrain trigger failed:', err.message);
                });
            }
        } catch (err) {
            console.error('[AI] Error checking property count for retrain:', err);
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

export const getProperties = async (req: any, res: Response) => {
    try {
        const {
            assetType,
            listingType,
            priceMin,
            priceMax,
            propertyType,
            beds,
            baths,
            region,
            city,
            subCity,
            brand,
            model,
            yearMin,
            yearMax,
            fuelType,
            transmission,
            mileageMax,
            amenities,
            location,
            ownerId,
            listedById,
            isVerified,
            sort
        } = req.query as any;

        const where: any = {};
        const requesterRole = req.user?.role;

        // 0. Verification Filter
        // If explicitly requested, use that filter
        if (isVerified !== undefined) {
            where.isVerified = isVerified === 'true';
        } else if (requesterRole !== 'ADMIN') {
            // By default, hide unverified properties from non-admins
            where.isVerified = true;
        }
        // If requester is ADMIN and no isVerified filter is provided, 
        // they get everything (verified + unverified)

        // 0. Owner Filter
        if (ownerId) {
            where.ownerId = ownerId;
        }

        // 0.1 Lister Filter
        if (listedById) {
            where.listedById = listedById;
        }

        // 1. Asset Type Filter
        if (assetType) {
            where.assetType = assetType.toUpperCase() === 'PROPERTY' || assetType.toUpperCase() === 'HOME' ? 'HOME' : 'CAR';
        }

        // 2. Listing Type Filter
        if (listingType && listingType !== 'any') {
            const type = listingType.toUpperCase();
            // Handle mapping 'buy' to 'BUY' or 'FOR_SALE'
            if (type === 'BUY' || type === 'SALE') {
                where.listingType = { hasSome: ['BUY', 'FOR_SALE'] };
            } else {
                where.listingType = { has: type };
            }
        }

        // 3. Price Filter
        if (priceMin || priceMax) {
            where.price = {};
            if (priceMin) where.price.gte = parseFloat(priceMin);
            if (priceMax) where.price.lte = parseFloat(priceMax);
        }

        // 4. Property Specifics
        if (propertyType && propertyType !== 'any') {
            where.propertyType = { contains: propertyType.trim(), mode: 'insensitive' };
        }
        if (beds && beds !== 'any') {
            if (beds === '4+') {
                where.bedrooms = { gte: 4 };
            } else {
                where.bedrooms = parseInt(beds);
            }
        }
        if (baths && baths !== 'any') {
            if (baths === '3+') {
                where.bathrooms = { gte: 3 };
            } else {
                where.bathrooms = parseInt(baths);
            }
        }

        // 5. Vehicle Specifics
        if (brand && brand !== 'any') {
            where.brand = { contains: brand.trim(), mode: 'insensitive' };
        }
        if (model && model !== 'any') {
            where.model = { contains: model.trim(), mode: 'insensitive' };
        }
        if (yearMin || yearMax) {
            where.year = {};
            if (yearMin) where.year.gte = parseInt(yearMin);
            if (yearMax) where.year.lte = parseInt(yearMax);
        }
        if (fuelType && fuelType !== 'any') {
            where.fuelType = { contains: fuelType.trim(), mode: 'insensitive' };
        }
        if (transmission && transmission !== 'any') {
            where.transmission = { contains: transmission.trim(), mode: 'insensitive' };
        }
        if (mileageMax) {
            where.mileage = { lte: parseInt(mileageMax) };
        }

        // 6. Location Filter
        if (location || region || city || subCity) {
            const locationConditions: any[] = [];
            
            if (region) locationConditions.push({ location: { region: { contains: region.trim(), mode: 'insensitive' } } });
            if (city) locationConditions.push({ location: { city: { contains: city.trim(), mode: 'insensitive' } } });
            if (subCity) locationConditions.push({ location: { subcity: { contains: subCity.trim(), mode: 'insensitive' } } });
            
            if (location) {
                locationConditions.push({ title: { contains: location.trim(), mode: 'insensitive' } });
                locationConditions.push({ description: { contains: location.trim(), mode: 'insensitive' } });
                locationConditions.push({ location: { city: { contains: location.trim(), mode: 'insensitive' } } });
                locationConditions.push({ location: { region: { contains: location.trim(), mode: 'insensitive' } } });
                locationConditions.push({ location: { subcity: { contains: location.trim(), mode: 'insensitive' } } });
                locationConditions.push({ location: { village: { contains: location.trim(), mode: 'insensitive' } } });
            }

            if (locationConditions.length > 0) {
                if (!where.AND) where.AND = [];
                where.AND.push({ OR: locationConditions });
            }
        }

        // 7. Amenities Filter
        if (amenities) {
            const amenityList = Array.isArray(amenities) ? amenities : [amenities];
            if (amenityList.length > 0) {
                where.amenities = { hasEvery: amenityList };
            }
        }

        // 8. Sorting
        let orderBy: any = { createdAt: 'desc' };
        if (sort) {
            switch (sort) {
                case 'newest':
                    orderBy = { createdAt: 'desc' };
                    break;
                case 'price-low':
                    orderBy = { price: 'asc' };
                    break;
                case 'price-high':
                    orderBy = { price: 'desc' };
                    break;
            }
        }

        const properties = await prisma.property.findMany({
            where,
            include: {
                location: true,
                images: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                },
                reviews: {
                    select: {
                        rating: true
                    }
                }
            },
            orderBy
        });

        // Add calculated fields
        const propertiesWithRatings = properties.map(property => {
            const reviews = property.reviews || [];
            const avgRating = reviews.length > 0
                ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
                : 0;
            return {
                ...property,
                rating: avgRating,
                reviewCount: reviews.length
            };
        });

        res.json(propertiesWithRatings);
    } catch (error: any) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

export const getPropertyById = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const requesterId = req.user?.id;
        const requesterRole = req.user?.role;

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
                        role: true,
                        verificationPhoto: true,
                        chapaSubaccountId: true
                    }
                },
                ownershipDocuments: true,
                reviews: {
                    include: {
                        reviewer: {
                            select: {
                                id: true,
                                name: true,
                                profileImage: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Add calculated fields
        const reviews = property.reviews || [];
        const avgRating = reviews.length > 0
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
            : 0;

        const propertyWithStats = {
            ...property,
            rating: avgRating,
            reviewCount: reviews.length
        };

        // Privacy check: If property is NOT verified, only the owner or an admin can see it
        if (!property.isVerified) {
            if (requesterId !== property.ownerId && requesterRole !== 'ADMIN') {
                return res.status(404).json({ error: 'Property not found' });
            }
        }

        res.json(propertyWithStats);
    } catch (error: any) {
        console.error('Error fetching property:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPropertiesByOwnerId = async (req: any, res: Response) => {
    try {
        const { ownerId } = req.params;
        const requesterId = req.user?.id;
        const requesterRole = req.user?.role;

        const where: any = { ownerId };

        // If not the owner and not an admin, only show verified properties
        if (requesterId !== ownerId && requesterRole !== 'ADMIN') {
            where.isVerified = true;
        }

        const properties = await prisma.property.findMany({
            where,
            include: {
                location: true,
                images: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(properties);
    } catch (error: any) {
        console.error('Error fetching owner properties:', error);
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
            location, amenities, keepImages
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

        // Image Reconciliation: delete images that were removed in the UI
        if (keepImages) {
            try {
                const keptUrls = typeof keepImages === 'string' ? JSON.parse(keepImages) : keepImages;
                if (Array.isArray(keptUrls)) {
                    await prisma.propertyImage.deleteMany({
                        where: {
                            propertyId: id,
                            url: { notIn: keptUrls }
                        }
                    });
                }
            } catch (e) {
                console.error("Error parsing keepImages:", e);
            }
        }

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

        // Handle Ownership Document Update
        if (files?.['ownershipDocument']?.length) {
            const doc = files['ownershipDocument'][0];
            const existingDoc = await prisma.document.findFirst({
                where: { propertyId: id, type: 'OWNERSHIP_PROOF' }
            });

            if (existingDoc) {
                await prisma.document.update({
                    where: { id: existingDoc.id },
                    data: { url: doc.path }
                });
            } else {
                await prisma.document.create({
                    data: {
                        type: 'OWNERSHIP_PROOF',
                        url: doc.path,
                        userId: userId,
                        propertyId: id,
                        verified: false
                    }
                });
            }
        }

        // Handle Owner Photo Update (Identification Photo)
        if (files?.['ownerPhoto']?.length) {
            const photo = files['ownerPhoto'][0];
            await prisma.user.update({
                where: { id: userId },
                data: { verificationPhoto: photo.path } as any
            });
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

export const verifyProperty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isVerified } = req.body;

        const property = await prisma.property.update({
            where: { id },
            data: { isVerified },
            include: {
                location: true,
                images: true,
                ownershipDocuments: true
            }
        });

        // Also update the documents to verified
        if (isVerified) {
            await prisma.document.updateMany({
                where: { propertyId: id },
                data: { verified: true }
            });
        }

        res.json(property);
    } catch (error: any) {
        console.error('Error verifying property:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

