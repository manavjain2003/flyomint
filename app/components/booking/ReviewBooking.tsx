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
import BillingAddressForm, { billingFormIsValid, type BillingAddress } from "@/app/components/booking/BillingDetailsForm";


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
    BaseFare?: number;
    Tax?: number;
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
        billing: BillingAddress | null;
        totalAmount: number;
        baseFareTotal: number;
        taxTotal: number;
        grossFareTotal: number;
        netFareTotal: number;
        fareDisplayType: "P" | "G" | "S" | "N";
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

function ptcEntry(fare: FareInfo, ptc: "ADT" | "CHD" | "INF"): PTCFareEntry | undefined {
    return fare.PTCFare?.find((p) => p.PTC === ptc);
}


function totalAcrossTravelers(
    legs: LegSelection[],
    field: "Fare" | "Tax" | "GrossFare" | "NetFare",
    counts: { adults: number; children: number; infants: number }
): number {
    return legs.reduce((sum, leg) => {
        const adt = ptcEntry(leg.fare, "ADT");
        const chd = ptcEntry(leg.fare, "CHD");
        const inf = ptcEntry(leg.fare, "INF");
        const adtAmt = (adt?.[field] ?? (field === "GrossFare" ? leg.fare.GrossFare : field === "NetFare" ? leg.fare.NetFare : 0)) * counts.adults;
        const chdAmt = (chd?.[field] ?? 0) * counts.children;
        const infAmt = (inf?.[field] ?? 0) * counts.infants;
        return sum + adtAmt + chdAmt + infAmt;
    }, 0);
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
        <div className="mx-5 mb-4 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-[14px] px-4 py-3 leading-[1.4]">
            <HiOutlinePaperAirplane className="w-4 h-4 mt-0.5 shrink-0 text-amber-500 dark:text-amber-400 -rotate-45" />
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
            ? "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400"
            : tone === "blue"
                ? "bg-[#e8f4fb] text-[#1c8fc7]"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300";
    return <span className={`text-[12px] font-semibold rounded-full px-3 py-1 whitespace-nowrap leading-[1.4] ${cls}`}>{children}</span>;
}

