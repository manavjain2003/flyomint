"use client";

import { useEffect, useState } from "react";
import { HiOutlineDocumentText } from "react-icons/hi2";

export type GSTDetails = {
    wantsGst: boolean;
    gstNumber: string;
    companyName: string;
    email: string;
    address: string;
};

const EMPTY_GST: GSTDetails = {
    wantsGst: false,
    gstNumber: "",
    companyName: "",
    email: "",
    address: "",
};

// Standard 15-char Indian GSTIN format: 2 digit state code, 10 char PAN,
// 1 entity code, 1 'Z' by default, 1 checksum char (alphanumeric).
const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidGstNumber(gstNumber: string): boolean {
    return GST_REGEX.test(gstNumber.trim().toUpperCase());
}

export function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email.trim());
}

export function gstFormIsValid(details: GSTDetails, mandatory: boolean): boolean {
    const shouldValidate = mandatory || details.wantsGst;
    if (!shouldValidate) return true;

    return Boolean(
        details.gstNumber.trim() &&
            isValidGstNumber(details.gstNumber) &&
            details.companyName.trim() &&
            details.email.trim() &&
            isValidEmail(details.email)
    );
}

export type GSTDetailsFormProps = {
    mandatory: boolean;
    onChange: (details: GSTDetails) => void;
};

export default function GSTDetailsForm({ mandatory, onChange }: GSTDetailsFormProps) {
    const [details, setDetails] = useState<GSTDetails>({ ...EMPTY_GST, wantsGst: mandatory });
    const [touched, setTouched] = useState<{ gstNumber?: boolean; email?: boolean }>({});

    useEffect(() => {
        onChange(details);
    }, [details]);

    const expanded = mandatory || details.wantsGst;

    const gstTrimmed = details.gstNumber.trim();
    const emailTrimmed = details.email.trim();

    const gstError =
        touched.gstNumber && gstTrimmed.length > 0 && !isValidGstNumber(details.gstNumber)
            ? "Enter a valid 15-character GSTIN"
            : touched.gstNumber && gstTrimmed.length === 0 && expanded
            ? "GST number is required"
            : null;

    const emailError =
        touched.email && emailTrimmed.length > 0 && !isValidEmail(details.email)
            ? "Enter a valid email address"
            : touched.email && emailTrimmed.length === 0 && expanded
            ? "Email is required"
            : null;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="grid place-items-center w-8 h-8 rounded-full bg-[#e8f4fb] text-[#1c8fc7] shrink-0">
                        <HiOutlineDocumentText className="w-4 h-4" />
                    </span>
                    <h3 className="text-base font-bold text-gray-900">GST Details{mandatory ? " *" : " (Optional)"}</h3>
                </div>

                {!mandatory && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={details.wantsGst}
                            onChange={(e) => setDetails((d) => ({ ...d, wantsGst: e.target.checked }))}
                            className="accent-[#1c8fc7]"
                        />
                        Claim GST invoice
                    </label>
                )}
            </div>

            {expanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                            GST Number *
                        </label>
                        <input
                            value={details.gstNumber}
                            maxLength={15}
                            onChange={(e) => setDetails((d) => ({ ...d, gstNumber: e.target.value.toUpperCase() }))}
                            onBlur={() => setTouched((t) => ({ ...t, gstNumber: true }))}
                            className={`w-full h-10 rounded-lg border px-3 text-sm text-gray-900 uppercase outline-none focus:border-[#1c8fc7] ${
                                gstError ? "border-red-400" : "border-gray-200"
                            }`}
                        />
                        {gstError && <p className="text-[11px] text-red-500 mt-1">{gstError}</p>}
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                            Company Name *
                        </label>
                        <input
                            value={details.companyName}
                            onChange={(e) => setDetails((d) => ({ ...d, companyName: e.target.value }))}
                            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-[#1c8fc7]"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={details.email}
                            onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                            className={`w-full h-10 rounded-lg border px-3 text-sm text-gray-900 outline-none focus:border-[#1c8fc7] ${
                                emailError ? "border-red-400" : "border-gray-200"
                            }`}
                        />
                        {emailError && <p className="text-[11px] text-red-500 mt-1">{emailError}</p>}
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                            Registered Address
                        </label>
                        <input
                            value={details.address}
                            onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))}
                            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-[#1c8fc7]"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}