"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { useRouter } from "next/navigation";
import "react-datepicker/dist/react-datepicker.css";
import {
    HiOutlineSwitchHorizontal,
    HiOutlineCalendar,
    HiOutlineUser,
    HiOutlineUserGroup,
    HiOutlineLocationMarker,
    HiX,
} from "react-icons/hi";
import { HiOutlineSparkles } from "react-icons/hi2";
import { DatePickerBrandStyles } from "../shared/DatePickerBrandStyles";
import { searchAirports } from "@/app/lib/utilityapi";
import { getAirlineToken } from "@/app/lib/flightsapi";
import { readCachedSearch, writeCachedSearch } from "@/app/components/flights/searchCache";
import { type Airport, type CabinClass, type FlightType, type SpecialFare, type TripType } from "@/app/components/flights/types";
import { CABIN_LABEL as CABIN_LABELS, CABIN_CODE } from "@/app/components/flights/utils";

const FLIGHT_TYPES: { key: FlightType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "direct", label: "Direct" },
    { key: "connecting", label: "Connecting" },
];

const SPECIAL_FARES: { key: Exclude<SpecialFare, "regular">; label: string }[] = [
    { key: "student", label: "Student" },
    { key: "senior", label: "Senior Citizen" },
    { key: "armed", label: "Armed Forces" },
];
const CABIN_CLASSES: { key: CabinClass; label: string; desc: string }[] = [
    { key: "economy", label: "Economy", desc: "Standard seating" },
    { key: "premium", label: "Premium Economy", desc: "Extra legroom & perks" },
    { key: "business", label: "Business", desc: "Premium comfort" },
    { key: "first", label: "First Class", desc: "Luxury experience" },
];
const SPECIAL_FARE_INFO: Record<Exclude<SpecialFare, "regular">, string> = {
    student: "Student fares are not applicable for children/infants",
    senior: "Applicable only for passengers aged 60 years and above",
    armed: "Valid defence ID card required at airport check-in",
};
const HERO_IMAGE_URL =
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2400";