function StepIndicator() {
    const steps = ["Search", "Review", "Pay"];
    return (
        <div className="hidden sm:flex items-center gap-2 text-[14px] leading-[1.4]">
            {steps.map((label, i) => {
                const stepNum = i + 1;
                const active = stepNum === 2;
                return (
                    <div key={label} className="flex items-center gap-2">
                        <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold leading-[1.4] ${active ? "bg-[#1c8fc7] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                                }`}
                        >
                            {stepNum}
                        </span>
                        <span className={active ? "font-semibold text-[#1c8fc7]" : "text-gray-400 dark:text-gray-500"}>{label}</span>
                        {stepNum < steps.length && <span className="text-gray-300 dark:text-gray-600">&rarr;</span>}
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
                <span className="text-[18px] font-semibold text-gray-900 dark:text-gray-100 leading-[1.4]">{seg.AirlineName}</span>
                <span className="text-[18px] text-gray-400 dark:text-gray-500 leading-[1.4]">
                    | {seg.AirlineCode}-{seg.FlightNo}
                    </span>
            </div>

        
     {/* Departure / duration / arrival row — CSS Grid with fixed left/right column
                widths guarantees the divider (middle) column is exactly the same width on
                every segment card, so the dot-line-dot always sits in an identical position
                and stays symmetric regardless of how much text/badges are in the side
                columns. A flex-based layout could still drift a few px between rows because
                flex-basis on the side columns responds to their content; grid's fixed track
                sizes cannot. */}
            <div className="grid grid-cols-[minmax(0,180px)_1fr_minmax(0,180px)] items-start gap-2">
                {/* Departure */}
                <div className="min-w-0">
                    {seg.DepartureTime && <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-2 leading-[1.4]">{formatDate(seg.DepartureTime)}</p>}
                    <p className="text-[30px] font-bold text-gray-900 dark:text-gray-100 leading-tight">{formatTime(seg.DepartureTime)}</p>
                    <p className="text-[14px] font-semibold text-gray-600 dark:text-gray-300 mt-1 break-words leading-[1.4]">
                        {seg.DepartureAirportCode} - {depCity}
                    </p>
                    <p className="text-[14px] text-gray-400 dark:text-gray-500 leading-[1.4]">{seg.DepartureAirportName}</p>
                    {seg.DepartureTerminal && (
                        <p className="text-[14px] text-gray-400 dark:text-gray-500 leading-[1.4]">{seg.DepartureTerminal}</p>
                    )}
                    {departureNearBy && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-semibold whitespace-nowrap leading-[1.4]">
                            <HiOutlineLocationMarker className="w-3 h-3 shrink-0" />
                            Nearby airport
                        </span>
                    )}
                </div>

                {/* Duration divider — centered within its own fixed-width grid track,
                    so the dot-line-dot midpoint lines up identically across every card. */}
                <div className="flex flex-col items-center justify-center self-center text-gray-400 dark:text-gray-500 pt-1">
                    {seg.Duration && <span className="text-[15px] mb-1.5 whitespace-nowrap leading-[1.4]">{formatDurationShort(seg.Duration)}</span>}
                    <div className="w-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                        <span className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600" />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                    </div>
                </div>

                {/* Arrival */}
                <div className="min-w-0 text-right">
                    {seg.ArrivalTime && <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-2 leading-[1.4]">{formatDate(seg.ArrivalTime)}</p>}
                    <p className="text-[30px] font-bold text-gray-900 dark:text-gray-100 leading-tight">{formatTime(seg.ArrivalTime)}</p>
                    <p className="text-[14px] font-semibold text-gray-600 dark:text-gray-300 mt-1 break-words leading-[1.4]">
                        {seg.ArrivalAirportCode} - {arrCity}
                    </p>
                    <p className="text-[14px] text-gray-400 dark:text-gray-500 leading-[1.4]">{seg.ArrivalAirportName}</p>
                    {seg.ArrivalTerminal && (
                        <p className="text-[14px] text-gray-400 dark:text-gray-500 leading-[1.4]">{seg.ArrivalTerminal}</p>
                    )}

                    {arrivalNearBy && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-semibold whitespace-nowrap leading-[1.4] justify-self-end">
                            <HiOutlineLocationMarker className="w-3 h-3 shrink-0" />
                            Nearby airport
                        </span>
                    )}
                </div>
            </div>

            {/* Baggage - moved below the departure/arrival row, spanning full width */}
            {hasBaggage && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 mb-2 leading-[1.4]">Baggage</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[12px] text-gray-600 dark:text-gray-300 leading-[1.4]">
                        {bag?.CabinBag && (
                            <p className="flex items-center gap-1.5">
                                <HiOutlineBriefcase className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                                <span>Cabin : <span className="font-semibold text-[#1c8fc7]">{bag.CabinBag}</span> per adult</span>
                            </p>
                        )}
                        {bag?.CheckinBaggage && (
                            <p className="flex items-center gap-1.5">
                                <HiOutlineBriefcase className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                                <span>Check-in : <span className="font-semibold text-[#1c8fc7]">{bag.CheckinBaggage}</span> per adult</span>
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function LayoverBanner({ seg }: { seg: Segment }) {
    const city = seg.ArrivalCityName ?? seg.ArrivalAirportName ?? seg.ArrivalAirportCode;
    return (
        <div className="mx-5 my-2 rounded-full bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-[12px] font-semibold text-center py-2 px-3 leading-[1.4]">
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 mb-5 overflow-hidden">
            <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Tag tone="blue">{label}</Tag>
                        <span className="text-[18px] font-bold text-gray-900 dark:text-gray-100 leading-[1.4]">
                            {fromLabel} <span className="text-gray-400 dark:text-gray-500">&rarr;</span> {toLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onShowFareRules}
                            className="text-[14px] font-semibold text-[#1c8fc7] hover:text-[#177aab] hover:underline whitespace-nowrap leading-[1.4]"
                        >
                            Fare rule details
                        </button>
                        <Tag>{refundableLabel(fare.Refundable)}</Tag>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap text-[14px] text-gray-500 dark:text-gray-400 leading-[1.4]">
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

            <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
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
                    <p className="text-[12px] text-[#177aab] bg-[#e8f4fb] rounded-lg px-3 py-2 leading-[1.4]">
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
        return { Icon: HiOutlineNoSymbol, tint: "text-rose-500 dark:text-rose-400", chip: "bg-rose-50 dark:bg-rose-950" };
    }
    if (h.includes("date") || h.includes("change") || h.includes("reschedul")) {
        return { Icon: HiOutlineCalendarDays, tint: "text-[#1c8fc7]", chip: "bg-[#e8f4fb]" };
    }
    if (h.includes("no show") || h.includes("no-show")) {
        return { Icon: HiOutlineUserGroup, tint: "text-amber-500 dark:text-amber-400", chip: "bg-amber-50 dark:bg-amber-950" };
    }
    return { Icon: HiOutlineDocumentText, tint: "text-gray-500 dark:text-gray-400", chip: "bg-gray-100 dark:bg-gray-800" };
}

function RulesCard({ legs, ruleLoading, ruleError, ruleData, onRetry }: {
    legs: LegSelection[];
    ruleLoading: boolean;
    ruleError: string | null;
    ruleData: any[] | null;
    onRetry: () => void;
}) {
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    function toggleSection(key: string) {
        setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    return (
        <div className="space-y-3">


            {ruleLoading && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[14px] text-gray-400 dark:text-gray-500 leading-[1.4]">
                        <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin text-[#FF7626]" />
                        Fetching cancellation &amp; date-change rules...
                    </div>
                    <div className="space-y-2 animate-pulse">
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
                    </div>
                </div>
            )}

            {!ruleLoading && ruleError && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-xl p-4 flex items-center justify-between gap-3">
                    <p className="text-[14px] text-red-600 dark:text-red-400 leading-[1.4]">{ruleError}</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-red-600 dark:text-red-400 shrink-0 hover:text-red-700 dark:hover:text-red-300 leading-[1.4]"
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
                        <div key={i} className="bg-white dark:bg-gray-900 overflow-hidden">
                            {routeLabel && (
                                <div className="px-4 py-2.5 bg-gray-300 dark:bg-gray-600 border-b border-gray-100 dark:border-gray-800">
                                    <p className="text-[12px] font-bold uppercase tracking-wide text-black dark:text-white leading-[1.4]">{routeLabel}</p>
                                </div>
                            )}

                            <div className="p-4 space-y-4">
                                {entry.sections?.length === 0 && (
                                    <p className="text-gray-400 dark:text-gray-500 text-[14px] leading-[1.4]">No detailed rules returned for this fare.</p>
                                )}

                                {entry.sections?.map((s: any, si: number) => {
                                    const sectionKey = `${i}-${si}`;
                                    const isCollapsed = !!collapsedSections[sectionKey];
                                    const { Icon, tint, chip } = getSectionVisual(s.head);
                                    const hasChild = s.tiers?.some((t: any) => t.childAmount);
                                    const hasInfant = s.tiers?.some((t: any) => t.infantAmount);

                                    return (
                                        <div key={si} className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => toggleSection(sectionKey)}
                                                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-gray-50/70 dark:bg-gray-900/70 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${chip} ${tint} shrink-0`}>
                                                        <Icon className="w-4 h-4" />
                                                    </span>
                                                    <span className="text-[12px] font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 text-left leading-[1.4]">{s.head}</span>
                                                </span>
                                                <HiOutlineChevronDown
                                                    className={`w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                                                />
                                            </button>

                                            {!isCollapsed && (
                                                <div className="px-3 py-2">
                                                    {!s.tiers || s.tiers.length === 0 ? (
                                                        <p className="text-[12px] text-gray-400 dark:text-gray-500 py-2 leading-[1.4]">No charge details available.</p>
                                                    ) : (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 leading-[1.4]">
                                                                        <th className="text-left font-semibold py-1.5 pr-2">Period</th>
                                                                        <th className="text-right font-semibold py-1.5 px-2">Adult</th>
                                                                        {hasChild && <th className="text-right font-semibold py-1.5 px-2">Child</th>}
                                                                        {hasInfant && <th className="text-right font-semibold py-1.5 pl-2">Infant</th>}
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                                    {s.tiers.map((t: any, ti: number) => (
                                                                        <tr key={ti} className={ti % 2 === 1 ? "bg-gray-50/50 dark:bg-gray-900/50" : ""}>
                                                                            <td className="py-2 pr-2 text-gray-500 dark:text-gray-400 align-top">{t.description || "—"}</td>
                                                                            <td
                                                                                className="py-2 px-2 text-right font-semibold text-gray-900 dark:text-gray-100 align-top whitespace-nowrap"
                                                                                dangerouslySetInnerHTML={{ __html: t.adultAmount || "—" }}
                                                                            />
                                                                            {hasChild && (
                                                                                <td
                                                                                    className="py-2 px-2 text-right font-semibold text-gray-900 dark:text-gray-100 align-top whitespace-nowrap"
                                                                                    dangerouslySetInnerHTML={{ __html: t.childAmount || "—" }}
                                                                                />
                                                                            )}
                                                                            {hasInfant && (
                                                                                <td
                                                                                    className="py-2 pl-2 text-right font-semibold text-gray-900 dark:text-gray-100 align-top whitespace-nowrap"
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
                                    <div className="flex items-start gap-2 text-[12px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2.5 leading-[1.4]">
                                        <HiOutlineDocumentText className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                                        <span>{entry.additionalCharge}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

            {!ruleLoading && !ruleError && (!ruleData || ruleData.length === 0) && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-[12px] text-gray-400 dark:text-gray-500 text-center leading-[1.4]">
                    Cancellation and date-change charges vary by fare rule and are confirmed at the time of booking.
                </div>
            )}
        </div>
    );
}

/**
 * Sidebar showing fare rules. When there is more than one leg (onward + return),
 * a tab bar is rendered so the traveller can flip between "DEL - BOM" and "BOM - DEL"
 * instead of only ever seeing whichever leg's "Fare rule details" link they clicked.
 */
function FareRuleSidebar({
    open,
    onClose,
    legs,
    activeIndex,
    onTabChange,
    ruleLoading,
    ruleError,
    ruleData,
    onRetry,
}: {
    open: boolean;
    onClose: () => void;
    legs: LegSelection[];
    activeIndex: number;
    onTabChange: (index: number) => void;
    ruleLoading: boolean;
    ruleError: string | null;
    ruleData: any[] | null;
    onRetry: () => void;
}) {
    const activeLeg = legs[activeIndex];

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
                className={`fixed top-0 right-0 h-full w-full sm:w-[680px] bg-[#f5f8fb] z-50 shadow-2xl transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <HiOutlineDocumentText className="w-5 h-5 text-[#1c8fc7]" />
                        <h3 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 leading-[1.4]">Fare rules &amp; policies</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <HiOutlineXMark className="w-5 h-5" />
                    </button>
                </div>

                {legs.length > 1 && (
                    <div className="flex gap-1 px-5 pt-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
                        {legs.map((leg, i) => {
                            const active = i === activeIndex;
                            const fromLabel = leg.journey.FromCity ?? leg.journey.From;
                            const toLabel = leg.journey.ToCity ?? leg.journey.To;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => onTabChange(i)}
                                    className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap leading-[1.4] ${active
                                        ? "border-[#1c8fc7] text-[#1c8fc7]"
                                        : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                        }`}
                                >
                                    {leg.journey.From} - {leg.journey.To}
                                    <span className="hidden sm:inline text-[12px] font-normal text-gray-400 dark:text-gray-500 ml-1 leading-[1.4]">
                                        ({fromLabel} &rarr; {toLabel})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 dark:bg-gray-900">
                    <RulesCard
                        legs={activeLeg ? [activeLeg] : []}
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
    const [pricedBookingId, setPricedBookingId] = useState<string>(bookingId);
    const [passengers, setPassengers] = useState<PassengerDetails[]>([]);
    const [gst, setGst] = useState<GSTDetails | null>(null);
    const [billing, setBilling] = useState<BillingAddress | null>(null);
    const [pricedIndex, setPricedIndex] = useState<string[] | null>(null);
    const [searchMeta, setSearchMeta] = useState<SearchMeta>({ fromCode: from, fromName, toCode: to, toName });


    const [fareRuleSidebarOpen, setFareRuleSidebarOpen] = useState(false);
    const [activeRuleTabIndex, setActiveRuleTabIndex] = useState(0);
    const [fareRuleState, setFareRuleState] = useState<
        Record<number, { loading: boolean; error: string | null; data: any[] | null }>
    >({});


    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, []);

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


    if (searchType === "RS" && index.length === 2) {
        let currentTokenId = tokenId;
        let currentBookingId = bookingId;
        const legResults: LegSelection[] = [];
        let lastPricing: any = null;

        for (const legIndex of index) {
            const res = await getAirlinePricing({
                tokenId: currentTokenId,
                bookingId: currentBookingId,
                index: legIndex,
                searchType,
            });

            if (!res.success || !res.pricing) {
                setPricingLoading(false);
                setPricingError(res.message || "Could not fetch fare details. Please try again.");
                return;
            }

            const journey = (res.pricing.journeys as Journey[])[0];
            const fare = journey?.FareInfo?.[0];

            if (!journey || !fare) {
                setPricingLoading(false);
                setPricingError("This fare is no longer available. Please go back and search again.");
                setPricedOnward(null);
                setPricedReturn(null);
                return;
            }

            legResults.push({ journey, fare });
            currentTokenId = res.pricing.tokenId || currentTokenId;
            currentBookingId = res.pricing.bookingId || currentBookingId;
            lastPricing = res.pricing;
        }

        setPricingLoading(false);
        setPricedOnward(legResults[0] ?? null);
        setPricedReturn(legResults[1] ?? null);
        setSearchMeta({
            fromCode: lastPricing?.from ?? from,
            fromName: lastPricing?.fromName ?? fromName,
            toCode: lastPricing?.to ?? to,
            toName: lastPricing?.toName ?? toName,
        });

        const newIndex = legResults
            .map((leg) => leg.fare.Index)
            .filter((v): v is string => Boolean(v));
        setPricedIndex(newIndex);

        setChecklist(
            lastPricing?.fnuLnuSettings
                ? {
                    ...lastPricing.fnuLnuSettings.TravellerCheckList,
                    FnuMessage: lastPricing.fnuLnuSettings.FnuMessage,
                    LnuMessage: lastPricing.fnuLnuSettings.LnuMessage,
                }
                : null
        );
        setExpirySeconds(parseExpiryToSeconds(lastPricing?.bookingExpiryTime));
        setPricedBookingId(currentBookingId || bookingId);

        setFareRuleState({});
        return;
    }

    // Oneway ("ON") and Roundtrip Domestic ("ON" + "RT") — single combined call.
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
    const returnLeg = returnJourney?.FareInfo?.[0]
        ? { journey: returnJourney, fare: returnJourney.FareInfo[0] }
        : null;

    if (!onwardLeg) {
        setPricingError("This fare is no longer available. Please go back and search again.");
        setPricedOnward(null);
        setPricedReturn(null);
        return;
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

    setFareRuleState({});
}

    async function fetchFareRuleForLeg(legIndex: number, leg: LegSelection) {
        setFareRuleState((prev) => ({
            ...prev,
            [legIndex]: { loading: true, error: null, data: prev[legIndex]?.data ?? null },
        }));


        const idx = leg.fare.Index || (isCombinedRoundtrip ? index[0] : index[legIndex]);
        if (!idx) {
            setFareRuleState((prev) => ({
                ...prev,
                [legIndex]: { loading: false, error: "Could not determine fare rules for this flight.", data: null },
            }));
            return;
        }

        const res = await getAirlineFareRule({ tokenId, index: [idx], searchType });

        if (!res.success || !res.rules) {
            setFareRuleState((prev) => ({
                ...prev,
                [legIndex]: { loading: false, error: res.message || "Could not fetch rules for this flight.", data: null },
            }));
            return;
        }

        if (res.rules.length === 0) {
            setFareRuleState((prev) => ({
                ...prev,
                [legIndex]: { loading: false, error: null, data: [] },
            }));
            return;
        }

        const legRoute = `${leg.journey.From}-${leg.journey.To}`.toUpperCase();
        const matchingEntries = res.rules.filter(
            (entry: any) => (entry.originDestination || "").toUpperCase() === legRoute
        );
        const entriesToUse = matchingEntries.length > 0 ? matchingEntries : res.rules;

        const seenSectionKeys = new Set<string>();
        const mergedSections: any[] = [];
        let mergedAdditionalCharge: string | null = null;

        for (const entry of entriesToUse) {
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

        setFareRuleState((prev) => ({
            ...prev,
            [legIndex]: {
                loading: false,
                error: null,
                data: [
                    {
                        originDestination: entriesToUse[0]?.originDestination || legRoute,
                        sections: mergedSections,
                        additionalCharge: mergedAdditionalCharge,
                    },
                ],
            },
        }));
    }

    function handleShowFareRules(legIndex: number) {
        setFareRuleSidebarOpen(true);
        setActiveRuleTabIndex(legIndex);
        const leg = legs[legIndex];
        const cached = fareRuleState[legIndex];
     
        if (leg && (!cached || cached.error)) {
            fetchFareRuleForLeg(legIndex, leg);
        }
    }

    function handleFareRuleTabChange(legIndex: number) {
        setActiveRuleTabIndex(legIndex);
        const leg = legs[legIndex];
        const cached = fareRuleState[legIndex];
        if (leg && (!cached || cached.error)) {
            fetchFareRuleForLeg(legIndex, leg);
        }
    }

    function handleRetryFareRule() {
        const leg = legs[activeRuleTabIndex];
        if (leg) fetchFareRuleForLeg(activeRuleTabIndex, leg);
    }

  

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

const travelerCounts = { adults, children, infants };

const baseFareTotal = totalAcrossTravelers(fareLegs, "Fare", travelerCounts);
const taxTotal = totalAcrossTravelers(fareLegs, "Tax", travelerCounts);
const grossFareTotal = totalAcrossTravelers(fareLegs, "GrossFare", travelerCounts);
const netFareTotal = totalAcrossTravelers(fareLegs, "NetFare", travelerCounts);
const discountTotal = grossFareTotal - netFareTotal;

// FareDisplayType
//  "G" -> Gross fare only
//  "N" -> Net fare only
//  "S" -> Gross fare struck through
//  "P" -> , discount + strike-through only if discounted
const fareDisplayType = fareLegs[0]?.fare.FareDisplayType ?? "P";

const showBreakdown = fareDisplayType !== "N";
const showDiscountRow =
    (fareDisplayType === "P" || fareDisplayType === "S") && discountTotal > 0;
const showStrikeThru =
    fareDisplayType === "S" ? true : fareDisplayType === "P" ? discountTotal > 0 : false;
const totalAmount = fareDisplayType === "G" ? grossFareTotal : netFareTotal;

    const gstMandatory = Boolean(checklist?.GSTMandate);
    const showTravellerForms = isPriced && checklist;

const readyToPay = showTravellerForms
    ? passengerFormIsValid(passengers, checklist!) &&
    contactFormIsValid(contact) &&
    (!gst || gstFormIsValid(gst, gstMandatory)) &&
    billingFormIsValid(billing, false)
    : false;

    const travellerCount = adults + children + infants;

function handleContinueToPayment() {
    onContinue({
        passengers,
        gst,
        contact,
        billing,
        totalAmount,
        baseFareTotal,
        taxTotal,
        grossFareTotal,
        netFareTotal,
        fareDisplayType,
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
        <div className="min-h-screen bg-dark dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 pb-10 font-[ixi-type,ui-sans-serif,system-ui,sans-serif]">
            <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-8 py-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-1 text-[14px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 leading-[1.4]"
                    >
                        <HiOutlineChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
                    <div>
                        <h1 className="text-[20px] font-bold text-gray-900 dark:text-gray-100 leading-tight">Review your booking</h1>
                        <p className="text-[14px] text-gray-400 dark:text-gray-500 leading-[1.4]">Verify info, add travellers, and continue to payment</p>
                    </div>
                </div>
                <StepIndicator />
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-4">
                        <HiOutlinePaperAirplane className="w-4 h-4 text-[#1c8fc7] -rotate-45" />
                        <h2 className="text-[18px] font-bold text-gray-900 dark:text-gray-100 leading-[1.4]">Flight details</h2>
                    </div>

                    {pricingError && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-2xl p-4 flex items-center justify-between gap-3 mb-5">
                            <p className="text-[14px] text-red-600 dark:text-red-400 leading-[1.4]">{pricingError}</p>
                            {/* <button
                                type="button"
                                onClick={() => fetchPricing()}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400 shrink-0"
                            >
                                <HiOutlineArrowPath className="w-4 h-4" /> Retry
                            </button> */}
                        </div>
                    )}

                    {pricingLoading && (
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-[14px] text-gray-400 dark:text-gray-500 mb-5 leading-[1.4]">
                            Fetching the latest fare...
                        </div>
                    )}

                    {displayOnward && (
                        <ItineraryCard
                            label="Departure Flight"
                            leg={displayOnward}
                            cabinLabel={CABIN_LABEL[cabinClass]}
                            searchMeta={searchMeta}
                            showNearByNotice
                            onShowFareRules={() => handleShowFareRules(0)}
                        />
                    )}
                    {isRoundtrip && displayReturn && (
                        <ItineraryCard
                            label="Return Flight"
                            leg={displayReturn}
                            cabinLabel={CABIN_LABEL[cabinClass]}
                            searchMeta={searchMeta}
                            showNearByNotice
                            onShowFareRules={() => handleShowFareRules(1)}
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
        <BillingAddressForm mandatory={false} onChange={setBilling} />
    </div>
)}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sticky top-6">
                    <h3 className="text-[18px] font-bold text-gray-900 dark:text-gray-100 leading-[1.4] mb-1">Fare summary</h3>
                    <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-3 leading-[1.4]">
                        {isRoundtrip ? "Round trip" : "One way"} &middot; {travellerCount} traveller
                        {travellerCount > 1 ? "s" : ""}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {adults > 0 && <Tag tone="blue">{adults} Adult{adults > 1 ? "s" : ""}</Tag>}
                        {children > 0 && <Tag tone="blue">{children} Child{children > 1 ? "ren" : ""}</Tag>}
                        {infants > 0 && <Tag tone="blue">{infants} Infant{infants > 1 ? "s" : ""}</Tag>}
                    </div>

{showBreakdown && (
    <div className="space-y-2 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between text-[14px] leading-[1.4]">
            <span className="text-gray-500 dark:text-gray-400">Base fare</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(baseFareTotal)}</span>
        </div>
        <div className="flex items-center justify-between text-[14px] leading-[1.4]">
            <span className="text-gray-500 dark:text-gray-400">Taxes &amp; fees</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(taxTotal)}</span>
        </div>
        {showDiscountRow && (
            <div className="flex items-center justify-between text-[14px] leading-[1.4]">
                <span className="text-gray-500 dark:text-gray-400">Discount</span>
                <span className="font-semibold text-green-600 dark:text-green-400">-{formatPrice(discountTotal)}</span>
            </div>
        )}
    </div>
)}

                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <p className="text-[16px] font-bold text-gray-900 dark:text-gray-100 leading-tight">Total</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-[1.4]">Incl. all taxes &amp; fees</p>
                        </div>
                        <div className="text-right">
                            {showStrikeThru && (
  <p className="text-[14px] text-gray-400 dark:text-gray-500 line-through leading-[1.4]">{formatPrice(grossFareTotal)}</p>
                            )}
                            <p className="text-[24px] font-bold text-[#1c8fc7] leading-tight">{formatPrice(totalAmount)}</p>
                        </div>
                    </div>

                    {isPriced && expirySeconds !== null && (
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 py-3 leading-[1.4]">
                            <HiOutlineLockClosed className="w-3.5 h-3.5" />
                            Price locked &middot; Valid for {formatCountdown(expirySeconds)}
                        </div>
                    )}
                    {!isLoggedIn && (
                        <p className="text-[12px] text-[#177aab] bg-[#e8f4fb] rounded-xl px-3 py-2 my-3 leading-[1.4]">
                            Log in to lock this fare and add traveller details.
                        </p>
                    )}

                    {isPriced ? (
                        <button
                            type="button"
                            disabled={!readyToPay}
                            onClick={handleContinueToPayment}
                            className={`w-full h-12 rounded-full text-[14px] font-bold flex items-center justify-center gap-2 transition-colors mt-2 ${readyToPay
                                ? "bg-[#1c8fc7] text-white hover:bg-[#177aab]"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
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

                    <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-3 leading-[1.4]">
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
                legs={legs}
                activeIndex={activeRuleTabIndex}
                onTabChange={handleFareRuleTabChange}
                ruleLoading={fareRuleState[activeRuleTabIndex]?.loading ?? false}
                ruleError={fareRuleState[activeRuleTabIndex]?.error ?? null}
                ruleData={fareRuleState[activeRuleTabIndex]?.data ?? null}
                onRetry={handleRetryFareRule}
            />
        </div>
    );
}