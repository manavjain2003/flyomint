import apiRequest, { ApiError, setUniqueKey } from "./api";
import { decryptOtp, encryptOtp } from "./otpCrypto";
import { getStoredUniqueKey, clearLoginSession } from "@/app/components/booking/LoginDrawer";

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

// ---------------------------------------------------------------------------
// Logged-in user profile
// ---------------------------------------------------------------------------

export async function getUserProfile() {
    try {
        const token = getStoredUniqueKey();
        if (!token) return { success: false, message: "Not logged in." };

        const res = await apiRequest("/Auth/UserProfile", {
            method: "GET",
            token,
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not load profile." };
        }

        return {
            success: true,
            name: payload.Name,
            email: payload.Email,
            mobile: payload.Mobile,
            balance: payload.Balance,
        };
    } catch (error) {
        if (error instanceof ApiError) return { success: false, message: error.message };
        return { success: false, message: "Network error. Please try again." };
    }
}

// ---------------------------------------------------------------------------
// Verify a new email / mobile before it can be saved to the profile
// ---------------------------------------------------------------------------

export async function requestProfileOtp({ mobile, email } = {}) {
    try {
        const token = getStoredUniqueKey();
        if (!token) return { success: false, message: "Not logged in." };

        const res = await apiRequest("/Auth/GenerateVerifyOTP", {
            method: "POST",
            token,
            body: { Mobile: mobile || "", Email: email || "" },
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not send OTP." };
        }

        let plainOtp = "";
        if (payload.OTP) {
            try {
                plainOtp = decryptOtp(payload.OTP);
            } catch (e) {
                console.error("Failed to decrypt OTP:", e);
            }
        }

        return {
            success: true,
            message: payload.Message || "OTP sent successfully.",
            otp: plainOtp,
        };
    } catch (error) {
        if (error instanceof ApiError) return { success: false, message: error.message };
        return { success: false, message: "Network error. Please try again." };
    }
}

export async function verifyProfileOtp({ mobile, email, otp }) {
    try {
        const token = getStoredUniqueKey();
        if (!token) return { success: false, message: "Not logged in." };

        const encryptedOtp = encryptOtp(otp);

        const res = await apiRequest("/Auth/VerifyOTP", {
            method: "POST",
            token,
            body: { Mobile: mobile || "", Email: email || "", OTP: encryptedOtp },
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Invalid or expired OTP." };
        }

        return {
            success: true,
            message: payload.Message || "Verified successfully.",
            verificationCode: payload.VerificationCode,
        };
    } catch (error) {
        if (error instanceof ApiError) return { success: false, message: error.message };
        return { success: false, message: "Network error. Please try again." };
    }
}

// ---------------------------------------------------------------------------
// Save profile changes. Pass emailVerificationCode / mobileVerificationCode
// (from verifyProfileOtp) only when the email / mobile is actually changing.
// ---------------------------------------------------------------------------

export async function updateProfile({ name, emailVerificationCode = "", mobileVerificationCode = "" }) {
    try {
        const token = getStoredUniqueKey();
        if (!token) return { success: false, message: "Not logged in." };

        const res = await apiRequest("/Auth/UpdateProfile", {
            method: "POST",
            token,
            body: {
                Name: name,
                EmailVerificationCode: emailVerificationCode,
                MobileVerificationCode: mobileVerificationCode,
            },
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not update profile." };
        }

        return { success: true, message: payload.Message || "Profile updated successfully." };
    } catch (error) {
        if (error instanceof ApiError) return { success: false, message: error.message };
        return { success: false, message: "Network error. Please try again." };
    }
}


export async function logoutUser() {
    try {
        const token = getStoredUniqueKey();
        if (!token) {
            clearLoginSession();
            return { success: true, message: "Logged out." };
        }

        const res = await apiRequest("/Auth/Logout", {
            method: "POST",
            token,
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.UniqueKey) {
            setUniqueKey(payload.UniqueKey, payload.Validity);
        }

        clearLoginSession();

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Logout failed." };
        }

        return { success: true, message: payload.Message || "Logged out successfully." };
    } catch (error) {
        // Even if the network call fails, clear the local session so the UI
        // doesn't get stuck showing the user as logged in.
        clearLoginSession();
        if (error instanceof ApiError) return { success: false, message: error.message };
        return { success: false, message: "Network error. Please try again." };
    }
}