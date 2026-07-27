"use client";

import { useEffect, useRef, useState } from "react";
import { type JourneyPair, type TravelerCounts } from "./types";
import CombinedFlightCard from "./CombinedFlightCard";

const PAGE_SIZE = 6;

export default function CombinedJourneyList({
    fromCity,
    toCity,
    loading,
    error,
    pairs,
    expandedGroupId,
    setExpandedGroupId,
    onBookPair,
    travelerCounts,
    tokenId,
}: {
    fromCity: string;
    toCity: string;
    loading: boolean;
    error: string | null;
    pairs: JourneyPair[];
    expandedGroupId: string | null;
    setExpandedGroupId: (id: string | null) => void;
    onBookPair: (pair: JourneyPair) => void;
    travelerCounts?: TravelerCounts;
    tokenId?: string; 
}) {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [pairs]);

    useEffect(() => {
        const node = sentinelRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((v) => Math.min(v + PAGE_SIZE, pairs.length));
                }
            },
            { rootMargin: "300px 0px" }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [pairs.length]);

    const visiblePairs = pairs.slice(0, visibleCount);
    const hasMore = visibleCount < pairs.length;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold tracking-wide text-white bg-[#1c8fc7] rounded px-2 py-1 uppercase">
                        Combined Fare
                    </span>
                    <span className="text-sm text-gray-400">
                        ({loading && pairs.length === 0 ? "..." : pairs.length} Options)
                    </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                    {fromCity} <span className="text-gray-400">&harr;</span> {toCity}
                </p>
            </div>

            {error && <div className="px-5 py-6 text-sm text-red-600">{error}</div>}

            {!error && !loading && pairs.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-gray-400">
                    No combined fares found for this route, date, and filters.
                </div>
            )}

            {!error && loading && pairs.length === 0 && (
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/3 bg-gray-100 rounded" />
                                <div className="h-3 w-1/2 bg-gray-100 rounded" />
                            </div>
                            <div className="h-8 w-24 bg-gray-100 rounded-full shrink-0" />
                        </div>
                    ))}
                </div>
            )}

            {pairs.length > 0 && (
                <div className="flex flex-col gap-3 p-4">
                    {visiblePairs.map((pair, idx) => {
                        const pairKey = `${pair.onward.GroupId}-${pair.ret.GroupId}`;
                        return (
                            <CombinedFlightCard
                                key={pairKey + idx}
                                pair={pair}
                                isExpanded={pairKey === expandedGroupId}
                                onToggleExpand={() => setExpandedGroupId(pairKey === expandedGroupId ? null : pairKey)}
                                onBookPair={onBookPair}
                                travelerCounts={travelerCounts}
                                tokenId={tokenId}
                            />
                        );
                    })}

                    {hasMore && (
                        <div ref={sentinelRef} className="flex items-center justify-center py-4">
                            <span className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-[#1c8fc7] animate-spin" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}