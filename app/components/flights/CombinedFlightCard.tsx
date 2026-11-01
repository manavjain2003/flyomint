"use client";

import { useState, useMemo } from "react";
import { HiOutlineChevronUp, HiOutlineChevronDown } from "react-icons/hi";
import { type JourneyPair, type FareInfo, type TravelerCounts } from "./types";
import { formatPrice, resolveFareDisplay, hasFreeMeal } from "./utils";
import { HiOutlineGift } from "react-icons/hi";
import CombinedLegRow from "@/app/components/flights/CombinedLegRow";
import FareDetailsPanel from "@/app/components/flights/FareDetailsPanel";

export default function CombinedFlightCard({
    pair,
    isExpanded,
    onToggleExpand,
    onBookPair,
    travelerCounts,
    tokenId,
    searchType,
}: {
    pair: JourneyPair;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onBookPair: (pair: JourneyPair) => void;
    travelerCounts?: TravelerCounts;
    tokenId?: string;
    searchType?: string;
}) {
    const onwardFare = pair.onwardFare as FareInfo;
    const returnFare = pair.retFare as FareInfo;
    const onwardDisplay = resolveFareDisplay(onwardFare);
    const returnDisplay = resolveFareDisplay(returnFare);
    const totalFare = onwardDisplay.mainAmount + returnDisplay.mainAmount;
    const totalStrike =
        onwardDisplay.strikeAmount != null || returnDisplay.strikeAmount != null
            ? (onwardDisplay.strikeAmount ?? onwardDisplay.gross) +
              (returnDisplay.strikeAmount ?? returnDisplay.gross)
            : null;
    const combinedDiscount =
        (onwardDisplay.showOff || returnDisplay.showOff)
            ? (onwardDisplay.gross + returnDisplay.gross) - (onwardDisplay.net + returnDisplay.net)
            : 0;
    const showCombinedOff = combinedDiscount > 0;

    const onwardAirline = pair.onward.Segments[0]?.AirlineCode;
    const returnAirline = pair.ret.Segments[0]?.AirlineCode;
    const isSelfTransfer =
        onwardAirline && returnAirline && onwardAirline !== returnAirline;

    return (
        <div className="relative rounded-2xl border border-[#FF7626] overflow-hidden bg-white dark:bg-gray-900">
            <div className="flex flex-col lg:flex-row">
                <div className="flex-1 p-4 sm:p-5">
                    {(hasFreeMeal(onwardFare) || hasFreeMeal(returnFare)) && (
                       <span className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950 text-[#c2570f] dark:text-orange-300 text-[11px] font-semibold leading-none">
                           <HiOutlineGift className="w-3.5 h-3.5 shrink-0" />
                            Free Meal
                       </span>
                    )}
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        <CombinedLegRow label="Onward" journey={pair.onward} />
                        <CombinedLegRow label="Return" journey={pair.ret} />
                    </div>

                    {isSelfTransfer && (
                        <p className="pt-3 text-xs text-gray-500 dark:text-gray-400">
                            Self transfer required
                        </p>
                    )}
                </div>

                <div className="lg:w-[220px] shrink-0 p-4 sm:p-5 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 flex flex-col justify-center gap-4">
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                            Total fare, per adult
                        </p>
                        <p className="text-2xl font-bold text-[#1c8fc7]">
                            {formatPrice(totalFare)}
                        </p>
                        {totalStrike != null && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 line-through leading-tight">
                                {formatPrice(totalStrike)}
                            </p>
                        )}
                        {showCombinedOff && (
                            <span className="inline-block text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 rounded-full px-2 py-0.5 whitespace-nowrap mt-0.5">
                                Extra {formatPrice(combinedDiscount)} Off
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            onBookPair({
                                ...pair,
                                onwardFare: onwardFare as FareInfo,
                                retFare: returnFare as FareInfo,
                            })
                        }
                        className="w-full h-11 rounded-full text-sm font-semibold transition-colors bg-[#FF7626] text-white hover:bg-[#e6661a]"
                    >
                        Book Now
                    </button>
                </div>
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
                    {isExpanded ? (
                        <HiOutlineChevronUp className="w-3.5 h-3.5" />
                    ) : (
                        <HiOutlineChevronDown className="w-3.5 h-3.5" />
                    )}
                </span>
            </button>

            {isExpanded && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-800">
                    <FareDetailsPanel
                        legs={[
                            {
                                label: "Onward",
                                journey: pair.onward,
                                fare: onwardFare as FareInfo,
                            },
                            {
                                label: "Return",
                                journey: pair.ret,
                                fare: returnFare as FareInfo,
                            },
                        ]}
                        travelerCounts={travelerCounts}
                        tokenId={tokenId}
                        searchType={searchType}
                    />
                </div>
            )}
        </div>
    );
}