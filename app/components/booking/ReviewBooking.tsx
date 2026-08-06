"use client";

import { useEffect, useState } from "react";
import {
    HiOutlineChevronLeft,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineArrowPath,
    HiOutlineArrowRight,
    HiOutlinePaperAirplane,
    HiOutlineBriefcase,
    HiOutlineLockClosed,
    HiOutlineNoSymbol,
    HiOutlineCalendarDays,
    HiOutlineUserGroup,
    HiOutlineDocumentText,
    HiOutlineXMark,
} from "react-icons/hi2";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { getAirlinePricing, getAirlineFareRule } from "@/app/lib/flightsapi";
import PassengerDetailsForm, {
    passengerFormIsValid,
    type PassengerDetails,
    type TravellerCheckList,
} from "@/app/components/booking/PassengerDetailsForm";
import GSTDetailsForm, { gstFormIsValid, type GSTDetails } from "@/app/components/booking/GSTDetailsForm";
import LoginDrawer, { isLoggedInSession } from "@/app/components/booking/LoginDrawer";
import AirlineLogo from "@/app/components/flights/AirlineLogo";
import type { CabinClass, TripType } from "@/app/components/flights/FlightResults";
import ContactDetailsForm, { contactFormIsValid, type ContactDetails } from "@/app/components/booking/ContactDetailsForm";
import { getUserProfile } from "@/app/lib/authApi";

type Baggage = { SegID?: string; PaxID?: string | null; PTC?: string; CabinBag?: string; CheckinBaggage?: string };
type PTCFareEntry = {
    PTC: string;
    Fare: number;
    Tax: number;
    GrossFare: number;
    NetFare: number;
    FareMessage?: string;
};
type FareInfo = {
    ConId?: string;
    ChannelCode?: string;
    FareType?: string;
    GrossFare: number;
    NetFare: number;
    FareMessage?: string;
    RBD?: string;
    FBC?: string;
    Refundable?: "Y" | "N" | "P";
    Index?: string;
    Seats?: number;
    PTCFare?: PTCFareEntry[];
    Baggage?: Baggage[];
    FareDisplayType?: "P" | "G" | "S" | "N";
};
type Segment = {
    SID: string;
    AirlineName: string;
    AirlineCode: string;
    FlightNo: string;
    VAC?: string;
    MAC?: string;
    OAC?: string;
    AirCraft?: string;
    EquipmentType?: string;
    Cabin?: string;
    DepartureAirportCode: string;
    ArrivalAirportCode: string;
    ArrivalAirportName?: string;
    DepartureAirportName?: string;
    DepartureCityName?: string;
    ArrivalCityName?: string;
    DepartureTime: string;
    ArrivalTime: string;
    DepartureTerminal?: string;
    ArrivalTerminal?: string;
    Duration?: string;
    Layover?: string;
    VACLogo?: string;
    MACLogo?: string;
    OACLogo?: string;
};
type Journey = {
    From: string;
    To: string;
    FromAirport?: string;
    ToAirport?: string;
    FromCity?: string;
    ToCity?: string;
    Stops: number;
    Segments: Segment[];
    DepartureDateTime: string;
    ArrivalDateTime: string;
    Duration: string;
    FareInfo: FareInfo[] | null;
    TransitVisa?: boolean;
    GroupId?: string;
    DepartureNearBy?: string;
    ArrivalNearBy?: string;
};
type LegSelection = { journey: Journey; fare: FareInfo };


type SearchMeta = { fromCode?: string; fromName?: string; toCode?: string; toName?: string };

export type ReviewBookingProps = {
    from: string;
    to: string;
    fromName?: string;
    toName?: string;
    tripType: TripType;
    onward: LegSelection | null;
    ret: LegSelection | null;
    adults: number;
    children: number;
    infants: number;
    searchType: string;
    cabinClass: CabinClass;
    tokenId: string;
    bookingId: string;
    index: string[];
    onBack: () => void;
    onContinue: (data: {
        passengers: PassengerDetails[];
        gst: GSTDetails | null;
        contact: ContactDetails | null;
        totalAmount: number;
        pricing: { onward: LegSelection | null; ret: LegSelection | null };
        bookingId: string;
    }) => void;
};

const CABIN_LABEL: Record<CabinClass, string> = {
    economy: "Economy",
    premium: "Premium Economy",
    business: "Business",
    first: "First Class",
};

function formatTime(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" });
}

function formatPrice(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
        amount
    );
}

