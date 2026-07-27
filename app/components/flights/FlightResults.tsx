"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { getAirlineToken, pollAvailability } from "@/app/lib/flightsapi";
import { DatePickerBrandStyles } from "../shared/DatePickerBrandStyles";
import {
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
    }) => void;
};

export default function FlightResults({
    from: fromProp,
    to: toProp,
    fromCity: fromCityProp,
    toCity: toCityProp,
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
        tripType: tripTypeProp,
        adults: adultsProp,
        children: childrenProp,
        infants: infantsProp,
        cabinClass: cabinClassProp,
        directOnly: directOnlyProp,
        specialFare: specialFareProp,
    }));
    const { from, to, fromCity, toCity, tripType, adults, children, infants, cabinClass, directOnly } = criteria;

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

    useEffect(() => {
        if (!priceTouched && filterOptions.maxPrice > 0) {
            setFilters((f) => ({ ...f, maxPrice: filterOptions.maxPrice }));
        }
    }, [filterOptions.maxPrice, priceTouched]);

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
            };

            pairs.push({ onward, onwardFare, ret, retFare });
        }
        return pairs.sort(
            (a, b) =>
                primaryFareAmount(a.onwardFare) + primaryFareAmount(a.retFare) -
                (primaryFareAmount(b.onwardFare) + primaryFareAmount(b.retFare))
        );
    }, [combinedOnwardJourneys, combinedReturnJourneys]);

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
    const showFooter = tripType === "roundtrip" && effectiveView === "split";

    function clearFilters() {
        setFilters({ ...EMPTY_FILTERS, maxPrice: filterOptions.maxPrice });
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
        });
    }

    function handleBookPair(pair: JourneyPair) {
        onReviewBooking?.({
            onward: { journey: pair.onward, fare: pair.onwardFare },
            ret: { journey: pair.ret, fare: pair.retFare },
            tokenId: combinedTokenId,
            bookingId: combinedBookingId,
            index: [pair.onwardFare.Index, pair.retFare.Index],
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
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-gray-900">
                        <span className="text-[#1c8fc7] text-lg">&#9650;</span>
                        <span className="font-bold text-lg">{from}</span>
                        <span className="text-gray-400">&rarr;</span>
                        <span className="font-bold text-lg">{to}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm">
                            <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-gray-400 text-xs">Departure</p>
                                <p className="font-semibold text-gray-900">
                                    {selectedDate.toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="w-px h-8 bg-gray-200" />

                        <div className="flex items-center gap-2 text-sm">
                            <HiOutlineUserGroup className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-gray-400 text-xs">Travelers</p>
                                <p className="font-semibold text-gray-900">{travelersSummary}</p>
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
            <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4">
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {PROMOS.map((p) => (
                        <button
                            key={p.title}
                            type="button"
                            className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shrink-0 min-w-[260px] text-left hover:border-gray-200 transition-colors"
                        >
                            <span className="w-8 h-8 rounded-full bg-[#e8f4fb] text-[#1c8fc7] flex items-center justify-center shrink-0">
                                <HiOutlineTag className="w-4 h-4" />
                            </span>
                            <span className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                                <p className="text-xs text-gray-400 truncate">{p.subtitle}</p>
                            </span>
                            <HiOutlineChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-8xl mx-auto px-4 sm:px-6 flex gap-6">
                <aside className="hidden lg:block w-64 shrink-0">
                    <FilterSidebar
                        filters={filters}
                        setFilters={setFilters}
                        setPriceTouched={setPriceTouched}
                        options={filterOptions}
                        onClear={clearFilters}
                    />
                </aside>

                <div className="flex-1 min-w-0">
                    {/* Date strip — one-way trips only */}
                    {tripType === "oneway" && (
                        <div className="flex items-center gap-2 mb-5 w-full">
                            <button
                                type="button"
                                onClick={() => setDateStripOffset((v) => v - 7)}
                                className="grid place-items-center w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-[#1c8fc7] hover:border-[#1c8fc7] shrink-0"
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
                                            type="button"
                                            onClick={() => {
                                                setSelectedDate(d);
                                                onModifySearch?.(criteria, d, null);
                                            }}
                                            className={`flex-1 min-w-[64px] rounded-xl border px-2 py-2 text-center transition-colors ${isSelected
                                                ? "border-[#1c8fc7] bg-[#e8f4fb] text-[#1c8fc7]"
                                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
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
                                className="grid place-items-center w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-[#1c8fc7] hover:border-[#1c8fc7] shrink-0"
                                aria-label="Later dates"
                            >
                                <HiOutlineChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {showViewTabs && (
                        <div className="inline-flex rounded-full border border-gray-200 p-1 mb-5 gap-1">
                            <button
                                type="button"
                                onClick={() => setViewMode("combined")}
                                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${effectiveView === "combined"
                                    ? "bg-[#1c8fc7] text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                Combined View
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("split")}
                                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${effectiveView === "split"
                                    ? "bg-[#1c8fc7] text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                Split View
                            </button>
                        </div>
                    )}

                    {tripType === "roundtrip" && effectiveView === "combined" ? (
                    <CombinedJourneyList
    fromCity={fromCity || from}
    toCity={toCity || to}
    loading={combinedLoading}
    error={combinedError}
    pairs={filteredCombinedPairs}
    expandedGroupId={expandedGroupId}
    setExpandedGroupId={setExpandedGroupId}
    onBookPair={handleBookPair}
    travelerCounts={{ adults, children, infants }}
    tokenId={combinedTokenId}
/>
                    ) : (
                        <div className={tripType === "roundtrip" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : undefined}>
                        <JourneyList
    title="Departing"
    from={fromCity || from}
    to={toCity || to}
    loading={loading}
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
    />
)}
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky booking summary bar */}
            {showFooter && (
                <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-6 min-w-0">
                        <p className="font-bold text-gray-900 text-lg shrink-0">
                            {from} <span className="text-gray-400 font-normal">&rarr;</span> {to}
                        </p>

                        <div className="hidden sm:block shrink-0">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">Departure</p>
                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                                {selectedDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                            </p>
                        </div>

                        <div className="hidden sm:block shrink-0">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">Travelers</p>
                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                                {adults + children + infants} Person{adults + children + infants > 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">Total Amount</p>
                            <p className="text-lg font-bold text-gray-900 leading-tight">{formatPrice(totalAmount)}</p>
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
                                });
                            }}
                            className={`h-10 px-6 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${readyToReview
                                ? "bg-[#1c8fc7] text-white hover:bg-[#177aab]"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
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