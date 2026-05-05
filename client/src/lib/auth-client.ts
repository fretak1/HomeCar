import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000",
    fetchOptions: {
        credentials: "include",
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
            },
        },
    },
    plugins: [
        emailOTPClient(),
    ],
});
