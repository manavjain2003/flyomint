"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    HiOutlineCalendar,
    HiOutlineUserGroup,
    HiOutlineChevronRight,
    HiOutlineChevronLeft,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineTag,
    HiOutlinePencil,
} from "react-icons/hi";
import GoogleAdSlot from "../shared/GoogleAdSlot";
import { getAirlineToken, pollAvailability } from "@/app/lib/flightsapi";
import { DatePickerBrandStyles } from "../shared/DatePickerBrandStyles";
import {
    type Airport,
    type CabinClass,
    type TripType,
    type SpecialFare,
    type Journey,
    type FareInfo,
    type Trip,
    type JourneyPair,
    type Filters,
    type SearchCriteria,
    type TravelerCounts,
} from "@/app/components/flights/types";
import {
    CABIN_CODE,
    CABIN_LABEL,
    PROMOS,
    EMPTY_FILTERS,
    toApiDate,
    formatAirportCodeLabel,
    formatDayLabel,
    formatPrice,
    primaryFareAmount,
    cheapestFare,
    journeyPasses,
    pairPasses,
    toggleSetValue,
    totalFareForTravelers,
} from "@/app/components/flights/utils";
import ModifySearchPanel from "@/app/components/flights/ModifySearchPanel";
import FilterSidebar from "@/app/components/flights/FilterSidebar";
import JourneyList from "@/app/components/flights/JourneyList";
import CombinedJourneyList from "@/app/components/flights/CombinedJourneyList";

export type { CabinClass, TripType, SpecialFare, Journey, FareInfo };
export type FlightResultsProps = {
    from: string;
    to: string;
    fromCity?: string;
    toCity?: string;
    departureDate: Date;
    returnDate?: Date | null;
    tripType: TripType;
    fromAirport?: Airport | null;
    toAirport?: Airport | null;
    adults: number;
    children: number;
    infants: number;
    cabinClass: CabinClass;
    specialFare?: SpecialFare;
    directOnly?: boolean;
    onModifySearch?: (criteria: SearchCriteria, departureDate: Date, returnDate: Date | null) => void;
    onSelectFlight?: (journey: Journey, fare: FareInfo) => void;
    onReviewBooking?: (payload: {
        onward: { journey: Journey; fare: FareInfo } | null;
        ret: { journey: Journey; fare: FareInfo } | null;
        tokenId: string;
        bookingId: string;
        index: string[];
        searchType: string;
    }) => void;
};


