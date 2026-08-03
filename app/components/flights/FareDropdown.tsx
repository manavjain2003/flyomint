"use client";

import { useState } from "react";
import { HiOutlineChevronUp, HiOutlineChevronDown, HiCheck } from "react-icons/hi";
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
    showBookButton = true,
    selectedIndex = null,
}: {
    fares: FareInfo[];
    /** idx is the fare's position in the sorted `fares` array — used by the caller to remember which fare was picked */
    onBook: (fare: FareInfo, idx: number) => void;
    journey?: Journey;
    travelerCounts?: TravelerCounts;
    tokenId?: string;
    showBookButton?: boolean;
    /** when showBookButton is false, marks this row as "Selected" and highlights it */
    selectedIndex?: number | null;
}) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    return (
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_minmax(140px,auto)] gap-3 px-5 py-3 bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                <span>Fare Type</span>
                <span>Cabin</span>
                <span>Checkin</span>
                <span />
            </div>
            <div className="divide-y divide-gray-100">
{fares.map((f, idx) => {
    const { gross, net } = getDisplayFareValues(f);
    const isGrossType = f.FareDisplayType === "G" || f.FareDisplayType === "P";
    const displayAmount = isGrossType ? gross : net;
    const discount = !isGrossType && gross > net ? gross - net : 0;
    const bag = f.Baggage?.find((b) => b.PTC === "A") ?? f.Baggage?.[0];
                    const isExpanded = expandedIdx === idx;
                    const isRowSelected = !showBookButton && selectedIndex === idx;

                    return (
                        <div key={f.ConId || f.Index || idx}>
                            <div
                                onClick={!showBookButton ? () => onBook(f, idx) : undefined}
                              className={`grid grid-cols-[1.2fr_0.9fr_0.9fr_minmax(140px,auto)] gap-3 items-start px-5 py-4 transition-colors ${
    !showBookButton ? "cursor-pointer hover:bg-gray-50" : ""
} ${isRowSelected ? "bg-[#e8f4fb] shadow-[inset_3px_0_0_0_#1c8fc7]" : ""}`}
                            >
                                <div>
                                    <p className="text-base font-semibold text-gray-800 leading-snug break-words">
                                        {f.FareType}
                                    </p>
                                   {isRowSelected && (
    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-[#1c8fc7] text-white text-[10px] font-bold uppercase tracking-wider">
        <HiCheck className="w-3 h-3" /> Selected
    </span>
)}
                                </div>

                                <p className="text-sm text-gray-600 leading-snug break-words">
                                    {formatBaggageText(bag?.CabinBag)}
                                </p>

                                <p
                                    className={`text-sm leading-snug break-words ${
                                        bag?.CheckinBaggage ? "text-gray-600" : "text-red-400"
                                    }`}
                                >
                                    {bag?.CheckinBaggage ? formatBaggageText(bag.CheckinBaggage) : "NA"}
                                </p>

                                <div className="flex flex-col items-end gap-1.5">
                                      <div className="text-right">
        {discount > 0 && (
            <p className="text-xs font-semibold text-green-600 whitespace-nowrap">
                Extra {formatPrice(discount)} Off
            </p>
        )}
        <p className="text-lg font-bold text-gray-900 leading-tight whitespace-nowrap">
            {formatPrice(displayAmount)}
        </p>
    </div>

                                    {showBookButton && (
                                        <button
                                            type="button"
                                            onClick={() => onBook(f, idx)}
                                            className="w-full h-9 px-5 rounded-full bg-[#FF7626] text-white text-sm font-semibold hover:bg-[#e6661a] whitespace-nowrap"
                                        >
                                            Book
                                        </button>
                                    )}
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
    showBookButton = true,
    selectedIndex = null,
}: {
    fares: FareInfo[];
    onBook: (fare: FareInfo, idx: number) => void;
    onLockPrice?: (fare: FareInfo) => void;
    onViewDetails?: (fare: FareInfo) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hidePanel?: boolean;
    showBookButton?: boolean;
    selectedIndex?: number | null;
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
                    <FareDropdownPanel
                        fares={fares}
                        onBook={onBook}
                        showBookButton={showBookButton}
                        selectedIndex={selectedIndex}
                    />
                </div>
            )}
        </div>
    );
}