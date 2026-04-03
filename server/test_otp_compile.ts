import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";

const auth = betterAuth({
    database: {} as any,
    plugins: [
        emailOTP({
            async sendVerificationOtp({ email, otp, type }) {
                console.log(email, otp, type);
            }
        })
    ]
});
