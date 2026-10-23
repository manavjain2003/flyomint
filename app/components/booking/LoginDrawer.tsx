"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { HiX } from "react-icons/hi";
import { FaFacebookF } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { requestLoginOtp, verifyLoginOtp } from "@/app/lib/authApi";
import { setUniqueKey } from "@/app/lib/api";

type Step = "mobile" | "otp";

const OTP_LENGTH = 6;
const UNIQUE_KEY = "uniqueKey";
const LOGIN_VALIDITY_KEY = "loginValidity";

export type LoginDrawerProps = {
    open: boolean;
    onClose: () => void;
    onLoginSuccess: (uniqueKey: string) => void;
};

export function saveLoginSession({ uniqueKey, validity }: { uniqueKey: string; validity?: string }) {
    localStorage.setItem(UNIQUE_KEY, uniqueKey);
    if (validity) localStorage.setItem(LOGIN_VALIDITY_KEY, validity);
    setUniqueKey(uniqueKey, validity, true);
}

export function getStoredUniqueKey(): string | null {
    return localStorage.getItem(UNIQUE_KEY);
}

export function clearLoginSession() {
    localStorage.removeItem(UNIQUE_KEY);
    localStorage.removeItem(LOGIN_VALIDITY_KEY);
}

export function isLoggedInSession(): boolean {
    const uniqueKey = getStoredUniqueKey();
    if (!uniqueKey) return false;

    const validity = localStorage.getItem(LOGIN_VALIDITY_KEY);
    if (!validity) {
        // No expiry on record for a stored key — treat as untrustworthy
        // rather than silently logged-in forever.
        clearLoginSession();
        return false;
    }

    const expiresAt = new Date(validity).getTime();
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
        // Stale/expired login session (e.g. from a previous visit whose
        // background refresh never got a chance to run before the tab was
        // closed). Wipe it here so the rest of the app — starting with
        // whatever just called this — doesn't keep treating an expired
        // token as a logged-in account.
        clearLoginSession();
        return false;
    }

    return true;
}

