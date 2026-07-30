"use client";

import { HiOutlineChevronRight } from "react-icons/hi";
import { type Journey, type FareInfo } from "@/app/components/flights/types";
import { formatTime, getDisplayFareValues, formatPrice } from "@/app/components/flights/utils";
import AirlineLogo from "@/app/components/flights/AirlineLogo";

export default function CombinedLegRow({
    label,
    journey,
    fares,
    selectedIdx,
    onSelectFare,
}: {
    label: string;
    journey: Journey;
    fares: FareInfo[];
    selectedIdx: number;
    onSelectFare: (idx: number) => void;
}) {
    const firstSeg = journey.Segments[0];
    const lastSeg = journey.Segments[journey.Segments.length - 1];
    const stopsLabel = journey.Stops === 0 ? "Non stop" : `${journey.Stops} stop${journey.Stops > 1 ? "s" : ""}`;

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
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#FF7626] bg-orange-50 rounded px-2 py-1 w-fit shrink-0">
                    {label}
                </span>

                <AirlineLogo seg={firstSeg} code={firstSeg?.AirlineCode} className="w-9 h-9" />

                <div className="min-w-[20px]">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{firstSeg?.AirlineName}</p>
                    <p className="text-xs text-gray-400 leading-tight">
                        {journey.Segments.map((s) => `${s.AirlineCode}-${s.FlightNo}`).join(", ")}
                    </p>
                </div>

                <div className="flex-1 flex items-center gap-4 min-w-0">
                    {/* Departure */}
                    <div className="text-left shrink-0">
                        <p className="text-xl font-bold text-gray-900 leading-tight">{formatTime(journey.DepartureDateTime)}</p>
                        <p className="text-xs text-gray-400">{firstSeg?.DepartureAirportCode}</p>
                        {journey.DepartureNearBy && (
                            <p className="text-[10px] text-red-600 font-medium leading-tight">Nearby airport</p>
                        )}
                    </div>

                    {/* Duration / Stops */}
                    <div className="flex-1 flex flex-col items-center text-gray-400 min-w-[80px]">
                        <span className="text-[11px] mb-0.5">{journey.Duration}</span>
                        <div className="w-full flex items-center">
                            <span className="flex-1 border-t border-gray-300" />
                            <span className="w-4 h-4 rounded-full bg-[#1c8fc7] text-white flex items-center justify-center shrink-0 mx-1">
                                <HiOutlineChevronRight className="w-2.5 h-2.5" />
                            </span>
                            <span className="flex-1 border-t border-gray-300" />
                        </div>
                        <span className="text-[11px] mt-0.5">{stopsLabel}</span>
                    </div>

                    {/* Arrival */}
                    <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-gray-900 leading-tight">{formatTime(journey.ArrivalDateTime)}</p>
                        <p className="text-xs text-gray-400">{lastSeg?.ArrivalAirportCode}</p>
                        {journey.ArrivalNearBy && (
                            <p className="text-[10px] text-red-600 font-medium leading-tight">Nearby airport</p>
                        )}
                    </div>
                </div>

                <span className="text-xs font-semibold text-gray-500 shrink-0">{fare.FareType}</span>
            </div>

            {fares.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-2 pl-0 sm:pl-[52px]">
                    {fares.map((f, idx) => {
                        const active = idx === selectedIdx;
                        const { net: fNet } = getDisplayFareValues(f);
                        return (
                            <button
                                key={f.ConId || f.Index || idx}
                                type="button"
                                onClick={() => onSelectFare(idx)}
                                className={`rounded-lg border px-2.5 py-1 text-left transition-colors ${active
                                    ? "bg-[#e8f4fb] border-[#1c8fc7]"
                                    : "bg-white border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <p
                                    className={`text-[10px] font-semibold uppercase tracking-wide leading-tight ${active ? "text-[#1c8fc7]" : "text-gray-600"
                                        }`}
                                >
                                    {f.FareType}
                                    {f.Refundable === "Y" && <span className="text-green-600"> &middot; Refundable</span>}
                                </p>
                                <p className={`text-xs font-bold leading-tight ${active ? "text-[#1c8fc7]" : "text-gray-900"}`}>
                                    {formatPrice(fNet)}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}