function formatShort(date: Date | null) {
    if (!date) return null;
    return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

function formatApiDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function formatAirportLocation(airport: Airport) {
    const parts = [airport.CityName];
    if (airport.StateName && airport.StateName !== airport.CityName) {
        parts.push(airport.StateName);
    }
    if (airport.CountryName) {
        parts.push(airport.CountryName);
    }
    return parts.join(", ");
}

function formatAirportSummary(airport: Airport | null, fallbackCode: string) {
    if (!airport) return fallbackCode;
    return `${airport.AirportCode} - ${airport.CityName}`;
}

const MAX_DATE = addDays(new Date(), 350);
const TODAY = new Date();
export default function Hero() {
    const router = useRouter();
    const [tripType, setTripType] = useState<TripType>("oneway");
    const [flightType, setFlightType] = useState<FlightType>("all");
    const [specialFare, setSpecialFare] = useState<SpecialFare>("regular");
    const [fromCode, setFromCode] = useState("");
    const [toCode, setToCode] = useState("");
    const [fromAirport, setFromAirport] = useState<Airport | null>(null);
    const [toAirport, setToAirport] = useState<Airport | null>(null);

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
const [hoveredFare, setHoveredFare] = useState<SpecialFare | null>(null);
    const fromRef = useRef<HTMLDivElement>(null);
    const toRef = useRef<HTMLDivElement>(null);
    const fromDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [departureDate, setDepartureDate] = useState<Date>(new Date());
    const [returnDate, setReturnDate] = useState<Date | null>(null);

    const [travelersOpen, setTravelersOpen] = useState(false);
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);
    const [cabinClass, setCabinClass] = useState<CabinClass>("economy");

    const travelersRef = useRef<HTMLDivElement>(null);

    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    useEffect(() => {
        function applyCachedSearch() {
            const cached = readCachedSearch();
            if (!cached) return;

            setTripType(cached.tripType);
            setFlightType(cached.flightType);
            setSpecialFare(cached.specialFare);
            setFromCode(cached.from);
            setToCode(cached.to);
            setFromAirport(cached.fromAirport);
            setToAirport(cached.toAirport);
            setAdults(cached.adults);
            setChildren(cached.children);
            setInfants(cached.infants);
            setCabinClass(cached.cabinClass);

            const cachedDeparture = new Date(cached.departureDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (!Number.isNaN(cachedDeparture.getTime()) && cachedDeparture >= today) {
                setDepartureDate(cachedDeparture);
            }
            if (cached.returnDate) {
                const cachedReturn = new Date(cached.returnDate);
                if (!Number.isNaN(cachedReturn.getTime()) && cachedReturn >= today) {
                    setReturnDate(cachedReturn);
                }
            }
        }


        applyCachedSearch();
        function handlePageShow(e: PageTransitionEvent) {
            if (e.persisted) applyCachedSearch();
        }
        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (travelersRef.current && !travelersRef.current.contains(e.target as Node)) {
                setTravelersOpen(false);
            }
            if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
                setFromOpen(false);
            }
            if (toRef.current && !toRef.current.contains(e.target as Node)) {
                setToOpen(false);
            }
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
                console.error("searchAirports (From) failed:", res.message);
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
                console.error("searchAirports (To) failed:", res.message);
            }
        }, 300);
        return () => {
            if (toDebounce.current) clearTimeout(toDebounce.current);
        };
    }, [toQuery]);

    const selectFromAirport = (airport: Airport) => {
        setFromCode(airport.AirportCode);
        setFromAirport(airport);
        setFromQuery("");
        setFromResults([]);
        setFromOpen(false);
    };

    const selectToAirport = (airport: Airport) => {
        setToCode(airport.AirportCode);
        setToAirport(airport);
        setToQuery("");
        setToResults([]);
        setToOpen(false);
    };

    const swapCities = () => {
        setFromCode(toCode);
        setToCode(fromCode);
        setFromAirport(toAirport);
        setToAirport(fromAirport);
    };

    const totalTravelers = adults + children + infants;
    const travelersSummary = `${totalTravelers} Traveler${totalTravelers > 1 ? "s" : ""}, ${CABIN_LABELS[cabinClass]}`;

    const maxAdults = Math.min(9 - children - infants, 9);
    const maxChildren = Math.min(adults * 2, 9 - adults - infants);
    const maxInfants = Math.min(adults, 9 - adults - children);

    const canSearch = Boolean(fromAirport && toAirport);

    const handleSearchFlights = async () => {
        if (!canSearch) return;
        setSearchError(null);
        setSearching(true);
        try {
            writeCachedSearch({
                tripType,
                flightType,
                specialFare,
                from: fromCode,
                to: toCode,
                fromCity: fromAirport?.CityName ?? "",
                toCity: toAirport?.CityName ?? "",
                fromAirport,
                toAirport,
                departureDate: formatApiDate(departureDate),
                returnDate: tripType === "roundtrip" && returnDate ? formatApiDate(returnDate) : null,
                adults,
                children,
                infants,
                cabinClass,
            });

            const params = new URLSearchParams({
                from: fromCode,
                to: toCode,
                fromCity: fromAirport?.CityName || fromCode,
                toCity: toAirport?.CityName || toCode,
                departureDate: formatApiDate(departureDate),
                tripType,
                adults: String(adults),
                children: String(children),
                infants: String(infants),
                cabinClass,
                specialFare,
                direct: flightType === "direct" ? "1" : "0",
            });
            if (tripType === "roundtrip" && returnDate) {
                params.set("returnDate", formatApiDate(returnDate));
            }

            router.push(`/flights-results?${params.toString()}`);
        } catch (err) {
            setSearchError("Something went wrong while searching flights.");
        } finally {
            setSearching(false);
        }
    };

    return (
        <section className="relative">
            <DatePickerBrandStyles />
            <AirportDropdownStyles />

            <div className="absolute inset-0 overflow-hidden" aria-hidden>
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
                />
                <div className="absolute inset-x-0 top-0 h-[95%] bg-gradient-to-b from-[#03a4d2]/70 via-[#03a4d2]/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-[35%] backdrop-blur-sm bg-gradient-to-b from-white/0 via-white/60 to-white/85" />
                <svg
                    className="pointer-events-none absolute -right-10 top-0 h-full w-[55%] max-w-2xl opacity-90"
                    viewBox="0 0 600 700"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M600 -20 L520 80 C480 260 420 420 320 560 L260 700 L360 700 C460 560 540 360 600 120 Z"
                        fill="#0d3f68"
                        fillOpacity="0.55"
                    />
                </svg>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-40 sm:pt-10 sm:pb-40">
                <div className="max-w-2xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 -mt-28 sm:-mt-32 pb-16">
                <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 lg:p-14 min-h-[420px]">
                    <div className="flex items-center gap-8 mb-8">
                        <div className="flex items-center gap-3">
    <button
        type="button"
        onClick={() => setTripType("oneway")}
        className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors ${
            tripType === "oneway"
                ? "border-[#1c8fc7] text-[#1c8fc7] bg-[#1c8fc7]/5"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
        }`}
    >
        One Way
    </button>
    <button
        type="button"
        onClick={() => setTripType("roundtrip")}
        className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors ${
            tripType === "roundtrip"
                ? "border-[#1c8fc7] text-[#1c8fc7] bg-[#1c8fc7]/5"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
        }`}
    >
        Round Trip
    </button>
