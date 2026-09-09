"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    HiOutlineChevronLeft,
    HiOutlineChevronDown,
    HiOutlineArrowRight,
    HiOutlinePaperAirplane,
} from "react-icons/hi2";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { getAirlineSSR } from "@/app/lib/flightsapi";
import AirlineLogo from "@/app/components/flights/AirlineLogo";

export type AddOnPassenger = {
    id: string;
    label: string;
    type: "ADT" | "CHD" | "INF";
};

type SSROption = { code: string; desc: string; charge: number; paxType: string; type: string };
type Segment = {
    sid: string;
    flightNo: string;
    airlineCode: string;
    airlineName: string;
    vacLogo?: string;
    macLogo?: string;
    oacLogo?: string;
    from: string;
    to: string;
    fromCity: string;
    toCity: string;
    departureTime: string;
    arrivalTime: string;
    mealOptions: SSROption[];
};
type Leg = {
    from: string;
    to: string;
    fromName: string;
    toName: string;
    duration: string;
    baggageOptions: SSROption[];
    segments: Segment[];
};

type BaggageSelection = Record<string, Record<number, string | null>>;

type MealSelection = Record<string, Record<string, string | null>>;

export type FareDisplayType = "P" | "G" | "S" | "N";

export type FlightAddOnsProps = {
    tokenId: string;
    bookingId: string;
    passengers: AddOnPassenger[];
    tripSummary: { from: string; to: string; date: string; isRoundtrip: boolean };
    baseFareTotal: number;
    baseFare?: number;
    taxTotal?: number;
    grossFareTotal?: number;
    netFareTotal?: number;
    fareDisplayType?: FareDisplayType;
    onBack: () => void;
    onContinue: (data: {
        addOnTotal: number;
        selections: {
            passengerId: string;
            paxId: number;
            code: string;
            charge: number;
            label: string;
            sid: string | number;
            ssrType: string;
        }[];
    }) => void;
};

function formatPrice(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function optionsForPax(options: SSROption[], paxType: string) {
    return options.filter((o) => o.paxType === paxType);
}

function formatDateLabel(iso: string | undefined) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" });
}

