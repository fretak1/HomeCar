import { Request, Response } from 'express';

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Multer-storage-cloudinary adds path to req.file
        res.json({
            url: (req.file as any).path,
            public_id: (req.file as any).filename
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
};

export const uploadFiles = async (req: Request, res: Response) => {
    try {
        const files = req.files as any[];
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadedFiles = files.map(file => ({
            url: file.path,
            public_id: file.filename
        }));

        res.json(uploadedFiles);
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
};