</div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end gap-5">
                        <div className="relative w-full lg:flex-1 lg:min-w-0" ref={fromRef}>
                            <Field label="From" onClick={() => setFromOpen(true)} active={fromOpen}>
                                <input
                                    value={fromOpen ? fromQuery : formatAirportSummary(fromAirport, fromCode)}
                                    onChange={(e) => {
                                        setFromQuery(e.target.value.toUpperCase());
                                        setFromOpen(true);
                                    }}
                                    onFocus={() => {
                                        setFromOpen(true);
                                        setFromQuery("");
                                    }}
                                    placeholder="From"
                                    className="w-full bg-transparent text-base font-semibold text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-medium"
                                />
                            </Field>

                            {fromOpen && fromQuery.length > 0 && (
                                <AirportDropdown
                                    loading={fromLoading}
                                    results={fromResults}
                                    query={fromQuery}
                                    error={fromError}
                                    onSelect={selectFromAirport}
                                />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={swapCities}
                            aria-label="Swap origin and destination"
                            className="hidden lg:grid place-items-center w-9 h-9 rounded-full border border-gray-200 text-gray-400 hover:text-[#FF7626] hover:border-[#FF7626] transition self-center mb-2.5 shrink-0 mt-8"
                        >
                            <HiOutlineSwitchHorizontal className="w-4 h-4" />
                        </button>

                        <div className="relative w-full lg:flex-1 lg:min-w-0" ref={toRef}>
                            <Field label="To" onClick={() => setToOpen(true)} active={toOpen}>
                                <input
                                    value={toOpen ? toQuery : formatAirportSummary(toAirport, toCode)}
                                    onChange={(e) => {
                                        setToQuery(e.target.value.toUpperCase());
                                        setToOpen(true);
                                    }}
                                    onFocus={() => {
                                        setToOpen(true);
                                        setToQuery("");
                                    }}
                                    placeholder="To"
                                    className="w-full bg-transparent text-base font-semibold text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-medium"
                                />
                            </Field>

                            {toOpen && toQuery.length > 0 && (
                                <AirportDropdown
                                    loading={toLoading}
                                    results={toResults}
                                    query={toQuery}
                                    error={toError}
                                    onSelect={selectToAirport}
                                />
                            )}
                        </div>

                        <div className="w-full lg:flex-1 lg:min-w-0">
                            <DatePicker
                                selected={departureDate}
                                onChange={(date) => {
                                    if (!date) return;
                                    setDepartureDate(date);
                                    if (returnDate && returnDate < date) setReturnDate(null);
                                }}
                                minDate={new Date()}
                                maxDate={MAX_DATE}
                                monthsShown={2}
                                popperPlacement="bottom-start"
                                wrapperClassName="block w-full"
                                openToDate={TODAY}
                                customInput={
                                    <Field label="Departure">
                                        <div className="flex items-center justify-between">
                                            <span className="text-base font-semibold text-gray-900">
                                                {formatShort(departureDate)}
                                            </span>
                                            <HiOutlineCalendar className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </Field>
                                }
                            />
                        </div>

                        <div className="w-full lg:flex-1 lg:min-w-0">
   <DatePicker
    selected={returnDate}
    onChange={(date) => {
        setReturnDate(date);
        if (date) setTripType("roundtrip");
    }}
    minDate={departureDate}
    maxDate={MAX_DATE}
    monthsShown={2}
    popperPlacement="bottom-start"
    wrapperClassName="block w-full"
    openToDate={TODAY}
    customInput={
        <Field label="Return">
            <div className="flex items-center justify-between">
                <span
                    className={`text-base ${returnDate ? "font-semibold text-gray-900" : "font-medium text-gray-400"
                        }`}
                >
                    {returnDate ? formatShort(returnDate) : "Add return"}
                </span>
                {returnDate ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setReturnDate(null);
                            setTripType("oneway");
                        }}
                        aria-label="Remove return date"
                        className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                    >
                        <HiX className="w-4 h-4" />
                    </button>
                ) : (
                    <HiOutlineCalendar className="w-5 h-5 text-gray-400 shrink-0" />
                )}
            </div>
        </Field>
    }
