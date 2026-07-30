"use client";

import { useEffect, useState } from "react";
import { HiOutlineUser } from "react-icons/hi2";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import AccountSidebar from "@/app/components/booking/AccountSidebar";
import {
    getUserProfile,
    requestProfileOtp,
    verifyProfileOtp,
    updateProfile,
} from "@/app/lib/authApi";
import { useRequireAuth } from "@/app/lib/useRequireAuth";

type ProfileTab = "personal" | "security";
type FieldStatus = "idle" | "otp-sent" | "verified";

const TABS: { key: ProfileTab; label: string }[] = [
    { key: "personal", label: "Personal info" },
    { key: "security", label: "Security" },
];

export default function MyProfilePage() {
    const ready = useRequireAuth();
    const [activeTab, setActiveTab] = useState<ProfileTab>("personal");

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [originalEmail, setOriginalEmail] = useState("");
    const [originalMobile, setOriginalMobile] = useState("");

    // Editable form state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [balance, setBalance] = useState<number | null>(null);

    // Email verification flow
    const [emailStatus, setEmailStatus] = useState<FieldStatus>("idle");
    const [emailOtp, setEmailOtp] = useState("");
    const [emailVerificationCode, setEmailVerificationCode] = useState("");
    const [emailTestOtp, setEmailTestOtp] = useState("");
    const [emailBusy, setEmailBusy] = useState(false);
    const [emailMsg, setEmailMsg] = useState("");

    // Mobile verification flow
    const [mobileStatus, setMobileStatus] = useState<FieldStatus>("idle");
    const [mobileOtp, setMobileOtp] = useState("");
    const [mobileVerificationCode, setMobileVerificationCode] = useState("");
    const [mobileTestOtp, setMobileTestOtp] = useState("");
    const [mobileBusy, setMobileBusy] = useState(false);
    const [mobileMsg, setMobileMsg] = useState("");

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState("");

    // Listen for login/logout events from sidebar
    useEffect(() => {
        function handleLogin() {
            loadProfile();
        }
        function handleLogout() {
            // Reset all state to show login prompt
            setFullName("");
            setEmail("");
            setMobile("");
            setOriginalEmail("");
            setOriginalMobile("");
            setBalance(null);
            setEmailStatus("idle");
            setMobileStatus("idle");
            setEmailOtp("");
            setMobileOtp("");
            setEmailVerificationCode("");
            setMobileVerificationCode("");
            setEmailMsg("");
            setMobileMsg("");
            setSaveError("");
            setSaveSuccess("");
            setLoadError("");
            setLoadingProfile(false);
        }
        window.addEventListener("flyomint:login", handleLogin);
        window.addEventListener("flyomint:logout", handleLogout);
        return () => {
            window.removeEventListener("flyomint:login", handleLogin);
            window.removeEventListener("flyomint:logout", handleLogout);
        };
    }, []);

    async function loadProfile() {
        setLoadingProfile(true);
        setLoadError("");
        const res = await getUserProfile();
        setLoadingProfile(false);

        if (!res.success) {
            setLoadError(res.message || "Could not load your profile.");
            return;
        }

        setFullName(res.name || "");
        setEmail(res.email || "");
        setMobile(res.mobile || "");
        setOriginalEmail(res.email || "");
        setOriginalMobile(res.mobile || "");
        setBalance(typeof res.balance === "number" ? res.balance : null);
    }

    useEffect(() => {
        loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function onEmailChange(value: string) {
        setEmail(value);
        setEmailStatus("idle");
        setEmailOtp("");
        setEmailVerificationCode("");
        setEmailMsg("");
        setEmailTestOtp("");
    }

    function onMobileChange(value: string) {
        setMobile(value.replace(/\D/g, ""));
        setMobileStatus("idle");
        setMobileOtp("");
        setMobileVerificationCode("");
        setMobileMsg("");
        setMobileTestOtp("");
    }

    async function handleSendEmailOtp() {
        setEmailMsg("");
        setEmailBusy(true);
        const res = await requestProfileOtp({ email });
        setEmailBusy(false);

        if (!res.success) {
            setEmailMsg(res.message || "Could not send OTP.");
            return;
        }
        setEmailTestOtp(res.otp || "");
        setEmailMsg(res.message || "OTP sent to your new email.");
        setEmailStatus("otp-sent");
    }

    async function handleVerifyEmailOtp() {
        setEmailMsg("");
        if (!emailOtp) {
            setEmailMsg("Enter the OTP sent to your new email.");
            return;
        }
        setEmailBusy(true);
        const res = await verifyProfileOtp({ email, otp: emailOtp });
        setEmailBusy(false);

        if (!res.success || !res.verificationCode) {
            setEmailMsg(res.message || "Invalid or expired OTP.");
            return;
        }
        setEmailVerificationCode(res.verificationCode);
        setEmailStatus("verified");
        setEmailMsg("Email verified. Save changes to apply it.");
    }

    async function handleSendMobileOtp() {
        setMobileMsg("");
        if (!/^\d{10}$/.test(mobile)) {
            setMobileMsg("Enter a valid 10-digit mobile number.");
            return;
        }
        setMobileBusy(true);
        const res = await requestProfileOtp({ mobile });
        setMobileBusy(false);

        if (!res.success) {
            setMobileMsg(res.message || "Could not send OTP.");
            return;
        }
        setMobileTestOtp(res.otp || "");
        setMobileMsg(res.message || "OTP sent to your new mobile number.");
        setMobileStatus("otp-sent");
    }

    async function handleVerifyMobileOtp() {
        setMobileMsg("");
        if (!mobileOtp) {
            setMobileMsg("Enter the OTP sent to your new mobile number.");
            return;
        }
        setMobileBusy(true);
        const res = await verifyProfileOtp({ mobile, otp: mobileOtp });
        setMobileBusy(false);

        if (!res.success || !res.verificationCode) {
            setMobileMsg(res.message || "Invalid or expired OTP.");
            return;
        }
        setMobileVerificationCode(res.verificationCode);
        setMobileStatus("verified");
        setMobileMsg("Mobile number verified. Save changes to apply it.");
    }

    const emailChanged = email !== originalEmail;
    const mobileChanged = mobile !== originalMobile;

    async function handleSave() {
        setSaveError("");
        setSaveSuccess("");

        if (emailChanged && emailStatus !== "verified") {
            setSaveError("Please verify your new email before saving.");
            return;
        }
        if (mobileChanged && mobileStatus !== "verified") {
            setSaveError("Please verify your new mobile number before saving.");
            return;
        }

        setSaving(true);
        const res = await updateProfile({
            name: fullName,
            emailVerificationCode: emailChanged ? emailVerificationCode : "",
            mobileVerificationCode: mobileChanged ? mobileVerificationCode : "",
        });
        setSaving(false);

        if (!res.success) {
            setSaveError(res.message || "Could not save changes.");
            return;
        }

        setSaveSuccess(res.message || "Profile updated successfully.");
        setEmailStatus("idle");
        setMobileStatus("idle");
        setEmailOtp("");
        setMobileOtp("");
        await loadProfile();
    }
    if (!ready) return null;

    const notLoggedIn = loadError === "Not logged in." || (!loadingProfile && !fullName && !email && !mobile && loadError);

    if (notLoggedIn) {
        return (
            <div className="flex-1 bg-[#f5f8fb]">
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-3">
                        <span className="grid place-items-center w-9 h-9 rounded-full bg-[#FF7626]/10 shrink-0">
                            <HiOutlineUser className="w-5 h-5 text-[#FF7626]" />
                        </span>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">My profile</h1>
                            <p className="text-sm text-gray-500">Manage your account, contact info and security</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        <aside className="w-full md:w-64 shrink-0">
                            <AccountSidebar />
                        </aside>

                        <div className="flex-1 min-w-0">
                            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                                <span className="grid place-items-center w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4">
                                    <HiOutlineUser className="w-8 h-8 text-gray-400" />
                                </span>
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Please log in</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    Log in to view and manage your profile, bookings, and wallet.
                                </p>
                                <p className="text-xs text-gray-400">
                                    Use the login button in the sidebar to sign in.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#f5f8fb]">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-3">
                    <span className="grid place-items-center w-9 h-9 rounded-full bg-[#FF7626]/10 shrink-0">
                        <HiOutlineUser className="w-5 h-5 text-[#FF7626]" />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">My profile</h1>
                        <p className="text-sm text-gray-500">Manage your account, contact info and security</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col md:flex-row gap-6">
                    <aside className="w-full md:w-64 shrink-0">
                        <AccountSidebar />
                    </aside>

                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl border border-gray-200">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 px-6">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`px-1 mr-8 py-4 text-sm font-medium border-b-2 transition-colors ${
                                            activeTab === tab.key
                                                ? "border-[#0f172a] text-gray-900"
                                                : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeTab === "personal" ? (
                                loadingProfile ? (
                                    <div className="p-10 flex items-center justify-center text-gray-400">
                                        <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin mr-2" />
                                        Loading your profile...
                                    </div>
                                ) : loadError ? (
                                    <div className="p-6">
                                        <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{loadError}</p>
                                        <button
                                            type="button"
                                            onClick={loadProfile}
                                            className="mt-4 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : (
                                <div className="p-6">
                                    {/* Avatar + name row */}
                                    <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
                                        <span className="grid place-items-center w-14 h-14 rounded-full bg-[#0284c7] text-white text-xl font-semibold shrink-0">
                                            {fullName.charAt(0).toUpperCase() || "?"}
                                        </span>
                                        <div>
                                            <p className="text-base font-semibold text-gray-900">{fullName || "—"}</p>
                                            <p className="text-sm text-gray-500">{originalEmail || "No email on file"}</p>
                                        </div>
                                        {balance !== null && (
                                            <div className="ml-auto text-right">
                                                <p className="text-xs text-gray-400">Wallet balance</p>
                                                <p className="text-sm font-semibold text-gray-900">₹{balance}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Form fields */}
                                    <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                                Full name
                                            </label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => onEmailChange(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]"
                                            />

                                            {/* ── EMAIL VERIFICATION UI ── */}
                                            {emailChanged && (
                                                <div className="mt-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                                                    {emailStatus === "idle" && (
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-medium text-orange-700">
                                                                    ⚠️ Email changed — verification required
                                                                </p>
                                                                <p className="text-xs text-orange-600 mt-0.5">
                                                                    Click the button to receive an OTP on your new email.
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={handleSendEmailOtp}
                                                                disabled={emailBusy}
                                                                className="ml-3 shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#FF7626] text-white hover:bg-[#e56a1f] disabled:opacity-60 transition-colors"
                                                            >
                                                                {emailBusy ? (
                                                                    <span className="flex items-center gap-1">
                                                                        <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin" />
                                                                        Sending...
                                                                    </span>
                                                                ) : (
                                                                    "Send OTP"
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {emailStatus === "otp-sent" && (
                                                        <div>
                                                            <p className="text-xs font-medium text-orange-700 mb-2">
                                                                📧 Enter the OTP sent to <strong>{email}</strong>
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={emailOtp}
                                                                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                                                                    placeholder="6-digit OTP"
                                                                    maxLength={6}
                                                                    className="w-36 rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7626]/20 focus:border-[#FF7626]"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleVerifyEmailOtp}
                                                                    disabled={emailBusy}
                                                                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#FF7626] text-white hover:bg-[#e56a1f] disabled:opacity-60 transition-colors"
                                                                >
                                                                    {emailBusy ? (
                                                                        <span className="flex items-center gap-1">
                                                                            <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin" />
                                                                            Verifying...
                                                                        </span>
                                                                    ) : (
                                                                        "Verify OTP"
                                                                    )}
                                                                </button>
                                                            </div>
                                                            {emailTestOtp && (
                                                                <p className="mt-2 text-xs text-orange-500 font-mono bg-orange-100/50 px-2 py-1 rounded inline-block">
                                                                    Test OTP: {emailTestOtp}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {emailStatus === "verified" && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-green-600 text-lg">✓</span>
                                                            <p className="text-xs font-semibold text-green-700">
                                                                New email verified! Click "Save changes" to apply.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {emailMsg && emailStatus !== "verified" && (
                                                        <p className="mt-2 text-xs text-orange-600">{emailMsg}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                                Mobile number
                                            </label>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                value={mobile}
                                                onChange={(e) => onMobileChange(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]"
                                            />
                                            <p className="mt-2 text-xs text-gray-400">
                                                Used for booking confirmations and OTPs.
                                            </p>

                                            {/* ── MOBILE VERIFICATION UI ── */}
                                            {mobileChanged && (
                                                <div className="mt-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                                                    {mobileStatus === "idle" && (
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-medium text-orange-700">
                                                                    ⚠️ Mobile changed — verification required
                                                                </p>
                                                                <p className="text-xs text-orange-600 mt-0.5">
                                                                    Click the button to receive an OTP on your new mobile.
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={handleSendMobileOtp}
                                                                disabled={mobileBusy}
                                                                className="ml-3 shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#FF7626] text-white hover:bg-[#e56a1f] disabled:opacity-60 transition-colors"
                                                            >
                                                                {mobileBusy ? (
                                                                    <span className="flex items-center gap-1">
                                                                        <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin" />
                                                                        Sending...
                                                                    </span>
                                                                ) : (
                                                                    "Send OTP"
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {mobileStatus === "otp-sent" && (
                                                        <div>
                                                            <p className="text-xs font-medium text-orange-700 mb-2">
                                                                📱 Enter the OTP sent to <strong>{mobile}</strong>
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={mobileOtp}
                                                                    onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ""))}
                                                                    placeholder="6-digit OTP"
                                                                    maxLength={6}
                                                                    className="w-36 rounded-lg border border-orange-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7626]/20 focus:border-[#FF7626]"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleVerifyMobileOtp}
                                                                    disabled={mobileBusy}
                                                                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#FF7626] text-white hover:bg-[#e56a1f] disabled:opacity-60 transition-colors"
                                                                >
                                                                    {mobileBusy ? (
                                                                        <span className="flex items-center gap-1">
                                                                            <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin" />
                                                                            Verifying...
                                                                        </span>
                                                                    ) : (
                                                                        "Verify OTP"
                                                                    )
                                                                }
                                                                </button>
                                                            </div>
                                                            {mobileTestOtp && (
                                                                <p className="mt-2 text-xs text-orange-500 font-mono bg-orange-100/50 px-2 py-1 rounded inline-block">
                                                                    Test OTP: {mobileTestOtp}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {mobileStatus === "verified" && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-green-600 text-lg">✓</span>
                                                            <p className="text-xs font-semibold text-green-700">
                                                                New mobile verified! Click "Save changes" to apply.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {mobileMsg && mobileStatus !== "verified" && (
                                                        <p className="mt-2 text-xs text-orange-600">{mobileMsg}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {saveError && (
                                        <p className="mt-6 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{saveError}</p>
                                    )}
                                    {saveSuccess && (
                                        <p className="mt-6 text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-xl">{saveSuccess}</p>
                                    )}

                                    <div className="pt-8 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={saving || (emailChanged && emailStatus !== "verified") || (mobileChanged && mobileStatus !== "verified")}
                                            className="px-5 py-2.5 rounded-xl bg-[#0284c7] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-60 flex items-center gap-2"
                                        >
                                            {saving && <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />}
                                            Save changes
                                        </button>
                                    </div>
                                </div>
                                )
                            ) : (
                                <div className="p-6">
                                    {/* Security tab content placeholder */}
                                    <p className="text-sm text-gray-500">
                                        Password and security settings go here.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}