import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { auth } from './lib/auth.js';


const allowedOrigins = (process.env.CORS_ORIGINS ||
    'http://localhost:3000,http://127.0.0.1:3000,http://10.0.2.2:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const isAllowedOrigin = (origin?: string) => {
    if (!origin) return true;

    if (allowedOrigins.includes(origin)) {
        return true;
    }

    try {
        const parsed = new URL(origin);
        return ['localhost', '127.0.0.1', '10.0.2.2'].includes(parsed.hostname);
    } catch {
        return false;
    }
};

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (isAllowedOrigin(origin)) {
                    callback(null, true);
                    return;
                }
                callback(new Error(`Origin ${origin} is not allowed`), false);
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware for sockets
    io.use(async (socket, next) => {
        try {
            const session = await auth.api.getSession({
                headers: socket.request.headers as any
            });

            if (!session) {
                console.error('Socket Auth Failed: No session found for headers');
                return next(new Error('Authentication error'));
            }

            console.log(`Socket Auth Success: User ${session.user.id} (${session.user.name})`);
            (socket as any).userId = session.user.id;
            next();
        } catch (err) {
            console.error('Socket Auth Error:', err);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = (socket as any).userId;

        // Have the user socket join a room identified by their userId
        if (userId) {
            socket.join(userId);
            console.log(`User connected via socket and joined room: ${userId} (Socket: ${socket.id})`);
        }

        socket.on('disconnect', () => {
            if (userId) {
                console.log(`User disconnected: ${userId} (Socket: ${socket.id})`);
            }
        });
    });

    return io;
};

export const getSocketServer = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized');
    }
    return io;
};

// Utility to send new message events to a specific user
export const emitNewMessage = (receiverId: string, messageData: any) => {
    if (!io) {
        console.warn('Socket.io NOT initialized, skipping emit');
        return;
    }
    console.log(`Emitting new_message to receiver room: ${receiverId}`);
    io.to(receiverId).emit('new_message', messageData);
};
// Utility to send notifications to a specific user
export const emitNotification = (userId: string, notification: any) => {
    if (!io) {
        console.warn('Socket.io NOT initialized, skipping notification emit');
        return;
    }
    console.log(`Emitting notification to user room: ${userId}`);
    io.to(userId).emit('new_notification', notification);
};
