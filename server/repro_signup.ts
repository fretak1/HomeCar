import axios from 'axios';

async function testDuplicateSignUp() {
    const baseURL = 'http://localhost:5000/api/auth';
    const testEmail = 'duplicate_test@example.com';
    const testPassword = 'Password123!';

    console.log(`--- Testing Case: Initial Sign Up ---`);
    try {
        const res1 = await axios.post(`${baseURL}/sign-up/email`, {
            email: testEmail,
            password: testPassword,
            name: 'Test User',
            callbackURL: 'http://localhost:3000/login'
        });
        console.log("First Sign Up Response Status:", res1.status);
        console.log("First Sign Up Response Data:", res1.data);
    } catch (e: any) {
        console.log("First Sign Up Failed (Expected if user exists):", e.response?.status, e.response?.data);
    }

    console.log(`\n--- Testing Case: Duplicate Sign Up ---`);
    try {
        const res2 = await axios.post(`${baseURL}/sign-up/email`, {
            email: testEmail,
            password: testPassword,
            name: 'Test User Duplicate',
            callbackURL: 'http://localhost:3000/login'
        });
        console.log("Duplicate Sign Up Response Status:", res2.status);
        console.log("Duplicate Sign Up Response Data:", res2.data);
    } catch (e: any) {
        console.log("Duplicate Sign Up Caught Error:", e.response?.status, e.response?.data);
    }
}

testDuplicateSignUp();