export default function LoginDrawer({ open, onClose, onLoginSuccess }: LoginDrawerProps) {
    const [step, setStep] = useState<Step>("mobile");
    const [mobile, setMobile] = useState("");
    const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [userKey, setUserKey] = useState("");
    const [testOtp, setTestOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [invalidOtp, setInvalidOtp] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);


    useEffect(() => {
        function handleSessionExpired() {
            clearLoginSession();
            window.dispatchEvent(new CustomEvent("flyomint:logout"));
        }

        window.addEventListener("flyomint:sessionExpired", handleSessionExpired);
        return () => {
            window.removeEventListener("flyomint:sessionExpired", handleSessionExpired);
        };
    }, []);

    if (!open) return null;

    function reset() {
        setStep("mobile");
        setMobile("");
        setOtpDigits(Array(OTP_LENGTH).fill(""));
        setUserKey("");
        setTestOtp("");
        setError("");
        setInfo("");
        setLoading(false);
        setInvalidOtp(false);
    }

    function handleClose() {
        reset();
        onClose();
    }

    async function handleSendOtp(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setInfo("");

        if (!/^\d{10}$/.test(mobile)) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        setLoading(true);
        const res = await requestLoginOtp(mobile);
        setLoading(false);

        if (!res.success) {
            setError(res.message);
            return;
        }
        if (!res.userKey) {
            setError("OTP request succeeded but did not return a UserKey to verify with.");
            return;
        }

        setUserKey(res.userKey);
        setTestOtp(res.otp || "");
        setInfo(res.message);
        setStep("otp");
    }

    function handleDigitChange(index: number, value: string) {
        const digit = value.replace(/[^0-9]/g, "").slice(-1);
        const next = [...otpDigits];
        next[index] = digit;
        setOtpDigits(next);
        if (invalidOtp) setInvalidOtp(false);

        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Backspace") {
            if (!otpDigits[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
                const next = [...otpDigits];
                next[index - 1] = "";
                setOtpDigits(next);
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
        if (!pasted) return;

        const next = Array(OTP_LENGTH).fill("");
        pasted.split("").forEach((char, i) => {
            next[i] = char;
        });
        setOtpDigits(next);

        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[focusIndex]?.focus();
    }

    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setInfo("");
        setInvalidOtp(false);

        const otp = otpDigits.join("");
        if (otp.length !== OTP_LENGTH) {
            setError(`Please enter the complete ${OTP_LENGTH}-digit OTP.`);
            return;
        }

        setLoading(true);
        const res = await verifyLoginOtp({ mobile, userKey, otp });
        setLoading(false);

        if (!res.success) {
            setError(res.message || "Invalid OTP. Please try again.");
            setInvalidOtp(true);
            setOtpDigits(Array(OTP_LENGTH).fill(""));
            inputRefs.current[0]?.focus();
            return;
        }

        if (!res.uniqueKey) {
            console.error("verifyLoginOtp succeeded but returned no uniqueKey", res);
            setError("Login succeeded but the session could not be saved. Please try again.");
            setInvalidOtp(true);
            return;
        }

        try {
            saveLoginSession({ uniqueKey: res.uniqueKey, validity: res.validity });
            window.dispatchEvent(new CustomEvent("flyomint:login"));
        } catch (err) {
            console.error("Failed to persist login session:", err);
        }

        setInfo("Login successful!");
        onLoginSuccess(res.uniqueKey);
        reset();
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[60] bg-black/40 transition-opacity"
                onClick={handleClose}
                aria-hidden="true"
            />
            {/* Drawer panel */}
            <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <Image src="/assets/logo.jpg" alt="Flyomint" width={140} height={35} className="h-8 w-auto" />
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close"
                        className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 grid place-items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    >
                        <HiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome Back</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Log in to continue your journey</p>

                    {step === "mobile" && (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                                placeholder="Enter mobile number"
                                className="w-full h-[52px] px-5 rounded-full border border-gray-200 dark:border-gray-700 text-[15px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#FF7626]"
                            />

                            {error && (
                                <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 px-4 py-2.5 rounded-xl">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-[52px] rounded-full bg-[#FF7626] hover:bg-[#e6661f] text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                            >
                                {loading ? <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" /> : "Continue"}
                            </button>
                        </form>
                    )}

                    {step === "otp" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div className={`flex justify-between gap-2 ${invalidOtp ? "animate-shake" : ""}`}>
                                {otpDigits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => {
                                            inputRefs.current[index] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleDigitChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className={`w-12 h-14 text-center text-xl font-semibold rounded-2xl border outline-none transition-colors
                                            ${invalidOtp
                                                ? "border-red-400 text-red-600 dark:text-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                                : "border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#FF7626] focus:ring-2 focus:ring-[#FF7626]/20"}`}
                                    />
                                ))}
                            </div>

                            {testOtp && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                                    Test OTP: <span className="font-semibold text-gray-700 dark:text-gray-300">{testOtp}</span>
                                </p>
                            )}

                            {error && (
                                <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950 px-4 py-2.5 rounded-xl">{error}</p>
                            )}
                            {info && (
                                <p className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-950 px-4 py-2.5 rounded-xl">{info}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-[52px] rounded-full bg-[#FF7626] hover:bg-[#e6661f] text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                            >
                                {loading ? <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" /> : "Verify OTP"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("mobile")}
                                className="w-full h-[52px] rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-[15px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Back
                            </button>
                        </form>
                    )}

                    <div className="relative my-7">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 bg-white dark:bg-gray-900 text-xs text-gray-400 dark:text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 h-12 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <FcGoogle className="w-5 h-5" />
                            Google
                        </button>
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 h-12 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <FaFacebookF className="w-4 h-4 text-[#1877F2]" />
                            Facebook
                        </button>
                    </div>

                    {/* <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-300">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-[#FF7626] font-semibold hover:underline">
                            Sign Up
                        </Link>
                    </p> */}
                </div>
            </div>
        </>
    );
}