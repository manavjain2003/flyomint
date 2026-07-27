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

export function gstFormIsValid(details: GSTDetails, mandatory: boolean): boolean {
    if (mandatory) {
        return Boolean(details.gstNumber.trim() && details.companyName.trim() && details.email.trim());
    }
    if (!details.wantsGst) return true;
    return Boolean(details.gstNumber.trim() && details.companyName.trim() && details.email.trim());
}

export type GSTDetailsFormProps = {
    mandatory: boolean;
    onChange: (details: GSTDetails) => void;
};

export default function GSTDetailsForm({ mandatory, onChange }: GSTDetailsFormProps) {
    const [details, setDetails] = useState<GSTDetails>({ ...EMPTY_GST, wantsGst: mandatory });

    useEffect(() => {
        onChange(details);
    }, [details]);

    const expanded = mandatory || details.wantsGst;

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
                            onChange={(e) => setDetails((d) => ({ ...d, gstNumber: e.target.value.toUpperCase() }))}
                            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 uppercase outline-none focus:border-[#1c8fc7]"
                        />
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
                            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-[#1c8fc7]"
                        />
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