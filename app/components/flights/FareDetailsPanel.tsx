"use client";

import { useState } from "react";
import { HiOutlineClock, HiOutlineCalendarDays, HiOutlineNoSymbol, HiOutlineUserGroup, HiOutlineDocumentText, HiOutlineChevronDown } from "react-icons/hi2";
import { HiOutlineArrowPath } from "react-icons/hi2";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { type Journey, type FareInfo, type TravelerCounts, type DetailTab } from "@/app/components/flights/types";
import { formatPrice, formatOffMessage } from "@/app/components/flights/utils";
import SegmentRouteCard from "@/app/components/flights/SegmentRouteCard";
import { getAirlineFareRule } from "@/app/lib/flightsapi";

const PTC_LABEL: Record<string, string> = {
    ADT: "Adult",
    CHD: "Child",
    INF: "Infant",
};

const PTC_COUNT_KEY: Record<string, keyof TravelerCounts> = {
    ADT: "adults",
    CHD: "children",
    INF: "infants",
};

type RuleTier = {
    description: string;
    adultAmount: string;
    childAmount?: string;
    infantAmount?: string;
    currencyCode?: string;
};
type RuleSection = { head: string; tiers: RuleTier[] };
type RuleEntry = {
    originDestination?: string;
    fareRuleText?: string;
    additionalCharge?: string | null;
    sections: RuleSection[];
};

/** A single priced leg to show in the panel. For a one-way/single-flight card
 * this array will have exactly one entry (no label shown). For a combined
 * (onward+return) fare it will have two, labeled so all tabs stay unified
 * instead of rendering two separate panels. */
export type FareLeg = {
    label?: string; // e.g. "Onward" / "Return" — omit for single-leg usage
    journey: Journey;
    fare: FareInfo;
};

function getSectionVisual(head: string) {
    const h = head.toLowerCase();
    if (h.includes("cancel") || h.includes("refund")) {
        return { Icon: HiOutlineNoSymbol, tint: "text-rose-500", chip: "bg-rose-50" };
    }
    if (h.includes("date") || h.includes("change") || h.includes("reschedul")) {
        return { Icon: HiOutlineCalendarDays, tint: "text-[#1c8fc7]", chip: "bg-[#e8f4fb]" };
    }
    if (h.includes("no show") || h.includes("no-show")) {
        return { Icon: HiOutlineUserGroup, tint: "text-amber-500", chip: "bg-amber-50" };
    }
    return { Icon: HiOutlineDocumentText, tint: "text-gray-500", chip: "bg-gray-100" };
}