function FlightSearchSkeleton({ fromLabel, toLabel }: { fromLabel: string; toLabel: string }) {
    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold tracking-wide text-white bg-[#1c8fc7] rounded px-2 py-1 uppercase">
                        Searching
                    </span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">...</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {fromLabel} <span className="text-gray-400 dark:text-gray-500">&harr;</span> {toLabel}
                </p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[1, 2, 3, 4].map((i) => (
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
        </div>
    );
}

export default function FlightResults({
    from: fromProp,
    to: toProp,
    fromCity: fromCityProp,
    toCity: toCityProp,
    fromAirport: fromAirportProp = null,
    toAirport: toAirportProp = null,
    departureDate: departureDateProp,
    returnDate: returnDateProp = null,
    tripType: tripTypeProp,
    adults: adultsProp,
    children: childrenProp,
    infants: infantsProp,
    cabinClass: cabinClassProp,
    specialFare: specialFareProp = "regular",
    directOnly: directOnlyProp = false,
    onModifySearch,
    onSelectFlight,
    onReviewBooking,
}: FlightResultsProps) {
    const [criteria, setCriteria] = useState<SearchCriteria>(() => ({
        from: fromProp,
        to: toProp,
        fromCity: fromCityProp || fromProp,
        toCity: toCityProp || toProp,
        fromAirport: fromAirportProp,
        toAirport: toAirportProp,
        tripType: tripTypeProp,
        adults: adultsProp,
        children: childrenProp,
        infants: infantsProp,
        cabinClass: cabinClassProp,
        directOnly: directOnlyProp,
        specialFare: specialFareProp,
    }));


    useEffect(() => {
        setCriteria((prev) => {
            if (prev.from !== fromProp || prev.to !== toProp) return prev;

            const resolvedFromCity = fromCityProp || prev.fromCity;
            const resolvedToCity = toCityProp || prev.toCity;
            const resolvedFromAirport = fromAirportProp ?? prev.fromAirport;
            const resolvedToAirport = toAirportProp ?? prev.toAirport;
const resolvedDirectOnly = directOnlyProp ?? prev.directOnly;

            const unchanged =
                resolvedFromCity === prev.fromCity &&
                resolvedToCity === prev.toCity &&
                resolvedFromAirport === prev.fromAirport &&
                       resolvedToAirport === prev.toAirport &&
        resolvedDirectOnly === prev.directOnly;

            if (unchanged) return prev;

            return {
                ...prev,
                fromCity: resolvedFromCity,
                toCity: resolvedToCity,
                fromAirport: resolvedFromAirport,
                toAirport: resolvedToAirport,
                directOnly: resolvedDirectOnly,

            };
        });
    }, [fromProp, toProp, fromCityProp, toCityProp, fromAirportProp, toAirportProp, directOnlyProp]);

    const { from, to, fromCity, toCity, tripType, adults, children, infants, cabinClass, directOnly } = criteria;
    const fromLabel = formatAirportCodeLabel(from, fromAirportProp?.CityName || fromCity);
    const toLabel = formatAirportCodeLabel(to, toAirportProp?.CityName || toCity);

    const [selectedDate, setSelectedDate] = useState<Date>(departureDateProp);
    const [returnDate, setReturnDate] = useState<Date | null>(returnDateProp);
    const [modifyOpen, setModifyOpen] = useState(false);
    const [searchTokenId, setSearchTokenId] = useState("");
    const [searchBookingId, setSearchBookingId] = useState("");
    const [combinedTokenId, setCombinedTokenId] = useState("");
    const [combinedBookingId, setCombinedBookingId] = useState("");
    const [selectionSource, setSelectionSource] = useState<"split" | "combined" | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [dateStripOffset, setDateStripOffset] = useState(0);

    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [priceTouched, setPriceTouched] = useState(false);
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

    const [selectedOnward, setSelectedOnward] = useState<{ journey: Journey; fare: FareInfo } | null>(null);
    const [selectedReturn, setSelectedReturn] = useState<{ journey: Journey; fare: FareInfo } | null>(null);
    const [viewMode, setViewMode] = useState<"combined" | "split">("split");
    const [combinedTrips, setCombinedTrips] = useState<Trip[]>([]);
    const [combinedLoading, setCombinedLoading] = useState(true);
    const [combinedError, setCombinedError] = useState<string | null>(null);

    const requestSeq = useRef(0);
    const combinedRequestSeq = useRef(0);

    const dateStrip = useMemo(() => {
        const days = [];
        for (let i = -3 + dateStripOffset; i < 11 + dateStripOffset; i++) {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    }, [selectedDate, dateStripOffset]);

    async function runSearch(date: Date) {
        const seq = ++requestSeq.current;
        setLoading(true);
        setError(null);
        setTrips([]);
        setSelectedOnward(null);
        setSelectedReturn(null);
        setSelectionSource(null);
        setPriceTouched(false);
        setFilters(EMPTY_FILTERS);

        const tokenRes = await getAirlineToken({
            searchType: tripType === "roundtrip" ? "RT" : "ON",
            adt: adults,
            chd: children,
            inf: infants,
            cabin: CABIN_CODE[cabinClass],
            trips: [
                {
                    from,
                    to,
                    onwardDate: toApiDate(date),
                    returnDate: tripType === "roundtrip" && returnDate ? toApiDate(returnDate) : "",
                },
            ],
            directFlight: directOnly,
            student: criteria.specialFare === "student",
            srCitizen: criteria.specialFare === "senior",
            armForce: criteria.specialFare === "armed",
        });

        if (seq !== requestSeq.current) return;

        if (!tokenRes.success || !tokenRes.tokenId) {
            setLoading(false);
            setError(tokenRes.message || "Could not start flight search");
            return;
        }

        setSearchBookingId(tokenRes.bookingId || "");

        const pollResult = await pollAvailability(tokenRes.tokenId, {
            onUpdate: (mergedTrips: Trip[]) => {
                if (seq !== requestSeq.current) return;
                setTrips(mergedTrips);
            },
        });

        if (seq !== requestSeq.current) return;
        setSearchTokenId(pollResult.tokenId);
        setLoading(false);
    }

    async function runCombinedSearch(date: Date) {
        const seq = ++combinedRequestSeq.current;
        setCombinedLoading(true);
        setCombinedError(null);
        setCombinedTrips([]);
        const tokenRes = await getAirlineToken({
            searchType: "RS",
            adt: adults,
            chd: children,
            inf: infants,
            cabin: CABIN_CODE[cabinClass],
            trips: [
                {
                    from,
                    to,
                    onwardDate: toApiDate(date),
                    returnDate: returnDate ? toApiDate(returnDate) : "",
                },
            ],
            directFlight: directOnly,
            student: criteria.specialFare === "student",
            srCitizen: criteria.specialFare === "senior",
            armForce: criteria.specialFare === "armed",
        });

        if (seq !== combinedRequestSeq.current) return;

        if (!tokenRes.success || !tokenRes.tokenId) {
            setCombinedLoading(false);
            setCombinedError(tokenRes.message || "Could not start combined fare search");
            return;
        }

        setCombinedBookingId(tokenRes.bookingId || "");

        const pollResult = await pollAvailability(tokenRes.tokenId, {
            onUpdate: (mergedTrips: Trip[]) => {
                if (seq !== combinedRequestSeq.current) return;
                setCombinedTrips(mergedTrips);
            },
        });

        if (seq !== combinedRequestSeq.current) return;
        setCombinedTokenId(pollResult.tokenId);
        setCombinedLoading(false);
    }

useEffect(() => {
    let ignore = false;
    async function run() {
        if (ignore) return;
        await runSearch(selectedDate);
        if (!ignore && tripType === "roundtrip") {
            await runCombinedSearch(selectedDate);
        }
    }
    run();
    return () => { ignore = true; };
}, [selectedDate, returnDate, tripType, adults, children, infants, cabinClass, directOnly, from, to]);

const onwardJourneys = trips[0]?.Journey ?? [];
    const returnJourneys = trips[1]?.Journey ?? [];
    const allJourneys = useMemo(() => [...onwardJourneys, ...returnJourneys], [onwardJourneys, returnJourneys]);

    const filterOptions = useMemo(() => {
        let min = Infinity;
        let max = 0;
        const stopsMap = new Map<number, number>();
        const airlineMap = new Map<string, { name: string; price: number }>();

        for (const j of allJourneys) {
            const fare = cheapestFare(j);
            if (!fare) continue;
            const amount = primaryFareAmount(fare);
            min = Math.min(min, amount);
            max = Math.max(max, amount);

            const prevStop = stopsMap.get(j.Stops);
            stopsMap.set(j.Stops, prevStop != null ? Math.min(prevStop, amount) : amount);

            const firstSeg = j.Segments[0];
            if (firstSeg) {
                const prev = airlineMap.get(firstSeg.AirlineCode);
                if (!prev || amount < prev.price) {
                    airlineMap.set(firstSeg.AirlineCode, { name: firstSeg.AirlineName, price: amount });
                }
            }
        }

        if (!Number.isFinite(min)) min = 0;

        return {
            minPrice: min,
            maxPrice: max,
            stops: [...stopsMap.entries()].sort((a, b) => a[0] - b[0]).map(([stops, price]) => ({ stops, price })),
            airlines: [...airlineMap.entries()]
                .sort((a, b) => a[1].price - b[1].price)
                .map(([code, v]) => ({ code, name: v.name, price: v.price })),
        };
    }, [allJourneys]);

    const filteredOnward = useMemo(
        () => onwardJourneys.filter((j) => journeyPasses(j, filters)),
        [onwardJourneys, filters]
    );
    const filteredReturn = useMemo(
        () => returnJourneys.filter((j) => journeyPasses(j, filters)),
        [returnJourneys, filters]
    );

    const combinedOnwardJourneys = combinedTrips[0]?.Journey ?? [];
    const combinedReturnJourneys = combinedTrips[1]?.Journey ?? [];

    const combinedPairs = useMemo(() => {
        const returnByReturnId = new Map(
            combinedReturnJourneys
                .filter((j) => j.ReturnIdentifier != null)
                .map((j) => [j.ReturnIdentifier, j])
        );
        const returnByGroup = new Map(
            combinedReturnJourneys.filter((j) => j.GroupId).map((j) => [j.GroupId, j])
        );

        const pairs: JourneyPair[] = [];
        for (const onward of combinedOnwardJourneys) {
            const ret =
                (onward.ReturnIdentifier != null ? returnByReturnId.get(onward.ReturnIdentifier) : undefined) ??
                (onward.GroupId ? returnByGroup.get(onward.GroupId) : undefined);
            if (!ret) continue;

            const onwardFare = cheapestFare(onward);
            if (!onwardFare) continue;

            const retFare = cheapestFare(ret) ?? {
                ...onwardFare,
                GrossFare: 0,
                NetFare: 0,
                PTCFare: onwardFare.PTCFare?.map((p) => ({
                    ...p,
                    GrossFare: 0,
                    NetFare: 0,
                })) ?? [],
            };

            pairs.push({ onward, onwardFare, ret, retFare });
        }
        return pairs.sort(
            (a, b) =>
                primaryFareAmount(a.onwardFare) + primaryFareAmount(a.retFare) -
                (primaryFareAmount(b.onwardFare) + primaryFareAmount(b.retFare))
        );
    }, [combinedOnwardJourneys, combinedReturnJourneys]);

    // Combined (RS) view uses a completely different dataset — combinedPairs,
    // built from combinedTrips — not the split-search `trips`/allJourneys above.
    // filterOptions was previously being reused for both views, which meant the
    // sidebar in Combined View showed options derived from the split search
    // (often empty or mismatched), not from the pairs actually on screen.
    const combinedFilterOptions = useMemo(() => {
        let min = Infinity;
        let max = 0;
        const stopsMap = new Map<number, number>();
        const airlineMap = new Map<string, { name: string; price: number }>();

        for (const pair of combinedPairs) {
            const amount = primaryFareAmount(pair.onwardFare) + primaryFareAmount(pair.retFare);
            min = Math.min(min, amount);
            max = Math.max(max, amount);

            // Combined trips have two legs; bucket by the higher stop-count of
            // the two so the label ("Non Stop" / "1 Stop") reflects what a
            // person filtering by stops would expect to see excluded/included.
            const stopsKey = Math.max(pair.onward.Stops, pair.ret.Stops);
            const prevStop = stopsMap.get(stopsKey);
            stopsMap.set(stopsKey, prevStop != null ? Math.min(prevStop, amount) : amount);

            const firstSeg = pair.onward.Segments[0];
            if (firstSeg) {
                const prev = airlineMap.get(firstSeg.AirlineCode);
                if (!prev || amount < prev.price) {
                    airlineMap.set(firstSeg.AirlineCode, { name: firstSeg.AirlineName, price: amount });
                }
            }
        }

        if (!Number.isFinite(min)) min = 0;

        return {
            minPrice: min,
            maxPrice: max,
            stops: [...stopsMap.entries()].sort((a, b) => a[0] - b[0]).map(([stops, price]) => ({ stops, price })),
            airlines: [...airlineMap.entries()]
                .sort((a, b) => a[1].price - b[1].price)
                .map(([code, v]) => ({ code, name: v.name, price: v.price })),
        };
    }, [combinedPairs]);

    const filteredCombinedPairs = useMemo(
        () => combinedPairs.filter((p) => pairPasses(p, filters)),
        [combinedPairs, filters]
    );

    const splitHasResults = onwardJourneys.length > 0 || returnJourneys.length > 0;
    const combinedHasResults = combinedPairs.length > 0;
    const bothViewsLoaded = tripType === "roundtrip" && !loading && !combinedLoading;
    const showViewTabs = bothViewsLoaded && splitHasResults && combinedHasResults;

    const effectiveView: "combined" | "split" =
        tripType !== "roundtrip"
            ? "split"
            : showViewTabs
                ? viewMode
                : bothViewsLoaded && combinedHasResults && !splitHasResults
                    ? "combined"
                    : "split";

    // Whichever dataset is actually rendered on screen right now drives the sidebar.
    const activeFilterOptions = effectiveView === "combined" ? combinedFilterOptions : filterOptions;

    useEffect(() => {
        if (!priceTouched && activeFilterOptions.maxPrice > 0) {
            setFilters((f) => ({ ...f, maxPrice: activeFilterOptions.maxPrice }));
        }
    }, [activeFilterOptions.maxPrice, priceTouched]);

    const noResultsAtAll =
        tripType === "roundtrip"
            ? bothViewsLoaded && !error && !combinedError && !splitHasResults && !combinedHasResults
            : !loading && !error && !splitHasResults;
    const showFooter = tripType === "roundtrip" && effectiveView === "split";
    const overallLoading = tripType === "roundtrip" ? (loading || combinedLoading) : loading;

    function clearFilters() {
        setFilters({ ...EMPTY_FILTERS, maxPrice: activeFilterOptions.maxPrice });
        setPriceTouched(false);
    }

    const totalTravelers = adults + children + infants;
    const travelersSummary = `${totalTravelers} Traveler${totalTravelers > 1 ? "s" : ""}, ${CABIN_LABEL[cabinClass]}`;
    const totalAmount =
        (selectedOnward ? totalFareForTravelers(selectedOnward.fare, { adults, children, infants }) : 0) +
        (selectedReturn ? totalFareForTravelers(selectedReturn.fare, { adults, children, infants }) : 0);

    const readyToReview =
        !!selectedOnward && (tripType === "oneway" || !!selectedReturn);
    function handleBookFare(journey: Journey, fare: FareInfo) {
        onReviewBooking?.({
            onward: { journey, fare },
            ret: null,
            tokenId: searchTokenId,
            bookingId: searchBookingId,
            index: [fare.Index],
            searchType: "ON",
        });
    }

    function handleBookPair(pair: JourneyPair) {
        onReviewBooking?.({
            onward: { journey: pair.onward, fare: pair.onwardFare },
            ret: { journey: pair.ret, fare: pair.retFare },
            tokenId: combinedTokenId,
            bookingId: combinedBookingId,
            index: [pair.onwardFare.Index, pair.retFare.Index].filter(
               (v): v is string => Boolean(v)
           ),
           searchType: "RS",
        });
    }
    function handleSelect(kind: "onward" | "return", journey: Journey, fare: FareInfo) {
        if (kind === "onward") setSelectedOnward({ journey, fare });
        else setSelectedReturn({ journey, fare });
        setSelectionSource("split");
        onSelectFlight?.(journey, fare);
    }

    function handleSelectPair(pair: JourneyPair) {
        setSelectedOnward({ journey: pair.onward, fare: pair.onwardFare });
        setSelectedReturn({ journey: pair.ret, fare: pair.retFare });
        setSelectionSource("combined");
        onSelectFlight?.(pair.onward, pair.onwardFare);
        onSelectFlight?.(pair.ret, pair.retFare);
    }

    function handleApplyModifiedSearch(
        newCriteria: SearchCriteria,
        newDeparture: Date,
        newReturn: Date | null
    ) {
        setCriteria(newCriteria);
        setSelectedDate(newDeparture);
        setReturnDate(newCriteria.tripType === "roundtrip" ? newReturn : null);
        setDateStripOffset(0);
        setModifyOpen(false);
        onModifySearch?.(newCriteria, newDeparture, newCriteria.tripType === "roundtrip" ? newReturn : null);
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            {/* Top bar */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <span className="text-[#1c8fc7] text-lg">&#9650;</span>
                        <span className="font-bold text-lg">{fromLabel}</span>
                        <span className="text-gray-400 dark:text-gray-500">&rarr;</span>
                        <span className="font-bold text-lg">{toLabel}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Departure */}
                        <div className="flex items-center gap-2 text-sm">
                            <HiOutlineCalendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <div>
                                <p className="text-gray-400 dark:text-gray-500 text-xs">Departure</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {selectedDate.toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Return — added */}
                        {tripType === "roundtrip" && returnDate && (
                            <>
                                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                                <div className="flex items-center gap-2 text-sm">
                                    <HiOutlineCalendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    <div>
                                        <p className="text-gray-400 dark:text-gray-500 text-xs">Return</p>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            {returnDate.toLocaleDateString("en-US", {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

                        {/* Travelers */}
                        <div className="flex items-center gap-2 text-sm">
                            <HiOutlineUserGroup className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <div>
                                <p className="text-gray-400 dark:text-gray-500 text-xs">Travelers</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{travelersSummary}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setModifyOpen((v) => !v)}
                        aria-expanded={modifyOpen}
                        className={`inline-flex items-center gap-2 h-10 px-5 rounded-full text-white text-sm font-semibold transition-colors ${modifyOpen ? "bg-[#177aab]" : "bg-[#1c8fc7] hover:bg-[#177aab]"
                            }`}
                    >
                        <HiOutlinePencil className="w-4 h-4" />
                        Modify Search
                        {modifyOpen ? (
                            <HiOutlineChevronUp className="w-4 h-4" />
                        ) : (
                            <HiOutlineChevronDown className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {modifyOpen && (
                    <ModifySearchPanel
                        criteria={criteria}
                        departureDate={selectedDate}
                        returnDate={returnDate}
                        onCancel={() => setModifyOpen(false)}
                        onApply={handleApplyModifiedSearch}
                    />
                )}
            </div>

            {/* Promo strip */}
         {(() => {
                const isOneway = tripType === "oneway";
const promoRef = useRef<HTMLDivElement>(null);
const [promoCanScrollLeft, setPromoCanScrollLeft] = useState(false);
const [promoCanScrollRight, setPromoCanScrollRight] = useState(true);

const checkPromoScroll = useCallback(() => {
    const el = promoRef.current;
    if (!el) return;
    setPromoCanScrollLeft(el.scrollLeft > 0);
    setPromoCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
}, []);

useEffect(() => {
    const el = promoRef.current;
    if (!el) return;
    checkPromoScroll();
    el.addEventListener("scroll", checkPromoScroll, { passive: true });
    window.addEventListener("resize", checkPromoScroll);
    return () => {
        el.removeEventListener("scroll", checkPromoScroll);
        window.removeEventListener("resize", checkPromoScroll);
    };
}, [checkPromoScroll]);

const scrollPromo = (dir: "left" | "right") => {
    const el = promoRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
};
const promoStrip = (
    <div className="flex items-center gap-2 mb-4">
        <button
            type="button"
            onClick={() => scrollPromo("left")}
            disabled={!promoCanScrollLeft}
            className={`grid place-items-center w-8 h-8 rounded-full border shrink-0 transition-colors ${
                promoCanScrollLeft
                    ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-[#1c8fc7] hover:border-[#1c8fc7]"
                    : "border-gray-100 dark:border-gray-800 text-gray-200 dark:text-gray-700 cursor-not-allowed"
            }`}
            aria-label="Previous offers"
        >
            <HiOutlineChevronLeft className="w-4 h-4" />
        </button>

        <div
            ref={promoRef}
            className="flex-1 flex gap-3 overflow-x-auto pb-1 scrollbar-hide scroll-smooth snap-x snap-mandatory min-w-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
            {PROMOS.map((p) => (
                <button
                    key={p.title}
                    type="button"
                    className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 shrink-0 min-w-[260px] text-left hover:border-gray-200 dark:hover:border-gray-700 transition-colors snap-start"
                >
                    <span className="w-8 h-8 rounded-full bg-[#e8f4fb] text-[#1c8fc7] flex items-center justify-center shrink-0">
                        <HiOutlineTag className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{p.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{p.subtitle}</p>
                    </span>
                    <HiOutlineChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                </button>
            ))}
        </div>

        <button
            type="button"
            onClick={() => scrollPromo("right")}
            disabled={!promoCanScrollRight}
            className={`grid place-items-center w-8 h-8 rounded-full border shrink-0 transition-colors ${
                promoCanScrollRight
                    ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-[#1c8fc7] hover:border-[#1c8fc7]"
                    : "border-gray-100 dark:border-gray-800 text-gray-200 dark:text-gray-700 cursor-not-allowed"
            }`}
            aria-label="Next offers"
        >
            <HiOutlineChevronRight className="w-4 h-4" />
        </button>
    </div>
);

                const dateStripEl = isOneway && (
                    <div className="flex items-center gap-2 mb-5">
                        <button
                            type="button"
                            onClick={() => setDateStripOffset((v) => v - 7)}
                            className="grid place-items-center w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-[#1c8fc7] hover:border-[#1c8fc7] shrink-0"
                            aria-label="Earlier dates"
                        >
                            <HiOutlineChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex-1 flex gap-2 overflow-x-auto sm:overflow-x-visible min-w-0">
                            {dateStrip.map((d) => {
                                const { dow, day, mon } = formatDayLabel(d);
                                const isSelected = toApiDate(d) === toApiDate(selectedDate);
                                return (
                                    <button
                                        key={toApiDate(d)}
                                        type="button"
                                        onClick={() => {
                                            setSelectedDate(d);
                                            onModifySearch?.(criteria, d, null);
                                        }}
                                        className={`flex-1 min-w-[56px] rounded-xl border px-2 py-2 text-center transition-colors ${
                                            isSelected
                                                ? "border-[#1c8fc7] bg-[#e8f4fb] text-[#1c8fc7]"
                                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                    >
                                        <p className="text-[11px] font-medium">{dow}</p>
                                        <p className="text-lg font-bold leading-tight">{day}</p>
                                        <p className="text-[11px]">{mon}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => setDateStripOffset((v) => v + 7)}
                            className="grid place-items-center w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-[#1c8fc7] hover:border-[#1c8fc7] shrink-0"
                            aria-label="Later dates"
                        >
                            <HiOutlineChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                );

                const viewTabsEl = showViewTabs && (
                    <div className="inline-flex rounded-full border border-gray-200 dark:border-gray-700 p-1 mb-5 gap-1">
                        <button
                            type="button"
                            onClick={() => setViewMode("combined")}
                            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                effectiveView === "combined"
                                    ? "bg-[#1c8fc7] text-white"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                        >
                            Combined View
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("split")}
                            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                effectiveView === "split"
                                    ? "bg-[#1c8fc7] text-white"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                        >
                            Split View
                        </button>
                    </div>
                );

                const resultsEl = noResultsAtAll ? (
                    <div className="flex flex-col items-center justify-center text-center py-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No flights found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            Try changing your travel dates, route, or search filters.
                        </p>
                    </div>
                ) : tripType === "roundtrip" && overallLoading && !splitHasResults && !combinedHasResults ? (
                    <FlightSearchSkeleton fromLabel={fromCity || from} toLabel={toCity || to} />
                ) : tripType === "roundtrip" && effectiveView === "combined" ? (
                    <CombinedJourneyList
                        fromCity={fromCity || from}
                        toCity={toCity || to}
                        loading={overallLoading}
                        error={combinedError}
                        pairs={filteredCombinedPairs}
                        expandedGroupId={expandedGroupId}
                        setExpandedGroupId={setExpandedGroupId}
                        onBookPair={handleBookPair}
                        travelerCounts={{ adults, children, infants }}
                        tokenId={combinedTokenId}
                        searchType="RS"
                    />
                ) : (
                    <div className={tripType === "roundtrip" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : undefined}>
                        <JourneyList
                            title="Departing"
                            from={fromCity || from}
                            to={toCity || to}
                            loading={overallLoading}
                            error={error}
                            journeys={filteredOnward}
                            selectedGroupId={selectedOnward?.journey.GroupId ?? null}
                            expandedGroupId={expandedGroupId}
                            setExpandedGroupId={setExpandedGroupId}
                            onSelectFlight={(j, f) => handleSelect("onward", j, f)}
                            onBookFare={handleBookFare}
                            directBooking={tripType === "oneway"}
                            travelerCounts={{ adults, children, infants }}
                            tokenId={searchTokenId}
                            searchType={tripType === "roundtrip" ? "RT" : "ON"}
                        />

                        {tripType === "roundtrip" && (
                            <JourneyList
                                title="Returning"
                                from={toCity || to}
                                to={fromCity || from}
                                loading={loading}
                                error={error}
                                journeys={filteredReturn}
                                selectedGroupId={selectedReturn?.journey.GroupId ?? null}
                                expandedGroupId={expandedGroupId}
                                setExpandedGroupId={setExpandedGroupId}
                                onSelectFlight={(j, f) => handleSelect("return", j, f)}
                                travelerCounts={{ adults, children, infants }}
                                tokenId={searchTokenId}
                                searchType={tripType === "roundtrip" ? "RT" : "ON"}
                            />
                        )}
                    </div>
                );

               return (
                    <div className="max-w-8xl mx-auto px-4 sm:px-6 flex gap-6 py-4">
                        <aside className="hidden lg:block w-74 shrink-0">
                            <FilterSidebar
                                filters={filters}
                                setFilters={setFilters}
                                setPriceTouched={setPriceTouched}
                                options={activeFilterOptions}
                                onClear={clearFilters}
                            />
                        </aside>

                        <div className={isOneway ? "flex-1 min-w-0 lg:max-w-[1120px]" : "flex-1 min-w-0"}>
                            {promoStrip}
                            {dateStripEl}
                            {viewTabsEl}
                            {resultsEl}
                        </div>

                        {isOneway && (
    <div className="hidden xl:block w-[320px] shrink-0">
        <GoogleAdSlot width={300} height={600} />
    </div>
)}
                    </div>
                );
            })()}

            {/* Sticky booking summary bar */}
            {showFooter && (
                <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-6 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-lg shrink-0">
                            {fromLabel} <span className="text-gray-400 dark:text-gray-500 font-normal">&rarr;</span> {toLabel}
                        </p>

                        <div className="hidden sm:block shrink-0">
                            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-tight">Departure</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                {selectedDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                            </p>
                        </div>
                        {tripType === "roundtrip" && returnDate && (
                            <div className="hidden sm:block shrink-0">
                                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-tight">Return</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                    {returnDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                                </p>
                            </div>
                        )}
                        <div className="hidden sm:block shrink-0">
                            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-tight">Travelers</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                {adults + children + infants} Person{adults + children + infants > 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-tight">Total Amount</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">{formatPrice(totalAmount)}</p>
                        </div>

                        <button
                            type="button"
                            disabled={!readyToReview}
                            onClick={() => {
                                if (!selectedOnward) return;
                                onReviewBooking?.({
                                    onward: selectedOnward,
                                    ret: selectedReturn,
                                    tokenId: searchTokenId,
                                    bookingId: searchBookingId,
                                    index: [selectedOnward.fare.Index, selectedReturn?.fare.Index].filter(
                                        (v): v is string => Boolean(v)
                                    ),
                                    searchType: tripType === "roundtrip" ? "RT" : "ON",
                                });
                            }}
                            className={`h-10 px-6 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${readyToReview
                                ? "bg-[#1c8fc7] text-white hover:bg-[#177aab]"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                }`}
                        >
                            Review Booking
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}