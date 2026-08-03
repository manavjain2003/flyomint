"use client";

import { useEffect, useMemo, useState } from "react";
import {
    HiOutlineChevronLeft,
    HiOutlineChevronDown,
    HiOutlineArrowRight,
    HiOutlinePaperAirplane,
} from "react-icons/hi2";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { getAirlineSSR } from "@/app/lib/flightsapi";

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
type MealSelection = Record<string, Record<string, Set<string>>>;

export type FlightAddOnsProps = {
    tokenId: string;
    bookingId: string;
    passengers: AddOnPassenger[];
    tripSummary: { from: string; to: string; date: string; isRoundtrip: boolean };
    baseFareTotal: number;
    onBack: () => void;
    onContinue: (data: { addOnTotal: number; selections: { passengerId: string; code: string; charge: number; label: string }[] }) => void;
};

function formatPrice(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function optionsForPax(options: SSROption[], paxType: string) {
    return options.filter((o) => o.paxType === paxType);
}

export default function FlightAddOns({
    tokenId,
    bookingId,
    passengers,
    tripSummary,
    baseFareTotal,
    onBack,
    onContinue,
}: FlightAddOnsProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [legs, setLegs] = useState<Leg[]>([]);

    const [activeLegIndex, setActiveLegIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<"baggage" | "meal">("meal");
    const [activePassengerId, setActivePassengerId] = useState(passengers[0]?.id ?? "");

    const [baggage, setBaggage] = useState<BaggageSelection>({});
    const [meals, setMeals] = useState<MealSelection>({});

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            const res = await getAirlineSSR({ tokenId, bookingId });
            if (cancelled) return;
            setLoading(false);
            if (!res.success) {
                setError(res.message || "Could not fetch add-on options.");
                return;
            }
            setLegs(res.legs as Leg[]);
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [tokenId, bookingId]);

    const activeLeg = legs[activeLegIndex];

    function toggleBaggage(passengerId: string, legIndex: number, code: string) {
        setBaggage((prev) => {
            const current = prev[passengerId]?.[legIndex] ?? null;
            return {
                ...prev,
                [passengerId]: {
                    ...prev[passengerId],
                    [legIndex]: current === code ? null : code, // re-clicking the same tier removes it
                },
            };
        });
    }

    function toggleMeal(passengerId: string, sid: string, code: string) {
        setMeals((prev) => {
            const existing = new Set(prev[passengerId]?.[sid] ?? []);
            if (existing.has(code)) existing.delete(code);
            else existing.add(code);
            return {
                ...prev,
                [passengerId]: {
                    ...prev[passengerId],
                    [sid]: existing,
                },
            };
        });
    }

    // Flatten all selections into a priced list for the summary + parent callback
    const selectionList = useMemo(() => {
        const list: { passengerId: string; code: string; charge: number; label: string }[] = [];

        legs.forEach((leg, legIndex) => {
            passengers.forEach((p) => {
                const selectedCode = baggage[p.id]?.[legIndex];
                if (!selectedCode) return;
                const opt = leg.baggageOptions.find((o) => o.code === selectedCode);
                if (opt) list.push({ passengerId: p.id, code: opt.code, charge: opt.charge, label: `${p.label} · ${leg.from}-${leg.to} · ${opt.desc}` });
            });

            leg.segments.forEach((seg) => {
                passengers.forEach((p) => {
                    const codes = meals[p.id]?.[seg.sid];
                    if (!codes || codes.size === 0) return;
                    codes.forEach((code) => {
                        const opt = seg.mealOptions.find((o) => o.code === code);
                        if (opt) list.push({ passengerId: p.id, code: opt.code, charge: opt.charge, label: `${p.label} · ${seg.from}-${seg.to} · ${opt.desc}` });
                    });
                });
            });
        });

        return list;
    }, [legs, passengers, baggage, meals]);

    const addOnTotal = selectionList.reduce((sum, s) => sum + s.charge, 0);
    const grandTotal = baseFareTotal + addOnTotal;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f8fb] flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                    Fetching baggage &amp; meal options...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f8fb] pb-28">
            <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center gap-3">
                <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-700">
                    <HiOutlineChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="w-px h-8 bg-gray-200 hidden sm:block" />
                <div>
                    <h1 className="text-base font-bold text-gray-900 leading-tight">Customize your trip</h1>
                    <p className="text-xs text-gray-400">Add baggage and meals for each traveller</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                {/* Left column */}
                <div className="space-y-5">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-900">Your Flight</span>
                            <span className="text-xs font-semibold text-gray-400">{tripSummary.isRoundtrip ? "Round Trip" : "One Way"}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{tripSummary.date}</p>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <HiOutlinePaperAirplane className="w-4 h-4 text-[#1c8fc7] -rotate-45" />
                            {tripSummary.from} <HiOutlineArrowRight className="w-3.5 h-3.5 text-gray-300" /> {tripSummary.to}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <p className="text-sm font-bold text-gray-900 mb-3">Travellers</p>
                        <ul className="space-y-1.5">
                            {passengers.map((p, i) => (
                                <li key={p.id} className="text-xs text-gray-600">
                                    {i + 1}. {p.label} <span className="text-gray-400">({p.type})</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-900">Fare Summary</span>
                            <span className="text-xs text-gray-400">{passengers.length} Traveller{passengers.length > 1 ? "s" : ""}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Base fare + taxes</span>
                                <span className="font-semibold text-gray-900">{formatPrice(baseFareTotal)}</span>
                            </div>
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 flex items-center gap-1">
                                        Add-ons <HiOutlineChevronDown className="w-3 h-3" />
                                    </span>
                                    <span className="font-semibold text-gray-900">{formatPrice(addOnTotal)}</span>
                                </div>
                                {selectionList.length > 0 && (
                                    <ul className="mt-1.5 space-y-1">
                                        {selectionList.map((s, i) => (
                                            <li key={i} className="flex items-center justify-between text-[11px] text-gray-400">
                                                <span className="truncate pr-2">{s.label}</span>
                                                <span className="shrink-0">{formatPrice(s.charge)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                            <span className="text-sm font-bold text-gray-900">Total Amount</span>
                            <span className="text-lg font-bold text-[#1c8fc7]">{formatPrice(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <div className="flex gap-2">
                            {(["baggage", "meal"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                                        activeTab === tab ? "text-[#1c8fc7] border-[#1c8fc7]" : "text-gray-400 border-transparent"
                                    }`}
                                >
                                    {tab === "baggage" ? "Baggage" : "Meal"}
                                </button>
                            ))}
                        </div>

                        {error && <p className="text-xs text-red-600">{error}</p>}
                    </div>

                    {legs.length > 1 && (
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {legs.map((leg, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setActiveLegIndex(i)}
                                    className={`text-xs font-semibold rounded-full px-4 py-1.5 border transition-colors ${
                                        activeLegIndex === i
                                            ? "bg-[#e8f4fb] text-[#1c8fc7] border-[#1c8fc7]"
                                            : "bg-white text-gray-500 border-gray-200"
                                    }`}
                                >
                                    {leg.from}-{leg.to}
                                </button>
                            ))}
                        </div>
                    )}

                    {passengers.length > 1 && (
                        <div className="flex gap-2 mb-5 flex-wrap">
                            {passengers.map((p) => {
                                const count =
                                    activeTab === "baggage"
                                        ? (baggage[p.id]?.[activeLegIndex] ? 1 : 0)
                                        : (activeLeg?.segments ?? []).reduce(
                                              (sum, seg) => sum + (meals[p.id]?.[seg.sid]?.size ?? 0),
                                              0
                                          );
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setActivePassengerId(p.id)}
                                        className={`text-xs font-semibold rounded-full px-4 py-1.5 border transition-colors ${
                                            activePassengerId === p.id
                                                ? "bg-[#1c8fc7] text-white border-[#1c8fc7]"
                                                : "bg-white text-gray-600 border-gray-200"
                                        }`}
                                    >
                                        {p.label}
                                        {count > 0 && <span className="ml-1">· {count} {activeTab === "baggage" ? "Bag" : "Meal"}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!activeLeg && !error && (
                        <p className="text-sm text-gray-400">No add-ons are available for this fare.</p>
                    )}

                    {activeLeg && activeTab === "baggage" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {optionsForPax(activeLeg.baggageOptions, passengers.find((p) => p.id === activePassengerId)?.type ?? "ADT").map((opt) => {
                                const selected = baggage[activePassengerId]?.[activeLegIndex] === opt.code;
                                return (
                                    <div
                                        key={opt.code}
                                        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                                            selected ? "border-[#1c8fc7] bg-[#e8f4fb]" : "border-gray-200"
                                        }`}
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{opt.desc}</p>
                                            <p className="text-xs text-gray-400">{formatPrice(opt.charge)}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleBaggage(activePassengerId, activeLegIndex, opt.code)}
                                            className={`text-xs font-semibold rounded-full px-4 py-1.5 border shrink-0 transition-colors ${
                                                selected
                                                    ? "border-[#FF7626] text-[#FF7626] bg-white"
                                                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            {selected ? "Remove" : "Add"}
                                        </button>
                                    </div>
                                );
                            })}
                            {optionsForPax(activeLeg.baggageOptions, passengers.find((p) => p.id === activePassengerId)?.type ?? "ADT").length === 0 && (
                                <p className="text-sm text-gray-400 sm:col-span-2">No baggage add-ons available for this traveller.</p>
                            )}
                        </div>
                    )}

                    {activeLeg && activeTab === "meal" && (
                        <div className="space-y-6">
                            {activeLeg.segments.map((seg) => {
                                const paxType = passengers.find((p) => p.id === activePassengerId)?.type ?? "ADT";
                                const options = optionsForPax(seg.mealOptions, paxType);
                                const selectedCodes = meals[activePassengerId]?.[seg.sid] ?? new Set<string>();
                                return (
                                    <div key={seg.sid}>
                                        <p className="text-xs font-semibold text-gray-500 mb-2">
                                            {seg.from} &rarr; {seg.to} &middot; {seg.airlineCode}-{seg.flightNo}
                                        </p>
                                        {options.length === 0 ? (
                                            <p className="text-sm text-gray-400">No meal add-ons available on this segment.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {options.map((opt) => {
                                                    const selected = selectedCodes.has(opt.code);
                                                    return (
                                                        <div
                                                            key={opt.code}
                                                            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                                                                selected ? "border-[#1c8fc7] bg-[#e8f4fb]" : "border-gray-200"
                                                            }`}
                                                        >
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{opt.desc}</p>
                                                                <p className="text-xs text-gray-400">{formatPrice(opt.charge)}</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleMeal(activePassengerId, seg.sid, opt.code)}
                                                                className={`text-xs font-semibold rounded-full px-4 py-1.5 border shrink-0 transition-colors ${
                                                                    selected
                                                                        ? "border-[#FF7626] text-[#FF7626] bg-white"
                                                                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                                                }`}
                                                            >
                                                                {selected ? "Remove" : "Add"}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky bottom bar */}
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-4 sm:px-8 py-4 flex items-center justify-between gap-4 z-40">
                <div>
                    <p className="text-lg font-bold text-gray-900">
                        {formatPrice(grandTotal)}{" "}
                        {addOnTotal > 0 && <span className="text-sm text-gray-400 line-through ml-1">{formatPrice(baseFareTotal)}</span>}
                    </p>
                    <p className="text-xs text-gray-400">{passengers.length} Traveller{passengers.length > 1 ? "s" : ""}</p>
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
    );
}