/>
                        </div>

                        <div className="relative w-full lg:flex-[1.2] lg:min-w-0" ref={travelersRef}>
                            <Field
                                label="Travelers & class"
                                onClick={() => setTravelersOpen((v) => !v)}
                                active={travelersOpen}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-base font-semibold text-gray-900 whitespace-nowrap truncate">
                                        {travelersSummary}
                                    </span>
                                    <HiOutlineUser className="w-5 h-5 text-gray-400 shrink-0" />
                                </div>
                            </Field>

                            {travelersOpen && (
                                <div className="absolute right-0 top-full mt-1.5 w-[320px] max-w-[92vw] bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-50">
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
                                            <HiX className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <CounterRow
                                        title="Adults"
                                        subtitle="12 yrs or above"
                                        value={adults}
                                        options={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                                        disabledOptions={[1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n > maxAdults)}
                                        onChange={(v) => {
                                            setAdults(v);
                                            const newMaxChildren = Math.min(v * 2, 9 - v - infants);
                                            if (children > newMaxChildren) setChildren(newMaxChildren);
                                            const newMaxInfants = Math.min(v, 9 - v - children);
                                            if (infants > newMaxInfants) setInfants(newMaxInfants);
                                        }}
                                    />

                                    <CounterRow
                                        title="Children"
                                        subtitle="2-12 years"
                                        titleSuffix="(2y-12y)"
                                        value={children}
                                        options={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
                                        disabledOptions={[0, 1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n > maxChildren)}
                                        onChange={(v) => setChildren(v)}
                                    />

                                    <CounterRow
                                        title="Infants"
                                        subtitle="on the day of travel"
                                        titleSuffix="(below 2y)"
                                        value={infants}
                                        options={[0, 1, 2, 3, 4]}
                                        disabledOptions={[0, 1, 2, 3, 4].filter((n) => n > maxInfants)}
                                        onChange={(v) => setInfants(v)}
                                    />

                                    <div className="bg-gray-50 rounded-lg px-2 py-1.5 flex items-center justify-between gap-1.5 mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <HiOutlineUserGroup className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="text-xs text-gray-700">
                                                Planning a trip for more than 9 travellers?
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="text-xs font-semibold text-[#FF7626] whitespace-nowrap"
                                        >
                                            Create Group Booking
                                        </button>
                                    </div>

                                    <p className="text-xs font-semibold text-gray-900 mb-1.5">Cabin Class</p>
                                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                                        {CABIN_CLASSES.map((c) => {
                                            const selected = cabinClass === c.key;
                                            return (
                                                <button
                                                    key={c.key}
                                                    type="button"
                                                    onClick={() => setCabinClass(c.key)}
                                                    className={`rounded-lg border px-2 py-1 text-left transition-colors ${selected
                                                            ? "bg-[#0f8a3c] border-[#0f8a3c] text-white"
                                                            : "bg-white border-gray-200 text-gray-900 hover:border-gray-300"
                                                        }`}
                                                >
                                                    <p className="text-xs font-semibold">{c.label}</p>
                                                    <p
                                                        className={`text-[10px] leading-tight ${selected ? "text-white/85" : "text-gray-500"
                                                            }`}
                                                    >
                                                        {c.desc}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setTravelersOpen(false)}
                                        className="w-full h-8 rounded-lg bg-[#FF7626] text-white text-sm font-semibold hover:bg-[#e6661f] transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-9 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="flex flex-col gap-5">
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">Flight Type</p>
                                <div className="inline-flex rounded-lg border border-gray-200 p-1 gap-1">
                                    {FLIGHT_TYPES.map((f) => (
                                        <button
                                            key={f.key}
                                            type="button"
                                            onClick={() => setFlightType(f.key)}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${flightType === f.key
                                                    ? "bg-[#FF7626] text-white"
                                                    : "text-gray-600 hover:bg-gray-50"
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

 <div className="flex items-center flex-wrap gap-2">
    <span className="text-sm font-semibold text-gray-900">Special Fares</span>
    <span className="text-xs text-gray-400 mr-1">(Optional)</span>
    {SPECIAL_FARES.map((f) => {
        const selected = specialFare === f.key;
        return (
            <div
                key={f.key}
                className="relative"
                onMouseEnter={() => setHoveredFare(f.key)}
                onMouseLeave={() => setHoveredFare(null)}
            >
                <button
                    type="button"
                    onClick={() => setSpecialFare(selected ? "regular" : f.key)}
                    className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                        selected
                            ? "border-[#FF7626] text-[#FF7626] bg-[#FF7626]/5"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                >
                    <span className="flex items-center gap-1.5">
                       {f.label}
                       {selected && <HiX className="w-3.5 h-3.5" />}
                   </span>
                </button>

                {hoveredFare === f.key && (
                    <div className="absolute left-0 top-full mt-2 z-50 w-64 animate-in fade-in duration-150">
                        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-start gap-2">
                            <span className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />
                            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                i
                            </span>
                            <p className="text-sm font-medium text-red-500 leading-snug">
                                {SPECIAL_FARE_INFO[f.key]}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    })}
</div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                            {searchError && (
                                <p className="text-sm text-red-600 max-w-xs text-right">{searchError}</p>
                            )}
                            {!canSearch && (
                                <p className="text-xs text-gray-400 max-w-xs text-right">
                                    Select airport in From and To for search
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={handleSearchFlights}
                                disabled={searching || !canSearch}
                                className="inline-flex items-center justify-center gap-2 h-14 px-9 rounded-full bg-[#FF7626] text-white font-semibold text-base hover:bg-[#e6661f] transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {searching ? "Searching..." : "Search Flights"}
                                {!searching && <span className="text-lg leading-none">+</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function RadioPill({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className="flex items-center gap-2">
            <span
                className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${checked ? "border-[#FF7626]" : "border-gray-300"
                    }`}
            >
                {checked && <span className="w-2 h-2 rounded-full bg-[#FF7626]" />}
            </span>
            <span className="text-sm font-medium text-gray-900">{label}</span>
        </button>
    );
}

type FieldProps = {
    label: string;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    active?: boolean;
};

const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
    { label, children, disabled, active, ...rest },
    ref
) {
    return (
        <div className="w-full">
            <p className="text-sm font-medium text-gray-600 mb-1.5 whitespace-nowrap">{label}</p>
            <div
                ref={ref}
                {...rest}
                className={`bg-gray-50 border rounded-xl px-5 py-3.5 transition-colors ${active ? "border-[#1c8fc7] ring-2 ring-[#1c8fc7]/20" : "border-gray-200"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-300"}`}
            >
                {children}
            </div>
        </div>
    );
});

type AirportDropdownProps = {
    loading: boolean;
    results: Airport[];
    query: string;
    error?: string | null;
    onSelect: (airport: Airport) => void;
};

function AirportDropdown({ loading, results, query, error, onSelect }: AirportDropdownProps) {
    return (
        <div className="airport-scrollbar absolute left-0 right-0 top-full mt-2 min-w-full w-[370px] bg-white rounded-2xl shadow-xl border border-gray-100 max-h-72 overflow-y-auto z-50">
            {loading && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#1c8fc7] animate-spin" />
                    Searching airports...
                </div>
            )}

            {!loading && error && (
                <div className="px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            {!loading && !error && results.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400">No airports found for &ldquo;{query}&rdquo;</div>
            )}

            {!loading && (
                <div className="divide-y divide-gray-100">
                {results.map((airport, idx) => (
    <button
        key={`${airport.AirportCode}-${airport.CityCode}-${idx}`}
        type="button"
        onClick={() => onSelect(airport)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold flex items-center justify-center shrink-0">
                                {airport.AirportCode}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {formatAirportLocation(airport)}
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

function AirportDropdownStyles() {
    return (
        <style>{`
            .airport-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: #cbd5e1 transparent;
            }
            .airport-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .airport-scrollbar::-webkit-scrollbar-track {
                background: transparent;
                margin: 8px 0;
            }
            .airport-scrollbar::-webkit-scrollbar-thumb {
                background-color: #cbd5e1;
                border-radius: 9999px;
            }
            .airport-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: #1c8fc7;
            }
        `}</style>
    );
}

type CounterRowProps = {
    title: string;
    subtitle: string;
    titleSuffix?: string;
    value: number;
    options: number[];
    disabledOptions?: number[];
    onChange: (value: number) => void;
};

function CounterRow({ title, subtitle, titleSuffix, value, options, disabledOptions = [], onChange }: CounterRowProps) {
    return (
        <div className="mb-1.5">
            <p className="text-xs font-semibold text-gray-900 leading-tight">
                {title}
                {titleSuffix && <span className="font-normal text-gray-400 ml-0.5 text-[10px]">{titleSuffix}</span>}
            </p>
            <p className="text-[10px] text-gray-400 mb-1">{subtitle}</p>
            <div className="flex flex-wrap gap-1">
                {options.map((opt) => {
                    const selected = value === opt;
                    const disabled = disabledOptions.includes(opt);
                    return (
                        <button
                            key={opt}
                            type="button"
                            disabled={disabled}
                            onClick={() => !disabled && onChange(opt)}
                            className={`w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center transition-colors ${disabled
                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    : selected
                                        ? "bg-[#FF7626] text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}