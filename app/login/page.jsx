"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaFacebookF } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { requestLoginOtp, verifyLoginOtp } from "@/app/lib/authApi";

const HARDCODED_MOBILE = "8800880088";
const OTP_LENGTH = 6;

export default function LoginPage() {
    const router = useRouter();

    const [step, setStep] = useState("mobile");
    const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
    const [userKey, setUserKey] = useState("");
    const [testOtp, setTestOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const inputRefs = useRef([]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        setInfo("");
        setLoading(true);

        const otpResult = await requestLoginOtp(HARDCODED_MOBILE);

        setLoading(false);

        if (!otpResult.success) {
            setError(otpResult.message);
            return;
        }

        if (!otpResult.userKey) {
            setError("OTP request succeeded but did not return a UserKey to verify with.");
            return;
        }

        setUserKey(otpResult.userKey);
        setTestOtp(otpResult.otp || "");
        setInfo(otpResult.message);
        setStep("otp");
    };

    const handleDigitChange = (index, value) => {
        const digit = value.replace(/[^0-9]/g, "").slice(-1);

        const next = [...otpDigits];
        next[index] = digit;
        setOtpDigits(next);

        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
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
    };

    const handlePaste = (e) => {
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
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        setInfo("");

        const otp = otpDigits.join("");

        if (otp.length !== OTP_LENGTH) {
            setError(`Please enter the complete ${OTP_LENGTH}-digit OTP.`);
            return;
        }

        setLoading(true);

        const loginResult = await verifyLoginOtp({
            mobile: HARDCODED_MOBILE,
            userKey,
            otp,
        });

        setLoading(false);

        if (loginResult.success) {
            sessionStorage.setItem("uniqueKey", loginResult.uniqueKey);
            setInfo("Login successful! Redirecting...");
            setTimeout(() => {
                router.push("/");
                router.refresh();
            }, 500);
        } else {
            setError(loginResult.message);
        }
    };

    const handleBack = () => {
        setStep("mobile");
        setOtpDigits(Array(OTP_LENGTH).fill(""));
        setUserKey("");
        setTestOtp("");
        setError("");
        setInfo("");
    };

    return (
        <div className="min-h-screen flex bg-white">
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center px-10 py-10">
                <div className="w-full max-w-md h-[calc(100vh-12rem)] bg-[#FF7626] rounded-[2.5rem] flex flex-col justify-between p-10">
                    <div className="flex-1 flex items-center justify-center">
                        <Image
                            src="/assets/login_illustration.png"
                            alt="Login illustration"
                            width={420}
                            height={420}
                            className="w-full h-auto max-w-xs object-contain"
                        />
                    </div>
                    <p className="text-white font-semibold text-lg leading-snug">
                        Book your flights with ease and convenience!
                    </p>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    <div className="flex items-center gap-2 mb-10">
                        <Image src="/assets/logo.jpg" alt="Flyomint" width={140} height={35} className="h-8 w-auto" />
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-500 text-sm mb-8">Log in to continue your journey</p>

                    {step === "mobile" && (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={HARDCODED_MOBILE}
                                readOnly
                                disabled
                                className="w-full h-[52px] px-5 rounded-full border border-gray-200 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none bg-gray-50 disabled:opacity-70"
                            />
                            <p className="text-xs text-gray-400 -mt-2 px-1">
                                Using test number {HARDCODED_MOBILE}
                            </p>

                            {error && (
                                <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
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
                            <div className="flex justify-between gap-2">
                                {otpDigits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleDigitChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className="w-12 h-14 text-center text-xl font-semibold rounded-2xl border border-gray-200 text-gray-900 outline-none focus:border-[#FF7626] focus:ring-2 focus:ring-[#FF7626]/20 transition-colors"
                                    />
                                ))}
                            </div>

                            {testOtp && (
                                <p className="text-xs text-gray-500 px-1">
                                    Test OTP: <span className="font-semibold text-gray-700">{testOtp}</span>
                                </p>
                            )}

                            {error && (
                                <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
                            )}
                            {info && (
                                <p className="text-green-600 text-sm bg-green-50 px-4 py-2.5 rounded-xl">{info}</p>
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
                                onClick={handleBack}
                                className="w-full h-[52px] rounded-full border border-gray-200 text-gray-700 font-semibold text-[15px] hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                        </form>
                    )}

                    <div className="relative my-7">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 bg-white text-xs text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 h-12 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <FcGoogle className="w-5 h-5" />
                            Google
                        </button>
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 h-12 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <FaFacebookF className="w-4 h-4 text-[#1877F2]" />
                            Facebook
                        </button>
                    </div>

                    <p className="mt-8 text-center text-sm text-gray-600">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-[#FF7626] font-semibold hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}