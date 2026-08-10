"use client";

import { HiOutlinePaperAirplane } from "react-icons/hi2";
import { type Segment } from "@/app/components/flights/types";
import AirlineLogo from "./AirlineLogo";

/** Formats an ISO datetime into e.g. "Fri, 21 Aug". */
function formatDateLabel(iso?: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" });
}

/** Formats an ISO datetime into e.g. "10:40". */
function formatTimeLabel(iso?: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function SegmentRouteCard({ seg }: { seg: Segment }) {
    const depCity = (seg as unknown as { DepartureCityName?: string }).DepartureCityName;
    const arrCity = (seg as unknown as { ArrivalCityName?: string }).ArrivalCityName;

    return (
        <div className="py-4">
            {/* Airline header */}
            <div className="flex items-center gap-2.5 mb-4">
                <AirlineLogo seg={seg} code={seg.AirlineCode} className="w-7 h-7" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {seg.AirlineName}
                    <span className="text-gray-400 dark:text-gray-500 font-normal"> | {seg.AirlineCode} {seg.FlightNo}</span>
                </p>
            </div>

            {/* Route */}
            <div className="flex items-start gap-4">
                {/* Departure */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{formatDateLabel(seg.DepartureTime)}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{formatTimeLabel(seg.DepartureTime)}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                        {seg.DepartureAirportCode}
                        {depCity ? ` - ${depCity}` : ""}
                    </p>
                    {seg.DepartureAirportName && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug mt-0.5">{seg.DepartureAirportName}</p>
                    )}
                    {seg.DepartureTerminal && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{seg.DepartureTerminal}</p>
                    )}
                    {seg.DepartureNearBy && (
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-medium mt-0.5">Nearby airport</p>
                    )}
                </div>

                {/* Duration / dashed connector */}
                <div className="flex flex-col items-center pt-1 shrink-0 w-24 sm:w-32">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 whitespace-nowrap">{seg.Duration}</span>
                    <div className="w-full flex items-center">
                        <span className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600" />
                        <HiOutlinePaperAirplane className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 mx-1 rotate-90 shrink-0" />
                        <span className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600" />
                    </div>
                </div>

                {/* Arrival */}
                <div className="flex-1 min-w-0 text-right">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{formatDateLabel(seg.ArrivalTime)}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{formatTimeLabel(seg.ArrivalTime)}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                        {seg.ArrivalAirportCode}
                        {arrCity ? ` - ${arrCity}` : ""}
                    </p>
                    {seg.ArrivalAirportName && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug mt-0.5">{seg.ArrivalAirportName}</p>
                    )}
                    {seg.ArrivalTerminal && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{seg.ArrivalTerminal}</p>
                    )}
                    {seg.ArrivalNearBy && (
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-medium mt-0.5">Nearby airport</p>
                    )}
                </div>
            </div>
        </div>
    );
}