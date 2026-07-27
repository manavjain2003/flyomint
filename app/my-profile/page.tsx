// app/my-profile/page.tsx

"use client";

import { useState } from "react";
import { HiOutlineUser } from "react-icons/hi2";
import AccountSidebar from "@/app/components/booking/AccountSidebar";

type ProfileTab = "personal" | "security";

const TABS: { key: ProfileTab; label: string }[] = [
    { key: "personal", label: "Personal info" },
    { key: "security", label: "Security" },
];

export default function MyProfilePage() {
    const [activeTab, setActiveTab] = useState<ProfileTab>("personal");

    const [fullName, setFullName] = useState("Manav");
    const [email] = useState("manav@gmail.com");
    const [countryCode, setCountryCode] = useState("+91");
    const [mobile, setMobile] = useState("9876543210");

    const handleSave = () => {
        console.log({ fullName, countryCode, mobile });
    };

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
                                <div className="p-6">
                                    {/* Avatar + name row */}
                                    <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
                                        <span className="grid place-items-center w-14 h-14 rounded-full bg-[#0284c7] text-white text-xl font-semibold shrink-0">
                                            {fullName.charAt(0).toUpperCase() || "?"}
                                        </span>
                                        <div>
                                            <p className="text-base font-semibold text-gray-900">{fullName}</p>
                                            <p className="text-sm text-gray-500">{email}</p>
                                        </div>
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
                                                disabled
                                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                                            />
                                            <p className="mt-2 text-xs text-gray-400">
                                                Contact support to change your email.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                                Mobile number
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={countryCode}
                                                    onChange={(e) => setCountryCode(e.target.value)}
                                                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]"
                                                >
                                                    <option value="+91">+91</option>
                                                    <option value="+1">+1</option>
                                                    <option value="+44">+44</option>
                                                </select>
                                                <input
                                                    type="tel"
                                                    value={mobile}
                                                    onChange={(e) => setMobile(e.target.value)}
                                                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]"
                                                />
                                            </div>
                                            <p className="mt-2 text-xs text-gray-400">
                                                Used for booking confirmations and OTPs.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-8 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            className="px-5 py-2.5 rounded-xl bg-[#0284c7] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-colors"
                                        >
                                            Save changes
                                        </button>
                                    </div>
                                </div>
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