function adtPtc(fare: FareInfo): PTCFareEntry | undefined {
    return fare.PTCFare?.find((p) => p.PTC === "ADT");
}

function adtNetFare(fare: FareInfo): number {
    return adtPtc(fare)?.NetFare ?? fare.NetFare;
}
function displayFareAmount(fare: FareInfo): number {
    const type = fare.FareDisplayType;
    if (type === "S" || type === "N") return fare.NetFare;
    return fare.GrossFare; // P, G, or fallback
}

function isStrikeThruFare(fare: FareInfo): boolean {
    return fare.FareDisplayType === "S";
}
function refundableLabel(r?: "Y" | "N" | "P") {
    if (r === "Y") return "Refundable";
    if (r === "P") return "Partially Refundable";
    return "Non-Refundable";
}


function resolveSearchedName(code: string | undefined, meta?: SearchMeta): string | undefined {
    if (!code || !meta) return undefined;
    if (code === meta.fromCode) return meta.fromName;
    if (code === meta.toCode) return meta.toName;
    return undefined;
}

function NearByAirportNotice({
    kind,
    searchedCode,
    searchedName,
    selectedCode,
    selectedName,
}: {
    kind: "departure" | "arrival";
    searchedCode: string;
    searchedName?: string;
    selectedCode: string;
    selectedName?: string;
}) {
    const direction = kind === "departure" ? "from" : "to";
    return (
        <div className="mx-5 mb-4 flex items-start gap-2 rounded-xl bg-amber-50 text-amber-800 text-sm px-4 py-3">
            <HiOutlinePaperAirplane className="w-4 h-4 mt-0.5 shrink-0 text-amber-500 -rotate-45" />
            <p>
                You searched for a flight {direction} {searchedCode}
                {searchedName ? <> (<span className="font-semibold">{searchedName}</span>)</> : null}, but you have
                selected {selectedCode}
                {selectedName ? <> (<span className="font-semibold">{selectedName}</span>)</> : null} as the {kind}{" "}
                airport.
            </p>
        </div>
    );
}


function parseExpiryToSeconds(expiry?: string): number | null {
    if (!expiry) return null;
    const [m, s] = expiry.split(":").map(Number);
    if (Number.isNaN(m) || Number.isNaN(s)) return null;
    return m * 60 + s;
}

