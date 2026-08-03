"use client";

import { useState } from "react";
import { HiOutlineChevronRight } from "react-icons/hi";
import { type Journey, type FareInfo, type TravelerCounts } from "@/app/components/flights/types";
import { formatTime } from "@/app/components/flights/utils";
import AirlineLogo from "@/app/components/flights/AirlineLogo";
import FareDropdown, { FareDropdownPanel } from "@/app/components/flights/FareDropdown";
import { HiOutlineLocationMarker } from "react-icons/hi";

export default function CombinedLegRow({
    label,
    journey,
    fares,
    selectedIdx,
    onSelectFare,
    travelerCounts,
    tokenId,
}: {
    label: string;
    journey: Journey;
    fares: FareInfo[];
    selectedIdx: number;
    onSelectFare: (idx: number) => void;
    travelerCounts?: TravelerCounts;
    tokenId?: string;
}) {
    const firstSeg = journey.Segments[0];
    const lastSeg = journey.Segments[journey.Segments.length - 1];
    const stopsLabel = journey.Stops === 0 ? "Non stop" : `${journey.Stops} stop${journey.Stops > 1 ? "s" : ""}`;
    const [fareDropdownOpen, setFareDropdownOpen] = useState(false);

    const fare = fares[selectedIdx] ?? {
        FareType: "Combined Fare",
        GrossFare: 0,
        NetFare: 0,
        Refundable: "N" as const,
        Seats: 0,
        ConId: "",
        Index: "",
    };

    return (
        <div className="px-4 sm:px-5 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Fixed-width label column so ONWARD/RETURN don't push things around */}
                <span className="w-[68px] shrink-0 text-center text-[10px] font-bold uppercase tracking-wide text-[#FF7626] bg-orange-50 rounded px-2 py-1">
                    {label}
                </span>

                <AirlineLogo seg={firstSeg} code={firstSeg?.AirlineCode} className="w-9 h-9 shrink-0" />

                {/* Fixed-width airline/flight-no column */}
                <div className="w-[140px] shrink-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight truncate" title={firstSeg?.AirlineName}>
                        {firstSeg?.AirlineName}
                    </p>
                    <p className="text-xs text-gray-400 leading-tight truncate">
                        {journey.Segments.map((s) => `${s.AirlineCode}-${s.FlightNo}`).join(", ")}
                    </p>
                </div>

                <div className="flex-1 flex items-center gap-4 min-w-0">
                    {/* Departure — fixed width */}
                    <div className="w-[70px] shrink-0 text-left">
                        <p className="text-xl font-bold text-gray-900 leading-tight">{formatTime(journey.DepartureDateTime)}</p>
                        <p className="text-sm text-gray-400">{firstSeg?.DepartureAirportCode}</p>
                        {journey.DepartureNearBy && (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold whitespace-nowrap">
                                <HiOutlineLocationMarker className="w-3 h-3 shrink-0" />
                                Nearby airport
                            </span>
                        )}
                    </div>

                    {/* Duration / Stops */}
                    <div className="flex-1 flex flex-col items-center text-gray-400 min-w-[80px]">
                        <span className="text-[11px] mb-0.5 whitespace-nowrap">{journey.Duration}</span>
                        <div className="w-full flex items-center">
                            <span className="flex-1 border-t border-gray-300" />
                            <span className="w-4 h-4 rounded-full bg-[#1c8fc7] text-white flex items-center justify-center shrink-0 mx-1">
                                <HiOutlineChevronRight className="w-2.5 h-2.5" />
                            </span>
                            <span className="flex-1 border-t border-gray-300" />
                        </div>
                        <span className="text-[11px] mt-0.5 whitespace-nowrap">{stopsLabel}</span>
                    </div>

                    {/* Arrival — fixed width */}
                    <div className="w-[70px] shrink-0 text-right">
                        <p className="text-xl font-bold text-gray-900 leading-tight">{formatTime(journey.ArrivalDateTime)}</p>
                        <p className="text-sm text-gray-400">{lastSeg?.ArrivalAirportCode}</p>
                        {journey.ArrivalNearBy && (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold whitespace-nowrap">
                                <HiOutlineLocationMarker className="w-3 h-3 shrink-0" />
                                Nearby airport
                            </span>
                        )}
                    </div>
                </div>

                {/* Fixed-width right column so the dropdown/fare-type lines up across every card */}
                <div className="w-[190px] shrink-0 flex flex-col items-end gap-1">
                    {fares.length > 1 ? (
                        <FareDropdown
                            fares={fares}
                            onBook={(f, idx) => onSelectFare(idx)}
                            open={fareDropdownOpen}
                            onOpenChange={setFareDropdownOpen}
                            hidePanel
                            showBookButton={false}
                            selectedIndex={selectedIdx}
                        />
                    ) : (
                        <span className="text-xs font-semibold text-gray-500">{fare.FareType}</span>
                    )}
                </div>
            </div>

            {fares.length > 1 && fareDropdownOpen && (
                <div className="mt-3">
                    <FareDropdownPanel
                        fares={fares}
                        onBook={(f, idx) => {
                            onSelectFare(idx);
                            setFareDropdownOpen(false);
                        }}
                        journey={journey}
                        travelerCounts={travelerCounts}
                        tokenId={tokenId}
                        showBookButton={true}
                        selectedIndex={null}
                    />
                </div>
            )}
        </div>
    );
}