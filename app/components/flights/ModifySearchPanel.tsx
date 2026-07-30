"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
    HiOutlineCalendar,
    HiOutlineUserGroup,
    HiOutlineChevronDown,
    HiOutlineSwitchHorizontal,
    HiOutlineX,
} from "react-icons/hi";
import { searchAirports } from "@/app/lib/utilityapi";
import { DatePickerBrandStyles } from "@/app/components/shared/DatePickerBrandStyles";
import { type Airport, type CabinClass, type SearchCriteria, type TripType } from "@/app/components/flights/types";
import { CABIN_LABEL, SPECIAL_FARE_LABEL, SPECIAL_FARE_SAVE, formatAirportCodeLabel, toApiDate } from "@/app/components/flights/utils";
import CounterRow from "@/app/components/booking/CounterRow";
import { writeCachedSearch } from "@/app/components/flights/searchCache";

export default function ModifySearchPanel({
    criteria,
    departureDate,
    returnDate,
    onCancel,
    onApply,
}: {
    criteria: SearchCriteria;
    departureDate: Date;
    returnDate: Date | null;
    onCancel: () => void;
    onApply: (criteria: SearchCriteria, departureDate: Date, returnDate: Date | null) => void;
}) {
    const [draft, setDraft] = useState<SearchCriteria>(criteria);
    const [draftDeparture, setDraftDeparture] = useState<Date>(departureDate);
    const [draftReturn, setDraftReturn] = useState<Date | null>(
        returnDate ?? new Date(departureDate.getTime() + 86400000)
    );
    const [travelersOpen, setTravelersOpen] = useState(false);
    const [fromQuery, setFromQuery] = useState("");
    const [toQuery, setToQuery] = useState("");
    const [fromResults, setFromResults] = useState<Airport[]>([]);
    const [toResults, setToResults] = useState<Airport[]>([]);
    const [fromOpen, setFromOpen] = useState(false);
    const [toOpen, setToOpen] = useState(false);
    const [fromLoading, setFromLoading] = useState(false);
    const [toLoading, setToLoading] = useState(false);
    const [fromError, setFromError] = useState<string | null>(null);
    const [toError, setToError] = useState<string | null>(null);

    // Seed from whatever the caller already knew about the airports (e.g. the
    // full record cached from Home) rather than always starting null. This is
    // what makes StateName/CountryName show up immediately instead of only
    // after the user re-picks an airport inside this panel.
    const [fromAirportDetail, setFromAirportDetail] = useState<Airport | null>(criteria.fromAirport ?? null);
    const [toAirportDetail, setToAirportDetail] = useState<Airport | null>(criteria.toAirport ?? null);

    const fromRef = useRef<HTMLDivElement>(null);
    const toRef = useRef<HTMLDivElement>(null);
    const travelersRef = useRef<HTMLDivElement>(null);
    const fromDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (fromRef.current && !fromRef.current.contains(e.target as Node)) setFromOpen(false);
            if (toRef.current && !toRef.current.contains(e.target as Node)) setToOpen(false);
            if (travelersRef.current && !travelersRef.current.contains(e.target as Node)) setTravelersOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (fromDebounce.current) clearTimeout(fromDebounce.current);
        if (!fromQuery) {
            setFromResults([]);
            return;
        }
        fromDebounce.current = setTimeout(async () => {
            setFromLoading(true);
            setFromError(null);
            const res = await searchAirports(fromQuery);
            setFromLoading(false);
            if (res.success) {
                setFromResults(res.airports);
            } else {
                setFromResults([]);
                setFromError(res.message || "Could not fetch airports");
            }
        }, 300);
        return () => {
            if (fromDebounce.current) clearTimeout(fromDebounce.current);
        };
    }, [fromQuery]);

    useEffect(() => {
        if (toDebounce.current) clearTimeout(toDebounce.current);
        if (!toQuery) {
            setToResults([]);
            return;
        }
        toDebounce.current = setTimeout(async () => {
            setToLoading(true);
            setToError(null);
            const res = await searchAirports(toQuery);
            setToLoading(false);
            if (res.success) {
                setToResults(res.airports);
            } else {
                setToResults([]);
                setToError(res.message || "Could not fetch airports");
            }
        }, 300);
        return () => {
            if (toDebounce.current) clearTimeout(toDebounce.current);
        };
    }, [toQuery]);

    function formatAirportField(code: string, city: string) {
        return formatAirportCodeLabel(code, city);
    }

    function selectFromAirport(airport: Airport) {
        setDraft((d) => ({
            ...d,
            from: airport.AirportCode,
            fromCity: airport.CityName,
        }));
        setFromAirportDetail(airport);
        setFromQuery("");
        setFromResults([]);
        setFromOpen(false);
    }

    function selectToAirport(airport: Airport) {
        setDraft((d) => ({
            ...d,
            to: airport.AirportCode,
            toCity: airport.CityName,
        }));
        setToAirportDetail(airport);
        setToQuery("");
        setToResults([]);
        setToOpen(false);
    }

    function swap() {
        setDraft((d) => ({
            ...d,
            from: d.to,
            to: d.from,
            fromCity: d.toCity,
            toCity: d.fromCity,
            fromAirport: d.toAirport,
            toAirport: d.fromAirport,
        }));
        setFromAirportDetail(toAirportDetail);
        setToAirportDetail(fromAirportDetail);
    }

    const maxChildren = Math.min(draft.adults * 2, 9 - draft.adults);
    const maxInfants = draft.adults;
    const maxAdults = Math.min(9 - draft.children, 9);

    function handleAdultsChange(v: number) {
        setDraft((d) => {
            const newMaxChildren = Math.min(v * 2, 9 - v);
            return {
                ...d,
                adults: v,
                children: d.children > newMaxChildren ? newMaxChildren : d.children,
                infants: d.infants > v ? v : d.infants,
            };
        });
    }

    function handleChildrenChange(v: number) {
        setDraft((d) => ({ ...d, children: v }));
    }

    function handleInfantsChange(v: number) {
        setDraft((d) => ({ ...d, infants: v }));
    }

    function submit() {
        if (!draft.from.trim() || !draft.to.trim()) return;

        const finalReturn = draft.tripType === "roundtrip" ? draftReturn : null;

        writeCachedSearch({
            tripType: draft.tripType,
            // Home stores this as the 3-way "all" | "direct" | "connecting"
            // FlightType, while this panel only tracks a directOnly boolean.
            // Map it through so a "Direct" choice made here is still
            // reflected correctly if the user navigates back to Home —
            // otherwise Home's cache kept whatever FlightType it last had,
            // which could silently disagree with the search actually run.
            flightType: draft.directOnly ? "direct" : "all",
            specialFare: draft.specialFare,
            from: draft.from,
            to: draft.to,
            fromCity: draft.fromCity,
            toCity: draft.toCity,
            // Only overwrite the cached full Airport records when this panel
            // actually has one (i.e. the user re-picked that field here).
            // fromAirportDetail/toAirportDetail start out null whenever this
            // page was reached without the full record being threaded
            // through (e.g. arriving via the results-page URL, which only
            // carries plain codes/city names). Writing `null` here for an
            // untouched field used to blank out the good Airport object
            // Home had originally cached — which is exactly what emptied
            // out the From/To fields when navigating back to Home.
            ...(fromAirportDetail ? { fromAirport: fromAirportDetail } : {}),
            ...(toAirportDetail ? { toAirport: toAirportDetail } : {}),
            departureDate: toApiDate(draftDeparture),
            returnDate: finalReturn ? toApiDate(finalReturn) : null,
            adults: draft.adults,
            children: draft.children,
            infants: draft.infants,
            cabinClass: draft.cabinClass,
        });

        onApply(
            { ...draft, fromAirport: fromAirportDetail, toAirport: toAirportDetail },
            draftDeparture,
            finalReturn
        );
    }

    const totalTravelers = draft.adults + draft.children + draft.infants;

    return (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 pb-5">
            <DatePickerBrandStyles />
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="inline-flex rounded-full border border-gray-200 p-1 gap-1">
                        {(["oneway", "roundtrip"] as TripType[]).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setDraft((d) => ({ ...d, tripType: t }))}
                                className={`px-4 h-8 rounded-full text-xs font-semibold transition-colors ${draft.tripType === t
                                    ? "bg-[#1c8fc7] text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {t === "oneway" ? "One Way" : "Round Trip"}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center flex-wrap gap-x-5 gap-y-2">
                        <span className="text-xs font-medium text-gray-500">Special fare:</span>
                        {(Object.keys(SPECIAL_FARE_LABEL) as Array<keyof typeof SPECIAL_FARE_LABEL>).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setDraft((d) => ({ ...d, specialFare: key }))}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${draft.specialFare === key ? "border-[#1c8fc7]" : "border-gray-300"
                                        }`}
                                >
                                    {draft.specialFare === key && <span className="w-2 h-2 rounded-full bg-[#1c8fc7]" />}
                                </span>
                                <span className="text-sm text-gray-700">
                                    {SPECIAL_FARE_LABEL[key]}
                                    {SPECIAL_FARE_SAVE[key] && (
                                        <span className="block text-[11px] text-green-600 leading-tight -mt-0.5">
                                            {SPECIAL_FARE_SAVE[key]}
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                    {/* From + To */}
                    <div className="col-span-2 md:col-span-2 relative grid grid-cols-2 gap-3">
                        {/* From */}
                        <div className="relative" ref={fromRef}>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">From</p>
                            <div
                                onClick={() => setFromOpen(true)}
                                className={`w-full h-10 rounded-lg border px-3 flex items-center cursor-text transition-colors ${fromOpen ? "border-[#1c8fc7] ring-2 ring-[#1c8fc7]/20" : "border-gray-200"
                                    }`}
                            >
                                <input
                                    value={fromOpen ? fromQuery : formatAirportField(draft.from, draft.fromCity)}
                                    onChange={(e) => {
                                        setFromQuery(e.target.value.toUpperCase());
                                        setFromOpen(true);
                                    }}
                                    onFocus={() => {
                                        setFromOpen(true);
                                        setFromQuery("");
                                    }}
                                    placeholder={formatAirportField(draft.from, draft.fromCity, fromAirportDetail) || "DEL"}
                                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                                />
                            </div>

                            {fromOpen && fromQuery.length > 0 && (
                                <ModifySearchAirportDropdown
                                    loading={fromLoading}
                                    results={fromResults}
                                    query={fromQuery}
                                    error={fromError}
                                    onSelect={selectFromAirport}
                                />
                            )}
                        </div>

                        {/* To */}
                        <div className="relative" ref={toRef}>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">To</p>
                            <div
                                onClick={() => setToOpen(true)}
                                className={`w-full h-10 rounded-lg border px-3 flex items-center cursor-text transition-colors ${toOpen ? "border-[#1c8fc7] ring-2 ring-[#1c8fc7]/20" : "border-gray-200"
                                    }`}
                            >
                                <input
                                    value={toOpen ? toQuery : formatAirportField(draft.to, draft.toCity, toAirportDetail)}
                                    onChange={(e) => {
                                        setToQuery(e.target.value.toUpperCase());
                                        setToOpen(true);
                                    }}
                                    onFocus={() => {
                                        setToOpen(true);
                                        setToQuery("");
                                    }}
                                    placeholder={formatAirportField(draft.to, draft.toCity, toAirportDetail) || "BOM"}
                                    className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                                />
                            </div>

                            {toOpen && toQuery.length > 0 && (
                                <ModifySearchAirportDropdown
                                    loading={toLoading}
                                    results={toResults}
                                    query={toQuery}
                                    error={toError}
                                    onSelect={selectToAirport}
                                />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={swap}
                            aria-label="Swap origin and destination"
                            className="hidden md:grid absolute left-1/2 top-6 -translate-x-1/2 z-20 place-items-center w-7 h-7 rounded-full border border-gray-200 bg-white text-gray-400 hover:text-[#1c8fc7] hover:border-[#1c8fc7] shadow-sm"
                        >
                            <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Departure date */}
                    <div className="col-span-1">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Departure</p>
                        <DatePicker
                            selected={draftDeparture}
                            onChange={(date) => {
                                if (!date) return;
                                setDraftDeparture(date);
                                if (draftReturn && draftReturn < date) setDraftReturn(date);
                            }}
                            minDate={new Date()}
                            monthsShown={2}
                            popperPlacement="bottom-start"
                            portalId="flight-search-datepicker-portal"
                            wrapperClassName="block w-full"
                            customInput={<ModifyDateInput />}
                        />
                    </div>

                    {/* Return date */}
                    <div className={`col-span-1 ${draft.tripType === "roundtrip" ? "" : "opacity-40 pointer-events-none"}`}>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Return</p>
                        <DatePicker
                            selected={draftReturn}
                            onChange={(date) => date && setDraftReturn(date)}
                            minDate={draftDeparture}
                            monthsShown={2}
                            popperPlacement="bottom-start"
                            portalId="flight-search-datepicker-portal"
                            wrapperClassName="block w-full"
                            disabled={draft.tripType !== "roundtrip"}
                            customInput={<ModifyDateInput placeholder="Add return" />}
                        />
                    </div>

                    {/* Travelers & class */}
                    <div className="col-span-2 md:col-span-1 relative" ref={travelersRef}>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                            Travelers &amp; Class
                        </p>
                        <button
                            type="button"
                            onClick={() => setTravelersOpen((v) => !v)}
                            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-900 flex items-center justify-between gap-1"
                        >
                            <span className="truncate">
                                {totalTravelers} &bull; {CABIN_LABEL[draft.cabinClass]}
                            </span>
                            <HiOutlineChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        </button>

                        {travelersOpen && (
                            <div className="absolute z-20 top-full mt-2 right-0 w-[320px] max-w-[92vw] bg-white border border-gray-100 rounded-xl shadow-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <HiOutlineUserGroup className="w-4 h-4 text-gray-700" />
                                        <span className="text-sm font-semibold text-gray-900">Travellers</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setTravelersOpen(false)}
                                        aria-label="Close"
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <HiOutlineX className="w-4 h-4" />
                                    </button>
                                </div>

                                <CounterRow
                                    title="Adults"
                                    subtitle="12 yrs or above"
                                    value={draft.adults}
                                    options={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                                    disabledOptions={[1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n > maxAdults)}
                                    onChange={handleAdultsChange}
                                />

                                <CounterRow
                                    title="Children"
                                    subtitle="2-12 years"
                                    titleSuffix="(2y-12y)"
                                    value={draft.children}
                                    options={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
                                    disabledOptions={[0, 1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n > maxChildren)}
                                    onChange={handleChildrenChange}
                                />

                                <CounterRow
                                    title="Infants"
                                    subtitle="on the day of travel"
                                    titleSuffix="(below 2y)"
                                    value={draft.infants}
                                    options={[0, 1, 2, 3, 4]}
                                    disabledOptions={[0, 1, 2, 3, 4].filter((n) => n > maxInfants)}
                                    onChange={handleInfantsChange}
                                />

                                <div className="bg-gray-50 rounded-lg px-2 py-1.5 flex items-center justify-between gap-1.5 mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <HiOutlineUserGroup className="w-3.5 h-3.5 text-gray-500" />
                                        <span className="text-xs text-gray-700">
                                            Planning a trip for more than 9 travellers?
                                        </span>
                                    </div>
                                    <button type="button" className="text-xs font-semibold text-[#1c8fc7] whitespace-nowrap">
                                        Create Group Booking
                                    </button>
                                </div>

                                <p className="text-xs font-semibold text-gray-900 mb-1.5">Cabin Class</p>
                                <div className="grid grid-cols-2 gap-1.5 mb-2">
                                    {(Object.keys(CABIN_LABEL) as CabinClass[]).map((c) => {
                                        const selected = draft.cabinClass === c;
                                        return (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setDraft((d) => ({ ...d, cabinClass: c }))}
                                                className={`rounded-lg border px-2 py-1 text-left transition-colors ${selected
                                                    ? "bg-[#1c8fc7] border-[#1c8fc7] text-white"
                                                    : "bg-white border-gray-200 text-gray-900 hover:border-gray-300"
                                                    }`}
                                            >
                                                <p className="text-xs font-semibold">{CABIN_LABEL[c]}</p>
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setTravelersOpen(false)}
                                    className="w-full h-8 rounded-lg bg-[#1c8fc7] text-white text-sm font-semibold hover:bg-[#177aab] transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="h-10 px-5 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            className="h-10 px-8 rounded-full bg-[#1c8fc7] text-white text-sm font-bold hover:bg-[#177aab] transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ModifyDateInput = forwardRef<
    HTMLButtonElement,
    { value?: string; onClick?: () => void; placeholder?: string }
>(function ModifyDateInput({ value, onClick, placeholder }, ref) {
    return (
        <button
            type="button"
            ref={ref}
            onClick={onClick}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-left flex items-center justify-between focus:outline-none focus:border-[#1c8fc7] disabled:cursor-not-allowed disabled:opacity-60"
        >
            <span className={value ? "text-gray-900" : "text-gray-400"}>
                {value || placeholder || "Select date"}
            </span>
            <HiOutlineCalendar className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
    );
});

function ModifySearchAirportDropdown({
    loading,
    results,
    query,
    error,
    onSelect,
}: {
    loading: boolean;
    results: Airport[];
    query: string;
    error?: string | null;
    onSelect: (airport: Airport) => void;
}) {
    return (
        <div className="absolute left-0 right-0 top-full mt-2 min-w-[260px] bg-white rounded-2xl shadow-xl border border-gray-100 max-h-64 overflow-y-auto z-50">
            {loading && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#1c8fc7] animate-spin" />
                    Searching airports...
                </div>
            )}
            {!loading && error && <div className="px-4 py-3 text-sm text-red-600">{error}</div>}
            {!loading && !error && results.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400">No airports found for &ldquo;{query}&rdquo;</div>
            )}
            {!loading && (
                <div className="divide-y divide-gray-100">
                    {results.map((airport) => (
                        <button
                            key={`${airport.AirportCode}-${airport.CityCode}`}
                            type="button"
                            onClick={() => onSelect(airport)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center shrink-0">
                                {airport.AirportCode}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {airport.CityName} ({airport.AirportCode}), {airport.CountryName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{airport.AirportName}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}