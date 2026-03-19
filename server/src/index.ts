import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { initSocket } from './socket.js';
import { initCronJobs } from './services/cronService.js';
import fs from 'fs';

dotenv.config();

// Initialize Cron Jobs
initCronJobs();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
// Middleware
app.use(
    cors({
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Cache-Control",
            "Expires",
            "Pragma"
        ],
        credentials: true
    })
);
app.use(express.json());
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
import userRoutes from './routes/userRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import leaseRoutes from './routes/leaseRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js';

app.use('/api/user', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/interactions', interactionRoutes);

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', service: 'HomeCar Backend' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('SERVER ERROR:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        details: err
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
