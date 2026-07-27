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
} from "react-icons/hi2";
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


type Baggage = { PTC?: string; CabinBag?: string; CheckinBaggage?: string };
type PTCFareEntry = { PTC: string; Fare: number; Tax: number; GrossFare: number; NetFare: number };
type FareInfo = {
    FareType?: string;
    GrossFare: number;
    NetFare: number;
    Refundable?: "Y" | "N" | "P";
    Index?: string;
    Seats?: number;
    PTCFare?: PTCFareEntry[];
    Baggage?: Baggage[];
};
type Segment = {
    AirlineName: string;
    AirlineCode: string;
    FlightNo: string;
    DepartureAirportCode: string;
    ArrivalAirportCode: string;
    ArrivalAirportName?: string;
    DepartureAirportName?: string;
    Duration?: string;
    Layover?: string;
    VACLogo?: string;
    MACLogo?: string;
    OACLogo?: string;
};
type Journey = {
    From: string;
    To: string;
    Stops: number;
    Segments: Segment[];
    DepartureDateTime: string;
    ArrivalDateTime: string;
    Duration: string;
    FareInfo: FareInfo[] | null;
};
type LegSelection = { journey: Journey; fare: FareInfo };

export type ReviewBookingProps = {
    from: string;
    to: string;
    tripType: TripType;
    onward: LegSelection | null;
    ret: LegSelection | null;
    adults: number;
    children: number;
    infants: number;
    cabinClass: CabinClass;
    tokenId: string;
    bookingId: string;
    index: string[];
    onBack: () => void;
    onContinueToPayment: (data: {
        passengers: PassengerDetails[];
        gst: GSTDetails | null;
        totalAmount: number;
        pricing: { onward: LegSelection | null; ret: LegSelection | null };
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

function refundableLabel(r?: "Y" | "N" | "P") {
    if (r === "Y") return "Refundable";
    if (r === "P") return "Partially Refundable";
    return "Non-Refundable";
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
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                active ? "bg-[#1c8fc7] text-white" : "bg-gray-100 text-gray-400"
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

function ItineraryCard({ label, leg, cabinLabel }: { label: string; leg: LegSelection; cabinLabel: string }) {
    const { journey, fare } = leg;
    const firstSeg = journey.Segments[0];
    const stopsLabel = journey.Stops === 0 ? "Direct" : `${journey.Stops} stop${journey.Stops > 1 ? "s" : ""}`;
    const adtBag = fare.Baggage?.find((b) => b.PTC === "A");
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 mb-5 overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-2 px-5 pt-5 pb-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <Tag tone="blue">{label}</Tag>
                    <span className="text-sm font-semibold text-gray-900">
                        {journey.From} <span className="text-gray-400">&rarr;</span> {journey.To} &middot;{" "}
                        {formatDate(journey.DepartureDateTime)}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {fare.FareType && <Tag>{fare.FareType}</Tag>}
                    <Tag>{refundableLabel(fare.Refundable)}</Tag>
                    <Tag tone="slate">{cabinLabel}</Tag>
                </div>
            </div>

            <div className="px-5 pb-4 flex items-center gap-4">
                <AirlineLogo seg={firstSeg} code={firstSeg?.AirlineCode} className="w-11 h-11" />

                <div className="flex-1 flex items-center gap-4 min-w-0">
                    <div className="shrink-0">
                        <p className="text-2xl font-bold text-gray-900 leading-tight">
                            {formatTime(journey.DepartureDateTime)}{" "}
                            <span className="text-sm font-semibold text-gray-500">{journey.From}</span>
                        </p>
                        <p className="text-xs text-gray-400">{firstSeg?.AirlineName}</p>
                        <p className="text-xs text-gray-400">
                            {firstSeg?.AirlineCode}-{firstSeg?.FlightNo}
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col items-center text-gray-400 min-w-[100px]">
                        <span className="text-[11px] mb-1">{journey.Duration}</span>
                        <span className="w-full border-t border-gray-300" />
                        <span className="text-[11px] mt-1 bg-green-50 text-green-700 rounded-full px-2 py-0.5">
                            {stopsLabel}
                        </span>
                    </div>

                    <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-gray-900 leading-tight">
                            {formatTime(journey.ArrivalDateTime)}{" "}
                            <span className="text-sm font-semibold text-gray-500">{journey.To}</span>
                        </p>
                        <p className="text-xs text-gray-400">{firstSeg?.ArrivalAirportName ?? journey.To}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <div className="flex items-center gap-5 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                        <HiOutlineBriefcase className="w-4 h-4 text-gray-400" /> Check-in{" "}
                        <span className="font-semibold text-[#1c8fc7]">
                            {adtBag?.CheckinBaggage ? `${adtBag.CheckinBaggage}` : "—"}
                        </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <HiOutlineBriefcase className="w-4 h-4 text-gray-400" /> Cabin{" "}
                        <span className="font-semibold text-[#1c8fc7]">
                            {adtBag?.CabinBag ? `${adtBag.CabinBag}` : "—"}
                        </span>
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-700"
                >
                    Show details {expanded ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
                </button>
            </div>

            {expanded && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-100 space-y-2">
                    {journey.Segments.map((seg, i) => (
                        <div key={i} className="text-xs text-gray-500 flex items-center justify-between gap-2">
                            <span>
                                {seg.AirlineName} {seg.AirlineCode}-{seg.FlightNo}: {seg.DepartureAirportCode} &rarr;{" "}
                                {seg.ArrivalAirportCode}
                            </span>
                            {seg.Duration && <span className="shrink-0">{seg.Duration}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function RulesCard({ legs, ruleLoading, ruleError, ruleData, onRetry }: {
    legs: LegSelection[];
    ruleLoading: boolean;
    ruleError: string | null;
    ruleData: any[] | null;
    onRetry: () => void;
}) {
    const fareTypes = Array.from(new Set(legs.map((l) => l.fare.FareType).filter(Boolean))) as string[];
    const refundLabels = Array.from(new Set(legs.map((l) => refundableLabel(l.fare.Refundable))));

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-3">Rules &amp; Policies</h3>
            <div className="flex flex-wrap gap-2 mb-4">
                {refundLabels.map((r) => <Tag key={r}>{r}</Tag>)}
                {fareTypes.map((f) => <Tag key={f}>{f}</Tag>)}
            </div>

            {ruleLoading && <p className="text-xs text-gray-400">Fetching cancellation &amp; date-change rules...</p>}

            {!ruleLoading && ruleError && (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-red-600">{ruleError}</p>
                    <button type="button" onClick={onRetry} className="text-xs font-semibold text-red-600">Retry</button>
                </div>
            )}

            {!ruleLoading && !ruleError && ruleData?.map((entry, i) => (
                <div key={entry.index || i} className="mb-3 last:mb-0">
                    {entry.sections?.map((s: any, si: number) => (
                        <div key={si} className="mb-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#1c8fc7] mb-1">{s.head}</p>
                            <p className="text-xs text-gray-500 whitespace-pre-line">{s.description || "—"}</p>
                        </div>
                    ))}
                </div>
            ))}

            {!ruleLoading && !ruleError && !ruleData && (
                <p className="text-xs text-gray-500">
                    Cancellation and date-change charges vary by fare rule and are confirmed at the time of booking.
                </p>
            )}
        </div>
    );
}

export default function ReviewBooking({
    from,
    to,
    tripType,
    onward,
    ret,
    adults,
    children,
    infants,
    cabinClass,
    tokenId,
    bookingId,
    index,
    onBack,
    onContinueToPayment,
}: ReviewBookingProps) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
const [loginOpen, setLoginOpen] = useState(false);

    const [pricingLoading, setPricingLoading] = useState(false);
    const [pricingError, setPricingError] = useState<string | null>(null);
    const [pricedOnward, setPricedOnward] = useState<LegSelection | null>(null);
    const [pricedReturn, setPricedReturn] = useState<LegSelection | null>(null);
    const [checklist, setChecklist] = useState<TravellerCheckList | null>(null);
    const [expirySeconds, setExpirySeconds] = useState<number | null>(null);
const [ruleLoading, setRuleLoading] = useState(false);
const [ruleError, setRuleError] = useState<string | null>(null);
const [ruleData, setRuleData] = useState<any[] | null>(null);
    const [passengers, setPassengers] = useState<PassengerDetails[]>([]);
    const [gst, setGst] = useState<GSTDetails | null>(null);

useEffect(() => {
    setIsLoggedIn(isLoggedInSession());
}, []);

async function fetchPricing() {
    setPricingLoading(true);
    setPricingError(null);

    const res = await getAirlinePricing({ tokenId, bookingId, index });
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

    if (!onwardLeg || (tripType === "roundtrip" && !returnLeg)) {
        setPricingError("This fare is no longer available. Please go back and search again.");
        setPricedOnward(null);
        setPricedReturn(null);
        return;
    }

    setPricedOnward(onwardLeg);
    setPricedReturn(returnLeg);
    setChecklist(res.pricing.fnuLnuSettings?.TravellerCheckList ?? null);
    setExpirySeconds(parseExpiryToSeconds(res.pricing.bookingExpiryTime));
}
async function fetchFareRule() {
    setRuleLoading(true);
    setRuleError(null);
    const res = await getAirlineFareRule({ tokenId, index });
    setRuleLoading(false);
    if (!res.success) {
        setRuleError(res.message || "Could not fetch fare rules.");
        return;
    }
    setRuleData(res.rules);
}

useEffect(() => {
    fetchFareRule();
}, [tokenId, index.join(",")]);

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
        await fetchPricing();
    }

    const displayOnward = pricedOnward ?? onward;
    const displayReturn = pricedReturn ?? ret;
    const isRoundtrip = tripType === "roundtrip";
    const isPriced = isLoggedIn && Boolean(pricedOnward) && (!isRoundtrip || Boolean(pricedReturn));

    const legs = [displayOnward, isRoundtrip ? displayReturn : null].filter(Boolean) as LegSelection[];

    const baseFare =
        legs.reduce((sum, leg) => sum + (adtPtc(leg.fare)?.Fare ?? 0), 0) * adults;
    const taxes = legs.reduce((sum, leg) => sum + (adtPtc(leg.fare)?.Tax ?? 0), 0) * adults;
    const totalAmount = legs.reduce((sum, leg) => sum + adtNetFare(leg.fare), 0) * adults;

    const gstMandatory = Boolean(checklist?.GSTMandate);
    const showTravellerForms = isPriced && checklist;

    const readyToPay = showTravellerForms
        ? passengerFormIsValid(passengers, checklist!) && (!gst || gstFormIsValid(gst, gstMandatory))
        : false;

    const travellerCount = adults + children + infants;

    function handleContinueToPayment() {
        onContinueToPayment({
            passengers,
            gst,
            totalAmount,
            pricing: { onward: displayOnward, ret: isRoundtrip ? displayReturn : null },
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
            <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
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
                        <h1 className="text-base font-bold text-gray-900 leading-tight">Review your booking</h1>
                        <p className="text-xs text-gray-400">Verify info, add travellers, and continue to payment</p>
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

                    {displayOnward && <ItineraryCard label="Your Flight" leg={displayOnward} cabinLabel={CABIN_LABEL[cabinClass]} />}
                    {isRoundtrip && displayReturn && (
                        <ItineraryCard label="Return Flight" leg={displayReturn} cabinLabel={CABIN_LABEL[cabinClass]} />
                    )}

                    {legs.length > 0 && <RulesCard legs={legs} />}

                    {showTravellerForms && (
                        <div className="space-y-5 mt-5">
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
                        <p className="text-xl font-bold text-[#1c8fc7]">{formatPrice(totalAmount)}</p>
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
                            className={`w-full h-12 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors mt-2 ${
                                readyToPay
                                    ? "bg-[#1c8fc7] text-white hover:bg-[#177aab]"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            Continue to Payment <HiOutlineArrowRight className="w-4 h-4" />
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
        </div>
    );
}