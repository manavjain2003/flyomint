"use client";

import { useState, useMemo } from "react";
import {
    HiOutlineChevronRight,
    HiOutlineChevronUp,
    HiOutlineChevronDown,
    HiCheck,
} from "react-icons/hi";
import { type Journey, type FareInfo, type TravelerCounts } from "@/app/components/flights/types";
import { primaryFareAmount, formatTime } from "@/app/components/flights/utils";
import AirlineLogo from "./AirlineLogo";
import FarePriceDisplay from "@/app/components/flights/FarePriceDisplay";
import FareDetailsPanel from "@/app/components/flights/FareDetailsPanel";
import FareDropdown, { FareDropdownPanel } from "@/app/components/flights/FareDropdown";
import { HiOutlineLocationMarker } from "react-icons/hi";


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
    searchType,     
}: {
    journey: Journey;
    isSelected: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onSelectFlight?: (journey: Journey, fare: FareInfo) => void;
    onBookFare?: (journey: Journey, fare: FareInfo) => void;
    directBooking?: boolean;
    tokenId?: string;
    searchType?: string;  
    travelerCounts?: TravelerCounts;
}) {
    const firstSeg = journey.Segments[0];
    const lastSeg = journey.Segments[journey.Segments.length - 1];
    const fares = useMemo(
        () => [...journey.FareInfo].sort((a, b) => primaryFareAmount(a) - primaryFareAmount(b)),
        [journey]
    );
    const [selectedFareIdx, setSelectedFareIdx] = useState(0);
    const [fareDropdownOpen, setFareDropdownOpen] = useState(false);
    const fare = fares[selectedFareIdx];
    const stopsLabel = journey.Stops === 0 ? "Non stop" : `${journey.Stops} stop${journey.Stops > 1 ? "s" : ""}`;
const stopAirports =
    journey.Stops > 0
        ? journey.Segments.slice(0, -1).map((s) => s.ArrivalAirportCode).join(", ")
        : "";
const flightCodes = useMemo(
    () => journey.Segments.map((s) => `${s.AirlineCode}-${s.FlightNo}`),
    [journey.Segments]
);
const [showAllCodes, setShowAllCodes] = useState(false);

    return (
       <div
           className={`relative rounded-2xl border border-[#FF7626] overflow-hidden bg-white dark:bg-gray-900 ${
                !directBooking ? "cursor-pointer" : ""
            }`}
            onClick={!directBooking ? () => fare && onSelectFlight?.(journey, fare) : undefined}
        >
            {/* SELECTED ribbon */}
            {isSelected && (
               <div
                    className="absolute top-0 left-0 bg-[#FF7626] text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-tl-2xl rounded-br-lg flex items-center gap-1 z-10"
                    onClick={(e) => e.stopPropagation()}
                >
                    <HiCheck className="w-3 h-3" /> Selected
                </div>
            )}

            {/* Main row */}
            <div
                onClick={!directBooking ? () => fare && onSelectFlight?.(journey, fare) : undefined}
               className={`px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 pt-9 ${
    !directBooking ? "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" : ""
}`}
             >
                <AirlineLogo seg={firstSeg} code={firstSeg?.AirlineCode} className="w-9 h-9 shrink-0" />

<div className="w-[100px] shrink-0">
   <p
  className="text-[18px] font-bold text-gray-900 dark:text-gray-100 leading-tight truncate"
  title={firstSeg?.AirlineName}
>
  {firstSeg?.AirlineName}
</p>
 <p className="text-[16px] text-gray-400 dark:text-gray-500 leading-tight break-words">
    {(() => {
        const codes = journey.Segments.map((s) => `${s.AirlineCode}-${s.FlightNo}`);
        if (codes.length <= 1) return codes[0] || "";
        if (codes.length === 2)
            return (
                <>
                    {codes[0]}
                    <br />
                    {codes[1]}
                </>
            );
        return <>{codes[0]}......</>;
    })()}
</p>
</div>

                <div className="flex-1 flex items-start gap-4 min-w-0">
                    {/* Departure */}
                    <div className="text-left shrink-0">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                            {formatTime(journey.DepartureDateTime)}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{firstSeg?.DepartureAirportCode}</p>
                       {journey.DepartureNearBy && (
    <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-semibold whitespace-nowrap">
        <HiOutlineLocationMarker className="w-3 h-3 shrink-0" />
        Nearby airport
    </span>
)}
                    </div>

                    {/* Duration / Stops */}
                    <div className="flex-1 flex flex-col items-center text-gray-400 dark:text-gray-500 min-w-[80px] mt-1.5">
                        <span className="text-[11px] mb-0.5 whitespace-nowrap shrink-0">{journey.Duration}</span>
                        <div className="w-full flex items-center">
                            <span className="flex-1 border-t border-gray-300 dark:border-gray-600" />
                            <span className="w-5 h-5 rounded-full bg-[#1c8fc7] text-white flex items-center justify-center shrink-0 mx-1">
                                <HiOutlineChevronRight className="w-3 h-3" />
                            </span>
                            <span className="flex-1 border-t border-gray-300 dark:border-gray-600" />
                        </div>
                         <span className="text-[11px] mt-0.5 whitespace-nowrap">
     {stopsLabel}
    {stopAirports ? ` · ${stopAirports}` : ""}
</span>
                    </div>

                    {/* Arrival */}
                    <div className="w-[70px] shrink-0 text-right">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                            {formatTime(journey.ArrivalDateTime)}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{lastSeg?.ArrivalAirportCode}</p>
                       {journey.ArrivalNearBy && (
    <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-semibold whitespace-nowrap">
        <HiOutlineLocationMarker className="w-3 h-3 shrink-0" />
        Nearby airport
    </span>
)}
                    </div>
                </div>

{fare && (
    <div className="min-w-[190px] shrink-0 flex flex-col items-end gap-1.5">
        <FarePriceDisplay fare={fare} size="lg" subtitle="per adult" />

        {directBooking && fares.length === 1 && (
            <button
                type="button"
                onClick={(e) => {
                                   e.stopPropagation();
                                    onBookFare?.(journey, fare);
                                }}
                className="h-9 px-5 rounded-full bg-[#FF7626] text-white text-sm font-semibold hover:bg-[#e6661a] whitespace-nowrap shrink-0"
            >
                Book
            </button>
        )}

{directBooking && fares.length > 1 && (
    <FareDropdown
        fares={fares}
        onBook={(f) => onBookFare?.(journey, f)}
        open={fareDropdownOpen}
        onOpenChange={setFareDropdownOpen}
        hidePanel
        journey={journey}
        travelerCounts={travelerCounts}
        tokenId={tokenId}
        searchType={searchType}
    />
)}

{!directBooking && fares.length > 1 && (
    <FareDropdown
        fares={fares}
        onBook={(f, idx) => {
            setSelectedFareIdx(idx);
            onSelectFlight?.(journey, f);
        }}
        open={fareDropdownOpen}
        onOpenChange={setFareDropdownOpen}
        hidePanel
        showBookButton={false}
        selectedIndex={selectedFareIdx}
        journey={journey}
        travelerCounts={travelerCounts}
        tokenId={tokenId}
        searchType={searchType}
    />
)}
    </div>
)}
            </div>

    {fares.length > 1 && fareDropdownOpen && (
    <div className="px-4 sm:px-5 pb-4">
        <FareDropdownPanel
            fares={fares}
            onBook={(f, idx) => {
                if (directBooking) {
                    onBookFare?.(journey, f);
                } else {
                    setSelectedFareIdx(idx);
                    onSelectFlight?.(journey, f);
                }
            }}
            journey={journey}
            travelerCounts={travelerCounts}
            tokenId={tokenId}
            searchType={searchType}
            showBookButton={directBooking}
            selectedIndex={directBooking ? null : selectedFareIdx}
        />
    </div>
)}

            {/* Orange fare bar */}
            {fare && !fareDropdownOpen && (
                <button
                    type="button"
                    onClick={onToggleExpand}
                    className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 bg-[#FF7626] text-white"
                >
                    <span className="flex items-center gap-2 text-xs font-semibold">
                        {fare.Refundable === "Y" && (
                            <span className="bg-white/25 dark:bg-gray-900/25 rounded-full px-2.5 py-0.5">Refundable</span>
                        )}
                        <span className="uppercase tracking-wide">{fare.FareType}</span>
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
            )}

{isExpanded && fare && !fareDropdownOpen && (
    <FareDetailsPanel
        legs={[{ journey, fare }]}
        travelerCounts={travelerCounts}
        tokenId={tokenId}
        searchType={searchType}
    />
)}
        </div>
    );
}