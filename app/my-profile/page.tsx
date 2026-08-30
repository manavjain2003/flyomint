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

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [balance, setBalance] = useState<number | null>(null);

    const [emailStatus, setEmailStatus] = useState<FieldStatus>("idle");
    const [emailOtp, setEmailOtp] = useState("");
    const [emailVerificationCode, setEmailVerificationCode] = useState("");
    const [emailTestOtp, setEmailTestOtp] = useState("");
    const [emailBusy, setEmailBusy] = useState(false);
    const [emailMsg, setEmailMsg] = useState("");



    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState("");

    useEffect(() => {
        function handleLogin() {
            loadProfile();
        }
        function handleLogout() {
            setFullName("");
            setEmail("");
            setMobile("");
            setOriginalEmail("");
            setBalance(null);
            setEmailStatus("idle");
          
            setEmailOtp("");
            
            setEmailVerificationCode("");
            
            setEmailMsg("");
            
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
        setBalance(typeof res.balance === "number" ? res.balance : null);
    }

    useEffect(() => {
        loadProfile();
    }, []);

    function onEmailChange(value: string) {
        setEmail(value);
        setEmailStatus("idle");
        setEmailOtp("");
        setEmailVerificationCode("");
        setEmailMsg("");
        setEmailTestOtp("");
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





    const emailChanged = email !== originalEmail;


    async function handleSave() {
        setSaveError("");
        setSaveSuccess("");

        if (emailChanged && emailStatus !== "verified") {
            setSaveError("Please verify your new email before saving.");
            return;
        }
    
        setSaving(true);
        const res = await updateProfile({
            name: fullName,
            emailVerificationCode: emailChanged ? emailVerificationCode : "",
        });
        setSaving(false);

        if (!res.success) {
            setSaveError(res.message || "Could not save changes.");
            return;
        }

        setSaveSuccess(res.message || "Profile updated successfully.");
        setEmailStatus("idle");
        
        setEmailOtp("");
        await loadProfile();
    }
    if (!ready) return null;

    const notLoggedIn = loadError === "Not logged in." || (!loadingProfile && !fullName && !email && !mobile && loadError);

    if (notLoggedIn) {
        return (
            <div className="flex-1 bg-[#f5f8fb]">
                <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-3">
                        <span className="grid place-items-center w-9 h-9 rounded-full bg-[#FF7626]/10 shrink-0">
                            <HiOutlineUser className="w-5 h-5 text-[#FF7626]" />
                        </span>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My profile</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account, contact info and security</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        <aside className="w-full md:w-64 shrink-0">
                            <AccountSidebar />
                        </aside>

                        <div className="flex-1 min-w-0">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
                                <span className="grid place-items-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4">
                                    <HiOutlineUser className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                </span>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Please log in</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Log in to view and manage your profile, bookings, and wallet.
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
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
        <div className="flex-1 bg-dark dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-3">
                    <span className="grid place-items-center w-9 h-9 rounded-full bg-[#FF7626]/10 shrink-0">
                        <HiOutlineUser className="w-5 h-5 text-[#FF7626]" />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My profile</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account, contact info and security</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col md:flex-row gap-6">
                    <aside className="w-full md:w-64 shrink-0">
                        <AccountSidebar />
                    </aside>

                    <div className="flex-1 min-w-0">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`px-1 mr-8 py-4 text-sm font-medium border-b-2 transition-colors ${
                                            activeTab === tab.key
                                                ? "border-[#0f172a] text-gray-900 dark:text-gray-100"
                                                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeTab === "personal" ? (
                                loadingProfile ? (
                                    <div className="p-10 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                        <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin mr-2" />
                                        Loading your profile...
                                    </div>
                                ) : loadError ? (
                                    <div className="p-6">
                                        <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 px-4 py-2.5 rounded-xl">{loadError}</p>
                                        <button
                                            type="button"
                                            onClick={loadProfile}
                                            className="mt-4 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : (
                                <div className="p-6">
                                    {/* Avatar + name row */}
                                    <div className="flex items-center gap-3 pb-6 border-b border-gray-100 dark:border-gray-800">
                                        <span className="grid place-items-center w-14 h-14 rounded-full bg-[#0284c7] text-white text-xl font-semibold shrink-0">
                                            {fullName.charAt(0).toUpperCase() || "?"}
                                        </span>
                                        <div>
                                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{fullName || "—"}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{originalEmail || "No email on file"}</p>
                                        </div>
                                        {balance !== null && (
                                            <div className="ml-auto text-right">
                                                <p className="text-xs text-gray-400 dark:text-gray-500">Wallet balance</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{balance}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Form fields */}
                                    <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                                Full name
                                            </label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => onEmailChange(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]"
                                            />

                                            {/* ── EMAIL VERIFICATION UI ── */}
                                            {emailChanged && (
                                                <div className="mt-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-950 border border-orange-100 dark:border-orange-900">
                                                    {emailStatus === "idle" && (
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                                                    ⚠️ Email changed — verification required
                                                                </p>
                                                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
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
                                                            <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2">
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
                                                                    className="w-36 rounded-lg border border-orange-200 dark:border-orange-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7626]/20 focus:border-[#FF7626]"
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
                                                                <p className="mt-2 text-xs text-orange-500 dark:text-orange-400 font-mono bg-orange-100/50 dark:bg-orange-900/50 px-2 py-1 rounded inline-block">
                                                                    Test OTP: {emailTestOtp}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {emailStatus === "verified" && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                                                            <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                                                                New email verified! Click "Save changes" to apply.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {emailMsg && emailStatus !== "verified" && (
                                                        <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">{emailMsg}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                                Mobile number
                                            </label>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                value={mobile}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]"
                                                disabled
                                            />
                                            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                               Mobile number cannot be changed.
                                            </p>

                                        </div>
                                    </div>

                                    {saveError && (
                                        <p className="mt-6 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 px-4 py-2.5 rounded-xl">{saveError}</p>
                                    )}
                                    {saveSuccess && (
                                        <p className="mt-6 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-4 py-2.5 rounded-xl">{saveSuccess}</p>
                                    )}

                                    <div className="pt-8 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={saving || (emailChanged && emailStatus !== "verified") }
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
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
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