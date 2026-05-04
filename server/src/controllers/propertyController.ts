import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import axios from 'axios';
import cloudinary from '../config/cloudinary.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const normalizeAssetType = (value?: string) => {
    const normalized = value?.toUpperCase();
    return normalized === 'HOME' || normalized === 'HOUSE' || normalized === 'PROPERTY'
        ? 'HOME'
        : 'CAR';
};

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
            assetType: normalizeAssetType(assetType),
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

        const normalizedAssetType = normalizeAssetType(assetType);
        if (normalizedAssetType === 'HOME') {
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
                        publicId: doc.filename, // Multer-Cloudinary provides public_id as 'filename'
                        resourceType: doc.resource_type || 'raw',
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
                await prisma.user.update({
                    where: { id: userId },
                    data: { verificationPhoto: photo.path } as any
                });
            }
        }

        // ALWAYS create a NEW document record for the history to be immutable
        if (!property.isVerified) {
            const docId = (property as any).ownershipDocuments?.[0]?.id;
            const owner = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, verificationPhoto: true } });
            await (prisma as any).adminVerification.create({
                data: {
                    entityId: property.id,
                    entityType: property.assetType === 'HOME' ? 'Home' : 'Car',
                    entityName: property.title,
                    entityEmail: owner?.email,
                    status: 'Pending',
                    adminId: null,
                    reason: 'Property listed and pending ownership verification',
                    verificationPhoto: owner?.verificationPhoto,
                    documentId: docId
                }
            });
        }

        // --- AI Retrain Trigger ---
        try {
            const count = await prisma.property.count();
            if (count % 5 === 0) {
                axios.post(`${AI_SERVICE_URL}/retrain`).catch(() => {});
            }
        } catch (err) {}

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
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

