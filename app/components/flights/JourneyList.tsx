"use client";

import { useEffect, useRef, useState } from "react";
import { type Journey, type FareInfo, type TravelerCounts } from "@/app/components/flights/types";
import FlightCard from "@/app/components/flights/FlightCard";

const PAGE_SIZE = 6;

export default function JourneyList({
    title,
    from,
    to,
    loading,
    error,
    journeys,
    selectedGroupId,
    expandedGroupId,
    setExpandedGroupId,
    onSelectFlight,
    onBookFare,
    directBooking = false,
    travelerCounts,
    tokenId, 
    searchType,
}: {
    title: string;
    from: string;
    to: string;
    loading: boolean;
    error: string | null;
    journeys: Journey[];
    selectedGroupId: string | null;
    expandedGroupId: string | null;
    setExpandedGroupId: (id: string | null) => void;
    onSelectFlight?: (journey: Journey, fare: FareInfo) => void;
    onBookFare?: (journey: Journey, fare: FareInfo) => void;
    directBooking?: boolean;
    travelerCounts?: TravelerCounts;
    tokenId?: string; 
    searchType?: string
}) {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [journeys]);

    useEffect(() => {
        const node = sentinelRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((v) => Math.min(v + PAGE_SIZE, journeys.length));
                }
            },
            { rootMargin: "300px 0px" }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [journeys.length]);

    const visibleJourneys = journeys.slice(0, visibleCount);
    const hasMore = visibleCount < journeys.length;

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold tracking-wide text-white bg-[#1c8fc7] rounded px-2 py-1 uppercase">
                        {title}
                    </span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                        ({loading && journeys.length === 0 ? "..." : journeys.length} Options)
                    </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {from} <span className="text-gray-400 dark:text-gray-500">&rarr;</span> {to}
                </p>
            </div>

            {error && <div className="px-5 py-6 text-sm text-red-600 dark:text-red-400">{error}</div>}

            {!error && !loading && journeys.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                    No flights found for this route, date, and filters.
                </div>
            )}

            {!error && loading && journeys.length === 0 && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/3 bg-gray-100 dark:bg-gray-800 rounded" />
                                <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 rounded" />
                            </div>
                            <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded-full shrink-0" />
                        </div>
                    ))}
                </div>
            )}

            {journeys.length > 0 && (
                <div className="flex flex-col gap-3 p-4">
                    {visibleJourneys.map((journey, idx) => (
                        <FlightCard
    key={journey.GroupId + idx}
    journey={journey}
    isSelected={journey.GroupId === selectedGroupId}
    isExpanded={journey.GroupId === expandedGroupId}
    onToggleExpand={() =>
        setExpandedGroupId(journey.GroupId === expandedGroupId ? null : journey.GroupId)
    }
    onSelectFlight={onSelectFlight}
    onBookFare={onBookFare}
    directBooking={directBooking}
    travelerCounts={travelerCounts}
    tokenId={tokenId}
    searchType={searchType}   
/>
                    ))}

                    {hasMore && (
                        <div ref={sentinelRef} className="flex items-center justify-center py-4">
                            <span className="h-5 w-5 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-[#1c8fc7] animate-spin" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}