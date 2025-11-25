import crypto from "crypto";

export const generateOtp = () => {
    const otp = crypto.randomInt(100000, 999999).toString();

    const hexOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const otpExpires = Date.now() + 15 * 60 * 1000;


    return {
        otp,
        hexOtp,
        otpExpires
    }
};