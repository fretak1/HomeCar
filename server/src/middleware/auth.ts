import { Request, Response, NextFunction } from 'express';
import { auth } from "../lib/auth.js";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        name: string;
    };
    session?: any;
}

const hasBetterAuthCookie = (req: Request) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
        return false;
    }

    return cookieHeader
        .split(';')
        .some(cookie => cookie.trim().startsWith('better-auth'));
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers as any
        });

        if (!session) {
            return res.status(401).json({ error: 'Unauthorized: No active session' });
        }

        req.session = session.session;
        req.user = {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role as string,
            name: session.user.name
        };
        next();
    } catch (error) {
        console.error("Auth middleware FAILED:", error);
        return res.status(500).json({ error: 'Authentication internal error' });
    }
};

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!hasBetterAuthCookie(req)) {
        next();
        return;
    }

    try {
        const session = await auth.api.getSession({
            headers: req.headers as any
        });

        if (session) {
            req.session = session.session;
            req.user = {
                id: session.user.id,
                email: session.user.email,
                role: session.user.role as string,
                name: session.user.name
            };
        }
        next();
    } catch (error) {
        next();
    }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access only' });
    }
    next();
};
