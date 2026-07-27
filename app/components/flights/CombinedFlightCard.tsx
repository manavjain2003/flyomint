"use client";

import { useState, useMemo } from "react";
import { HiOutlineChevronUp, HiOutlineChevronDown } from "react-icons/hi";
import { type JourneyPair, type FareInfo, type TravelerCounts } from "./types";
import { primaryFareAmount, formatPrice } from "./utils";
import CombinedLegRow from "@/app/components/flights/CombinedLegRow";
import FareDetailsPanel from "@/app/components/flights/FareDetailsPanel";

export default function CombinedFlightCard({
    pair,
    isExpanded,
    onToggleExpand,
    onBookPair,
    travelerCounts,
    tokenId,
}: {
    pair: JourneyPair;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onBookPair: (pair: JourneyPair) => void;
    travelerCounts?: TravelerCounts;
    tokenId?: string;
}) {
    const onwardFares = useMemo(
        () => [...(pair.onward.FareInfo ?? [])].sort((a, b) => primaryFareAmount(a) - primaryFareAmount(b)),
        [pair.onward]
    );
    const returnFares = useMemo(
        () => [...(pair.ret.FareInfo ?? [])].sort((a, b) => primaryFareAmount(a) - primaryFareAmount(b)),
        [pair.ret]
    );
    const [onwardFareIdx, setOnwardFareIdx] = useState(0);
    const [returnFareIdx, setReturnFareIdx] = useState(0);
    const onwardFare = onwardFares[onwardFareIdx] ?? { GrossFare: 0, NetFare: 0 };
    const returnFare = returnFares[returnFareIdx] ?? { GrossFare: 0, NetFare: 0 };
    const totalFare = primaryFareAmount(onwardFare as FareInfo) + primaryFareAmount(returnFare as FareInfo);
const ruleIndex = [onwardFare?.Index, returnFare?.Index].filter(Boolean) as string[];
    return (
        <div className="relative rounded-2xl border border-[#FF7626] overflow-hidden bg-white">
            <div className="divide-y divide-gray-100">
                <CombinedLegRow
                    label="Onward"
                    journey={pair.onward}
                    fares={onwardFares}
                    selectedIdx={onwardFareIdx}
                    onSelectFare={setOnwardFareIdx}
                />
                <CombinedLegRow
                    label="Return"
                    journey={pair.ret}
                    fares={returnFares}
                    selectedIdx={returnFareIdx}
                    onSelectFare={setReturnFareIdx}
                />
            </div>

            <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-gray-50">
                <div>
                    <p className="text-xl font-bold text-[#1c8fc7] whitespace-nowrap leading-tight">
                        {formatPrice(totalFare)}
                    </p>
                    <p className="text-[11px] text-gray-400">Total for both legs, per adult</p>
                </div>
                <button
                    type="button"
                    onClick={() =>
                        onBookPair({ ...pair, onwardFare: onwardFare as FareInfo, retFare: returnFare as FareInfo })
                    }
                    className="h-9 px-6 rounded-full text-sm font-semibold whitespace-nowrap transition-colors bg-[#FF7626] text-white hover:bg-[#e6661a]"
                >
                    Book Now
                </button>
            </div>

            <button
                type="button"
                onClick={onToggleExpand}
                className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 bg-[#FF7626] text-white"
            >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    Fare Details
                </span>
                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
                    {isExpanded ? "Hide Details" : "View Details"}
                    {isExpanded ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
                </span>
            </button>

                   {isExpanded && (
            <div className="divide-y divide-gray-100 border-t border-gray-100">
                <FareDetailsPanel
                    journey={pair.onward}
                    fare={onwardFare as FareInfo}
                    travelerCounts={travelerCounts}
                    tokenId={tokenId}
                    ruleIndex={ruleIndex}
                />
                <FareDetailsPanel
                    journey={pair.ret}
                    fare={returnFare as FareInfo}
                    travelerCounts={travelerCounts}
                    tokenId={tokenId}
                    ruleIndex={ruleIndex}
                />
            </div>
        )}
        </div>
    );
}