function formatCountdown(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

function Tag({ children, tone = "orange" }: { children: React.ReactNode; tone?: "orange" | "slate" | "blue" }) {
    const cls =
        tone === "orange"
            ? "bg-orange-50 text-orange-600"
            : tone === "blue"
                ? "bg-[#e8f4fb] text-[#1c8fc7]"
                : "bg-gray-100 text-gray-600";
    return <span className={`text-[11px] font-semibold rounded-full px-3 py-1 whitespace-nowrap ${cls}`}>{children}</span>;
}

function StepIndicator() {
    const steps = ["Search", "Review", "Pay"];
    return (
        <div className="hidden sm:flex items-center gap-2 text-sm">
            {steps.map((label, i) => {
                const stepNum = i + 1;
                const active = stepNum === 2;
                return (
                    <div key={label} className="flex items-center gap-2">
                        <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${active ? "bg-[#1c8fc7] text-white" : "bg-gray-100 text-gray-400"
                                }`}
                        >
                            {stepNum}
                        </span>
                        <span className={active ? "font-semibold text-[#1c8fc7]" : "text-gray-400"}>{label}</span>
                        {stepNum < steps.length && <span className="text-gray-300">&rarr;</span>}
                    </div>
                );
            })}
        </div>
    );
}


function findBaggage(fare: FareInfo, seg: Segment, ptc: string = "A"): Baggage | undefined {
    return fare.Baggage?.find((b) => {
        if (b.PTC !== ptc) return false;
        if (!b.SegID) return true;
        return b.SegID.split(",").map((id) => id.trim()).includes(seg.SID);
    });
}

/** Reformats the API's "2 Hr 50 Minutes" style string into "2h 50m" for the compact divider. Falls back to the original string if it doesn't match. */
function formatDurationShort(duration?: string): string {
    if (!duration) return "";
    const hMatch = duration.match(/(\d+)\s*Hr/i);
    const mMatch = duration.match(/(\d+)\s*Min/i);
    if (!hMatch && !mMatch) return duration;
    return [hMatch ? `${hMatch[1]}h` : "", mMatch ? `${mMatch[1]}m` : ""].filter(Boolean).join(" ");
}


function SegmentLeg({
    seg,
    fare,
    departureNearBy,
    arrivalNearBy,
}: {
    seg: Segment;
    fare: FareInfo;
    departureNearBy?: string;
    arrivalNearBy?: string;
}) {
    const bag = findBaggage(fare, seg, "A");
    const depCity = seg.DepartureCityName ?? seg.DepartureAirportName ?? seg.DepartureAirportCode;
    const arrCity = seg.ArrivalCityName ?? seg.ArrivalAirportName ?? seg.ArrivalAirportCode;
    const hasBaggage = Boolean(bag?.CabinBag || bag?.CheckinBaggage);

    return (
        <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
                <AirlineLogo seg={seg} code={seg.AirlineCode} className="w-6 h-6" />
                <span className="text-lg font-semibold text-gray-900">{seg.AirlineName}</span>
                <span className="text-lg text-gray-400">
                    | {seg.AirlineCode}-{seg.FlightNo}
                </span>
            </div>

            <div className="grid grid-cols-[minmax(150px,1.3fr)_70px_minmax(150px,1.3fr)_minmax(120px,1fr)] gap-3 sm:gap-4 items-start">
                {/* Departure */}
                <div className="min-w-0">
                    {seg.DepartureTime && <p className="text-xs text-gray-400 mb-2">{formatDate(seg.DepartureTime)}</p>}
                    <p className="text-2xl font-bold text-gray-900 leading-tight">{formatTime(seg.DepartureTime)}</p>
                    <p className="text-sm font-semibold text-gray-600 mt-1 break-words">
                        {seg.DepartureAirportCode} - {seg.DepartureAirportName ?? depCity}
                    </p>
                    {seg.DepartureTerminal && (
                        <p className="text-[14px] text-gray-400">{seg.DepartureTerminal}</p>
                    )}
                    {departureNearBy && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-semibold whitespace-nowrap">
                            <HiOutlineLocationMarker className="w-3 h-3 shrink-0" />
                            Nearby airport
                        </span>
                    )}
                </div>

                {/* Duration divider */}
                <div className="flex flex-col items-center text-gray-400 pt-6 min-w-0">
                    {seg.Duration && <span className="text-[11px] mb-1.5 whitespace-nowrap">{formatDurationShort(seg.Duration)}</span>}
                    <div className="w-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                        <span className="flex-1 border-t border-dashed border-gray-300" />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                    </div>
                </div>

                {/* Arrival */}
                <div className="min-w-0">
                    {seg.ArrivalTime && <p className="text-xs text-gray-400 mb-2">{formatDate(seg.ArrivalTime)}</p>}
                    <p className="text-xl font-bold text-gray-900 leading-tight">{formatTime(seg.ArrivalTime)}</p>
                    <p className="text-xs font-semibold text-gray-600 mt-1 break-words">
                        {seg.ArrivalAirportCode} - {seg.ArrivalAirportName ?? arrCity}
                    </p>
                    {seg.ArrivalTerminal && (
                        <p className="text-[11px] text-gray-400">{seg.ArrivalTerminal}</p>
                    )}
                    {arrivalNearBy && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-semibold whitespace-nowrap">
                            <HiOutlineLocationMarker className="w-3 h-3 shrink-0" />
                            Nearby airport
                        </span>
                    )}
                </div>

                <div className="min-w-0 sm:border-l sm:border-gray-100 sm:pl-4">
                    {hasBaggage && (
                        <>
                            <p className="text-xs font-semibold text-gray-500 mb-2">Baggage</p>
                            <div className="space-y-1.5 text-xs text-gray-600">
                                {bag?.CabinBag && (
                                    <p className="flex items-start gap-1.5">
                                        <HiOutlineBriefcase className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                        <span>Cabin : <span className="font-semibold text-[#1c8fc7]">{bag.CabinBag}</span> per adult</span>
                                    </p>
                                )}
                                {bag?.CheckinBaggage && (
                                    <p className="flex items-start gap-1.5">
                                        <HiOutlineBriefcase className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                        <span>Check-in : <span className="font-semibold text-[#1c8fc7]">{bag.CheckinBaggage}</span> per adult</span>
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function LayoverBanner({ seg }: { seg: Segment }) {
    const city = seg.ArrivalCityName ?? seg.ArrivalAirportName ?? seg.ArrivalAirportCode;
    return (
        <div className="mx-5 my-2 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold text-center py-2 px-3">
            Change of Planes{seg.Layover ? ` \u2022 ${seg.Layover} layover in ${city}` : ` \u2022 Layover in ${city}`}
        </div>
    );
}

function ItineraryCard({
    label,
    leg,
    cabinLabel,
    searchMeta,
    showNearByNotice = false,
    onShowFareRules,
}: {
    label: string;
    leg: LegSelection;
    cabinLabel: string;
    searchMeta?: SearchMeta;
    showNearByNotice?: boolean;
    onShowFareRules: () => void;
}) {
    const { journey, fare } = leg;
    const stopsLabel = journey.Stops === 0 ? "Direct" : `${journey.Stops} stop${journey.Stops > 1 ? "s" : ""}`;
    const fromLabel = journey.FromCity ?? journey.From;
    const toLabel = journey.ToCity ?? journey.To;
    const firstSeg = journey.Segments[0];
    const lastSeg = journey.Segments[journey.Segments.length - 1];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 mb-5 overflow-hidden">
            <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Tag tone="blue">{label}</Tag>
                        <span className="text-lg font-bold text-gray-900">
                            {fromLabel} <span className="text-gray-400">&rarr;</span> {toLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onShowFareRules}
                            className="text-sm font-semibold text-[#1c8fc7] hover:text-[#177aab] hover:underline whitespace-nowrap"
                        >
                            Fare rule details
                        </button>
                        <Tag>{refundableLabel(fare.Refundable)}</Tag>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap text-sm text-gray-500">
                    <span>{formatDate(journey.DepartureDateTime)}</span>
                    <span>&middot;</span>
                    <span>{stopsLabel}</span>
                    {journey.Duration && (
                        <>
                            <span>&middot;</span>
                            <span>{journey.Duration}</span>
                        </>
                    )}
                    <span>&middot;</span>
                    <span>{cabinLabel}</span>
                </div>
            </div>
            {showNearByNotice && journey.DepartureNearBy && firstSeg && (
                <NearByAirportNotice
                    kind="departure"
                    searchedCode={journey.DepartureNearBy}
                    searchedName={resolveSearchedName(journey.DepartureNearBy, searchMeta)}
                    selectedCode={firstSeg.DepartureAirportCode}
                    selectedName={firstSeg.DepartureAirportName}
                />
            )}
            {showNearByNotice && journey.ArrivalNearBy && lastSeg && (
                <NearByAirportNotice
                    kind="arrival"
                    searchedCode={journey.ArrivalNearBy}
                    searchedName={resolveSearchedName(journey.ArrivalNearBy, searchMeta)}
                    selectedCode={lastSeg.ArrivalAirportCode}
                    selectedName={lastSeg.ArrivalAirportName}
                />
            )}

            <div className="border-t border-gray-100 divide-y divide-gray-100">
                {journey.Segments.map((seg, i) => (
                    <div key={seg.SID ?? i}>
                        {i > 0 && <LayoverBanner seg={journey.Segments[i - 1]} />}
                        <SegmentLeg
                            seg={seg}
                            fare={fare}
                            departureNearBy={i === 0 ? journey.DepartureNearBy : undefined}
                            arrivalNearBy={i === journey.Segments.length - 1 ? journey.ArrivalNearBy : undefined}
                        />
                    </div>
                ))}
            </div>

            {journey.TransitVisa && (
                <div className="px-5 pb-4 -mt-1">
                    <p className="text-xs text-[#177aab] bg-[#e8f4fb] rounded-lg px-3 py-2">
                        Transit visa may be required for this connection.
                    </p>
                </div>
            )}
        </div>
    );
}

function ruleEntryRouteLabel(entry: { originDestination?: string }, index: number, legs: LegSelection[]): string {
    const leg = legs[index];
    if (leg?.journey.From && leg?.journey.To) {
        return `${leg.journey.From} - ${leg.journey.To}`;
    }
    return entry.originDestination || "";
}

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

function RulesCard({ legs, ruleLoading, ruleError, ruleData, onRetry }: {
    legs: LegSelection[];
    ruleLoading: boolean;
    ruleError: string | null;
    ruleData: any[] | null;
    onRetry: () => void;
}) {
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const fareTypes = Array.from(new Set(legs.map((l) => l.fare.FareType).filter(Boolean))) as string[];
    const refundableValue = legs.some((l) => l.fare.Refundable === "N")
        ? "N"
        : legs.every((l) => l.fare.Refundable === "Y")
            ? "Y"
            : "P";

    function toggleSection(key: string) {
        setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    return (
        <div className="space-y-3">


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
                        onClick={onRetry}
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
                ruleData.map((entry, i) => {
                    const routeLabel = ruleEntryRouteLabel(entry, i, legs);
                    return (
                        <div key={i} className="bg-white overflow-hidden">
                            {routeLabel && (
                                <div className="px-4 py-2.5 bg-gray-300 border-b border-gray-100">
                                    <p className="text-xs font-bold uppercase tracking-wide text-black">{routeLabel}</p>
                                </div>
                            )}

                            <div className="p-4 space-y-4">
                                {entry.sections?.length === 0 && (
                                    <p className="text-gray-400 text-sm">No detailed rules returned for this fare.</p>
                                )}

                                {entry.sections?.map((s: any, si: number) => {
                                    const sectionKey = `${i}-${si}`;
                                    const isCollapsed = !!collapsedSections[sectionKey];
                                    const { Icon, tint, chip } = getSectionVisual(s.head);
                                    const hasChild = s.tiers?.some((t: any) => t.childAmount);
                                    const hasInfant = s.tiers?.some((t: any) => t.infantAmount);

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
                                                    {!s.tiers || s.tiers.length === 0 ? (
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
                                                                    {s.tiers.map((t: any, ti: number) => (
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
                    );
                })}

            {!ruleLoading && !ruleError && (!ruleData || ruleData.length === 0) && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-xs text-gray-400 text-center">
                    Cancellation and date-change charges vary by fare rule and are confirmed at the time of booking.
                </div>
            )}
        </div>
    );
}

function FareRuleSidebar({
    open,
    onClose,
    legs,
    ruleLoading,
    ruleError,
    ruleData,
    onRetry,
}: {
    open: boolean;
    onClose: () => void;
    legs: LegSelection[];
    ruleLoading: boolean;
    ruleError: string | null;
    ruleData: any[] | null;
    onRetry: () => void;
}) {
    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />
            {/* Drawer */}
        <div
    className={`fixed top-0 right-0 h-full w-full sm:w-[680px] bg-[#f5f8fb] z-50 shadow-2xl transition-transform duration-300 flex flex-col ${
        open ? "translate-x-0" : "translate-x-full"
    }`}
>
                <div className="flex items-center justify-between gap-3 px-5 py-4 bg-white border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <HiOutlineDocumentText className="w-5 h-5 text-[#1c8fc7]" />
                        <h3 className="text-base font-bold text-gray-900">Fare rules &amp; policies</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <HiOutlineXMark className="w-5 h-5" />
                    </button>
                </div>
<div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
    <RulesCard
        legs={legs}
        ruleLoading={ruleLoading}
        ruleError={ruleError}
        ruleData={ruleData}
        onRetry={onRetry}
    />
</div>
            </div>
        </>
    );
}

export default function ReviewBooking({
    from,
    to,
    fromName,
    toName,
    tripType,
    onward,
    ret,
    adults,
    children,
    infants,
    cabinClass,
    tokenId, bookingId, index, searchType, onBack, onContinue
}: ReviewBookingProps) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [contact, setContact] = useState<ContactDetails | null>(null);
    const [contactInitial, setContactInitial] = useState<Partial<ContactDetails>>({});
    const [contactLoading, setContactLoading] = useState(false);
    const [profileName, setProfileName] = useState("");
    const [pricingLoading, setPricingLoading] = useState(false);
    const [pricingError, setPricingError] = useState<string | null>(null);
    const [pricedOnward, setPricedOnward] = useState<LegSelection | null>(null);
    const [pricedReturn, setPricedReturn] = useState<LegSelection | null>(null);
    const [checklist, setChecklist] = useState<TravellerCheckList | null>(null);
    const [expirySeconds, setExpirySeconds] = useState<number | null>(null);
    const [ruleLoading, setRuleLoading] = useState(false);
    const [ruleError, setRuleError] = useState<string | null>(null);
    const [pricedBookingId, setPricedBookingId] = useState<string>(bookingId);
    const [ruleData, setRuleData] = useState<any[] | null>(null);
    const [passengers, setPassengers] = useState<PassengerDetails[]>([]);
    const [gst, setGst] = useState<GSTDetails | null>(null);
    const [pricedIndex, setPricedIndex] = useState<string[] | null>(null);
    const [searchMeta, setSearchMeta] = useState<SearchMeta>({ fromCode: from, fromName, toCode: to, toName });
    const [fareRuleSidebarOpen, setFareRuleSidebarOpen] = useState(false);
const [activeRuleLeg, setActiveRuleLeg] = useState<LegSelection | null>(null);
    useEffect(() => {
        function handleLoginEvent() {
            setIsLoggedIn(isLoggedInSession());
        }
        window.addEventListener("flyomint:login", handleLoginEvent);
        window.addEventListener("flyomint:sessionExpired", handleLoginEvent);
        return () => {
            window.removeEventListener("flyomint:login", handleLoginEvent);
            window.removeEventListener("flyomint:sessionExpired", handleLoginEvent);
        };
    }, []);
    useEffect(() => {
        if (!loginOpen) {
            setIsLoggedIn(isLoggedInSession());
        }
    }, [loginOpen]);
    async function fetchContactProfile() {
        setContactLoading(true);
        const res = await getUserProfile();
        setContactLoading(false);

        if (!res.success) return;

        setProfileName(res.name || "");
        setContactInitial({
            email: res.email || "",
            mobile: res.mobile || "",
            countryCode: res.countryCode || "+91",
        });
    }

    useEffect(() => {
        if (isLoggedIn) {
            fetchPricing();
            fetchContactProfile();
        }
    }, [isLoggedIn]);

    async function fetchPricing() {
        setPricingLoading(true);
        setPricingError(null);

        const res = await getAirlinePricing({ tokenId, bookingId, index, searchType });
        setPricingLoading(false);

        if (!res.success || !res.pricing) {
            setPricingError(res.message || "Could not fetch fare details. Please try again.");
            return;
        }

        const journeys = res.pricing.journeys as Journey[];
        const onwardJourney = journeys[0];
        const returnJourney = tripType === "roundtrip" ? journeys[1] : undefined;

        const onwardLeg = onwardJourney?.FareInfo?.[0]
            ? { journey: onwardJourney, fare: onwardJourney.FareInfo[0] }
            : null;
        let returnLeg = returnJourney?.FareInfo?.[0]
            ? { journey: returnJourney, fare: returnJourney.FareInfo[0] }
            : null;

        if (!onwardLeg) {
            setPricingError("This fare is no longer available. Please go back and search again.");
            setPricedOnward(null);
            setPricedReturn(null);
            return;
        }
        if (tripType === "roundtrip" && !returnLeg && returnJourney && searchType === "RS") {
            returnLeg = { journey: returnJourney, fare: onwardLeg.fare };
        }

        if (tripType === "roundtrip" && !returnLeg) {
            setPricingError("This fare is no longer available. Please go back and search again.");
            setPricedOnward(null);
            setPricedReturn(null);
            return;
        }
        setPricedOnward(onwardLeg);
        setPricedReturn(returnLeg);
        setSearchMeta({
            fromCode: res.pricing.from ?? from,
            fromName: res.pricing.fromName ?? fromName,
            toCode: res.pricing.to ?? to,
            toName: res.pricing.toName ?? toName,
        });
        const newIndex = [
            onwardJourney?.FareInfo?.[0]?.Index,
            returnJourney?.FareInfo?.[0]?.Index,
        ].filter((v): v is string => Boolean(v));
        setPricedIndex(newIndex);

        setChecklist(
    res.pricing.fnuLnuSettings
        ? {
              ...res.pricing.fnuLnuSettings.TravellerCheckList,
              FnuMessage: res.pricing.fnuLnuSettings.FnuMessage,
              LnuMessage: res.pricing.fnuLnuSettings.LnuMessage,
          }
        : null
);
        setExpirySeconds(parseExpiryToSeconds(res.pricing.bookingExpiryTime));
        setPricedBookingId(res.pricing.bookingId || bookingId);
    }
async function fetchFareRuleForLeg(leg: LegSelection) {
    setRuleLoading(true);
    setRuleError(null);
    setRuleData(null);
    setActiveRuleLeg(leg);

    const idx = leg.fare.Index;
    if (!idx) {
        setRuleLoading(false);
        setRuleError("Could not determine fare rules for this flight.");
        return;
    }

    const res = await getAirlineFareRule({ tokenId, index: [idx], searchType });
    setRuleLoading(false);

    if (!res.success || !res.rules) {
        setRuleError(res.message || "Could not fetch rules for this flight.");
        return;
    }

    if (res.rules.length === 0) {
        setRuleData([]);
        return;
    }

    const seenSectionKeys = new Set<string>();
    const mergedSections: any[] = [];
    let mergedAdditionalCharge: string | null = null;

    for (const entry of res.rules) {
        for (const section of entry.sections || []) {
            const key = JSON.stringify({ head: section.head, tiers: section.tiers });
            if (seenSectionKeys.has(key)) continue;
            seenSectionKeys.add(key);
            mergedSections.push(section);
        }
        if (!mergedAdditionalCharge && entry.additionalCharge) {
            mergedAdditionalCharge = entry.additionalCharge;
        }
    }

    setRuleData([
        {
            originDestination: res.rules[0].originDestination || "",
            sections: mergedSections,
            additionalCharge: mergedAdditionalCharge,
        },
    ]);
}

function handleShowFareRules(leg: LegSelection) {
    setFareRuleSidebarOpen(true);
    fetchFareRuleForLeg(leg);
}

function handleRetryFareRule() {
    if (activeRuleLeg) fetchFareRuleForLeg(activeRuleLeg);
}

    // Logged-in users get priced as soon as they land on this screen.
    useEffect(() => {
        if (isLoggedIn) fetchPricing();
    }, [isLoggedIn]);

    useEffect(() => {
        if (expirySeconds === null) return;
        const interval = setInterval(() => {
            setExpirySeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
        }, 1000);
        return () => clearInterval(interval);
    }, [expirySeconds !== null]);

    async function handleLoginSuccess(uniqueKey: string) {
        setLoginOpen(false);
        setIsLoggedIn(true);
        window.dispatchEvent(new Event("flyomint:login"));
    }

    const displayOnward = pricedOnward ?? onward;
    const displayReturn = pricedReturn ?? ret;
    const isRoundtrip = tripType === "roundtrip";
    const isPriced = isLoggedIn && Boolean(pricedOnward) && (!isRoundtrip || Boolean(pricedReturn));

    const legs = [displayOnward, isRoundtrip ? displayReturn : null].filter(Boolean) as LegSelection[];

    const isCombinedRoundtrip = searchType === "RS";
    const fareLegs = isCombinedRoundtrip && displayOnward ? [displayOnward] : legs;

    const baseFare =
        fareLegs.reduce((sum, leg) => sum + (adtPtc(leg.fare)?.Fare ?? 0), 0) * adults;
    const taxes = fareLegs.reduce((sum, leg) => sum + (adtPtc(leg.fare)?.Tax ?? 0), 0) * adults;
    const totalAmount = fareLegs.reduce((sum, leg) => sum + displayFareAmount(leg.fare), 0) * adults;
    const grossTotal = fareLegs.reduce((sum, leg) => sum + leg.fare.GrossFare, 0) * adults;
    const showStrikeThru = fareLegs.some((l) => isStrikeThruFare(l.fare));

    const gstMandatory = Boolean(checklist?.GSTMandate);
    const showTravellerForms = isPriced && checklist;

    const readyToPay = showTravellerForms
        ? passengerFormIsValid(passengers, checklist!) &&
        contactFormIsValid(contact) &&
        (!gst || gstFormIsValid(gst, gstMandatory))
        : false;

    const travellerCount = adults + children + infants;

    function handleContinueToPayment() {
        onContinue({
            passengers,
            gst,
            contact,
            totalAmount,
            pricing: { onward: displayOnward, ret: isRoundtrip ? displayReturn : null },
            bookingId: pricedBookingId,
        });
    }



    function handleContinueClick() {
        if (!isLoggedIn) {
            setLoginOpen(true);
            return;
        }
        if (!isPriced && !pricingLoading) {
            fetchPricing();
        }
    }

    if (!onward) return null;

    return (
        <div className="min-h-screen bg-[#f5f8fb] pb-10">
            <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-700"
                    >
                        <HiOutlineChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="w-px h-8 bg-gray-200 hidden sm:block" />
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">Review your booking</h1>
                        <p className="text-sm text-gray-400">Verify info, add travellers, and continue to payment</p>
                    </div>
                </div>
                <StepIndicator />
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-4">
                        <HiOutlinePaperAirplane className="w-4 h-4 text-[#1c8fc7] -rotate-45" />
                        <h2 className="text-base font-bold text-gray-900">Flight details</h2>
                    </div>

                    {pricingError && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between gap-3 mb-5">
                            <p className="text-sm text-red-600">{pricingError}</p>
                            {/* <button
                                type="button"
                                onClick={() => fetchPricing()}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 shrink-0"
                            >
                                <HiOutlineArrowPath className="w-4 h-4" /> Retry
                            </button> */}
                        </div>
                    )}

                    {pricingLoading && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-sm text-gray-400 mb-5">
                            Fetching the latest fare...
                        </div>
                    )}

        {displayOnward && (
    <ItineraryCard
        label="Departure Flight"
        leg={displayOnward}
        cabinLabel={CABIN_LABEL[cabinClass]}
        searchMeta={searchMeta}
        showNearByNotice={isPriced}
        onShowFareRules={() => handleShowFareRules(displayOnward)}
    />
)}
{isRoundtrip && displayReturn && (
    <ItineraryCard
        label="Return Flight"
        leg={displayReturn}
        cabinLabel={CABIN_LABEL[cabinClass]}
        searchMeta={searchMeta}
        showNearByNotice={isPriced}
        onShowFareRules={() => handleShowFareRules(displayReturn)}
    />
)}
                    {showTravellerForms && (
                        <div className="space-y-5 mt-5">
                            <ContactDetailsForm
                                initial={contactInitial}
                                fetchedName={profileName}
                                loading={contactLoading}
                                onChange={setContact}
                            />
                            <PassengerDetailsForm
                                adults={adults}
                                children={children}
                                infants={infants}
                                checklist={checklist!}
                                onChange={setPassengers}
                            />
                            {checklist!.GST_Accepted && <GSTDetailsForm mandatory={gstMandatory} onChange={setGst} />}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-6">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Fare summary</h3>
                    <p className="text-xs text-gray-400 mb-3">
                        {isRoundtrip ? "Round trip" : "One way"} &middot; {travellerCount} traveller
                        {travellerCount > 1 ? "s" : ""}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {adults > 0 && <Tag tone="blue">{adults} Adult{adults > 1 ? "s" : ""}</Tag>}
                        {children > 0 && <Tag tone="blue">{children} Child{children > 1 ? "ren" : ""}</Tag>}
                        {infants > 0 && <Tag tone="blue">{infants} Infant{infants > 1 ? "s" : ""}</Tag>}
                    </div>

                    <div className="space-y-2 pb-3 border-b border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Base fare</span>
                            <span className="font-semibold text-gray-900">{formatPrice(baseFare)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Taxes &amp; fees</span>
                            <span className="font-semibold text-gray-900">{formatPrice(taxes)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                            <p className="text-base font-bold text-gray-900 leading-tight">Total</p>
                            <p className="text-[11px] text-gray-400">Incl. all taxes &amp; fees</p>
                        </div>
                        <div className="text-right">
                            {showStrikeThru && (
                                <p className="text-sm text-gray-400 line-through">{formatPrice(grossTotal)}</p>
                            )}
                            <p className="text-xl font-bold text-[#1c8fc7]">{formatPrice(totalAmount)}</p>
                        </div>
                    </div>

                    {isPriced && expirySeconds !== null && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 py-3">
                            <HiOutlineLockClosed className="w-3.5 h-3.5" />
                            Price locked &middot; Valid for {formatCountdown(expirySeconds)}
                        </div>
                    )}
                    {!isLoggedIn && (
                        <p className="text-xs text-[#177aab] bg-[#e8f4fb] rounded-xl px-3 py-2 my-3">
                            Log in to lock this fare and add traveller details.
                        </p>
                    )}

                    {isPriced ? (
                        <button
                            type="button"
                            disabled={!readyToPay}
                            onClick={handleContinueToPayment}
                            className={`w-full h-12 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors mt-2 ${readyToPay
                                    ? "bg-[#1c8fc7] text-white hover:bg-[#177aab]"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            Continue <HiOutlineArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleContinueClick}
                            disabled={pricingLoading}
                            className="w-full h-12 rounded-full text-sm font-bold flex items-center justify-center gap-2 bg-[#1c8fc7] text-white hover:bg-[#177aab] transition-colors disabled:opacity-70 mt-2"
                        >
                            {pricingLoading ? (
                                <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                            ) : isLoggedIn ? (
                                "Retry"
                            ) : (
                                "Continue"
                            )}
                        </button>
                    )}

                    <p className="text-[11px] text-gray-400 text-center mt-3">
                        By proceeding, you agree to our Terms and Privacy
                    </p>
                </div>
            </div>

            <LoginDrawer
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />
           <FareRuleSidebar
    open={fareRuleSidebarOpen}
    onClose={() => setFareRuleSidebarOpen(false)}
    legs={activeRuleLeg ? [activeRuleLeg] : []}
    ruleLoading={ruleLoading}
    ruleError={ruleError}
    ruleData={ruleData}
    onRetry={handleRetryFareRule}
/>
        </div>
    );
}