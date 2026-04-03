import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";

const auth = betterAuth({
    database: {} as any,
    emailVerification: {
        // Will this clash with emailOTP?
    },
    plugins: [
        emailOTP({
            async sendVerificationOtp({ email, otp, type }) {
                console.log(email, otp, type);
            },
            sendVerificationOnSignUp: true // Does this exist?
        })
    ]
});
