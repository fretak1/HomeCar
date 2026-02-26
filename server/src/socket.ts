import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key';

// Keep track of connected users: { userId: socketId }
const connectedUsers = new Map<string, string>();

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware for sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
            (socket as any).userId = decoded.id;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = (socket as any).userId;

        // Add user to tracking map
        if (userId) {
            connectedUsers.set(userId, socket.id);
            console.log(`User connected via socket: ${userId} (Socket: ${socket.id})`);
        }

        socket.on('disconnect', () => {
            if (userId) {
                connectedUsers.delete(userId);
                console.log(`User disconnected: ${userId}`);
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
    if (!io) return;
    const socketId = connectedUsers.get(receiverId);
    if (socketId) {
        io.to(socketId).emit('new_message', messageData);
    }
};