export const getProperties = async (req: any, res: Response) => {
    try {
        const {
            assetType, listingType, priceMin, priceMax, propertyType,
            beds, baths, region, city, subCity, brand, model,
            yearMin, yearMax, fuelType, transmission, mileageMax,
            amenities, location, ownerId, listedById, isVerified, sort, 
            limit = 20, page = 1
        } = req.query as any;

        const where: any = {};
        const requesterRole = req.user?.role;

        if (isVerified !== undefined) {
            where.isVerified = isVerified === 'true';
        } else if (requesterRole !== 'ADMIN') {
            where.isVerified = true;
        }

        if (ownerId) where.ownerId = ownerId;
        if (listedById) where.listedById = listedById;
        if (assetType) where.assetType = assetType.toUpperCase().includes('HOME') ? 'HOME' : 'CAR';

        // Filter out UNAVAILABLE listings from general searches
        if (!ownerId && !listedById) {
            where.status = { not: 'UNAVAILABLE' };
        }

        if (listingType && listingType !== 'any') {
            const type = listingType.toUpperCase();
            if (type === 'BUY' || type === 'SALE') {
                where.listingType = { hasSome: ['BUY', 'FOR_SALE'] };
            } else {
                where.listingType = { has: type };
            }
        }

        if (priceMin || priceMax) {
            where.price = {};
            if (priceMin) where.price.gte = parseFloat(priceMin);
            if (priceMax) where.price.lte = parseFloat(priceMax);
        }

        if (beds && beds !== 'any') {
            const bedVal = parseInt(beds.toString().replace('+', ''));
            if (!isNaN(bedVal)) where.bedrooms = { gte: bedVal };
        }
        if (baths && baths !== 'any') {
            const bathVal = parseInt(baths.toString().replace('+', ''));
            if (!isNaN(bathVal)) where.bathrooms = { gte: bathVal };
        }

        if (amenities) {
            const amenitiesArr = Array.isArray(amenities) ? amenities : [amenities];
            if (amenitiesArr.length > 0) {
                where.amenities = { hasEvery: amenitiesArr };
            }
        }

        if (yearMin || yearMax) {
            where.year = {};
            if (yearMin) where.year.gte = parseInt(yearMin);
            if (yearMax) where.year.lte = parseInt(yearMax);
        }
        if (fuelType && fuelType !== 'any') {
            where.fuelType = { equals: fuelType, mode: 'insensitive' };
        }
        if (transmission && transmission !== 'any') {
            where.transmission = { equals: transmission, mode: 'insensitive' };
        }
        if (mileageMax) {
            where.mileage = { lte: parseInt(mileageMax) };
        }

        if (propertyType && propertyType !== 'any') {
            where.propertyType = { contains: propertyType.trim(), mode: 'insensitive' };
        }
        
        const andConditions: any[] = [];
        if (region && region !== 'any') andConditions.push({ location: { region: { contains: (region as string).trim(), mode: 'insensitive' } } });
        if (city && city !== 'any') andConditions.push({ location: { city: { contains: (city as string).trim(), mode: 'insensitive' } } });
        if (subCity && subCity !== 'any') andConditions.push({ location: { subcity: { contains: (subCity as string).trim(), mode: 'insensitive' } } });
        if (req.query.village && req.query.village !== 'any') andConditions.push({ location: { village: { contains: (req.query.village as string).trim(), mode: 'insensitive' } } });
        
        if (brand && brand !== 'any') {
            where.brand = { contains: (brand as string).trim(), mode: 'insensitive' };
        }
        if (model && model !== 'any') {
            where.model = { contains: (model as string).trim(), mode: 'insensitive' };
        }

        if (location && (location as string).trim() !== "") {
            const term = (location as string).trim();
            andConditions.push({
                OR: [
                    { title: { contains: term, mode: 'insensitive' } },
                    { description: { contains: term, mode: 'insensitive' } },
                    { location: { city: { contains: term, mode: 'insensitive' } } },
                    { location: { region: { contains: term, mode: 'insensitive' } } },
                    { location: { subcity: { contains: term, mode: 'insensitive' } } },
                    { location: { village: { contains: term, mode: 'insensitive' } } }
                ]
            });
        }

        if (andConditions.length > 0) where.AND = andConditions;

        let orderBy: any = [{ createdAt: 'desc' }, { id: 'asc' }];
        if (sort === 'price-low') orderBy = [{ price: 'asc' }, { id: 'asc' }];
        if (sort === 'price-high') orderBy = [{ price: 'desc' }, { id: 'asc' }];

        // Pagination Math
        const pLimit = Math.min(parseInt(limit as string) || 20, 10000);
        const pPage = Math.max(parseInt(page as string) || 1, 1);
        const skip = (pPage - 1) * pLimit;

        // Get total count for pagination metadata
        const total = await prisma.property.count({ where });

        const properties = await prisma.property.findMany({
            where,
            include: {
                location: true,
                images: true,
                owner: { select: { id: true, name: true, profileImage: true } },
                reviews: { select: { rating: true } }
            },
            orderBy,
            skip,
            take: pLimit
        });

        const formattedProperties = properties.map(p => ({
            ...p,
            rating: p.reviews.length > 0 ? p.reviews.reduce((a, c) => a + c.rating, 0) / p.reviews.length : 0,
            reviewCount: p.reviews.length
        }));

        res.json({
            properties: formattedProperties,
            total,
            page: pPage,
            limit: pLimit,
            totalPages: Math.ceil(total / pLimit)
        });
    } catch (error: any) {
        console.error("GetProperties Error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const getPropertyById = async (req: any, res: Response) => {
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
                        role: true,
                        verificationPhoto: true,
                        chapaSubaccountId: true
                    }
                },
                ownershipDocuments: { orderBy: { uploadedAt: 'desc' } },
                reviews: { include: { reviewer: { select: { id: true, name: true, profileImage: true } } } }
            }
        });

        if (!property) return res.status(404).json({ error: 'Property not found' });
        
        const reviews = property.reviews || [];
        res.json({
            ...property,
            rating: reviews.length > 0 ? reviews.reduce((a, c) => a + c.rating, 0) / reviews.length : 0,
            reviewCount: reviews.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPropertiesByOwnerId = async (req: any, res: Response) => {
    try {
        const { ownerId } = req.params;
        const properties = await prisma.property.findMany({
            where: {
                OR: [
                    { ownerId },
                    { listedById: ownerId }
                ]
            },
            include: { location: true, images: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProperty = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        const existing = await prisma.property.findUnique({
            where: { id },
            include: { 
                ownershipDocuments: { orderBy: { uploadedAt: 'desc' } },
                owner: true,
                images: true
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Only owner, listedBy (Agent), or admin can update
        if (existing.ownerId !== userId && existing.listedById !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized to update this property' });
        }

        const propertyOwnerId = existing.ownerId;

        const { 
            title, description, assetType, listingType, price,
            propertyType, bedrooms, bathrooms, area,
            brand, model, year, fuelType, transmission, mileage,
            location, amenities, keepImages, status
        } = req.body;
        const files = req.files as { [fieldname: string]: any[] } | undefined;

        const normalizedStatus = status ? (Array.isArray(status) ? status[0] : status).toString().toUpperCase() : undefined;

        const updateData: any = { 
            title, 
            description, 
            price: price ? parseFloat(price) : undefined,
            status: normalizedStatus && ['AVAILABLE', 'SOLD', 'UNAVAILABLE'].includes(normalizedStatus) ? normalizedStatus : undefined,
            assetType: assetType ? normalizeAssetType(assetType) : undefined,
            listingType: listingType ? (Array.isArray(listingType) ? listingType : [listingType]).map((t: string) => t.toUpperCase()) : undefined,
        };

        const normalizedAssetType = assetType ? normalizeAssetType(assetType) : existing.assetType;
        if (normalizedAssetType === 'HOME') {
            if (propertyType !== undefined) updateData.propertyType = propertyType;
            if (bedrooms !== undefined) updateData.bedrooms = parseInt(bedrooms) || 0;
            if (bathrooms !== undefined) updateData.bathrooms = parseInt(bathrooms) || 0;
            if (area !== undefined) updateData.area = parseFloat(area) || 0;
        } else {
            if (brand !== undefined) updateData.brand = brand;
            if (model !== undefined) updateData.model = model;
            if (year !== undefined) updateData.year = parseInt(year) || 0;
            if (fuelType !== undefined) updateData.fuelType = fuelType;
            if (transmission !== undefined) updateData.transmission = transmission;
            if (mileage !== undefined) updateData.mileage = parseInt(mileage) || 0;
        }

        if (amenities) {
            try {
                updateData.amenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
            } catch (e) {
                console.error('Error parsing amenities:', e);
            }
        }

        if (location) {
            const loc = typeof location === 'string' ? JSON.parse(location) : location;
            await prisma.location.update({
                where: { id: existing.locationId },
                data: { 
                    city: loc.city, 
                    region: loc.region, 
                    subcity: loc.subcity || loc.subCity,
                    village: loc.village,
                    lat: loc.lat ? parseFloat(loc.lat) : undefined,
                    lng: loc.lng ? parseFloat(loc.lng) : undefined
                }
            });
        }

        let keepImageUrls = existing.images.map((image) => image.url);
        if (keepImages !== undefined) {
            try {
                const parsedKeepImages =
                    typeof keepImages === 'string' ? JSON.parse(keepImages) : keepImages;
                if (Array.isArray(parsedKeepImages)) {
                    keepImageUrls = parsedKeepImages
                        .map((item: any) => item?.toString?.())
                        .filter((value: string | undefined): value is string => !!value);
                }
            } catch (error) {
                console.error('Error parsing keepImages:', error);
            }
        }

        if (files?.images?.length) {
            const newImageRecords = files.images.map((file: any) => ({
                url: file.path,
                propertyId: id,
                isMain: false
            }));

            if (keepImageUrls.length === 0) {
                await prisma.propertyImage.deleteMany({
                    where: { propertyId: id }
                });
            } else {
                await prisma.propertyImage.deleteMany({
                    where: {
                        propertyId: id,
                        url: { notIn: keepImageUrls }
                    }
                });
            }

            await prisma.propertyImage.createMany({
                data: newImageRecords
            });
        } else if (keepImages !== undefined) {
            if (keepImageUrls.length === 0) {
                await prisma.propertyImage.deleteMany({
                    where: { propertyId: id }
                });
            } else {
                await prisma.propertyImage.deleteMany({
                    where: {
                        propertyId: id,
                        url: { notIn: keepImageUrls }
                    }
                });
            }
        }

        const propertyImages = await prisma.propertyImage.findMany({
            where: { propertyId: id },
            orderBy: { id: 'asc' }
        });
        if (propertyImages.length > 0) {
            await prisma.propertyImage.updateMany({
                where: { propertyId: id },
                data: { isMain: false }
            });
            await prisma.propertyImage.update({
                where: { id: propertyImages[0].id },
                data: { isMain: true }
            });
        }

        let newDocId = existing.ownershipDocuments?.[0]?.id;
        let photoUpdated = false;

        if (files?.ownershipDocument?.length) {
            const doc = files.ownershipDocument[0];
            const createdDoc = await prisma.document.create({
                data: {
                    type: 'OWNERSHIP_PROOF',
                    url: doc.path,
                    publicId: doc.filename,
                    resourceType: doc.resource_type || 'raw',
                    userId: propertyOwnerId,
                    propertyId: id,
                    verified: false
                }
            });
            newDocId = createdDoc.id;
            updateData.isVerified = false;
            updateData.rejectionReason = null;
        }

        if (files?.ownerPhoto?.length) {
            const photo = files.ownerPhoto[0];
            await prisma.user.update({
                where: { id: propertyOwnerId },
                data: {
                    verificationPhoto: photo.path,
                    verified: false,
                    rejectionReason: null
                } as any
            });
            updateData.isVerified = false;
            updateData.rejectionReason = null;
            photoUpdated = true;
        }

        const updated = await prisma.property.update({
            where: { id },
            data: updateData,
            include: {
                location: true,
                images: true,
                ownershipDocuments: {
                    orderBy: { uploadedAt: 'desc' },
                    take: 1
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        role: true,
                        verificationPhoto: true,
                        chapaSubaccountId: true
                    }
                }
            }
        });

        // If something was updated that requires re-verification, create a Pending log
        if (files?.ownershipDocument?.length || photoUpdated) {
            await (prisma as any).adminVerification.create({
                data: {
                    entityId: id,
                    entityType: updated.assetType === 'HOME' ? 'Home' : 'Car',
                    entityName: updated.title,
                    entityEmail: (updated.owner as any)?.email,
                    status: 'Pending',
                    adminId: null,
                    reason: 'Ownership documents updated',
                    verificationPhoto: updated.owner?.verificationPhoto,
                    documentId: newDocId
                }
            });
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteProperty = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.property.delete({ where: { id } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyProperty = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { isVerified, rejectionReason } = req.body;
        const adminId = req.user?.id;

        // Fetch current documents for snapshot
        const currentProperty = await prisma.property.findUnique({
            where: { id },
            include: {
                ownershipDocuments: { orderBy: { uploadedAt: 'desc' } },
                owner: {
                    select: {
                        name: true,
                        email: true,
                        verificationPhoto: true
                    }
                }
            }
        });

        const property = await prisma.property.update({
            where: { id },
            data: { 
                isVerified,
                rejectionReason: isVerified ? null : rejectionReason
            }
        });
            if (isVerified) {
            await prisma.document.updateMany({ where: { propertyId: id }, data: { verified: true } });
        }

        // Create Admin Verification Record
        if (adminId && currentProperty) {
            const doc = currentProperty.ownershipDocuments?.[0];
            await (prisma as any).adminVerification.create({
                data: {
                    entityId: id,
                    entityType: currentProperty.assetType === 'HOME' ? 'Home' : 'Car',
                    entityName: currentProperty.title,
                    entityEmail: (currentProperty.owner as any)?.email,
                    status: isVerified ? 'Verified' : 'Rejected',
                    adminId: adminId,
                    reason: isVerified ? null : rejectionReason,
                    verificationPhoto: currentProperty.owner?.verificationPhoto,
                    documentId: doc?.id
                }
            });
        }

        res.json(property);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSignedUrl = async (req: any, res: Response) => {
    try {
        const { docId } = req.params;
        const doc = await prisma.document.findUnique({ where: { id: docId } });
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        let publicId = doc.publicId;
        if (!publicId) {
            // Support older documents stored before publicId column existed
            const uploadRegex = /\/upload\/(?:v\d+\/)?(.+)\.[^/.]+$/;
            const match = doc.url.match(uploadRegex);
            publicId = (match && match[1]) ? match[1] : null;
        }

        if (!publicId) {
            return res.status(400).json({ error: 'Invalid document missing public ID' });
        }

        const signedUrl = cloudinary.url(publicId, {
            sign_url: true,
            resource_type: doc.resourceType || 'raw',
            type: 'authenticated',
            secure: true,
            format: 'pdf',
            flags: 'attachment:false'
        });
        
        console.log(`[SignedUrl] Successfully generated link for ${publicId}`);
        res.json({ signedUrl });
    } catch (error: any) {
        console.error("[SignedUrl Error]:", error.message);
        res.status(500).json({ error: 'Failed to generate signed URL' });
    }
};

/**
 * FINAL FIX: Unbreakable Base64 Document Proxy
 */
export const viewDocument = async (req: Request, res: Response) => {
    try {
        const { docId } = req.params;
        const user = (req as any).user;

        console.log(`[DocumentProxy] Start bridge request for doc: ${docId}`);

        const doc = await prisma.document.findUnique({ where: { id: docId } });
        if (!doc) {
            console.error(`[DocumentProxy] Error: Document ${docId} not found in DB`);
            return res.status(404).json({ message: "Document not found" });
        }

        // Security check: Allow ADMIN or the original document UPLOADER (the owner of the file)
        if (user.role?.toUpperCase() !== 'ADMIN' && doc.userId !== user.id) {
            console.warn(`[DocumentProxy] Denied: User ${user.id} has role ${user.role} and does not own doc ${docId}`);
            return res.status(403).json({ message: "Forbidden: Administrative or Document Owner access only" });
        }

        let publicId = doc.publicId;
        if (!publicId) {
            // Support older documents stored before publicId column existed
            const uploadRegex = /\/upload\/(?:v\d+\/)?(.+)\.[^/.]+$/;
            const match = doc.url.match(uploadRegex);
            publicId = (match && match[1]) ? match[1] : null;
        }

        if (!publicId) {
            console.error(`[DocumentProxy] Error: Invalid document missing public ID`);
            return res.status(400).json({ message: 'Invalid document missing public ID' });
        }

        // Generate the signature (internal use)
        // We try the stored resource type first, but fallback to raw if missing
        const rType = doc.resourceType || 'raw';
        
        let signedUrl = cloudinary.url(publicId, {
            sign_url: true,
            resource_type: rType,
            type: 'authenticated',
            secure: true
        });

        console.log(`[DocumentProxy] Signature resolved (${rType}). Fetching bytes...`);

        let response;
        try {
            response = await axios({ 
                method: 'get', 
                url: signedUrl, 
                responseType: 'arraybuffer',
                timeout: 10000
            });
        } catch (fetchError: any) {
            // If the first attempt fails (maybe it was actually an image but stored as raw), try the other type
            const otherType = rType === 'raw' ? 'image' : 'raw';
            console.warn(`[DocumentProxy] Fetch failed for ${rType}. Retrying as ${otherType}...`);
            
            signedUrl = cloudinary.url(publicId, {
                sign_url: true,
                resource_type: otherType,
                type: 'authenticated',
                secure: true
            });

            response = await axios({ 
                method: 'get', 
                url: signedUrl, 
                responseType: 'arraybuffer',
                timeout: 10000
            });
        }

        console.log(`[DocumentProxy] Bytes received (${response.data.byteLength} bytes). Packaging bundle...`);

        const contentType = response.headers['content-type'] || 'application/pdf';
        const buffer = Buffer.from(response.data);
        const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;

        console.log(`[DocumentProxy] Success. Bridging data bundle to dashboard.`);
        return res.status(200).json({ dataUri });

    } catch (error: any) {
        console.error("[DocumentProxy] CRITICAL BRIDGE FAILURE:", error.message);
        
        // Return clear status codes for the frontend to catch
        if (error.response) {
            console.error(`[DocumentProxy] Cloudinary Error (${error.response.status}):`, error.response.data?.toString());
            return res.status(error.response.status).json({ message: "Cloudinary access error" });
        }
        
        return res.status(500).json({ message: "Failed to resolve secure data bundle" });
    }
};
