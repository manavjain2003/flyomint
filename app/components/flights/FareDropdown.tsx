"use client";

import { useState } from "react";
import { HiOutlineChevronUp, HiOutlineChevronDown } from "react-icons/hi";
import { type FareInfo, type Journey, type TravelerCounts } from "@/app/components/flights/types";
import { formatPrice, getDisplayFareValues } from "@/app/components/flights/utils";
import FareDetailsPanel from "@/app/components/flights/FareDetailsPanel";

function formatBaggageText(raw?: string | number | null): string {
    if (raw === undefined || raw === null || raw === "") return "-";
    const str = String(raw).trim();
    const hasUnit = /kg/i.test(str);
    return hasUnit ? `${str} per adult/child` : `${str} kg per adult/child`;
}

export function FareDropdownPanel({
    fares,
    onBook,
    journey,
    travelerCounts,
    tokenId,
}: {
    fares: FareInfo[];
    onBook: (fare: FareInfo) => void;
    journey?: Journey;
    travelerCounts?: TravelerCounts;
    tokenId?: string;
}) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    return (
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
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
                    const isExpanded = expandedIdx === idx;

                    return (
                        <div key={f.ConId || f.Index || idx}>
                            <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-4 items-center px-5 py-4">
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


                            {journey && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                        className="w-full flex items-center justify-between px-5 py-2.5 bg-[#FF7626] text-white"
                                    >
                                        <span className="flex items-center gap-2 text-xs font-semibold">
                                            {f.Refundable === "Y" && (
                                                <span className="bg-white/25 rounded-full px-2.5 py-0.5">Refundable</span>
                                            )}
                                            <span className="uppercase tracking-wide">{f.FareType}</span>
                                        </span>
                                        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
                                            {isExpanded ? "Hide Details" : "View Details"}
                                            {isExpanded ? (
                                                <HiOutlineChevronUp className="w-3.5 h-3.5" />
                                            ) : (
                                                <HiOutlineChevronDown className="w-3.5 h-3.5" />
                                            )}
                                        </span>
                                    </button>

                                    {isExpanded && (
                                        <FareDetailsPanel
                                            journey={journey}
                                            fare={f}
                                            travelerCounts={travelerCounts}
                                            tokenId={tokenId}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function FareDropdown({
    fares,
    onBook,
    onLockPrice,
    onViewDetails,
    open: openProp,
    onOpenChange,
    hidePanel = false,
}: {
    fares: FareInfo[];
    onBook: (fare: FareInfo) => void;
    onLockPrice?: (fare: FareInfo) => void;
    onViewDetails?: (fare: FareInfo) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hidePanel?: boolean;
}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = openProp !== undefined ? openProp : internalOpen;
    const setOpen = (next: boolean) => {
        if (onOpenChange) onOpenChange(next);
        else setInternalOpen(next);
    };

    return (
        <div className="w-full sm:w-auto">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="h-9 px-6 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border bg-white text-[#1c8fc7] border-[#1c8fc7] hover:bg-[#e8f4fb] inline-flex items-center gap-1.5"
            >
                {open ? "Hide Fares" : "View Fares"}
                {open ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
            </button>

            {!hidePanel && open && (
                <div className="mt-3">
                    <FareDropdownPanel fares={fares} onBook={onBook} />
                </div>
            )}
        </div>
    );
}