function formatTimeLabel(iso: string | undefined) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function FlightAddOns({
    tokenId,
    bookingId,
    passengers,
    tripSummary,
    baseFareTotal,
    baseFare,
    taxTotal,
    grossFareTotal,
    netFareTotal,
    fareDisplayType = "P",
    onBack,
    onContinue,
}: FlightAddOnsProps) {

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "instant",
        });
    }, []);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [legs, setLegs] = useState<Leg[]>([]);

    const [activeLegIndex, setActiveLegIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<"meal" | "baggage">("meal");
    const [activePassengerId, setActivePassengerId] = useState(passengers[0]?.id ?? "");
    const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
    const [baggage, setBaggage] = useState<BaggageSelection>({});
    const [meals, setMeals] = useState<MealSelection>({});
    const [addOnsExpanded, setAddOnsExpanded] = useState(true);
    const hasFetchedSSR = useRef(false);

    const activeLeg = legs[activeLegIndex];

    const autoSkipped = useRef(false);

    const hasAnyBaggage = useMemo(
        () => legs.some((l) => l.baggageOptions.length > 0),
        [legs]
    );
    const hasAnyMeals = useMemo(
        () => legs.some((l) => l.segments.some((s) => s.mealOptions.length > 0)),
        [legs]
    );


    const legsToShow = useMemo(() => {
        return legs
            .map((leg, i) => ({ leg, i }))
            .filter(({ leg }) =>
                activeTab === "baggage"
                    ? leg.baggageOptions.length > 0
                    : leg.segments.some((s) => s.mealOptions.length > 0)
            );
    }, [legs, activeTab]);

    const availableMealSegments = useMemo(() => {
        if (!activeLeg) return [];
        const paxType = passengers.find((p) => p.id === activePassengerId)?.type ?? "ADT";
        return activeLeg.segments
            .map((seg, i) => ({ seg, i }))
            .filter(({ seg }) => optionsForPax(seg.mealOptions, paxType).length > 0);
    }, [activeLeg, activePassengerId, passengers]);

    useEffect(() => {
        if (activeTab === "baggage" && !hasAnyBaggage && hasAnyMeals) {
            setActiveTab("meal");
        } else if (activeTab === "meal" && !hasAnyMeals && hasAnyBaggage) {
            setActiveTab("baggage");
        }
    }, [activeTab, hasAnyBaggage, hasAnyMeals]);


    useEffect(() => {
        if (legsToShow.length === 0) return;
        const stillValid = legsToShow.some(({ i }) => i === activeLegIndex);
        if (!stillValid) {
            setActiveLegIndex(legsToShow[0].i);
        }
    }, [activeTab, legsToShow, activeLegIndex]);

    useEffect(() => {
        if (loading || error || legs.length === 0 || autoSkipped.current) return;

        const hasBaggage = legs.some((leg) => leg.baggageOptions.length > 0);
        const hasMeals = legs.some((leg) =>
            leg.segments.some((seg) => seg.mealOptions.length > 0)
        );

        if (!hasBaggage && !hasMeals) {
            autoSkipped.current = true;
            onContinue({ addOnTotal: 0, selections: [] });
        }
    }, [legs, loading, error, onContinue]);

    useEffect(() => {
        if (hasFetchedSSR.current) return;
        hasFetchedSSR.current = true;

        async function load() {
            setLoading(true);
            setError(null);
            const res = await getAirlineSSR({ tokenId, bookingId });
            setLoading(false);
            if (!res.success) {
                setError(res.message || "Could not fetch add-on options.");
                return;
            }
            setLegs(res.legs as Leg[]);
        }
        load();
    }, [tokenId, bookingId]);


    useEffect(() => {
        if (availableMealSegments.length === 0) {
            setActiveSegmentIndex(0);
            return;
        }
        const stillValid = availableMealSegments.some((s) => s.i === activeSegmentIndex);
        if (!stillValid) {
            setActiveSegmentIndex(availableMealSegments[0].i);
        }
    }, [activeLegIndex, activePassengerId, availableMealSegments]);

    function toggleBaggage(passengerId: string, legIndex: number, code: string) {
        setBaggage((prev) => {
            const current = prev[passengerId]?.[legIndex] ?? null;
            return {
                ...prev,
                [passengerId]: {
                    ...prev[passengerId],
                    [legIndex]: current === code ? null : code, 
                },
            };
        });
    }


    function toggleMeal(passengerId: string, sid: string, code: string) {
        setMeals((prev) => {
            const current = prev[passengerId]?.[sid] ?? null;
            return {
                ...prev,
                [passengerId]: {
                    ...prev[passengerId],
                    [sid]: current === code ? null : code,
                },
            };
        });
    }

    const selectionList = useMemo(() => {
        const list: {
            passengerId: string;
            paxId: number;
            code: string;
            charge: number;
            label: string;
            desc: string;
            sid: string | number;
            ssrType: string;
        }[] = [];

        legs.forEach((leg, legIndex) => {
            passengers.forEach((p, paxIdx) => {
                const selectedCode = baggage[p.id]?.[legIndex];
                if (!selectedCode) return;
                const opt = leg.baggageOptions.find((o) => o.code === selectedCode);
                if (opt) {
                    list.push({
                        passengerId: p.id,
                        paxId: paxIdx + 1,
                        code: opt.code,
                        charge: opt.charge,
                        label: `${leg.from}-${leg.to} · ${opt.desc}`,
                        desc: opt.desc,
                        sid: leg.segments[0]?.sid ?? 1,
                        ssrType: "2",
                    });
                }
            });


            leg.segments.forEach((seg) => {
                passengers.forEach((p, paxIdx) => {
                    const code = meals[p.id]?.[seg.sid];
                    if (!code) return;
                    const opt = seg.mealOptions.find((o) => o.code === code);
                    if (opt) {
                        list.push({
                            passengerId: p.id,
                            paxId: paxIdx + 1,
                            code: opt.code,
                            charge: opt.charge,
                            label: `${seg.from}-${seg.to} · ${opt.desc}`,
                            desc: opt.desc,
                            sid: seg.sid,
                            ssrType: "1",
                        });
                    }
                });
            });
        });

        return list;
    }, [legs, passengers, baggage, meals]);

    const addOnTotal = selectionList.reduce((sum, s) => sum + s.charge, 0);

    // FareDisplayType
    //  "G" -> Gross fare only
    //  "N" -> Net fare only
    //  "S" -> Gross fare struck through
    //  "P" -> discount + strike-through only if discounted
    const hasBreakdownFields =
        typeof baseFare === "number" &&
        typeof taxTotal === "number" &&
        typeof grossFareTotal === "number" &&
        typeof netFareTotal === "number";

    const discountTotal =
        hasBreakdownFields ? Math.max(0, (grossFareTotal as number) - (netFareTotal as number)) : 0;

    const showBreakdown = hasBreakdownFields && fareDisplayType !== "N";
    const showDiscountRow =
        hasBreakdownFields &&
        (fareDisplayType === "P" || fareDisplayType === "S") &&
        discountTotal > 0;
    const showStrikeThru = hasBreakdownFields
        ? fareDisplayType === "S"
            ? true
            : fareDisplayType === "P"
              ? discountTotal > 0
              : false
        : false;

    const flightPayable = baseFareTotal;
    const grandTotal = flightPayable + addOnTotal;

    if (loading) {
        return (
            <div className="min-h-screen bg-dark dark:bg-gray-900 border-b border-gray-200 flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
                    <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                    Fetching baggage &amp; meal options...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-8 py-4 flex items-center gap-3">
                <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    <HiOutlineChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
                <div>
                    <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">Customize your trip</h1>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Add baggage and meals for each traveller</p>
                </div>
            </div>

            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[850px_1fr] gap-6 items-start">
              {/* Left column */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 min-w-0 order-1 lg:order-1">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                        {(() => {
                            const tabs = (["meal", "baggage"] as const).filter((t) =>
                                t === "baggage" ? hasAnyBaggage : hasAnyMeals
                            );
                            return (
                                <>
                                    {tabs.length > 1 ? (
                                        <div className="flex gap-5">
                                            {tabs.map((tab) => (
                                                <button
                                                    key={tab}
                                                    type="button"
                                                    onClick={() => setActiveTab(tab)}
                                                    className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                                                        activeTab === tab
                                                            ? "text-[#1c8fc7] border-[#1c8fc7]"
                                                            : "text-gray-400 dark:text-gray-500 border-transparent"
                                                    }`}
                                                >
                                                    {tab === "baggage" ? "Baggage" : "Meal"}
                                                </button>
                                            ))}
                                        </div>
                                    ) : tabs.length === 1 ? (
                                        <div className="flex gap-5">
                                            <span className="text-sm font-semibold pb-2 border-b-2 border-[#1c8fc7] text-[#1c8fc7]">
                                                {tabs[0] === "baggage" ? "Baggage" : "Meal"}
                                            </span>
                                        </div>
                                    ) : null}

                                    {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
                                </>
                            );
                        })()}
                    </div>

                 {(legsToShow.length > 1 || (activeTab === "meal" && availableMealSegments.length > 1)) && (
    <div className="flex flex-col gap-3 mb-4">
        {/* Parent flight / leg options — different UI (not round pills) */}
        {legsToShow.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto flex-nowrap scrollbar-hide">
                {legsToShow.map(({ leg, i }) => (
                    <button
                        key={`leg-${i}`}
                        type="button"
                        onClick={() => setActiveLegIndex(i)}
                        className={`text-xs font-semibold px-3 py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                            activeLegIndex === i
                                ? "text-[#1c8fc7] border-[#1c8fc7]"
                                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                    >
                        {leg.from}-{leg.to}
                    </button>
                ))}
            </div>
        )}

        {/* Segment options for meals — appear in the next row */}
        {activeTab === "meal" && availableMealSegments.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto flex-nowrap scrollbar-hide">
                {availableMealSegments.map(({ seg, i }) => (
                    <button
                        key={`seg-${seg.sid}`}
                        type="button"
                        onClick={() => setActiveSegmentIndex(i)}
                        className={`text-xs font-semibold rounded-full px-4 py-1.5 border transition-colors whitespace-nowrap shrink-0 ${
                            activeSegmentIndex === i
                                ? "bg-[#1c8fc7] text-white border-[#1c8fc7]"
                                : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                        }`}
                    >
                        {seg.from}-{seg.to}
                    </button>
                ))}
            </div>
        )}
    </div>
)}

                    {passengers.length > 1 && (
                        <div className="flex gap-2 mb-5 flex-wrap">
                            {passengers.map((p) => {
                                const count =
                                    activeTab === "baggage"
                                        ? baggage[p.id]?.[activeLegIndex]
                                            ? 1
                                            : 0
                                        : (activeLeg?.segments ?? []).filter(
                                              (seg) => meals[p.id]?.[seg.sid]
                                          ).length;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setActivePassengerId(p.id)}
                                        className={`text-xs font-semibold rounded-full px-4 py-1.5 border transition-colors ${
                                            activePassengerId === p.id
                                                ? "bg-[#1c8fc7] text-white border-[#1c8fc7]"
                                                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                                        }`}
                                    >
                                        {p.label}
                                        {count > 0 && (
                                            <span className="ml-1">
                                                · {count} {activeTab === "baggage" ? "Bag" : "Meal"}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!activeLeg && !error && (
                        <p className="text-sm text-gray-400 dark:text-gray-500">No add-ons are available for this fare.</p>
                    )}

                    {activeLeg && activeTab === "baggage" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {optionsForPax(
                                activeLeg.baggageOptions,
                                passengers.find((p) => p.id === activePassengerId)?.type ?? "ADT"
                            ).map((opt) => {
                                const selected = baggage[activePassengerId]?.[activeLegIndex] === opt.code;
                                return (
                                    <div
                                        key={opt.code}
                                        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                                            selected
                                                ? "border-[#1c8fc7] bg-[#e8f4fb] dark:bg-gray-900"
                                                : "border-gray-200 dark:border-gray-700"
                                        }`}
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{opt.desc}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{formatPrice(opt.charge)}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleBaggage(activePassengerId, activeLegIndex, opt.code)}
                                            className={`text-xs font-semibold rounded-full px-4 py-1.5 border shrink-0 transition-colors ${
                                                selected
                                                    ? "border-[#FF7626] text-[#FF7626] bg-white dark:bg-gray-900"
                                                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                        >
                                            {selected ? "Remove" : "Add"}
                                        </button>
                                    </div>
                                );
                            })}
                            {optionsForPax(
                                activeLeg.baggageOptions,
                                passengers.find((p) => p.id === activePassengerId)?.type ?? "ADT"
                            ).length === 0 && (
                                <p className="text-sm text-gray-400 dark:text-gray-500 sm:col-span-2">
                                    No baggage add-ons available for this traveller.
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === "meal" &&
    activeLeg &&
    (() => {
        const seg = activeLeg.segments[activeSegmentIndex];
        if (!seg) return null;
        const paxType = passengers.find((p) => p.id === activePassengerId)?.type ?? "ADT";
        const options = optionsForPax(seg.mealOptions, paxType);
        const selectedCode = meals[activePassengerId]?.[seg.sid] ?? null;

        if (options.length === 0) {
            return (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                    No meal add-ons available on this segment.
                </p>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {options.map((opt) => {
                    const selected = selectedCode === opt.code;
                    return (
                        <div
                            key={opt.code}
                            className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-b-0"
                        >
                            {/* Generic placeholder — API doesn't return per-meal imagery */}
                            <div
                                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base shrink-0"
                                aria-hidden="true"
                            >
                                🍽️
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate uppercase tracking-tight">
                                    {opt.desc}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{formatPrice(opt.charge)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleMeal(activePassengerId, seg.sid, opt.code)}
                                className={`text-xs font-semibold rounded-md px-4 py-1.5 border shrink-0 transition-colors ${
                                    selected
                                        ? "border-[#FF7626] text-[#FF7626] bg-white dark:bg-gray-900"
                                        : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                            >
                                {selected ? "Remove" : "Add"}
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    })()}
                </div>
               
                {/* Right column */}
                <div className="space-y-5 order-1 lg:order-1">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Your Flight</span>
                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                                {tripSummary.isRoundtrip ? "Round Trip" : "One Way"}
                            </span>
                        </div>

                        <div className="space-y-4">
                                                                                 {legs.map((leg, i) => {
                                const firstSeg = leg.segments[0];
                                const lastSeg = leg.segments[leg.segments.length - 1];
                                const stops = leg.segments.length - 1;
                                return (
                                    <div key={`itinerary-${i}`}>
                                        {i > 0 && <div className="h-px bg-gray-100 dark:bg-gray-800 my-4" />}

                                        {firstSeg && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <AirlineLogo
                                                    seg={{
                                                        VACLogo: firstSeg.vacLogo,
                                                        MACLogo: firstSeg.macLogo,
                                                        OACLogo: firstSeg.oacLogo,
                                                    }}
                                                    code={firstSeg.airlineCode}
                                                    className="w-5 h-5"
                                                />
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    {firstSeg.airlineName}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    · {firstSeg.airlineCode}-{firstSeg.flightNo}
                                                </span>
                                            </div>
                                        )}

                                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">
                                            {formatDateLabel(firstSeg?.departureTime)}
                                        </p>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                    {formatTimeLabel(firstSeg?.departureTime)}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{leg.from}</p>
                                            </div>
                                            <div className="flex-1 flex flex-col items-center pt-1.5">
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500">{leg.duration}</span>
                                                <div className="w-full flex items-center gap-1 my-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                                                    <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                                    <HiOutlinePaperAirplane className="w-3 h-3 text-[#1c8fc7] -rotate-45 shrink-0" />
                                                    <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                                                </div>
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                                    {stops > 0 ? `${stops} stop${stops > 1 ? "s" : ""}` : "Nonstop"}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                    {formatTimeLabel(lastSeg?.arrivalTime)}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{leg.to}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {legs.length === 0 && (
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    <HiOutlinePaperAirplane className="w-4 h-4 text-[#1c8fc7] -rotate-45" />
                                    {tripSummary.from} <HiOutlineArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" /> {tripSummary.to}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Travellers</p>
                        <ul className="space-y-1.5">
                            {passengers.map((p, i) => (
                                <li key={p.id} className="text-xs text-gray-600 dark:text-gray-300">
                                    {i + 1}. {p.label} <span className="text-gray-400 dark:text-gray-500">({p.type})</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Fare Summary</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                {passengers.length} Traveller{passengers.length > 1 ? "s" : ""}
                            </span>
                        </div>

                        {showBreakdown && (
                            <div className="space-y-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between text-sm leading-[1.4]">
                                    <span className="text-gray-500 dark:text-gray-400">Base fare</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {formatPrice(baseFare as number)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm leading-[1.4]">
                                    <span className="text-gray-500 dark:text-gray-400">Taxes &amp; fees</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {formatPrice(taxTotal as number)}
                                    </span>
                                </div>
                                {showDiscountRow && (
                                    <div className="flex items-center justify-between text-sm leading-[1.4]">
                                        <span className="text-gray-500 dark:text-gray-400">Discount</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            -{formatPrice(discountTotal)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Fallback single line when breakdown fields are not passed */}
                        {!showBreakdown && (
                            <div className="flex items-center justify-between text-sm pb-3 border-b border-gray-100 dark:border-gray-800">
                                <span className="text-gray-500 dark:text-gray-400">Base fare + taxes</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {formatPrice(flightPayable)}
                                </span>
                            </div>
                        )}

                        {/* Add-ons row (collapsible) */}
                        <div className="pt-3">
                            <button
                                type="button"
                                onClick={() => setAddOnsExpanded((v) => !v)}
                                disabled={selectionList.length === 0}
                                className="w-full flex items-center justify-between disabled:cursor-default text-sm"
                            >
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    Add-ons{" "}
                                    {selectionList.length > 0 && (
                                        <HiOutlineChevronDown
                                            className={`w-3 h-3 transition-transform ${addOnsExpanded ? "rotate-180" : ""}`}
                                        />
                                    )}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {formatPrice(addOnTotal)}
                                </span>
                            </button>
                            {selectionList.length > 0 && addOnsExpanded && (
                                <ul className="mt-1.5 space-y-1">
                                    {selectionList.map((s, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500"
                                        >
                                            <span className="truncate pr-2">{s.label}</span>
                                            <span className="shrink-0">{formatPrice(s.charge)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Total with optional strikethrough on gross (same as ReviewBooking) */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                    Total Amount
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-[1.4]">
                                    Incl. all taxes &amp; fees
                                </p>
                            </div>
                            <div className="text-right">
                                {showStrikeThru && (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 line-through leading-[1.4]">
                                        {formatPrice((grossFareTotal as number) + addOnTotal)}
                                    </p>
                                )}
                                <p className="text-lg font-bold text-[#1c8fc7] leading-tight">
                                    {formatPrice(grandTotal)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

       
            <div className="sticky bottom-0 z-40 w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                   <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] rounded-2xl py-4 px-4 flex items-center justify-between gap-4 mb-4">
                        <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {formatPrice(grandTotal)}{" "}
                                {(showStrikeThru || addOnTotal > 0) && (
                                    <span className="text-sm text-gray-400 dark:text-gray-500 line-through ml-1">
                                        {formatPrice(
                                            showStrikeThru
                                                ? (grossFareTotal as number) + addOnTotal
                                                : flightPayable
                                        )}
                                    </span>
                                )}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                {passengers.length} Traveller{passengers.length > 1 ? "s" : ""}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onContinue({ addOnTotal, selections: selectionList })}
                            className="h-12 px-6 rounded-full text-sm font-bold flex items-center gap-2 bg-[#FF7626] hover:bg-[#e6661f] text-white transition-colors"
                        >
                            Next <HiOutlineArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}