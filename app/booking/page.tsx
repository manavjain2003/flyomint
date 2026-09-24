"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAirlineBookingRetrieve, getETicketCopy, getAirlineInvoice } from "@/app/lib/flightsapi";
import { HiOutlinePhone, HiOutlineEnvelope } from "react-icons/hi2";
import AirlineLogo from "@/app/components/flights/AirlineLogo";

type SSR = {
  SID: number;
  SSRCode: string;
  SSRDesc: string;
  SSRType: string;
};

type Traveler = {
  PaxID: number;
  Title: string;
  FirstName: string;
  LastName: string;
  PaxType: string;
  TicketNumber?: string;
  SSRL?: SSR[];
};

type Segment = {
  SID: string;
  FlightNo: string;
  AirlineCode: string;
  AirlineName: string;
  VACLogo?: string;
  MACLogo?: string;
  OACLogo?: string;
  DepartureTime: string;
  ArrivalTime: string;
  DepartureAirportCode: string;
  ArrivalAirportCode: string;
  DepartureCityName: string;
  ArrivalCityName: string;
  DepartureAirportName?: string;
  ArrivalAirportName?: string;
  DepartureTerminal?: string;
  ArrivalTerminal?: string;
  Cabin?: string;
  Duration?: string;
  Layover?: string;
};

type PTCFare = {
  PTC: string;
  Fare: number;
  Tax: number;
  Discount: number;
  GrossFare: number;
  NetFare: number;
  ConvFee?: number;
};

type FareInfo = {
  BaseFare: number;
  Tax: number;
  Discount: number;
  GrossFare: number;
  NetFare: number;
  ConvenienceFee?: number;
  PTCFare?: PTCFare[];
};

type Journey = {
  BookingStatus: string;
  AirlinePNR: string;
  Stops: number;
  From: string;
  To: string;
  FromCity: string;
  ToCity: string;
  FareInfo: FareInfo;
  Segments: Segment[];
  DepartureDateTime: string;
  ArrivalDateTime: string;
  Travelers: Traveler[];
  Message?: string;
  PaymentTime?: string;
};

type ServiceResponse = {
  TransactionID: number;
  ReferenceNo: string;
  ContactInfo: { Mobile: string; Email: string };
  PaymentStatus: string;
  PaymentTime?: string;
  Journey: Journey[];
  ADT: number;
  CHD: number;
  INF: number;
};

const currency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n ?? 0);

const CABIN_LABELS: Record<string, string> = {
  E: "Economy",
  Y: "Economy",
  P: "Premium Economy",
  W: "Premium Economy",
  C: "Business",
  J: "Business",
  F: "First",
};

const PENDING_STATUSES = [
  "PENDING",
  "BOOKING INITIATE",
  "INITIATE",
  "IN PROGRESS",
  "BOOKING NOT INITIATED",
  "NOT INITIATED",
];

const CONFIRMED_STATUSES = ["CONFIRMED", "SUCCESS", "TICKETED", "BOOKED"];

function isPendingStatus(status?: string) {
  if (!status) return false;
  return PENDING_STATUSES.includes(status.toUpperCase().trim());
}

