import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = 'homecar/uploads';
        if (file.fieldname === 'profileImage') folder = 'homecar/profiles';
        if (file.fieldname === 'images') folder = 'homecar/properties';
        if (file.fieldname === 'ownershipDocument') folder = 'homecar/documents';

        return {
            folder: folder,
            allowed_formats: ['jpg', 'png', 'jpeg', 'avif', 'pdf', 'webp', 'gif'],
            resource_type: 'auto',
            public_id: `${file.fieldname}_${Date.now()}`,
        };
    },
});

export const upload = multer({ storage });
