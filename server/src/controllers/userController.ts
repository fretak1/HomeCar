import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing name, email, or password' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: role || 'CUSTOMER',
            }
        });

        // Omit password from response
        const { passwordHash: _, ...userWithoutPassword } = user;

        res.status(201).json(userWithoutPassword);
    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { passwordHash: _, ...userWithoutPassword } = user;

        res.json({
            user: userWithoutPassword,
            token
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const logoutUser = (req: Request, res: Response) => {
    // For JWT, logout is usually handled on the client by clearing the token.
    // We can just return success.
    res.json({ message: 'Logged out successfully' });
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();
        const usersWithoutPasswords = users.map(user => {
            const { passwordHash: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.json(usersWithoutPasswords);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



export const getCurrentUser = async (req: any, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error: any) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateCurrentUser = async (req: any, res: Response) => {
    try {
        const userId = req.user?.id;
        const {
            name, profileImage, email, phoneNumber,
            marriageStatus, kids, gender, employmentStatus,
            currentPassword, newPassword
        } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (profileImage !== undefined) updateData.profileImage = profileImage;
        if (req.file) updateData.profileImage = req.file.path;
        if (email) updateData.email = email;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (marriageStatus) updateData.marriageStatus = marriageStatus;
        if (kids) updateData.kids = kids;
        if (gender) updateData.gender = gender;
        if (employmentStatus) updateData.employmentStatus = employmentStatus;

        // Handle Password Update
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to set a new password' });
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.passwordHash) {
                return res.status(404).json({ error: 'User not found' });
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            updateData.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error: any) {
        console.error('Error updating current user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
