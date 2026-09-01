"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { pollBookingConfirmation, getAirlineBookingRetrieve, getETicketCopy, getAirlineInvoice } from "@/app/lib/flightsapi";

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
  DepartureTime: string;
  ArrivalTime: string;
  DepartureAirportCode: string;
  ArrivalAirportCode: string;
  DepartureCityName: string;
  ArrivalCityName: string;
  DepartureTerminal?: string;
  ArrivalTerminal?: string;
  Cabin?: string;
  Duration?: string;
  Layover?: string;
};

type FareInfo = {
  BaseFare: number;
  Tax: number;
  Discount: number;
  GrossFare: number;
  NetFare: number;
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

const PENDING_STATUSES = ["PENDING", "BOOKING INITIATE", "INITIATE", "IN PROGRESS"];

function isPendingStatus(status?: string) {
  if (!status) return false;
  return PENDING_STATUSES.includes(status.toUpperCase().trim());
}

function formatDate(iso?: string) {
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

function travelerName(t: Traveler) {
  return [t.Title, t.FirstName, t.LastName].filter(Boolean).join(" ");
}

function findSSR(t: Traveler, type: string) {
  return t.SSRL?.find((s) => s.SSRType === type)?.SSRDesc || "—";
}

type Stage = "checking" | "landing" | "paymentFailed" | "bookingFailed";
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

  const [paymentStatus, setPaymentStatus] = useState<LeafStatus | null>(null);
  const [bookingStatus, setBookingStatus] = useState<LeafStatus | null>(null);

  const [failReason, setFailReason] = useState<string>("Something went wrong. Please try again.");
  const [failedAt, setFailedAt] = useState<Date | null>(null);

  const [booking, setBooking] = useState<ServiceResponse | null>(null);
  const [copied, setCopied] = useState(false);
const messageExpiry = getMessageExpiry(booking?.PaymentTime);
  const [panel, setPanel] = useState<"cancel" | "reschedule" | "fareRules" | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const pollCountRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkPaymentRef = useRef<(() => Promise<void>) | null>(null);
  const [manualChecking, setManualChecking] = useState(false);
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [selectedJourneys, setSelectedJourneys] = useState<Set<number>>(new Set());
  const [selectedTravelers, setSelectedTravelers] = useState<Set<number>>(new Set());

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
      const res = await getETicketCopy({
        transactionId: String(booking.TransactionID),
      });
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
      setPaymentStatus("failed");
      setStage("paymentFailed");
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
        // Booking record may not have propagated yet right after payment
        // succeeds. Retry a few times before treating this as a real failure.
        if (pollCountRef.current < 5) {
          pollCountRef.current += 1;
          setBookingStatus("pending");
          setStage("landing");
          pollTimerRef.current = setTimeout(() => {
            if (!cancelled) runBookingRetrieve();
          }, 60_000);
          return;
        }

        // Genuinely stuck after retries — this is a booking-confirmation
        // problem, NOT a payment failure (payment already succeeded).
        setBookingStatus("failed");
        setFailReason(
          retrieved?.message ||
            "We couldn't confirm your booking. If any amount was deducted, please contact support with your transaction ID."
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
            // Message exists → show the airline-provided pending message
            setPendingMessage(pendingJourneyWithMessage.Message || null);
          } else {
            // Pending but no specific message → fall back to the generic copy
            setPendingMessage(null);
          }

          setBookingStatus("pending");
          setStage("landing");

          // Polling: first 5 calls every 1 min, then every 5 min
          pollCountRef.current += 1;
          const nextDelay = pollCountRef.current <= 5 ? 60_000 : 300_000;
          pollTimerRef.current = setTimeout(() => {
            if (!cancelled) runBookingRetrieve();
          }, nextDelay);
        } else {
          // All journeys confirmed
          setBookingStatus("success");
          setPendingMessage(null);
          setStage("landing");
          sessionStorage.removeItem("pendingBooking");
        }
      } else {
        // No journey data yet → keep polling as pending
        setBookingStatus("pending");
        setStage("landing");

        pollCountRef.current += 1;
        const nextDelay = pollCountRef.current <= 5 ? 60_000 : 300_000;
        pollTimerRef.current = setTimeout(() => {
          if (!cancelled) runBookingRetrieve();
        }, nextDelay);
      }
    }

    // Payment check: a single request. If the payment is still "pending" we
    // do NOT automatically re-call the API — we show the pending state and
    // stop. The user (via "Check status again") triggers the next check.
    async function checkPayment() {
      if (cancelled) return;

      let pay: any;
      try {
        pay = await pollBookingConfirmation(transactionId!, { signal: controller.signal });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        throw err;
      }
      if (cancelled) return;

      if (pay.stage === "payment") {
        if (pay.status === "success") {
          setPaymentStatus("success");
        } else if (pay.status === "pending") {
          setPaymentStatus("pending");
          setBookingStatus("pending");
          setStage("landing");
          return;
        } else {
          setPaymentStatus("failed");
          setFailReason(
            pay.message ||
              "We're having trouble processing your payment. Please try again or contact support for further queries."
          );
          setFailedAt(new Date());
          setStage("paymentFailed");
          return;
        }
      } else {
        // stage === "booking" → payment already succeeded by definition.
        // Don't treat a failed/pending booking-status check as a payment failure;
        // runBookingRetrieve below does the fuller, authoritative check.
        setPaymentStatus("success");
      }

      pollCountRef.current = 0;
      await runBookingRetrieve();
    }

    checkPaymentRef.current = checkPayment;
    checkPayment();

    return () => {
      cancelled = true;
      controller.abort();
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [transactionId]);

  async function handleManualRecheck() {
    if (manualChecking || !checkPaymentRef.current) return;
    setManualChecking(true);
    try {
      await checkPaymentRef.current();
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

  // Simple, static loading state — no step-by-step verification animation.
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

if (stage === "paymentFailed") {
  const isAuthError = /not a valid login|unauthorized|session|token|login/i.test(
    failReason || ""
  );

  return (
    <PaymentFailedCard
      title={isAuthError ? "Session expired" : "Oh no! Payment Failed."}
      message={
        isAuthError
          ? "Your session is no longer valid. Please log in again and retry from your bookings."
          : failReason
      }
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
      buttonLabel={isAuthError ? "Login" : "Contact Support"}
      onTryAgain={() => {
        if (isAuthError) {
          router.push("/login");
        } else {
          router.push("/contact");
        }
      }}
    />
  );
}

if (stage === "bookingFailed") {
  return (
    <PaymentFailedCard
      title="We couldn't confirm your booking"
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
      buttonLabel="Contact Support"
      onTryAgain={() => router.push("/contact")}
    />
  );
}

  if (!booking && stage !== "landing") return null;

  const isFullyConfirmed =
    paymentStatus === "success" &&
    bookingStatus === "success" &&
    !!booking?.Journey?.length &&
    booking.Journey.every((j) => !isPendingStatus(j.BookingStatus));

  const isPaymentPending = paymentStatus === "pending";
  const isBookingPending = bookingStatus === "pending" && !!pendingMessage;

  const totalFare = booking?.Journey.reduce((sum, j) => sum + (j.FareInfo?.NetFare ?? 0), 0) ?? 0;
  const totalBase = booking?.Journey.reduce((sum, j) => sum + (j.FareInfo?.BaseFare ?? 0), 0) ?? 0;
  const totalTax = booking?.Journey.reduce((sum, j) => sum + (j.FareInfo?.Tax ?? 0), 0) ?? 0;
  const totalDiscount = booking?.Journey.reduce((sum, j) => sum + (j.FareInfo?.Discount ?? 0), 0) ?? 0;

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">

          {/* Fully confirmed banner */}
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

          {/* Payment success but still confirming (no message case) */}
          {!isFullyConfirmed && !isPaymentPending && !isBookingPending && bookingStatus === "pending" && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900 px-5 py-5 flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-extrabold text-amber-700 dark:text-amber-400">Payment Received — Booking In Progress</p>
                <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  Your payment was successful, but we're still confirming your booking with the airline.
                  Your PNR and ticket number will appear here once confirmed.
                </p>
                {booking?.ReferenceNo && (
                  <p className="mt-3 text-sm font-bold text-gray-900 dark:text-gray-100">
                    Booking Ref: <span className="font-mono">{booking.ReferenceNo}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pending status */}
{(isPaymentPending || isBookingPending) && (
  <PendingStatusBanner
    message={pendingMessage}
    referenceNo={booking?.ReferenceNo}
    onRecheck={isPaymentPending ? handleManualRecheck : undefined}
    rechecking={manualChecking}
    expiresAt={pendingMessage ? messageExpiry : null}
  />
)}

          <div className="grid grid-cols-1 lg:grid-cols-[750px_1fr] gap-6 items-start">
            <div className="min-w-0 order-1 lg:order-1 space-y-4">
              {!isPaymentPending && (
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

              {booking?.Journey.map((journey, jIdx) => {
                const cabin = cabinLabel(journey.Segments?.[0]?.Cabin);
                const journeyIsPending = isPendingStatus(journey.BookingStatus);
                const journeyIsConfirmed = !journeyIsPending;

                return (
                  <div
                    key={jIdx}
                    className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {journey.FromCity} → {journey.ToCity}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {[formatDate(journey.DepartureDateTime), stopsLabel(journey.Stops), cabin]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>

                      {/* Per-journey status badge */}
                      {journeyIsPending ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Confirmed
                        </span>
                      )}
                    </div>

                    {/* Show the specific message for this pending journey */}
{journeyIsPending && journey.Message?.trim() && (
  <div className="mt-3 mb-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-3.5 py-2.5 flex items-start justify-between gap-3">
    <p className="text-sm text-blue-800 dark:text-blue-200">
      {journey.Message}
    </p>
    {messageExpiry && <CountdownTimer expiresAt={messageExpiry} />}
  </div>
)}

                    <div className="space-y-3 mb-4 mt-4">
                      {journey.Segments.map((seg, sIdx) => (
                        <div key={seg.SID}>
                          <div className="flex items-center gap-4">
                            {seg.VACLogo && (
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                <span className="text-[10px] font-bold text-gray-500">{seg.AirlineCode}</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-xs text-gray-400 mb-1.5">
                                {seg.AirlineName} • {seg.AirlineCode} {seg.FlightNo}
                              </p>
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                                    {formatTime(seg.DepartureTime)}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {seg.DepartureAirportCode}
                                    {seg.DepartureTerminal ? ` • ${seg.DepartureTerminal}` : ""}
                                  </p>
                                </div>
                                <div className="flex-1 text-center px-1">
                                  {seg.Duration && <p className="text-xs text-gray-400">{seg.Duration}</p>}
                                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                                </div>
                                <div className="text-right">
                                  <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                                    {formatTime(seg.ArrivalTime)}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {seg.ArrivalAirportCode}
                                    {seg.ArrivalTerminal ? ` • ${seg.ArrivalTerminal}` : ""}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {sIdx < journey.Segments.length - 1 && seg.Layover && (
                            <div className="ml-12 mt-2 mb-1 pl-3 border-l-2 border-dashed border-amber-300 text-xs text-amber-600 dark:text-amber-400">
                              {seg.Layover} layover in {seg.ArrivalCityName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {journey.Travelers?.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div className="grid grid-cols-4 text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">
                          <span>Traveller</span>
                          <span>PNR</span>
                          <span>Baggage</span>
                          <span>Meal</span>   
                        </div>
                        {journey.Travelers.map((t) => (
                          <div
                            key={t.PaxID}
                            className="grid grid-cols-4 text-sm py-1.5 border-t border-gray-50 dark:border-gray-800/60"
                          >
                            <span className="text-gray-800 dark:text-gray-200">{travelerName(t)}</span>
                            <span className="text-gray-400 font-mono">
                              {journeyIsConfirmed ? journey.AirlinePNR || "—" : "Pending"}
                            </span>
                            
                            <span className="text-gray-400">{findSSR(t, "2")}</span>
                            <span className="text-gray-400">{findSSR(t, "1")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right column */}
            <div className="space-y-4 order-2 lg:order-2 lg:sticky lg:top-8">
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Fare Summary</p>
                <FareRow label="Base Fare" value={currency(totalBase)} />
                <FareRow label="Taxes & Fees" value={currency(totalTax)} />
                {totalDiscount > 0 && <FareRow label="Discount" value={`- ${currency(totalDiscount)}`} positive />}
                <div className="flex items-center justify-between text-sm py-2 mt-1 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Total Amount Paid</span>
                  <span className="font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">{currency(totalFare)}</span>
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
function getMessageExpiry(paymentTime?: string): Date | null {
  if (!paymentTime) return null;
  const base = new Date(paymentTime);
  if (isNaN(base.getTime())) return null;
  return new Date(base.getTime() + 20 * 60 * 1000); // PaymentTime + 20 min
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
    const id = setInterval(() => {
      setRemainingMs(expiresAt.getTime() - Date.now());
    }, 1000);
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
function PaymentFailedCard({
  title = "Oh no! Payment Failed.",
  message,
  cfLinkId,
  dateTime,
  onTryAgain,
  buttonLabel = "Try again",
}: {
  title?: string;
  message: string;
  cfLinkId: string;
  dateTime: string;
  onTryAgain: () => void;
  buttonLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 px-6 py-8 text-center">
        <h1 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100 dark:border-gray-800">
          <span className="text-gray-400">CF Link ID</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">{cfLinkId}</span>
        </div>
        <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100 dark:border-gray-800 mb-6">
          <span className="text-gray-400">Date &amp; Time</span>
          <span className="text-gray-700 dark:text-gray-300">{dateTime}</span>
        </div>

        <button
          type="button"
          onClick={onTryAgain}
          className="w-full h-11 rounded-full border border-gray-200 dark:border-gray-700 text-[#FF7626] font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

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
          <p className="text-lg font-extrabold text-[#1c8fc7]">
            {message ? "Booking In Progress" : "Payment Pending"}
          </p>
          {expiresAt && <CountdownTimer expiresAt={expiresAt} />}
        </div>
        <p className="text-sm text-blue-900/70 dark:text-blue-300/80 mt-0.5">
          {message ||
            "We're still waiting for confirmation from your bank. Your PNR and ticket number will be added here automatically once payment is confirmed"}
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
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`absolute right-0 top-0 h-full w-full sm:max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100">{titles[panel]}</p>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
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
                    className={`rounded-xl border px-4 py-3 mb-3 ${
                      journeySelected
                        ? "border-[#1c8fc7] bg-[#e8f4fb] dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={journeySelected}
                        onChange={() => onToggleJourney(jIdx)}
                        className="mt-0.5 accent-[#1c8fc7]"
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {journey.FromCity} → {journey.ToCity}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {[formatDate(journey.DepartureDateTime), journey.Segments?.[0]?.AirlineName, journey.AirlinePNR]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                    </label>

                    {journey.Travelers?.length > 0 && (
                      <div className="mt-2 ml-6 space-y-1.5">
                        {journey.Travelers.map((t) => (
                          <label key={t.PaxID} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTravelers.has(t.PaxID)}
                              onChange={() => onToggleTraveler(t.PaxID)}
                              className="accent-[#1c8fc7]"
                            />
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
                    {journey.Segments?.[0]?.AirlineName || "the airline"} and may vary based on how close to the
                    travel date the request is made. Contact support for the exact fare rule breakdown for PNR{" "}
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

function ActionCard({ label, sublabel, onClick, disabled }: { label: string; sublabel: string; onClick?: () => void; disabled?: boolean }) {
  return (
<button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-3 text-left hover:border-[#1c8fc7]/50 transition-colors ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
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