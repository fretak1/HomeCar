import nodeCron from 'node-cron';
import prisma from '../lib/prisma.js';
import { sendEmail } from './emailService.js';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1';

/**
 * Checks for upcoming lease payments and sends reminders to customers 2 days before the due date.
 */
export const checkUpcomingPayments = async () => {
    console.log('Running cron: Upcoming Payment Reminders');

    try {
        const today = new Date();
        const reminderDate = new Date();
        reminderDate.setDate(today.getDate() + 2);

        // Find active leases where the start date day matches the reminder date day
        const activeLeases = await prisma.lease.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                customer: true,
                property: true
            }
        });

        for (const lease of activeLeases) {
            const dueDateDay = lease.startDate.getDate();

            // Check if reminderDate is the due date day
            if (reminderDate.getDate() === dueDateDay) {
                // Check if payment already exists for this period
                // We'll look for a completed RENT transaction in the last 25 days
                const recentPayment = await prisma.transaction.findFirst({
                    where: {
                        leaseId: lease.id,
                        type: 'RENT',
                        status: 'COMPLETED',
                        createdAt: {
                            gte: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000)
                        }
                    }
                });

                if (!recentPayment) {
                    const subject = `Reminder: Upcoming Payment for ${lease.property.title}`;
                    const html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #4f46e5;">Payment Reminder</h2>
                            <p>Hello ${lease.customer.name},</p>
                            <p>This is a friendly reminder that your monthly rent payment of <strong>${lease.recurringAmount || lease.totalPrice} ETB</strong> for <strong>${lease.property.title}</strong> is due in 2 days on <strong>${reminderDate.toLocaleDateString()}</strong>.</p>
                            <p>Please ensure your payment is made on time to avoid any late fees or service interruptions.</p>
                            <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                                <p style="margin: 0; font-size: 14px; color: #6b7280;">If you have already made this payment, please disregard this email.</p>
                            </div>
                            <p style="margin-top: 20px;">Best regards,<br/>HomeCar Team</p>
                        </div>
                    `;

                    await sendEmail(lease.customer.email, subject, html);
                }
            }
        }
    } catch (error) {
        console.error('Error in checkUpcomingPayments cron:', error);
    }
};

/**
 * Checks for overdue lease payments and notifies owners.
 */
export const checkOverduePayments = async () => {
    console.log('Running cron: Overdue Payment Alerts');

    try {
        const today = new Date();

        const activeLeases = await prisma.lease.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                owner: true,
                customer: true,
                property: true
            }
        });

        for (const lease of activeLeases) {
            const dueDateDay = lease.startDate.getDate();

            // If today is after the due date day (e.g. today is 6th, due date was 5th)
            if (today.getDate() > dueDateDay) {
                // Check if payment exists for this billing cycle
                const recentPayment = await prisma.transaction.findFirst({
                    where: {
                        leaseId: lease.id,
                        type: 'RENT',
                        status: 'COMPLETED',
                        createdAt: {
                            gte: new Date(today.getTime() - (today.getDate() - dueDateDay + 1) * 24 * 60 * 60 * 1000)
                        }
                    }
                });

                if (!recentPayment) {
                    const subject = `Alert: Overdue Payment for ${lease.property.title}`;
                    const html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #ef4444;">Overdue Payment Alert</h2>
                            <p>Hello ${lease.owner.name},</p>
                            <p>This is to inform you that the rent payment for your property <strong>${lease.property.title}</strong> by customer <strong>${lease.customer.name}</strong> is currently overdue.</p>
                            <p>The due date was the <strong>${dueDateDay}th</strong> of this month.</p>
                            <p>You may want to contact the tenant or check your transaction dashboard for more details.</p>
                            <p style="margin-top: 20px;">Best regards,<br/>HomeCar Team</p>
                        </div>
                    `;

                    await sendEmail(lease.owner.email, subject, html);
                }
            }
        }
    } catch (error) {
        console.error('Error in checkOverduePayments cron:', error);
    }
};

/**
 * Triggers the AI model retraining process.
 */
export const triggerAiRetrain = async () => {
    console.log('Running cron: Triggering AI model retraining...');
    try {
        await axios.post(`${AI_SERVICE_URL}/retrain`);
        console.log('[AI] Successfully triggered retraining task on AI Service.');
    } catch (error: any) {
        console.error('[AI] Error triggering AI Retraining:', error.message);
    }
};

// Clear cron jobs at midnight every day
export const initCronJobs = () => {
    // Run at 00:00 every day
    nodeCron.schedule('0 0 * * *', () => {
        checkUpcomingPayments();
        checkOverduePayments();
    });

    // Run at 03:00 every day
    nodeCron.schedule('0 3 * * *', () => {
        triggerAiRetrain();
    });

    console.log('Cron jobs initialized');
};