function isConfirmedStatus(status?: string) {
  if (!status) return false;
  return CONFIRMED_STATUSES.includes(status.toUpperCase().trim());
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

function formatDateShort(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function stopsLabel(stops: number) {
  if (!stops) return "Non-stop";
  return `${stops} Stop${stops > 1 ? "s" : ""}`;
}

function cabinLabel(code?: string) {
  if (!code) return "";
  return CABIN_LABELS[code] ?? code;
}

const AIRLINE_PHONES: Record<string, string> = {
  "6E": "0124-6173838",
  IX: "0124-6173838",
  AI: "0124-2640888",
  UK: "0124-6173838",
  SG: "0120-2444415",
  G8: "0120-711-1000",
  QP: "0120-444-4444",
};

function getAirlinePhone(airlineCode?: string): string {
  if (!airlineCode) return "—";
  return AIRLINE_PHONES[airlineCode.toUpperCase()] ?? "—";
}

function travelerName(t: Traveler) {
  return [t.Title, t.FirstName, t.LastName].filter(Boolean).join(" ");
}

function travelerPaxTypeLabel(t: Traveler) {
  const map: Record<string, string> = { A: "Adult", C: "Child", I: "Infant" };
  const gender = t.Title === "MRS" || t.Title === "MS" ? "Female" : "Male";
  return `${map[t.PaxType] ?? t.PaxType}, ${gender}`;
}

function findSSRAddon(t: Traveler, sid: string | number, type: string): string {
  const sidStr = String(sid);
  const matches = t.SSRL?.filter(
    (s) =>
      s.SSRType === type &&
      String(s.SID) === sidStr &&
      !(type === "2" && s.SSRCode === "BAG")
  );
  if (!matches || matches.length === 0) return "--";
  return matches.map((s) => s.SSRDesc).join(", ");
}

function getFreeBaggage(travelers: Traveler[], segSID: string | number): { cabin: string; checkin: string } | null {
  const t = travelers[0];
  if (!t?.SSRL) return null;
  const sidStr = String(segSID);
  const bagSsr = t.SSRL.find(
    (s) => s.SSRCode === "BAG" && s.SSRType === "2" && String(s.SID) === sidStr
  );
  if (!bagSsr) return null;
  const parts = bagSsr.SSRDesc.split(",").map((p) => p.trim());
  const checkin = parts[0] ?? "";
  const cabin = parts[1] ?? "";
  return { checkin, cabin };
}

function getMessageExpiry(paymentTime?: string): Date | null {
  if (!paymentTime) return null;
  const base = new Date(paymentTime);
  if (isNaN(base.getTime())) return null;
  return new Date(base.getTime() + 20 * 60 * 1000);
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CountdownTimer({ expiresAt }: { expiresAt: Date }) {
  const [remainingMs, setRemainingMs] = useState(() => expiresAt.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemainingMs(expiresAt.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remainingMs <= 0) return null;

  const totalSeconds = Math.floor(remainingMs / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-sm font-bold tabular-nums flex-shrink-0">
      <ClockIcon className="w-4 h-4" />
      {mm}:{ss}
    </span>
  );
}

type Stage = "checking" | "landing" | "bookingFailed";
type LeafStatus = "success" | "failed" | "pending";

export default function BookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-[#1c8fc7]/20 border-t-[#1c8fc7] animate-spin" />
        </div>
      }
    >
      <BookingConfirmationPage />
    </Suspense>
  );
}

function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const transactionId =
    searchParams.get("txnid") ||
    searchParams.get("txnid1") ||
    searchParams.get("txnId") ||
    searchParams.get("TransactionID") ||
    searchParams.get("transactionId") ||
    searchParams.get("id") ||
    searchParams.get("tid");

  const [stage, setStage] = useState<Stage>("checking");
  const [bookingStatus, setBookingStatus] = useState<LeafStatus | null>(null);
  const [failReason, setFailReason] = useState<string>("Something went wrong. Please try again.");
  const [failedAt, setFailedAt] = useState<Date | null>(null);
  const [booking, setBooking] = useState<ServiceResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [panel, setPanel] = useState<"cancel" | "reschedule" | "fareRules" | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [manualChecking, setManualChecking] = useState(false);
  const [selectedJourneys, setSelectedJourneys] = useState<Set<number>>(new Set());
  const [selectedTravelers, setSelectedTravelers] = useState<Set<number>>(new Set());

  const pollCountRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retrieveRef = useRef<(() => Promise<void>) | null>(null);

  function openPanel(type: "cancel" | "reschedule" | "fareRules") {
    if (booking) {
      setSelectedJourneys(new Set(booking.Journey.map((_, i) => i)));
      setSelectedTravelers(new Set(booking.Journey.flatMap((j) => j.Travelers.map((t) => t.PaxID))));
    }
    setPanel(type);
    requestAnimationFrame(() => requestAnimationFrame(() => setPanelVisible(true)));
  }

  function closePanel() {
    setPanelVisible(false);
    setTimeout(() => setPanel(null), 300);
  }

  async function handleDownloadTicket() {
    if (!booking?.TransactionID || downloadingTicket) return;
    setDownloadingTicket(true);
    try {
      const refNo = booking.ReferenceNo || "";
      const res = await getETicketCopy({ transactionId: String(booking.TransactionID) });
      if (!res.success || !res.data?.blob) {
        alert(res.message || "Could not download e-ticket. Please try again.");
        return;
      }
      const url = window.URL.createObjectURL(res.data.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `e-ticket-${refNo || booking.TransactionID}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingTicket(false);
    }
  }

  async function handleDownloadInvoice() {
    if (!booking?.TransactionID || downloadingInvoice) return;
    setDownloadingInvoice(true);
    try {
      const res = await getAirlineInvoice({
        transactionId: booking.TransactionID,
        pnr: "",
        referenceNo: "",
      });
      if (!res.success || !res.data?.blob) {
        alert(res.message || "Could not download invoice. Please try again.");
        return;
      }
      const url = window.URL.createObjectURL(res.data.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${booking.ReferenceNo || booking.TransactionID}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingInvoice(false);
    }
  }

  function toggleJourney(idx: number) {
    setSelectedJourneys((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function toggleTraveler(paxId: number) {
    setSelectedTravelers((prev) => {
      const next = new Set(prev);
      if (next.has(paxId)) next.delete(paxId);
      else next.add(paxId);
      return next;
    });
  }

  useEffect(() => {
    if (!transactionId) {
      setFailReason("We couldn't find your transaction details.");
      setFailedAt(new Date());
      setBookingStatus("failed");
      setStage("bookingFailed");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function runBookingRetrieve() {
      if (!transactionId || cancelled) return;

      let retrieved: any;
      try {
        retrieved = await getAirlineBookingRetrieve({
          transactionId: transactionId!,
          signal: controller.signal,
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        throw err;
      }

      if (cancelled) return;

      if (!retrieved?.success) {
        if (pollCountRef.current < 5) {
          pollCountRef.current += 1;
          setBookingStatus("pending");
          setStage("landing");
          pollTimerRef.current = setTimeout(() => {
            if (!cancelled) runBookingRetrieve();
          }, 60_000);
          return;
        }
        setBookingStatus("failed");
        setFailReason(
          retrieved?.message ||
            "We couldn't load your booking details. If any amount was deducted, please contact support with your transaction ID."
        );
        setFailedAt(new Date());
        setStage("bookingFailed");
        return;
      }

      const payload: ServiceResponse | null = retrieved.raw ?? null;

      if (payload && payload.Journey?.length) {
        setBooking(payload);

        const hasPendingJourney = payload.Journey.some((j) => isPendingStatus(j.BookingStatus));
        const pendingJourneyWithMessage = payload.Journey.find(
          (j) => isPendingStatus(j.BookingStatus) && !!j.Message?.trim()
        );

        if (hasPendingJourney) {
          if (pendingJourneyWithMessage) {
            setPendingMessage(pendingJourneyWithMessage.Message || null);
          } else {
            setPendingMessage(null);
          }
          setBookingStatus("pending");
          setStage("landing");

          pollCountRef.current += 1;
          const nextDelay = pollCountRef.current <= 5 ? 60_000 : 300_000;
          pollTimerRef.current = setTimeout(() => {
            if (!cancelled) runBookingRetrieve();
          }, nextDelay);
        } else {
          setBookingStatus("success");
          setPendingMessage(null);
          setStage("landing");
        }
      } else {
        // No journey data yet — keep polling
        setBookingStatus("pending");
        setStage("landing");

        pollCountRef.current += 1;
        const nextDelay = pollCountRef.current <= 5 ? 60_000 : 300_000;
        pollTimerRef.current = setTimeout(() => {
          if (!cancelled) runBookingRetrieve();
        }, nextDelay);
      }
    }

    retrieveRef.current = runBookingRetrieve;
    runBookingRetrieve();

    return () => {
      cancelled = true;
      controller.abort();
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [transactionId]);

  async function handleManualRecheck() {
    if (manualChecking || !retrieveRef.current) return;
    setManualChecking(true);
    try {
      await retrieveRef.current();
    } finally {
      setManualChecking(false);
    }
  }

  function copyBookingId() {
    if (!booking?.ReferenceNo) return;
    navigator.clipboard?.writeText(booking.ReferenceNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (stage === "checking") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-14 h-14 rounded-full border-4 border-[#1c8fc7]/20 border-t-[#1c8fc7] animate-spin mb-6" />
        <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Loading your booking…</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
          Please don't close this window or press back.
        </p>
      </div>
    );
  }

  if (stage === "bookingFailed") {
    return (
      <BookingFailedCard
        message={failReason}
        cfLinkId={transactionId ?? "—"}
        dateTime={
          failedAt
            ? failedAt.toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : ""
        }
        onContactSupport={() => router.push("/contact")}
      />
    );
  }

  if (!booking && stage !== "landing") return null;

  const messageExpiry = getMessageExpiry(booking?.PaymentTime);

  const isFullyConfirmed =
    bookingStatus === "success" &&
    !!booking?.Journey?.length &&
    booking.Journey.every((j) => !isPendingStatus(j.BookingStatus));

  const isBookingPending = bookingStatus === "pending";

  const totalFare = booking?.Journey.reduce((sum, j) => sum + (j.FareInfo?.NetFare ?? 0), 0) ?? 0;
  const totalBase = booking?.Journey.reduce((sum, j) => sum + (j.FareInfo?.BaseFare ?? 0), 0) ?? 0;
  const totalTax = booking?.Journey.reduce((sum, j) => sum + (j.FareInfo?.Tax ?? 0), 0) ?? 0;
  const totalDiscount = booking?.Journey.reduce((sum, j) => sum + (j.FareInfo?.Discount ?? 0), 0) ?? 0;
  const totalGross = booking?.Journey.reduce((sum, j) => sum + (j.FareInfo?.GrossFare ?? 0), 0) ?? 0;
  const totalConvenience = booking?.Journey.reduce((sum, j) => sum + (j.FareInfo?.ConvenienceFee ?? 0), 0) ?? 0;

  const uniqueTravelers: Traveler[] = booking?.Journey?.[0]?.Travelers ?? [];
  const PAX_TYPE_TO_PTC: Record<string, string> = { A: "ADT", C: "CHD", I: "INF" };

  function ptcTotal(paxType: string, field: "Fare" | "NetFare"): number {
    return booking?.Journey.reduce((sum, j) => {
      const ptc = j.FareInfo?.PTCFare?.find((p) => p.PTC === paxType);
      return sum + (ptc?.[field] ?? 0);
    }, 0) ?? 0;
  }

  const travelerFares = uniqueTravelers.map((t) => ({
    paxId: t.PaxID,
    name: travelerName(t),
    fare: ptcTotal(PAX_TYPE_TO_PTC[t.PaxType] ?? t.PaxType, "NetFare"),
  }));

  const adultFareTotal = ptcTotal("ADT", "Fare") * (booking?.ADT ?? 0);
  const childFareTotal = ptcTotal("CHD", "Fare") * (booking?.CHD ?? 0);
  const infantFareTotal = ptcTotal("INF", "Fare") * (booking?.INF ?? 0);

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">

          {/* Confirmed banner */}
          {isFullyConfirmed && (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 px-5 py-5 flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="3">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">Booking Confirmed</p>
                {booking?.ContactInfo?.Email && (
                  <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                    Thank you for booking with us. Your e-ticket and itinerary will be emailed to {booking.ContactInfo.Email}.
                  </p>
                )}
                <button
                  onClick={copyBookingId}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100"
                >
                  Booking Ref: <span className="font-mono">{booking?.ReferenceNo}</span>
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-400" stroke="currentColor" strokeWidth="1.7">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15V6a1 1 0 011-1h9" />
                  </svg>
                  {copied && <span className="text-xs text-emerald-600">Copied!</span>}
                </button>
              </div>
            </div>
          )}

          {/* Booking pending banner */}
          {isBookingPending && (
            <PendingStatusBanner
              message={pendingMessage}
              referenceNo={booking?.ReferenceNo}
              onRecheck={handleManualRecheck}
              rechecking={manualChecking}
              expiresAt={pendingMessage ? messageExpiry : null}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[750px_1fr] gap-6 items-start">
            <div className="min-w-0 order-1 lg:order-1 space-y-4">

              {/* Action cards */}
              {isFullyConfirmed && (
                <div className="grid grid-cols-3 gap-3">
                  <ActionCard label="Web Check-in" sublabel="Complete before airport" />
                  <ActionCard
                    label="E-Ticket"
                    sublabel={downloadingTicket ? "Downloading…" : "Download PDF"}
                    onClick={handleDownloadTicket}
                    disabled={downloadingTicket}
                  />
                  <ActionCard
                    label="Invoice"
                    sublabel={downloadingInvoice ? "Downloading…" : "View & download"}
                    onClick={handleDownloadInvoice}
                    disabled={downloadingInvoice}
                  />
                </div>
              )}

              {/* Journey cards */}
              {booking?.Journey.map((journey, jIdx) => {
                const cabin = cabinLabel(journey.Segments?.[0]?.Cabin);
                const journeyIsPending = isPendingStatus(journey.BookingStatus);
                const journeyIsConfirmed = isConfirmedStatus(journey.BookingStatus);

                const totalDuration = journey.Segments.reduce((acc, seg) => {
                  const m = seg.Duration?.match(/(\d+)\s*Hr\s*(\d+)\s*Min/i);
                  if (m) return acc + parseInt(m[1]) * 60 + parseInt(m[2]);
                  return acc;
                }, 0);
                const journeyDurationLabel = totalDuration > 0
                  ? `${Math.floor(totalDuration / 60)} Hr ${totalDuration % 60} Minutes`
                  : "";

                return (
                  <div
                    key={jIdx}
                    className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden"
                  >
                    {/* Journey header */}
                    <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {journey.FromCity} → {journey.ToCity}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {[
                            formatDate(journey.DepartureDateTime),
                            stopsLabel(journey.Stops),
                            journeyDurationLabel || undefined,
                            cabin,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>

                      {journeyIsConfirmed ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex-shrink-0">
                          Confirmed
                        </span>
                      ) : journeyIsPending ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex-shrink-0">
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 flex-shrink-0">
                          {journey.BookingStatus || "Not Started"}
                        </span>
                      )}
                    </div>

                    {/* Journey-level pending message */}
                    {journeyIsPending && (journey.Message?.trim() || pendingMessage) && (
                      <div className="mx-5 mb-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-3.5 py-2.5">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {journey.Message?.trim() || pendingMessage}
                        </p>
                      </div>
                    )}

                    {/* Segments — each rendered separately */}
                    {journey.Segments.map((seg, sIdx) => {
                      const freeBag = getFreeBaggage(journey.Travelers, seg.SID);

                      return (
                        <div key={seg.SID}>
                          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
                            {/* Airline + flight header */}
                            <div className="flex items-center gap-2 mb-3">
                              <AirlineLogo seg={seg} code={seg.AirlineCode} className="w-7 h-7" />
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {seg.AirlineName}
                              </span>
                              <span className="text-sm text-gray-400">|</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {seg.AirlineCode}-{seg.FlightNo}
                              </span>
                              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                                {formatDateShort(seg.DepartureTime)}
                              </span>
                            </div>

                            {/* Flight timeline */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-none">
                                  {formatTime(seg.DepartureTime)}
                                </p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                                  {seg.DepartureAirportCode}
                                  {seg.DepartureTerminal ? ` · ${seg.DepartureTerminal}` : ""}
                                </p>
                                {seg.DepartureAirportName && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug mt-0.5">
                                    {seg.DepartureAirportName}
                                  </p>
                                )}
                              </div>

                              <div className="flex-1 flex flex-col items-center px-2 pt-2">
                                {seg.Duration && (
                                  <p className="text-xs text-gray-400 mb-1">{seg.Duration}</p>
                                )}
                                <div className="relative w-full flex items-center">
                                  <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mx-1 flex-shrink-0" />
                                  <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
                                </div>
                              </div>

                              <div className="min-w-0 text-right">
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-none">
                                  {formatTime(seg.ArrivalTime)}
                                </p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                                  {seg.ArrivalAirportCode}
                                  {seg.ArrivalTerminal ? ` · ${seg.ArrivalTerminal}` : ""}
                                </p>
                                {seg.ArrivalAirportName && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug mt-0.5">
                                    {seg.ArrivalAirportName}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Free baggage */}
                            {freeBag && (
                              <div className="mt-3 flex items-center gap-4">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Baggage</p>
                                {freeBag.cabin && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0" stroke="currentColor" strokeWidth="1.6">
                                      <rect x="5" y="8" width="14" height="12" rx="2" />
                                      <path d="M9 8V6a3 3 0 016 0v2" strokeLinecap="round" />
                                      <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round" />
                                      <line x1="10" y1="14" x2="14" y2="14" strokeLinecap="round" />
                                    </svg>
                                    <span>Cabin: <span className="font-semibold text-gray-700 dark:text-gray-300">{freeBag.cabin} per adult</span></span>
                                  </div>
                                )}
                                {freeBag.checkin && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0" stroke="currentColor" strokeWidth="1.6">
                                      <rect x="4" y="7" width="16" height="14" rx="2" />
                                      <path d="M9 7V5a3 3 0 016 0v2" strokeLinecap="round" />
                                      <circle cx="8" cy="21" r="1" fill="currentColor" stroke="none" />
                                      <circle cx="16" cy="21" r="1" fill="currentColor" stroke="none" />
                                    </svg>
                                    <span>Check-in: <span className="font-semibold text-gray-700 dark:text-gray-300">{freeBag.checkin} per adult</span></span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Traveler table per segment */}
                            {journey.Travelers?.length > 0 && (
                              <div className="mt-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 overflow-hidden">
                                <div className="grid grid-cols-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 py-2 bg-gray-100/70 dark:bg-gray-800">
                                  <span>Traveller</span>
                                  <span>PNR</span>
                                  <span>Baggage</span>
                                  <span>Meal</span>
                                </div>
                                {journey.Travelers.map((t) => (
                                  <TravelerRow
                                    key={t.PaxID}
                                    traveler={t}
                                    segSID={seg.SID}
                                    pnr={journeyIsConfirmed ? journey.AirlinePNR || "—" : "Pending"}
                                    showCopyPNR={journeyIsConfirmed && !!journey.AirlinePNR}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Layover banner */}
                          {sIdx < journey.Segments.length - 1 && seg.Layover && (
                            <div className="border-t border-b border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-5 py-2.5 flex items-center gap-2">
                              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-amber-500 flex-shrink-0" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                Change of Planes · {seg.Layover} layover in {seg.ArrivalCityName}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Contact & Help card */}
              {((booking?.ContactInfo && (booking.ContactInfo.Mobile || booking.ContactInfo.Email)) ||
                booking?.Journey?.[0]?.Segments?.[0]) && (
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 space-y-5">
                  {booking?.ContactInfo && (booking.ContactInfo.Mobile || booking.ContactInfo.Email) && (
                    <div>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100">Contact Details</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        We have sent the booking details on your email &amp; WhatsApp
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                        {booking.ContactInfo.Mobile && (
                          <div className="flex items-center gap-2 min-w-0">
                            <HiOutlinePhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {booking.ContactInfo.Mobile}
                            </span>
                          </div>
                        )}
                        {booking.ContactInfo.Email && (
                          <div className="flex items-center gap-2 min-w-0">
                            <HiOutlineEnvelope className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                              {booking.ContactInfo.Email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Need Help?</p>
                    <button
                      type="button"
                      onClick={() => router.push("/contact")}
                      className="w-full flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-500" stroke="currentColor" strokeWidth="1.8">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Customer Service</p>
                          <p className="text-xs text-gray-400">Get answers on our Help Centre or chat with us instantly</p>
                        </div>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-500" stroke="currentColor" strokeWidth="2">
                        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  {booking?.Journey?.[0]?.Segments?.[0] && (
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Call Airline</p>
                      <a
                        href={`tel:${getAirlinePhone(booking.Journey[0].Segments[0].AirlineCode)}`}
                        className="w-full flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <AirlineLogo
                            seg={booking.Journey[0].Segments[0]}
                            code={booking.Journey[0].Segments[0].AirlineCode}
                            className="w-9 h-9"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {booking.Journey[0].Segments[0].AirlineName}
                            </p>
                            <p className="text-xs text-gray-400 tabular-nums">
                              {getAirlinePhone(booking.Journey[0].Segments[0].AirlineCode)}
                            </p>
                          </div>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-500" stroke="currentColor" strokeWidth="2">
                          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4 order-2 lg:order-2 lg:sticky lg:top-8">
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Amount Paid</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums mb-3">
                  {currency(totalFare)}
                </p>

                {travelerFares.length > 0 && (
                  <div className="space-y-1 pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                      Fare Per Traveller
                    </p>
                    {travelerFares.map(({ paxId, name, fare }) => (
                      <FareRow key={paxId} label={name} value={currency(fare)} />
                    ))}
                  </div>
                )}

                <div className="space-y-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                  {adultFareTotal > 0 && <FareRow label="Adult Fare" value={currency(adultFareTotal)} />}
                  {childFareTotal > 0 && <FareRow label="Child Fare" value={currency(childFareTotal)} />}
                  {infantFareTotal > 0 && <FareRow label="Infant Fare" value={currency(infantFareTotal)} />}
                  <FareRow label="Taxes & Fees" value={currency(totalTax)} />
                  {totalConvenience > 0 && <FareRow label="Convenience Fee" value={currency(totalConvenience)} />}
                  {totalDiscount > 0 && (
                    <FareRow label="Instant Discount" value={`- ${currency(totalDiscount)}`} positive />
                  )}
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Total Payable</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-[1.4]">
                      Incl. all taxes &amp; fees
                    </p>
                  </div>
                  <div className="text-right">
                    {totalDiscount > 0 && totalGross > totalFare && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 line-through leading-[1.4]">
                        {currency(totalGross + totalConvenience)}
                      </p>
                    )}
                    <p className="text-lg font-extrabold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">
                      {currency(totalFare)}
                    </p>
                  </div>
                </div>
              </div>

              {isFullyConfirmed && (
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Modify Booking</p>
                  <ModifyRow
                    label="Cancel Flight"
                    sublabel="Cancellation charges will be applicable as per the airline policy"
                    onClick={() => openPanel("cancel")}
                  />
                  <ModifyRow
                    label="Reschedule Flight"
                    sublabel="Rescheduling charges will be applicable as per the airline policy"
                    onClick={() => openPanel("reschedule")}
                  />
                  <ModifyRow
                    label="View Fare Rules"
                    sublabel="Cancellation & rescheduling charges"
                    onClick={() => openPanel("fareRules")}
                  />
                </div>
              )}

              <button
                onClick={() => router.push("/")}
                className="w-full h-12 rounded-full bg-[#1c8fc7] text-white font-semibold text-sm hover:bg-[#177aab] transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <ModifyBookingPanel
        panel={panel}
        visible={panelVisible}
        onClose={closePanel}
        booking={booking}
        selectedJourneys={selectedJourneys}
        selectedTravelers={selectedTravelers}
        onToggleJourney={toggleJourney}
        onToggleTraveler={toggleTraveler}
      />
    </>
  );
}

// ─── BookingFailedCard ─────────────────────────────────────────────────────────

function BookingFailedCard({
  message,
  cfLinkId,
  dateTime,
  onContactSupport,
}: {
  message: string;
  cfLinkId: string;
  dateTime: string;
  onContactSupport: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 px-6 py-8 text-center">
        <h1 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 mb-2">
          Could not load booking
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100 dark:border-gray-800">
          <span className="text-gray-400">Transaction ID</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">{cfLinkId}</span>
        </div>
        <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100 dark:border-gray-800 mb-6">
          <span className="text-gray-400">Date &amp; Time</span>
          <span className="text-gray-700 dark:text-gray-300">{dateTime}</span>
        </div>
        <button
          type="button"
          onClick={onContactSupport}
          className="w-full h-11 rounded-full border border-gray-200 dark:border-gray-700 text-[#FF7626] font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}

// ─── PendingStatusBanner ───────────────────────────────────────────────────────

function PendingStatusBanner({
  message,
  referenceNo,
  onRecheck,
  rechecking,
  expiresAt,
}: {
  message: string | null;
  referenceNo?: string;
  onRecheck?: () => void;
  rechecking?: boolean;
  expiresAt?: Date | null;
}) {
  return (
    <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 px-5 py-5 flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-full bg-[#1c8fc7] flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-extrabold text-[#1c8fc7]">Booking In Progress</p>
          {expiresAt && <CountdownTimer expiresAt={expiresAt} />}
        </div>
        <p className="text-sm text-blue-900/70 dark:text-blue-300/80 mt-0.5">
          {message ||
            "Your booking is being confirmed with the airline. Your PNR and ticket number will appear here automatically once confirmed."}
        </p>
        {referenceNo && (
          <p className="mt-3 text-sm font-bold text-gray-900 dark:text-gray-100">
            Booking Ref: <span className="font-mono">{referenceNo}</span>
          </p>
        )}
        {onRecheck && (
          <button
            onClick={onRecheck}
            disabled={rechecking}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1c8fc7] hover:text-[#166f9c] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 ${rechecking ? "animate-spin" : ""}`} stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {rechecking ? "Checking..." : "Check status again"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ModifyBookingPanel ────────────────────────────────────────────────────────

function ModifyBookingPanel({
  panel,
  visible,
  onClose,
  booking,
  selectedJourneys,
  selectedTravelers,
  onToggleJourney,
  onToggleTraveler,
}: {
  panel: "cancel" | "reschedule" | "fareRules" | null;
  visible: boolean;
  onClose: () => void;
  booking: ServiceResponse | null;
  selectedJourneys: Set<number>;
  selectedTravelers: Set<number>;
  onToggleJourney: (idx: number) => void;
  onToggleTraveler: (paxId: number) => void;
}) {
  if (!panel || !booking) return null;

  const titles: Record<string, string> = {
    cancel: "Booking Cancellation",
    reschedule: "Reschedule Flight",
    fareRules: "Fare Rules",
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full sm:max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100">{titles[panel]}</p>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {(panel === "cancel" || panel === "reschedule") && (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {panel === "cancel"
                  ? "A penalty may be charged by the airline based on how close to the travel date the cancellation is made."
                  : "Rescheduling charges depend on the airline's fare rules and how close to the travel date the change is made."}
              </p>
              {booking.Journey.map((journey, jIdx) => {
                const journeySelected = selectedJourneys.has(jIdx);
                return (
                  <div
                    key={jIdx}
                    className={`rounded-xl border px-4 py-3 mb-3 ${journeySelected ? "border-[#1c8fc7] bg-[#e8f4fb] dark:bg-gray-800" : "border-gray-200 dark:border-gray-700"}`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={journeySelected} onChange={() => onToggleJourney(jIdx)} className="mt-0.5 accent-[#1c8fc7]" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {journey.FromCity} → {journey.ToCity}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {[formatDate(journey.DepartureDateTime), journey.Segments?.[0]?.AirlineName, journey.AirlinePNR]
                            .filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </label>
                    {journey.Travelers?.length > 0 && (
                      <div className="mt-2 ml-6 space-y-1.5">
                        {journey.Travelers.map((t) => (
                          <label key={t.PaxID} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={selectedTravelers.has(t.PaxID)} onChange={() => onToggleTraveler(t.PaxID)} className="accent-[#1c8fc7]" />
                            <span className="text-xs text-gray-700 dark:text-gray-300">{travelerName(t)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {panel === "fareRules" && (
            <div className="space-y-3">
              {booking.Journey.map((journey, jIdx) => (
                <div key={jIdx} className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {journey.FromCity} → {journey.ToCity}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Detailed cancellation and rescheduling charges for this fare are set by{" "}
                    {journey.Segments?.[0]?.AirlineName || "the airline"} and may vary based on how close to the travel date the request is made. Contact support for the exact fare rule breakdown for PNR{" "}
                    <span className="font-mono">{journey.AirlinePNR}</span>.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {(panel === "cancel" || panel === "reschedule") && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={onClose}
              className="w-full h-12 rounded-full bg-[#FF7626] hover:bg-[#e6661f] text-white font-semibold text-sm transition-colors"
            >
              {panel === "cancel" ? "Calculate Refund" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small UI components ───────────────────────────────────────────────────────

function ActionCard({ label, sublabel, onClick, disabled }: { label: string; sublabel: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-3 text-left hover:border-[#1c8fc7]/50 transition-colors ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">{label}</p>
      <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{sublabel}</p>
    </button>
  );
}

function FareRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-semibold tabular-nums ${positive ? "text-emerald-600" : "text-gray-900 dark:text-gray-100"}`}>
        {value}
      </span>
    </div>
  );
}

function ModifyRow({ label, sublabel, onClick }: { label: string; sublabel: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between text-left py-2.5 border-t border-gray-50 dark:border-gray-800/60 first:border-t-0"
    >
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
        <p className="text-xs text-gray-400">{sublabel}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-300 flex-shrink-0" stroke="currentColor" strokeWidth="2">
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function TravelerRow({
  traveler,
  segSID,
  pnr,
  showCopyPNR,
}: {
  traveler: Traveler;
  segSID: string | number;
  pnr: string;
  showCopyPNR: boolean;
}) {
  const [copiedPNR, setCopiedPNR] = useState(false);
  const addonBag = findSSRAddon(traveler, segSID, "2");
  const addonMeal = findSSRAddon(traveler, segSID, "1");

  return (
    <div className="grid grid-cols-4 text-sm px-3 py-2.5 border-t border-gray-100 dark:border-gray-800">
      <div>
        <p className="text-gray-800 dark:text-gray-200 font-medium text-xs leading-tight">
          {travelerName(traveler)}
        </p>
        <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
          ({travelerPaxTypeLabel(traveler)})
        </p>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{pnr}</span>
        {showCopyPNR && (
          <button
            onClick={() => {
              navigator.clipboard?.writeText(pnr);
              setCopiedPNR(true);
              setTimeout(() => setCopiedPNR(false), 1500);
            }}
            className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            title="Copy PNR"
          >
            {copiedPNR ? (
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-emerald-500" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="1.8">
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V6a1 1 0 011-1h9" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )}
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500">{addonBag}</span>
      <span className="text-xs text-gray-400 dark:text-gray-500">{addonMeal}</span>
    </div>
  );
}