import { BrevoClient } from "@getbrevo/brevo";
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Brevo Client
const client = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY!,
});

// TypeScript-friendly sendEmail function
export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
    try {
        // Send the email using v4 SDK structure
        const response = await client.transactionalEmails.sendTransacEmail({
            sender: {
                name: "HomeCar",
                email: process.env.SMTP_USER!,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        });

        console.log("Email sent successfully! ID:", response.messageId);
    } catch (error: any) {
        // Handle errors safely
        console.error("Email sending failed:", error?.response?.body || error);
    }
};
