import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma.js";
import { sendEmail } from "../services/emailService.js";
import { emailOTP } from "better-auth/plugins";
import { expo } from "@better-auth/expo";

const configuredTrustedOrigins = (
    process.env.BETTER_AUTH_TRUSTED_ORIGINS ||
    process.env.CORS_ORIGINS ||
    "http://localhost:3000,http://127.0.0.1:3000,http://10.0.2.2:3000,homecar://,exp://"
)
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

const isAllowedTrustedOrigin = (origin?: string | null) => {
    if (!origin) return false;

    if (configuredTrustedOrigins.includes(origin)) {
        return true;
    }

    try {
        const parsed = new URL(origin);
        return ["localhost", "127.0.0.1", "10.0.2.2"].includes(parsed.hostname);
    } catch {
        return false;
    }
};

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    appURL: process.env.CORS_ORIGINS?.split(',')[0] || "http://localhost:3000",
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "CUSTOMER",
            },
            phoneNumber: { type: "string" },
            gender: { type: "string" },
            marriageStatus: { type: "string" },
            kids: { type: "string" },
            employmentStatus: { type: "string" },
            profileImage: { type: "string" },
            verified: { type: "boolean", defaultValue: false },
            verificationPhoto: {
                type: "string",
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
    trustedOrigins: async (request?: Request) => {
        const requestOrigin = request?.headers.get("origin");
        return [
            ...configuredTrustedOrigins,
            isAllowedTrustedOrigin(requestOrigin) ? requestOrigin : undefined,
        ];
    },
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
        expo(),
        emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }: { email: string, otp: string, type: string }) {
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
