"use client";

import { HiOutlineChevronRight } from "react-icons/hi";
import { type Journey } from "@/app/components/flights/types";
import { formatTime } from "@/app/components/flights/utils";
import AirlineLogo from "@/app/components/flights/AirlineLogo";

export default function CombinedLegRow({
    label,
    journey,
}: {
    label: string;
    journey: Journey;
}) {
    const firstSeg = journey.Segments[0];
    const lastSeg = journey.Segments[journey.Segments.length - 1];
    const stopsLabel =
        journey.Stops === 0
            ? "Non stop"
            : `${journey.Stops} stop${journey.Stops > 1 ? "s" : ""}`;

    const stopAirports =
        journey.Stops > 0
            ? journey.Segments.slice(0, -1).map((s) => s.ArrivalAirportCode).join(", ")
            : "";

    return (
        <div className="py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                {label}
            </p>

            <div className="flex items-center gap-3 sm:gap-4">
                {/* Airline */}
                <div className="flex items-center gap-2.5 w-[130px] sm:w-[150px] shrink-0">
                    <AirlineLogo
                        seg={firstSeg}
                        code={firstSeg?.AirlineCode}
                        className="w-9 h-9 sm:w-10 sm:h-10 shrink-0"
                    />
                    <div className="min-w-0">
                        <p
                            className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate"
                            title={firstSeg?.AirlineName}
                        >
                            {firstSeg?.AirlineName}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                            {journey.Segments
                                .map((s) => `${s.AirlineCode}-${s.FlightNo}`)
                                .join(", ")}
                        </p>
                    </div>
                </div>

                {/* Departure */}
                <div className="w-[65px] sm:w-[75px] shrink-0">
                    <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                        {formatTime(journey.DepartureDateTime)}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        {firstSeg?.DepartureAirportCode}
                    </p>
                </div>

                {/* Duration / Stops */}
                <div className="flex-1 flex flex-col items-center text-gray-400 dark:text-gray-500 min-w-[80px]">
                    <span className="text-[11px] mb-0.5 whitespace-nowrap">
                        {journey.Duration}
                    </span>
                    <div className="w-full flex items-center">
                        <span className="flex-1 border-t border-gray-300 dark:border-gray-600" />
                        <span className="w-4 h-4 rounded-full bg-[#1c8fc7] text-white flex items-center justify-center shrink-0 mx-1.5">
                            <HiOutlineChevronRight className="w-2.5 h-2.5" />
                        </span>
                        <span className="flex-1 border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <span className="text-[11px] mt-0.5 whitespace-nowrap">
                        {stopsLabel}
                        {stopAirports ? ` · ${stopAirports}` : ""}
                    </span>
                </div>

                {/* Arrival */}
                <div className="w-[65px] sm:w-[75px] shrink-0 text-right">
                    <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                        {formatTime(journey.ArrivalDateTime)}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        {lastSeg?.ArrivalAirportCode}
                    </p>
                </div>
            </div>
        </div>
    );
}