export default function FareDetailsPanel({
    legs,
    travelerCounts,
    tokenId,
}: {
    legs: FareLeg[];
    travelerCounts?: TravelerCounts;
    tokenId?: string;
}) {
    const [tab, setTab] = useState<DetailTab>("FLIGHT");
    const tabs: DetailTab[] = ["FLIGHT", "BAGGAGE", "FARE", "RULES"];
    const multiLeg = legs.length > 1;

    const [ruleLoading, setRuleLoading] = useState(false);
    const [ruleError, setRuleError] = useState<string | null>(null);
    const [ruleData, setRuleData] = useState<RuleEntry[] | null>(null);
    const [ruleFetchedFor, setRuleFetchedFor] = useState<string | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    // Combine rule indices across all legs so RULES fetches once for the whole fare.
    const effectiveIndex = legs
        .flatMap((l) => (l.fare.Index ? [l.fare.Index] : []))
        .filter(Boolean);
    const indexKey = effectiveIndex.join(",");

    async function fetchRules() {
        if (!tokenId || effectiveIndex.length === 0) return;
        setRuleLoading(true);
        setRuleError(null);
        const res = await getAirlineFareRule({ tokenId, index: effectiveIndex });
        setRuleLoading(false);
        if (!res.success) {
            setRuleError(res.message || "Could not fetch fare rules.");
            return;
        }
        setRuleData(res.rules as RuleEntry[]);
        setRuleFetchedFor(indexKey);
    }

    function handleTabClick(t: DetailTab) {
        setTab(t);
        if (t === "RULES" && tokenId && effectiveIndex.length > 0 && ruleFetchedFor !== indexKey && !ruleLoading) {
            fetchRules();
        }
    }

    function toggleSection(key: string) {
        setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function visibleBaggageFor(fare: FareInfo) {
        return (fare.Baggage ?? []).filter((b) => {
            if (!travelerCounts) return true;
            if (b.PTC === "A") return travelerCounts.adults > 0;
            if (b.PTC === "C") return travelerCounts.children > 0;
            if (b.PTC === "I") return travelerCounts.infants > 0;
            return true;
        });
    }

    function visiblePtcFaresFor(fare: FareInfo) {
        return (fare.PTCFare ?? []).filter((p) => {
            if (!travelerCounts) return true;
            const key = PTC_COUNT_KEY[p.PTC];
            return key ? travelerCounts[key] > 0 : true;
        });
    }

    function lineTotalFor(fare: FareInfo, p: FareInfo["PTCFare"][number]) {
        const key = PTC_COUNT_KEY[p.PTC];
        const count = key && travelerCounts ? travelerCounts[key] : 1;
        const amt = fare.FareDisplayType === "G" || fare.FareDisplayType === "P" ? p.GrossFare : p.NetFare;
        return amt * count;
    }

    const grandTotal = legs.reduce(
        (sum, l) => sum + visiblePtcFaresFor(l.fare).reduce((s, p) => s + lineTotalFor(l.fare, p), 0),
        0
    );

    // Refundable summary: worst-case across legs (if either leg is non-refundable, show that).
    const refundableValue = legs.some((l) => l.fare.Refundable === "N")
        ? "N"
        : legs.every((l) => l.fare.Refundable === "Y")
        ? "Y"
        : "P";
    const fareTypeLabel = legs.map((l) => l.fare.FareType).join(" + ");

    return (
        <div className="bg-[#f4f6f8] px-4 sm:px-6 py-5">
            <div className="flex items-center justify-center gap-3 mb-5 flex-wrap">
                {tabs.map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => handleTabClick(t)}
                        className={`h-8 px-5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                            tab === t ? "bg-[#FF7626] text-white" : "bg-white text-[#FF7626] border border-[#FF7626]"
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === "FLIGHT" && (
                <div className="space-y-4">
                    {legs.map((leg, li) => (
                        <div key={li}>
                            {multiLeg && leg.label && (
                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#FF7626] bg-orange-50 rounded px-2 py-1 inline-block mb-2">
                                    {leg.label}
                                </p>
                            )}
                            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 divide-y divide-gray-100">
                                {leg.journey.Segments.map((seg, idx) => (
                                    <div key={seg.SID}>
                                        <SegmentRouteCard seg={seg} />
                                        {idx < leg.journey.Segments.length - 1 && seg.Layover && (
                                            <div className="flex items-center gap-3 py-3 px-1">
                                                <span className="flex-1 border-t border-dashed border-gray-300" />
                                                <span className="inline-flex items-center gap-2 bg-[#e8f4fb] text-[#1c8fc7] rounded-lg px-3 py-2 text-xs whitespace-nowrap">
                                                    <HiOutlineClock className="w-4 h-4 shrink-0 text-orange-500" />
                                                    <span>
                                                        <span className="font-bold">Plane Change</span>
                                                        <span className="font-normal"> &middot; {seg.Layover} Layover in {seg.ArrivalAirportCode}</span>
                                                    </span>
                                                </span>
                                                <span className="flex-1 border-t border-dashed border-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === "BAGGAGE" && (
                <div className="space-y-3">
                    {legs.every((l) => visibleBaggageFor(l.fare).length === 0) && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-400 text-center">
                            No baggage information available.
                        </div>
                    )}
                    {legs.map((leg, li) => {
                        const baggage = visibleBaggageFor(leg.fare);
                        if (baggage.length === 0) return null;
                        return (
                            <div key={li} className="space-y-2">
                                {multiLeg && leg.label && (
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#FF7626] bg-orange-50 rounded px-2 py-1 inline-block">
                                        {leg.label}
                                    </p>
                                )}
                                {baggage.map((b, idx) => (
                                    <div
                                        key={`${li}-${b.PTC}-${idx}`}
                                        className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 sm:gap-8 text-sm"
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-wide text-white bg-[#1c8fc7] rounded px-2 py-1 shrink-0 w-16 text-center">
                                            {(b.PTC === "A" ? "Adult" : b.PTC === "C" ? "Child" : b.PTC === "I" ? "Infant" : b.PTC) ?? "—"}
                                        </span>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Cabin Baggage</p>
                                            <p className="font-semibold text-gray-900">{b.CabinBag ?? "—"}</p>
                                        </div>
                                        <div className="w-px h-8 bg-gray-200 shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Check-in Baggage</p>
                                            <p className="font-semibold text-gray-900">{b.CheckinBaggage ?? "—"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            {tab === "FARE" && (
                <div className="space-y-3">
                    {legs.map((leg, li) => {
                        const ptcFares = visiblePtcFaresFor(leg.fare);
                        if (ptcFares.length === 0) return null;
                        return (
                            <div key={li} className="space-y-2">
                                {multiLeg && leg.label && (
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#FF7626] bg-orange-50 rounded px-2 py-1 inline-block">
                                        {leg.label}
                                    </p>
                                )}
                                {ptcFares.map((p, idx) => {
                                    const key = PTC_COUNT_KEY[p.PTC];
                                    const count = key && travelerCounts ? travelerCounts[key] : 1;
                                    const lineTotal = lineTotalFor(leg.fare, p);
                                    return (
                                        <div
                                            key={`${li}-${p.PTC}-${idx}`}
                                            className="bg-white rounded-xl border border-gray-200 p-4 text-sm divide-y divide-gray-100"
                                        >
                                            <div className="flex items-center justify-between pb-2">
                                                <span className="text-[11px] font-bold uppercase tracking-wide text-white bg-[#1c8fc7] rounded px-2 py-1">
                                                    {PTC_LABEL[p.PTC] ?? p.PTC} {count > 1 ? `× ${count}` : ""}
                                                </span>
                                                <span className="font-bold text-gray-900">{formatPrice(lineTotal)}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-gray-500">Base Fare</span>
                                                <span className="font-semibold text-gray-900">{formatPrice(p.Fare)}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-gray-500">Taxes &amp; Fees</span>
                                                <span className="font-semibold text-gray-900">{formatPrice(p.Tax)}</span>
                                            </div>
                                            {p.FareMessage && (
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-gray-500">Discount</span>
                                                    <span className="font-semibold text-green-600">{formatOffMessage(p.FareMessage)}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}

                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between text-sm">
                        <span className="text-gray-700 font-semibold">Grand Total{multiLeg ? " (Both Legs)" : ""}</span>
                        <span className="font-bold text-gray-900">{formatPrice(grandTotal)}</span>
                    </div>

                    {legs.map((leg, li) => (
                        <div key={li} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                                {multiLeg && leg.label ? `${leg.label} Seats Left` : "Seats Left"}
                            </span>
                            <span className="font-semibold text-gray-900">{leg.fare.Seats}</span>
                        </div>
                    ))}
                </div>
            )}

            {tab === "RULES" && (
                <div className="space-y-3">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-6 flex-wrap text-sm">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">Fare Type</p>
                            <p className="font-semibold text-gray-900">{fareTypeLabel}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-100 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                                    refundableValue === "Y"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : refundableValue === "P"
                                        ? "bg-amber-50 text-amber-600"
                                        : "bg-rose-50 text-rose-600"
                                }`}
                            >
                                {refundableValue === "Y" ? "Refundable" : refundableValue === "P" ? "Partially Refundable" : "Non-Refundable"}
                            </span>
                        </div>
                    </div>

                    {ruleLoading && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin text-[#FF7626]" />
                                Fetching cancellation &amp; date-change rules...
                            </div>
                            <div className="space-y-2 animate-pulse">
                                <div className="h-3 bg-gray-100 rounded w-1/3" />
                                <div className="h-3 bg-gray-100 rounded w-full" />
                                <div className="h-3 bg-gray-100 rounded w-5/6" />
                            </div>
                        </div>
                    )}

                    {!ruleLoading && ruleError && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between gap-3">
                            <p className="text-sm text-red-600">{ruleError}</p>
                            <button
                                type="button"
                                onClick={() => fetchRules()}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 shrink-0 hover:text-red-700"
                            >
                                <HiOutlineArrowPath className="w-4 h-4" /> Retry
                            </button>
                        </div>
                    )}

                    {!ruleLoading &&
                        !ruleError &&
                        ruleData &&
                        ruleData.length > 0 &&
                        ruleData.map((entry, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {entry.originDestination && (
                                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{entry.originDestination}</p>
                                    </div>
                                )}

                                <div className="p-4 space-y-4">
                                    {entry.sections.length === 0 && (
                                        <p className="text-gray-400 text-sm">No detailed rules returned for this fare.</p>
                                    )}

                                    {entry.sections.map((s, si) => {
                                        const sectionKey = `${i}-${si}`;
                                        const isCollapsed = !!collapsedSections[sectionKey];
                                        const { Icon, tint, chip } = getSectionVisual(s.head);
                                        const hasChild = s.tiers.some((t) => t.childAmount);
                                        const hasInfant = s.tiers.some((t) => t.infantAmount);

                                        return (
                                            <div key={si} className="border border-gray-100 rounded-lg overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSection(sectionKey)}
                                                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-gray-50/70 hover:bg-gray-100 transition-colors"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${chip} ${tint} shrink-0`}>
                                                            <Icon className="w-4 h-4" />
                                                        </span>
                                                        <span className="text-xs font-bold uppercase tracking-wide text-gray-700 text-left">{s.head}</span>
                                                    </span>
                                                    <HiOutlineChevronDown
                                                        className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                                                    />
                                                </button>

                                                {!isCollapsed && (
                                                    <div className="px-3 py-2">
                                                        {s.tiers.length === 0 ? (
                                                            <p className="text-xs text-gray-400 py-2">No charge details available.</p>
                                                        ) : (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="text-[10px] uppercase tracking-wide text-gray-400">
                                                                            <th className="text-left font-semibold py-1.5 pr-2">Period</th>
                                                                            <th className="text-right font-semibold py-1.5 px-2">Adult</th>
                                                                            {hasChild && <th className="text-right font-semibold py-1.5 px-2">Child</th>}
                                                                            {hasInfant && <th className="text-right font-semibold py-1.5 pl-2">Infant</th>}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-50">
                                                                        {s.tiers.map((t, ti) => (
                                                                            <tr key={ti} className={ti % 2 === 1 ? "bg-gray-50/50" : ""}>
                                                                                <td className="py-2 pr-2 text-gray-500 align-top">{t.description || "—"}</td>
                                                                                <td
                                                                                    className="py-2 px-2 text-right font-semibold text-gray-900 align-top whitespace-nowrap"
                                                                                    dangerouslySetInnerHTML={{ __html: t.adultAmount || "—" }}
                                                                                />
                                                                                {hasChild && (
                                                                                    <td
                                                                                        className="py-2 px-2 text-right font-semibold text-gray-900 align-top whitespace-nowrap"
                                                                                        dangerouslySetInnerHTML={{ __html: t.childAmount || "—" }}
                                                                                    />
                                                                                )}
                                                                                {hasInfant && (
                                                                                    <td
                                                                                        className="py-2 pl-2 text-right font-semibold text-gray-900 align-top whitespace-nowrap"
                                                                                        dangerouslySetInnerHTML={{ __html: t.infantAmount || "—" }}
                                                                                    />
                                                                                )}
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {entry.additionalCharge && (
                                        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
                                            <HiOutlineDocumentText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                            <span>{entry.additionalCharge}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                    {!ruleLoading && !ruleError && ruleData && ruleData.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 text-xs text-gray-400 text-center">
                            Cancellation and date-change charges vary by fare rule and are confirmed at the time of booking.
                        </div>
                    )}

                    {!ruleLoading && !ruleError && !ruleData && !tokenId && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 text-xs text-gray-400 text-center">
                            Cancellation and date-change charges vary by fare rule and are confirmed at the time of booking.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}