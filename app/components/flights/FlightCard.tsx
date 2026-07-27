"use client";

import { useState, useMemo } from "react";
import {
    HiOutlineChevronRight,
    HiOutlineChevronUp,
    HiOutlineChevronDown,
    HiCheck,
} from "react-icons/hi";
import { type Journey, type FareInfo, type TravelerCounts } from "@/app/components/flights/types";
import { primaryFareAmount, formatTime, getDisplayFareValues, formatPrice } from "@/app/components/flights/utils";
import AirlineLogo from "./AirlineLogo";
import FarePriceDisplay from "@/app/components/flights/FarePriceDisplay";
import FareDetailsPanel from "@/app/components/flights/FareDetailsPanel";
import FareDropdown from "@/app/components/flights/FareDropdown";

export default function FlightCard({
    journey,
    isSelected,
    isExpanded,
    onToggleExpand,
    onSelectFlight,
    onBookFare,
    directBooking = false,
    travelerCounts,
    tokenId,
}: {
    journey: Journey;
    isSelected: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onSelectFlight?: (journey: Journey, fare: FareInfo) => void;
    onBookFare?: (journey: Journey, fare: FareInfo) => void;
    /** true for oneway / single-flight results — skips the Select+footer flow and books straight through */
    directBooking?: boolean;
    tokenId?: string;
    travelerCounts?: TravelerCounts;
}) {
    const firstSeg = journey.Segments[0];
    const lastSeg = journey.Segments[journey.Segments.length - 1];
    const fares = useMemo(
        () => [...journey.FareInfo].sort((a, b) => primaryFareAmount(a) - primaryFareAmount(b)),
        [journey]
    );
    const [selectedFareIdx, setSelectedFareIdx] = useState(0);
    const fare = fares[selectedFareIdx];
    const stopsLabel = journey.Stops === 0 ? "Non stop" : `${journey.Stops} stop${journey.Stops > 1 ? "s" : ""}`;
    const isDepartureNearby = Boolean(firstSeg?.DepartureNearBy);
    const isArrivalNearby = Boolean(lastSeg?.ArrivalNearBy);

    return (
        <div className="relative rounded-2xl border border-[#FF7626] overflow-hidden bg-white">
            {/* SELECTED ribbon */}
            {isSelected && (
                <div className="absolute top-0 left-0 bg-[#FF7626] text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-tl-2xl rounded-br-lg flex items-center gap-1 z-10">
                    <HiCheck className="w-3 h-3" /> Selected
                </div>
            )}

            {/* Main row */}
            <div className={`px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 ${isSelected ? "pt-9" : ""}`}>
                <AirlineLogo seg={firstSeg} code={firstSeg?.AirlineCode} className="w-9 h-9" />

                <div className="min-w-[20px]">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{firstSeg?.AirlineName}</p>
                    <p className="text-xs text-gray-400 leading-tight">
                        {journey.Segments.map((s) => `${s.AirlineCode}-${s.FlightNo}`).join(", ")}
                    </p>
                </div>

                <div className="flex-1 flex items-start gap-4 min-w-0">
                    <div className="text-left shrink-0">
                        <p className="text-xl font-bold text-gray-900 leading-tight">{formatTime(journey.DepartureDateTime)}</p>
                        {isDepartureNearby ? (
                            <>
                                <p className="text-xs text-red-600 font-semibold leading-tight">{journey.From}</p>
                                <p className="text-[10px] text-red-600 leading-tight">(Nearby airport)</p>
                            </>
                        ) : (
                            <p className="text-xs text-gray-400">{journey.From}</p>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col items-center text-gray-400 min-w-[80px] mt-1.5">
                        <span className="text-[11px] mb-0.5">{journey.Duration}</span>
                        <div className="w-full flex items-center">
                            <span className="flex-1 border-t border-gray-300" />
                            <span className="w-5 h-5 rounded-full bg-[#1c8fc7] text-white flex items-center justify-center shrink-0 mx-1">
                                <HiOutlineChevronRight className="w-3 h-3" />
                            </span>
                            <span className="flex-1 border-t border-gray-300" />
                        </div>
                        <span className="text-[11px] mt-0.5">{stopsLabel}</span>
                    </div>

                    <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-gray-900 leading-tight">{formatTime(journey.ArrivalDateTime)}</p>
                        {isArrivalNearby ? (
                            <>
                                <p className="text-xs text-red-600 font-semibold leading-tight">{journey.To}</p>
                                <p className="text-[10px] text-red-600 leading-tight">(Nearby airport)</p>
                            </>
                        ) : (
                            <p className="text-xs text-gray-400">{journey.To}</p>
                        )}
                    </div>
                </div>

                {fare && (
                    <div className="flex flex-col gap-2 sm:items-end sm:justify-end shrink-0 w-full sm:w-auto">
                        <div className="flex items-center gap-4">
                            <FarePriceDisplay fare={fare} size="lg" subtitle="per adult" />

                            {!directBooking && (
                                <button
                                    type="button"
                                    onClick={() => onSelectFlight?.(journey, fare)}
                                    className={`h-9 px-6 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${isSelected
                                        ? "bg-[#1c8fc7] text-white border-[#1c8fc7]"
                                        : "bg-white text-[#1c8fc7] border-[#1c8fc7] hover:bg-[#e8f4fb]"
                                        }`}
                                >
                                    {isSelected ? "Selected" : "Select"}
                                </button>
                            )}

                            {directBooking && fares.length === 1 && (
                                <button
                                    type="button"
                                    onClick={() => onBookFare?.(journey, fare)}
                                    className="h-9 px-6 rounded-full bg-[#FF7626] text-white text-sm font-semibold hover:bg-[#e6661a] whitespace-nowrap"
                                >
                                    Book
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {directBooking && fares.length > 1 && (
                <div className="px-4 sm:px-5 pb-4">
                    <FareDropdown fares={fares} onBook={(f) => onBookFare?.(journey, f)} />
                </div>
            )}

            {!directBooking && fares.length > 1 && (
                <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-2">
                    {fares.map((f, idx) => {
                        const active = idx === selectedFareIdx;
                        const { net: fNet } = getDisplayFareValues(f);
                        return (
                            <button
                                key={f.ConId || f.Index || idx}
                                type="button"
                                onClick={() => setSelectedFareIdx(idx)}
                                className={`rounded-xl border px-3 py-1.5 text-left transition-colors ${active
                                    ? "bg-[#e8f4fb] border-[#1c8fc7]"
                                    : "bg-white border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <p
                                    className={`text-[11px] font-semibold uppercase tracking-wide leading-tight ${active ? "text-[#1c8fc7]" : "text-gray-600"
                                        }`}
                                >
                                    {f.FareType}
                                    {f.Refundable === "Y" && <span className="text-green-600"> &middot; Refundable</span>}
                                </p>
                                <p className={`text-sm font-bold leading-tight ${active ? "text-[#1c8fc7]" : "text-gray-900"}`}>
                                    {formatPrice(fNet)}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Orange fare bar */}
            {fare && (
                <button
                    type="button"
                    onClick={onToggleExpand}
                    className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 bg-[#FF7626] text-white"
                >
                    <span className="flex items-center gap-2 text-xs font-semibold">
                        {fare.Refundable === "Y" && (
                            <span className="bg-white/25 rounded-full px-2.5 py-0.5">Refundable</span>
                        )}
                        <span className="uppercase tracking-wide">{fare.FareType}</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
                        {isExpanded ? "Hide Details" : "View Details"}
                        {isExpanded ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
                    </span>
                </button>
            )}

           {isExpanded && fare && (
    <FareDetailsPanel journey={journey} fare={fare} travelerCounts={travelerCounts} tokenId={tokenId} />
)}
        </div>
    );
}