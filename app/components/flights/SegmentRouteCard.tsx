"use client";

import { HiOutlineChevronRight } from "react-icons/hi";
import { type Segment } from "@/app/components/flights/types";
import { formatTime } from "@/app/components/flights/utils";

export default function SegmentRouteCard({ seg }: { seg: Segment }) {
    const depTerminal = seg.DepartureTerminal?.replace("Terminal ", "");
    const arrTerminal = seg.ArrivalTerminal?.replace("Terminal ", "");

    return (
        <div className="py-3">
            <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-[#FF7626]" />
                    {seg.DepartureAirportCode} <HiOutlineChevronRight className="w-3 h-3 text-gray-400" /> {seg.ArrivalAirportCode}
                </span>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {seg.AirlineName} &bull; {seg.AirlineCode}-{seg.FlightNo}
                </span>
            </div>

            <div className="flex items-center justify-between pl-1">
                <div>
                    <p className="text-lg font-bold text-gray-900 leading-tight">{formatTime(seg.DepartureTime)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(seg.DepartureTime).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                        })}
                    </p>
                    <p className="text-xs text-gray-400">
                        {depTerminal && `${depTerminal}, `}
                        {seg.DepartureAirportName ?? seg.DepartureAirportCode}
                    </p>
                </div>

                <div className="flex-1 flex flex-col items-center text-gray-400 px-4">
                    <span className="text-[11px] mb-1">{seg.Duration}</span>
                    <span className="w-full border-t border-dashed border-gray-300" />
                </div>

                <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 leading-tight">{formatTime(seg.ArrivalTime)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(seg.ArrivalTime).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                        })}
                    </p>
                    <p className="text-xs text-gray-400">
                        {arrTerminal && `${arrTerminal}, `}
                        {seg.ArrivalAirportName ?? seg.ArrivalAirportCode}
                    </p>
                </div>
            </div>
        </div>
    );
}