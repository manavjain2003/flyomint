"use client";

import { useState } from "react";
import { HiOutlineChevronUp, HiOutlineChevronDown, HiOutlineLockClosed } from "react-icons/hi";
import { HiChevronRight } from "react-icons/hi2";
import { type FareInfo } from "@/app/components/flights/types";
import { formatPrice, getDisplayFareValues } from "@/app/components/flights/utils";

function formatBaggageText(raw?: string | number | null): string {
    if (raw === undefined || raw === null || raw === "") return "-";
    const str = String(raw).trim();
    const hasUnit = /kg/i.test(str);
    return hasUnit ? `${str} per adult/child` : `${str} kg per adult/child`;
}

export default function FareDropdown({
    fares,
    onBook,
    onLockPrice,
    onViewDetails,
}: {
    fares: FareInfo[];
    onBook: (fare: FareInfo) => void;
    onLockPrice?: (fare: FareInfo) => void;
    onViewDetails?: (fare: FareInfo) => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="w-full sm:w-auto">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="h-9 px-6 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border bg-white text-[#1c8fc7] border-[#1c8fc7] hover:bg-[#e8f4fb] inline-flex items-center gap-1.5"
            >
                {open ? "Hide Fares" : "View Fares"}
                {open ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
            </button>

            {open && (
                <div className="mt-3 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                        <span>Fare Type</span>
                        <span>Cabin</span>
                        <span>Checkin</span>
                        <span />
                    </div>
                    <div className="divide-y divide-gray-100">
                        {fares.map((f, idx) => {
                            const { gross, net } = getDisplayFareValues(f);
                            const bag = f.Baggage?.find((b) => b.PTC === "A") ?? f.Baggage?.[0];
                            const discount = gross > net ? gross - net : 0;
                          

                            return (
                                <div
                                    key={f.ConId || f.Index || idx}
                                    className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-4 items-center px-5 py-4"
                                >
                                    <p className="text-base font-semibold text-gray-800 leading-tight">
                                        {f.FareType}
                                    </p>

                                    <p className="text-sm text-gray-600 whitespace-nowrap">
                                        {formatBaggageText(bag?.CabinBag)}
                                    </p>

                                    <p
                                        className={`text-sm whitespace-nowrap ${
                                            bag?.CheckinBaggage ? "text-gray-600" : "text-red-400"
                                        }`}
                                    >
                                        {bag?.CheckinBaggage ? formatBaggageText(bag.CheckinBaggage) : "NA"}
                                    </p>

                                    <div className="flex flex-col items-end gap-1.5 min-w-[180px]">
                                        <div className="text-right">
                                            {discount > 0 && (
                                                <p className="text-xs font-semibold text-green-600">
                                                    Extra {formatPrice(discount)} Off
                                                </p>
                                            )}
                                            <p className="text-lg font-bold text-gray-900 leading-tight">
                                                {formatPrice(net)}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => onBook(f)}
                                            className="w-full h-9 px-5 rounded-full bg-[#FF7626] text-white text-sm font-semibold hover:bg-[#e6661a] whitespace-nowrap"
                                        >
                                            Book
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}