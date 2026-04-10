import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isSecureDoc = file.fieldname === 'ownershipDocument' || file.fieldname === 'license';
        
        let folder = 'homecar/uploads';
        if (file.fieldname === 'profileImage') folder = 'homecar/profiles';
        if (file.fieldname === 'images' || file.fieldname === 'selfie') folder = 'homecar/properties';
        if (isSecureDoc) folder = 'homecar/documents';

        return {
            folder: folder,
            resource_type: isSecureDoc ? 'raw' : 'auto',
            type: isSecureDoc ? 'authenticated' : 'upload',
            public_id: `${file.fieldname}_${Date.now()}`,
            // In Cloudinary, 'raw' assets don't always use 'allowed_formats' the same way as images
            allowed_formats: isSecureDoc ? undefined : ['jpg', 'png', 'jpeg', 'avif', 'pdf', 'webp', 'gif'],
        };
    },
});

export const upload = multer({ storage });
