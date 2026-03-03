import { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../lib/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';

/**
 * Creates a Chapa subaccount for an owner/agent.
 * This is required for split payments.
 */
export const createOwnerSubaccount = async (req: Request, res: Response) => {
    try {
        const { userId, bankCode, accountNumber, accountName, businessName } = req.body;

        if (!userId || !bankCode || !accountNumber || !accountName) {
            return res.status(400).json({ error: 'Missing required bank details' });
        }

        // 1. Create subaccount on Chapa
        const chapaResponse = await axios.post(
            `${CHAPA_BASE_URL}/subaccount`,
            {
                business_name: businessName || accountName,
                account_name: accountName,
                bank_code: bankCode,
                account_number: accountNumber,
                split_type: 'percentage',
                split_value: 0.0, // Default to 0% commission as requested
            },
            {
                headers: {
                    Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (chapaResponse.data.status !== 'success') {
            return res.status(400).json({ error: 'Failed to create Chapa subaccount', details: chapaResponse.data });
        }

        const subaccountId = chapaResponse.data.data.id || chapaResponse.data.data.subaccount_id;

        // 2. Save to our database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                chapaSubaccountId: subaccountId,
                payoutBankCode: bankCode.toString(),
                payoutAccountNumber: accountNumber,
                payoutAccountName: accountName,
            },
        });

        res.json({ message: 'Subaccount created successfully', subaccountId });
    } catch (error: any) {
        console.error('Error creating Chapa subaccount:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Internal server error',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Initializes a split payment for a lease or property.
 */
export const initializePayment = async (req: Request, res: Response) => {
    try {
        const { amount, email, firstName, lastName, txRef, callbackUrl, returnUrl, subaccountId, leaseId, propertyId, payerId, payeeId, meta } = req.body;

        if (!amount || !email || !txRef || !subaccountId || !payerId || !payeeId) {
            return res.status(400).json({ error: 'Missing payment details' });
        }

        // 1. Create a pending transaction in our DB
        await prisma.transaction.create({
            data: {
                amount: parseFloat(amount),
                status: 'PENDING',
                type: leaseId ? 'RENT' : 'FULL_PURCHASE', // Simplified logic
                payerId,
                payeeId,
                leaseId,
                propertyId,
                chapaReference: txRef,
                metadata: meta || null,
            }
        });

        // 2. Initialize Chapa Transaction
        // Chapa requires a valid email format. Ensure we provide one even in dev.
        const validEmail = email.includes('@') && email.includes('.')
            ? email
            : `${email.replace(/\s+/g, '')}@example.com`;

        console.log(`Initializing Chapa Payment. Original email: ${email}, Validated email: ${validEmail}`);

        const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
        const finalReturnUrl = returnUrl || `${APP_BASE_URL}/checkout/success/${txRef}`;

        const chapaResponse = await axios.post(
            `${CHAPA_BASE_URL}/transaction/initialize`,
            {
                amount: amount.toString(),
                currency: 'ETB',
                email: validEmail,
                first_name: firstName,
                last_name: lastName,
                tx_ref: txRef,
                callback_url: callbackUrl,
                return_url: finalReturnUrl,
                subaccount_id: subaccountId, // This enables the split
                'customization[title]': 'HomeCar Payment',
                'customization[description]': leaseId ? 'Lease Payment' : 'Property Purchase',
            },
            {
                headers: {
                    Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json(chapaResponse.data);
    } catch (error: any) {
        console.error('Error initializing Chapa payment:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to initialize payment',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Manually verifies a payment via Chapa API.
 * This is used on the frontend success page.
 */
export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { txRef } = req.params;

        if (!txRef) {
            return res.status(400).json({ error: 'Missing transaction reference' });
        }

        // 1. Verify with Chapa
        const chapaRes = await axios.get(
            `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
            {
                headers: {
                    Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
                },
            }
        );

        const verificationData = chapaRes.data;

        if (verificationData.status === 'success' && verificationData.data.status === 'success') {
            // 2. Fetch existing transaction to preserve its metadata (like the 'month' field)
            const existingTx = await prisma.transaction.findUnique({
                where: { chapaReference: txRef }
            });

            const mergedMetadata = {
                ...(typeof existingTx?.metadata === 'object' && existingTx?.metadata != null ? existingTx.metadata : {}),
                ...verificationData.data
            };

            // 3. Update our database with merged metadata
            const transaction = await prisma.transaction.update({
                where: { chapaReference: txRef },
                data: {
                    status: 'COMPLETED',
                    metadata: mergedMetadata as any, // Store full Chapa response + existing custom meta
                },
                include: {
                    payee: true,
                    payer: true,
                    property: true
                }
            });

            // 4. Notify Owner via Email
            const subject = `Payment Received: ${transaction.amount} ETB for ${transaction.property?.title || 'Property'}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #10b981;">Payment Received!</h2>
                    <p>Hello ${transaction.payee.name},</p>
                    <p>You have successfully received a payment of <strong>${transaction.amount} ${transaction.currency}</strong> from <strong>${transaction.payer.name}</strong>.</p>
                    <p><strong>Property:</strong> ${transaction.property?.title || 'Lease/Purchase'}</p>
                    <p><strong>Transaction ID:</strong> ${transaction.id}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    <p style="margin-top: 20px;">The funds have been split according to your subaccount settings and will be settled by Chapa shortly.</p>
                    <p style="margin-top: 20px;">Best regards,<br/>HomeCar Team</p>
                </div>
            `;

            import('../services/emailService.js').then(module => {
                module.sendEmail(transaction.payee.email, subject, html);
            }).catch(err => console.error('Delayed email import failed:', err));

            // 3. If it's a lease payment, we could do more here (e.g., auto-advance month)
            // But for now, just marking it as completed is enough to reflect in the UI

            return res.json({
                success: true,
                message: 'Payment verified successfully',
                transaction
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed',
                details: verificationData.data
            });
        }
    } catch (error: any) {
        console.error('Verify payment error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Error verifying payment',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Webhook handler for Chapa payment confirmations.
 */
export const verifyWebhook = async (req: Request, res: Response) => {
    try {
        // In a real app, verify the signature here
        const { tx_ref, status } = req.body;

        if (status === 'success') {
            // Fetch existing transaction to preserve its metadata
            const existingTx = await prisma.transaction.findUnique({
                where: { chapaReference: tx_ref }
            });

            const mergedMetadata = {
                ...(typeof existingTx?.metadata === 'object' && existingTx?.metadata != null ? existingTx.metadata : {}),
                ...req.body
            };

            const transaction = await prisma.transaction.update({
                where: { chapaReference: tx_ref },
                data: {
                    status: 'COMPLETED',
                    metadata: mergedMetadata as any, // Store webhook payload + existing custom meta
                },
                include: {
                    payee: true,
                    payer: true,
                    property: true
                }
            });

            // Notify Owner via Email
            const subject = `Payment Received: ${transaction.amount} ETB for ${transaction.property?.title || 'Property'}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #10b981;">Payment Received!</h2>
                    <p>Hello ${transaction.payee.name},</p>
                    <p>You have successfully received a payment of <strong>${transaction.amount} ${transaction.currency}</strong> from <strong>${transaction.payer.name}</strong>.</p>
                    <p>Property: ${transaction.property?.title || 'Lease/Purchase'}</p>
                    <p>Transaction ID: ${transaction.id}</p>
                    <p>Date: ${new Date().toLocaleString()}</p>
                    <p style="margin-top: 20px;">The funds have been split according to your subaccount settings and will be settled by Chapa shortly.</p>
                    <p style="margin-top: 20px;">Best regards,<br/>HomeCar Team</p>
                </div>
            `;

            import('../services/emailService.js').then(module => {
                module.sendEmail(transaction.payee.email, subject, html);
            }).catch(err => console.error('Webhook email sending failed:', err));

            // If it's a lease payment, we might want to update the lease last payment date here
        }

        res.sendStatus(200);
    } catch (error: any) {
        console.error('Error verifying webhook:', error);
        res.status(500).send('Webhook failed');
    }
};

/**
 * Fetches the list of supported banks from Chapa.
 */
export const getBanks = async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${CHAPA_BASE_URL}/banks`, {
            headers: {
                Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
            },
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch banks' });
    }
};
