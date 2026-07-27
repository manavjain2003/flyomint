import apiRequest, { ApiError } from "./api";
import { decryptOtp, encryptOtp } from "./otpCrypto";

export async function requestLoginOtp(mobile) {
    try {
        const res = await apiRequest("/Auth/GetLoginOTP", {
            method: "POST",
            body: { Mobile: mobile },
        });

        const payload = res?.ServiceResponse ?? {};

        console.log("Raw payload:", payload); 
        console.log("Raw OTP value:", payload.OTP);

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not send OTP" };
        }

        let plainOtp = "";
        if (payload.OTP) {
            try {
                plainOtp = decryptOtp(payload.OTP);
                console.log("Decrypted OTP:", plainOtp);
            } catch (e) {
                console.error("Failed to decrypt OTP:", e);
            }
        } else {
            console.warn("payload.OTP was falsy — check field name casing from API");
        }

        return {
            success: true,
            message: payload.Message || "OTP sent successfully.",
            otp: plainOtp,
            userKey: payload.UserKey,
        };
    } catch (error) {
        if (error instanceof ApiError) return { success: false, message: error.message };
        return { success: false, message: "Network error. Please try again." };
    }
}

export async function verifyLoginOtp({ mobile, userKey, otp }) {
    try {
        const encryptedOtp = encryptOtp(otp);

        const res = await apiRequest("/Auth/Login", {
            method: "POST",
            body: { Mobile: mobile, UserKey: userKey, OTP: encryptedOtp },
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Invalid or expired OTP" };
        }

        return {
            success: true,
            message: payload.Message || "Login successful",
            uniqueKey: payload.UniqueKey,
            validity: payload.Validity,
        };
    } catch (error) {
        if (error instanceof ApiError) return { success: false, message: error.message };
        return { success: false, message: "Network error. Please try again." };
    }
}