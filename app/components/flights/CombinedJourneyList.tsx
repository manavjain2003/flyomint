"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { type JourneyPair, type TravelerCounts } from "./types";
import CombinedFlightCard from "./CombinedFlightCard";
import { OFFSCREEN_SKIP_STYLE, useProgressiveList } from "./useProgressiveList";

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
    searchType
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
    searchType?: string;
}) {
    const { visible: visiblePairs, hasMore, sentinelRef } = useProgressiveList(pairs);

    const latest = useRef({ onBookPair, setExpandedGroupId, expandedGroupId });
    useEffect(() => {
        latest.current = { onBookPair, setExpandedGroupId, expandedGroupId };
    });
    const stableBookPair = useCallback((pair: JourneyPair) => latest.current.onBookPair(pair), []);
    const toggleExpand = useCallback((id: string) => {
        const c = latest.current;
        c.setExpandedGroupId(id === c.expandedGroupId ? null : id);
    }, []);
    const adults = travelerCounts?.adults;
    const kids = travelerCounts?.children;
    const infs = travelerCounts?.infants;
    const stableCounts = useMemo(
        () => (travelerCounts ? { adults, children: kids, infants: infs } as TravelerCounts : undefined),
        [adults, kids, infs]
    );

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold tracking-wide text-white bg-[#1c8fc7] rounded px-2 py-1 uppercase">
                        Combined Fare
                    </span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                        ({loading && pairs.length === 0 ? "..." : pairs.length} Options)
                    </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {fromCity} <span className="text-gray-400 dark:text-gray-500">&harr;</span> {toCity}
                </p>
            </div>

            {error && <div className="px-5 py-6 text-sm text-red-600 dark:text-red-400">{error}</div>}

            {!error && !loading && pairs.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                    No combined fares found for this route, date, and filters.
                </div>
            )}

            {!error && loading && pairs.length === 0 && (
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

            {pairs.length > 0 && (
                <div className="flex flex-col gap-3 p-4">
                    {visiblePairs.map((pair, idx) => {
                        const pairKey = `${pair.onward.GroupId}-${pair.ret.GroupId}`;
                        const isExpanded = pairKey === expandedGroupId;
                        return (
                            <div key={pairKey + idx} style={isExpanded ? undefined : OFFSCREEN_SKIP_STYLE}>
                                <CombinedFlightCard
                                    pair={pair}
                                    isExpanded={isExpanded}
                                    onToggleExpand={toggleExpand}
                                    onBookPair={stableBookPair}
                                    travelerCounts={stableCounts}
                                    tokenId={tokenId}
                                    searchType={searchType}
                                />
                            </div>
                        );
                    })}

                    {hasMore && (
                        <div ref={sentinelRef} aria-hidden className="h-px" />
                    )}
                </div>
            )}
        </div>
    );
}