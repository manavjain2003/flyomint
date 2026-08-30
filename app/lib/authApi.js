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

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not send OTP" };
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

export async function getUserProfile() {
    try {
        if (!getStoredUniqueKey()) return { success: false, message: "Not logged in." };

        const res = await apiRequest("/Auth/UserProfile", {
            method: "GET",
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
            billing: {
                pinCode: payload.PINCode ?? "",
                address: payload.Address ?? "",
                city: payload.City ?? "",
                state: payload.State ?? "",
            },
        };
    } catch (error) {
        if (error instanceof ApiError) return { success: false, message: error.message };
        return { success: false, message: "Network error. Please try again." };
    }
}

export async function requestProfileOtp({ mobile, email } = {}) {
    try {
        if (!getStoredUniqueKey()) return { success: false, message: "Not logged in." };
        const body = {};
        if (email) body.Email = email;
        if (mobile) body.Mobile = mobile;
        const res = await apiRequest("/Auth/GenerateVerifyOTP", {
            method: "POST",
            body,
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

export async function verifyProfileOtp({ mobile = "", email = "", otp }) {
    try {
        if (!getStoredUniqueKey()) return { success: false, message: "Not logged in." };

        const encryptedOtp = encryptOtp(otp);
        const body = { OTP: encryptedOtp };
        if (email) body.Email = email;
        if (mobile) body.Mobile = mobile;
        const res = await apiRequest("/Auth/VerifyOTP", {
            method: "POST",
            body,
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


export async function updateProfile({
    name = "",
    emailVerificationCode = "",
    mobileVerificationCode = "",
    address = "",
    city = "",
    state = "",
    pinCode = "",
} = {}) {
    try {
        if (!getStoredUniqueKey()) return { success: false, message: "Not logged in." };

        const body = {
            Name: name,
            EmailVerificationCode: emailVerificationCode,
            MobileVerificationCode: mobileVerificationCode,
        };

        if (address !== undefined) body.Address = address;
        if (city !== undefined) body.City = city;
        if (state !== undefined) body.State = state;
        if (pinCode !== undefined) body.PINCode = pinCode;

        const res = await apiRequest("/Auth/UpdateProfile", {
            method: "POST",
            body,
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
        if (!getStoredUniqueKey()) {
            clearLoginSession();
            return { success: true, message: "Logged out." };
        }

        const res = await apiRequest("/Auth/Logout", {
            method: "POST",
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
        clearLoginSession();
        if (error instanceof ApiError) return { success: false, message: error.message };
        return { success: false, message: "Network error. Please try again." };
    }
}