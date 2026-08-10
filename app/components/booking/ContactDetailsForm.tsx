"use client";

import { useEffect, useState } from "react";
import { HiOutlinePhone } from "react-icons/hi2";

export type ContactDetails = {
    countryCode: string;
    mobile: string;
    email: string;
};

export type ContactDetailsFormProps = {
    initial?: Partial<ContactDetails>;
    fetchedName?: string;
    loading?: boolean;
    onChange: (contact: ContactDetails) => void;
};

const COUNTRY_CODES = [
    { code: "+91", label: "India (+91)" },
    { code: "+1", label: "USA/Canada (+1)" },
    { code: "+44", label: "United Kingdom (+44)" },
    { code: "+971", label: "UAE (+971)" },
    { code: "+65", label: "Singapore (+65)" },
    { code: "+61", label: "Australia (+61)" },
    { code: "+49", label: "Germany (+49)" },
    { code: "+33", label: "France (+33)" },
    { code: "+81", label: "Japan (+81)" },
    { code: "+86", label: "China (+86)" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{6,12}$/;

export function contactFormIsValid(contact: ContactDetails | null): boolean {
    if (!contact) return false;
    if (!contact.countryCode) return false;
    if (!MOBILE_REGEX.test(contact.mobile)) return false;
    if (!EMAIL_REGEX.test(contact.email)) return false;
    return true;
}

export default function ContactDetailsForm({
    initial,
    fetchedName,
    loading,
    onChange,
}: ContactDetailsFormProps) {
    const [countryCode, setCountryCode] = useState(initial?.countryCode || "+91");
    const [mobile, setMobile] = useState(initial?.mobile || "");
    const [email, setEmail] = useState(initial?.email || "");

    useEffect(() => {
        if (initial?.countryCode) setCountryCode(initial.countryCode);
        if (initial?.mobile) setMobile(initial.mobile);
        if (initial?.email) setEmail(initial.email);
    }, [initial?.countryCode, initial?.mobile, initial?.email]);

    useEffect(() => {
        onChange({ countryCode, mobile, email });
    }, [countryCode, mobile, email]);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="grid place-items-center w-8 h-8 rounded-full bg-[#e8f4fb] text-[#1c8fc7] shrink-0">
                        <HiOutlinePhone className="w-4 h-4" />
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Contact Details</h3>
                </div>
                {loading && <span className="text-xs text-gray-400 dark:text-gray-500">Fetching your details...</span>}
            </div>

            {fetchedName && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    Booking confirmation will be sent to{" "}
                    <span className="font-semibold text-gray-600 dark:text-gray-300">{fetchedName}</span>
                </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 mb-4">
                <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                        Country Code *
                    </label>
                    <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1c8fc7]/20 focus:border-[#1c8fc7]"
                    >
                        {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                        Mobile Number *
                    </label>
                    <input
                        type="tel"
                        inputMode="numeric"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                        placeholder="9876543210"
                        maxLength={12}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1c8fc7]/20 focus:border-[#1c8fc7]"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                    Email *
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1c8fc7]/20 focus:border-[#1c8fc7]"
                />
            </div>

            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
                Your e-ticket and booking updates will be sent to this email and mobile number.
            </p>
        </div>
    );
}