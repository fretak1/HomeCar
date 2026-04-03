import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma.js";
import { sendEmail } from "../services/emailService.js";
import { emailOTP } from "better-auth/plugins";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    appURL: "http://localhost:3000",
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "CUSTOMER",
            },
        },
    },
    session: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "CUSTOMER",
            },
        },
    },
    trustedOrigins: ["http://localhost:3000"],
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
    },
    plugins: [
        emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }) {
                if (type === "email-verification") {
                    await sendEmail(
                        email,
                        "Verify your email",
                        `Your verification code is: <b>${otp}</b>. It will expire in 5 minutes.`
                    );
                } else if (type === "forget-password") {
                    await sendEmail(
                        email,
                        "Reset your password",
                        `Your password reset code is: <b>${otp}</b>. Use this to set a new password.`
                    );
                }
            },
        }),
    ],
    rateLimit: {
        enabled: true,
        window: 60, // 1 minute
        max: 5, // Increased for development testing
    },
    advanced: {
        cookiePrefix: "better-auth",
        crossOrigin: true, // Fix for cross-port localhost
    },
    // We'll configure advanced email verification once we have the SMTP service ready
});
