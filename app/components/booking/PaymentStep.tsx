"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAirlineTrvlItinerary, getAirlinePaymentUrl } from "@/app/lib/flightsapi";
import {
  HiOutlinePaperAirplane,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineChatBubbleLeftRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import type { ComponentType } from "react";

const SESSION_DURATION = 10 * 60; // 10 minutes in seconds



function SessionExpiredModal({ onGoBack }: { onGoBack: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
          {/* Hourglass illustration */}
          <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950">
            <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none">
              <path d="M20 8h24M20 56h24" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
              <path d="M22 8c0 12 10 16 10 24S22 44 22 56" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M42 8c0 12-10 16-10 24s10 12 10 24" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
              <ellipse cx="32" cy="32" rx="8" ry="4" fill="#fed7aa" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 dark:text-gray-100 mb-2">Payments timed out</h2>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6">Current payment session got expired</p>
          <button
            type="button"
            onClick={onGoBack}
            className="w-full h-11 rounded-full bg-[#1c8fc7] text-white text-[14px] font-bold hover:bg-[#177aab] transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </>
  );
}

const currency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n ?? 0);

const PTC_LABEL: Record<string, string> = {
  ADT: "Adult",
  CHD: "Child",
  INF: "Infant",
};

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BASE_IMAGE_URL || "";

function resolveLogoUrl(logo?: string): string | undefined {
  if (!logo) return undefined;

  if (/^https?:\/\//i.test(logo)) return logo;

  const baseOrigin = BASE_IMAGE_URL.replace(/\/+$/, ""); 
  return `${baseOrigin}${logo.startsWith("/") ? "" : "/"}${logo}`;
}

function pick(obj: any, keys: string[]) {
  if (!obj) return undefined;
  const objKeys = Object.keys(obj);
  for (const k of keys) {
    const found = objKeys.find((ok) => ok.toLowerCase() === k.toLowerCase());
    if (found !== undefined && obj[found] !== undefined && obj[found] !== null) {
      return obj[found];
    }
  }
  return undefined;
}
function normalizePgDetails(raw: any) {
  return {
    pgId: pick(raw, ["pgId", "PGID", "PgId", "pgID"]),
    pgCode: pick(raw, ["pgCode", "PGCode", "PgCode"]),
    pgName: pick(raw, ["pgName", "PGName", "PgName"]),
    pgDescription: pick(raw, [
      "pgDescription",
      "PGDescription",
      "PgDescription",
      "pGDescription",
      "description",
      "desc",
      "pgDesc",
      "methodDescription",
    ]),
  };
}

function normalizeFare(raw: any) {
  const pgDetails = normalizePgDetails(raw.pgDetails || raw.PGDetails || raw.PgDetails || {});
  const ptcFaresRaw = pick(raw, ["ptcFares", "PTCFares"]) || [];
  const pgLogosRaw = pick(raw, ["pgLogos", "PGLogos", "PgLogos"]) || [];
  return {
    pgDetails,
    baseFare: pick(raw, ["baseFare", "BaseFare"]) ?? 0,
    tax: pick(raw, ["tax", "Tax"]) ?? 0,
    convenienceFee: pick(raw, ["convenienceFee", "ConvenienceFee"]) ?? 0,
    discount: pick(raw, ["discount", "Discount"]) ?? 0,
    instantOff: pick(raw, ["instantOff", "InstantOff"]) ?? 0,
    markUp: pick(raw, ["markUp", "MarkUp"]) ?? 0,
    addOns: pick(raw, ["addOns", "AddOns"]) ?? 0,
    addOnDetails: pick(raw, ["addOnDetails", "AddOnDetails"]) ?? [],
    wallet: pick(raw, ["wallet", "Wallet"]) ?? 0,
    amountToBePaid: pick(raw, ["amountToBePaid", "AmountToBePaid"]) ?? 0,
    ptcFares: ptcFaresRaw.map((p: any) => ({
      ptc: pick(p, ["ptc", "PTC"]),
      fare: pick(p, ["fare", "Fare"]) ?? 0,
      tax: pick(p, ["tax", "Tax"]) ?? 0,
    })),
    pgLogos: (Array.isArray(pgLogosRaw) ? pgLogosRaw : []).map((l: any) => ({
      name: pick(l, ["logoName", "LogoName"]) ?? "",
      path: pick(l, ["logoPath", "LogoPath"]) ?? "",
    })).filter((l: { name: string; path: string }) => !!l.path),
  };
}

function normalizeServiceResponse(res: any) {
  const container = res?.ServiceResponse || res?.serviceResponse || res;
  const fareInfoRaw = pick(container, ["fareInfo", "FareInfo"]) || [];
  return {
    success: res?.success ?? (pick(res, ["ServiceStatus", "serviceStatus"]) === "200" || res?.success === true),
    message: pick(res, ["message", "MSG", "msg"]) ?? null,
    tokenId: pick(container, ["tokenId", "TokenID", "TokenId"]),
    transactionId: pick(container, ["transactionId", "TransactionID", "TransactionId"]),
    bookingId: pick(container, ["bookingId", "BookingID", "BookingId"]),
    fareInfo: fareInfoRaw.map(normalizeFare),
  };
}



const CATEGORY_DEFS: { key: string; label: string; subtitle: string; match: RegExp }[] = [
  { key: "upi", label: "Pay via any UPI app", subtitle: "Scan and pay with UPI", match: /upi/i },
   { key: "credit-card",
    label: "Credit Card",
    subtitle: "Visa, Mastercard, Amex & more",
    match: /credit ?card/i,
  },
  {
    key: "card",
    label: "Debit Card",
    subtitle: "Visa, Mastercard, RuPay & more",
    match: /debit ?card/i,
  },
  {
    key: "debit-atm",
    label: "Debit with ATM",
    subtitle: "Pay with your ATM-cum-debit card",
    match: /debit ?with ?atm|atm ?card/i,
  },
  {
    key: "card",
    label: "Cards",
    subtitle: "Visa, Mastercard, Amex, RuPay & more",
    match: /\bcard\b|visa|master|rupay|amex|maestro/i,
  },
  {
    key: "paylater",
    label: "Pay Later & Easy EMI",
    subtitle: "Book now & pay later options",
    match: /pay ?later|bnpl|simpl|lazypay|zip/i,
  },
  {
    key: "apps",
    label: "Pay with Apps",
    subtitle: "Pay with CRED, Apple Pay & more",
    match: /cred|apple ?pay|g ?pay|google ?pay|phonepe app/i,
  },
  {
    key: "emi",
    label: "EMI",
    subtitle: "Credit & debit card EMI options",
    match: /\bemi\b/i,
  },
  {
    key: "netbanking",
    label: "Net Banking",
    subtitle: "All major banks supported",
    match: /net ?banking|net ?bank|\bnb\b/i,
  },
  {
    key: "wallet",
    label: "Wallets",
    subtitle: "Pay using your wallet balance",
    match: /wallet|paytm|amazon ?pay|mobikwik|freecharge/i,
  },
];

function categorize(
  pgDescription: string,
  pgName: string,
  pgCode: string
): { key: string; label: string; subtitle: string } {
  const primary = (pgDescription || "").trim();
  const fallback = `${pgCode || ""} ${pgName || ""}`.trim();

  const found =
    CATEGORY_DEFS.find((c) => c.match.test(primary)) ||
    CATEGORY_DEFS.find((c) => c.match.test(fallback));

  if (found) return found;

  if (!primary && pgCode) {
    const cleanName = (pgName || pgCode).trim() || "Other";
    return {
      key: `other-${pgCode.toLowerCase()}`,
      label: cleanName,
      subtitle: "Secure checkout",
    };
  }

  const label = primary || pgName || "Other";
  return {
    key: `other-${label}`,
    label,
    subtitle: "Secure checkout",
  };
}

function CategoryIcon({ categoryKey, className }: { categoryKey: string; className?: string }) {
  const common = className ?? "w-5 h-5";
  switch (categoryKey) {
    case "upi":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.7">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18M7 14h4" strokeLinecap="round" />
        </svg>
      );
    case "credit-card":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.7">
          <rect x="2.5" y="5.5" width="19" height="13" rx="2.2" />
          <path d="M2.5 9.5h19" strokeLinecap="round" />
          <path d="M6 14.5h4" strokeLinecap="round" />
        </svg>
      );
          case "debit-card":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.7">
          <rect x="2.5" y="5.5" width="19" height="13" rx="2.2" />
          <path d="M2.5 9.5h19" strokeLinecap="round" />
          <path d="M6 14.5h4" strokeLinecap="round" />
        </svg>
      );
          case "debit-atm":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.7">
          <rect x="2.5" y="5.5" width="19" height="13" rx="2.2" />
          <path d="M2.5 9.5h19" strokeLinecap="round" />
          <path d="M6 14.5h4" strokeLinecap="round" />
        </svg>
      );
    case "paylater":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12.5" r="8" />
          <path d="M12 8.5v4l2.6 1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "apps":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="9" r="4.5" />
          <path d="M4.5 20c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
        </svg>
      );
    case "emi":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.7">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 9h10M7 13h6M7 17h4" strokeLinecap="round" />
        </svg>
      );
    case "netbanking":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.7">
          <path d="M3 10l9-5 9 5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.5 10v8m5-8v8m5-8v8m5-8v8" strokeLinecap="round" />
          <path d="M2.5 20.5h19" strokeLinecap="round" />
        </svg>
      );
    case "wallet":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.7">
          <path d="M3 7.5A2.5 2.5 0 015.5 5H17a2 2 0 012 2v1" strokeLinecap="round" />
          <rect x="3" y="8" width="18" height="11" rx="2" />
          <circle cx="16" cy="13.5" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}


function genderFromTitle(title?: string): string {
  const t = (title || "").toLowerCase();
  if (t === "mr" || t === "mstr") return "M";
  if (t === "mrs" || t === "ms" || t === "miss") return "F";
  return "";
}

function ptcLabel(ptc?: string): string {
  if (ptc === "CHD") return "CHILD";
  if (ptc === "INF") return "INFANT";
  return "ADULT";
}

function formatSegDate(iso?: string) {
  const d = new Date(iso || "");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "2-digit" });
}

function formatSegTime(iso?: string) {
  const d = new Date(iso || "");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

/**
 * Renders one itinerary leg from the normalized AddOnLegSummary shape
 * (from, to, duration, stops, segments[]) produced by FlightAddOns and
 * threaded through via addOnData.legs. This is sourced from getAirlineSSR
 * (keyed off the booking's actual TokenID/BookingID), so PaymentStep no
 * longer needs to reach back into ReviewBooking's pricing state for
 * itinerary display.
 */
function TripLegSummaryRow({ leg, showDetails }: { leg: any; showDetails: boolean }) {
  if (!leg) return null;
  const firstSeg = leg.segments?.[0];
  const lastSeg = leg.segments?.[leg.segments.length - 1];
  const stopsLabel = leg.stops === 0 ? "Direct" : `${leg.stops} stop${leg.stops > 1 ? "s" : ""}`;
  const logoUrl = resolveLogoUrl(firstSeg?.logo);

  return (
    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex items-center gap-2.5 mb-2">
        {logoUrl ? (
  <img
    src={logoUrl}
    alt=""
    className="w-7 h-7 rounded-full object-contain border border-gray-100 dark:border-gray-800 flex-shrink-0"
    onError={(e) => {
      e.currentTarget.style.display = "none";
    }}
  />
) : (
  <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
)}
        <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100 truncate">
          {leg.from} <span className="text-gray-400">&rarr;</span> {leg.to}
        </p>
      </div>

      {showDetails && (
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap pl-9">
          {firstSeg && (
            <span className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
              <HiOutlinePaperAirplane className="w-3.5 h-3.5 -rotate-45 text-gray-400" />
              {firstSeg.airlineCode}-{firstSeg.flightNo}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <HiOutlineCalendarDays className="w-3.5 h-3.5 text-gray-400" />
            {formatSegDate(firstSeg?.departureTime)}
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <HiOutlineClock className="w-3.5 h-3.5 text-gray-400" />
            {formatSegTime(firstSeg?.departureTime)} &rarr; {formatSegTime(lastSeg?.arrivalTime)}
          </span>
          {leg.duration && <span>({leg.duration})</span>}
          <span>({stopsLabel})</span>
        </div>
      )}
    </div>
  );
}


export default function PaymentStep({
  reviewPayload,
  bookingData,
  addOnData,
  onBack,
}: {
  reviewPayload: any;
  bookingData: any;
  addOnData: any;
  onBack: () => void;
}) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fareInfo, setFareInfo] = useState<any[]>([]);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [legDetailsOpen, setLegDetailsOpen] = useState(true);

  // Payment-session countdown: starts the moment this page mounts (not on
  // review), so it reflects time actually spent on payment rather than
  // ticking down while the person is still filling in traveller details.
  const [sessionSeconds, setSessionSeconds] = useState<number>(SESSION_DURATION);
  const [sessionExpired, setSessionExpired] = useState(false);

  function handleSessionExpiredGoBack() {
    window.location.href = "/";
  }

  useEffect(() => {
    if (sessionExpired) return;
    if (sessionSeconds <= 0) {
      setSessionExpired(true);
      return;
    }
    const t = setTimeout(() => setSessionSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sessionSeconds, sessionExpired]);

  const hasFetchedRef = useRef(false);

  const itineraryLegs = addOnData?.legs ?? [];

useEffect(() => {
  if (hasFetchedRef.current) return;
  hasFetchedRef.current = true;

  async function load() {
    try {
      const ssrl = (addOnData?.selections ?? []).map((s: any) => ({
        sid: Number(s.sid),
        paxId: s.paxId,
        ssrCode: s.code,
        ssrType: s.ssrType,
      }));

const travelers = (bookingData.passengers ?? []).map((p: any, i: number) => ({
  paxId: i + 1,
  title: p.title,
  firstName: p.firstName,
  lastName: p.lastName,
  dob: p.dob,
  nationality: p.nationality || "IN",
  passportNo: p.passportNo || "",
  pic: p.passportIssuingCountry || "",  
  pdoe: p.passportExpiry || "",    
  pdoi: p.passportIssuingDate || "",                            
  documentNo: p.documentNo || "",
  paxType: p.ptc === "INF" ? "I" : p.ptc === "CHD" ? "C" : "A",
}));
      const contact = bookingData.contact ?? {};

      const rawRes = await getAirlineTrvlItinerary({
        tokenId: reviewPayload?.tokenId,
        bookingId: bookingData.bookingId || reviewPayload?.bookingId,
        contactInfo: {
          mobile: contact.mobile || "",
          email: contact.email || "",
          gstCompanyName: bookingData.gst?.companyName || "",
          gstTin: bookingData.gst?.gstNumber || "",
          gstMobile: bookingData.gst?.mobile || "",
          gstEmail: bookingData.gst?.email || "",
          gstAddress: bookingData.gst?.address || "",
        },
        billInfo: {
          profileUpdate: bookingData.billing?.profileUpdate ?? false,
          pinCode: bookingData.billing?.pinCode || "",
          address: bookingData.billing?.address || "",
          city: bookingData.billing?.city || "",
          state: bookingData.billing?.state || "",
        },
        travelers,
        ssrl: ssrl.length ? ssrl : undefined,
      });

     const res = rawRes;

      if (!res.success) {
        setError(res.message || "Could not create itinerary");
        return;
      }

      setFareInfo(res.fareInfo);
      setTokenId(res.tokenId ?? reviewPayload?.tokenId ?? null);
      setTransactionId(res.transactionId ?? null);
    } catch (e) {
      console.error("PaymentStep load() failed:", e);
      setError(e instanceof Error ? e.message : "Something went wrong while loading payment options.");
    } finally {
      setLoading(false);
    }
  }

  load();
}, []);

  const selected = selectedIndex !== null ? fareInfo[selectedIndex] : undefined;

  const savings = useMemo(() => {
    if (!selected) return 0;
    return (selected.discount || 0) + (selected.instantOff || 0);
  }, [selected]);

  const defaultFare = useMemo(() => {
  if (fareInfo.length === 0) return null;
  const base = fareInfo[0];
  const addOns = base.addOns ?? 0;
  return {
    baseFare: base.baseFare ?? 0,
    tax: base.tax ?? 0,
    convenienceFee: base.convenienceFee ?? 0,
    addOns,
    markUp: 0,
    discount: 0,
    instantOff: 0,
    wallet: 0,
    ptcFares: base.ptcFares ?? [],
    amountToBePaid:
      (base.baseFare ?? 0) + (base.tax ?? 0) + (base.convenienceFee ?? 0) + addOns,
  };
}, [fareInfo]);

  const displayFare = selected ?? defaultFare;

  const groupedMethods = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; label: string; subtitle: string; options: { index: number; f: any }[] }
    >();

    fareInfo.forEach((f, index) => {
      const pgId = f.pgDetails?.pgId;
      const pgDescription = (f.pgDetails?.pgDescription || "").trim();
      const pgName = (f.pgDetails?.pgName || "").trim();
      const pgCode = (f.pgDetails?.pgCode || "").trim();

      // Parse amount properly - handle strings
      const rawAmount = f.amountToBePaid;
      const amount = typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;

      if (!pgId || (!pgDescription && !pgName && !pgCode)) return;
      if (amount == null || isNaN(amount) || amount <= 0) return;

      const cat = categorize(pgDescription, pgName, pgCode);
      if (!groups.has(cat.key)) {
        groups.set(cat.key, { ...cat, options: [] });
      }
      groups.get(cat.key)!.options.push({ index, f });
    });

return Array.from(groups.values()).map((g) => {
  if (g.options.length === 1) {
    const desc = (g.options[0].f.pgDetails?.pgDescription || "").trim();
    if (desc && desc.toLowerCase() !== g.label.toLowerCase()) {
      return { ...g, label: desc, subtitle: "Secure checkout" };
    }
  }
  return g;
});
  }, [fareInfo]);

  // No payment method is auto-selected — the person must actively pick one.

  const travellers = bookingData?.passengers ?? [];
  const gstDetails = bookingData?.gst ?? null;
  const hasGstDetails = Boolean(gstDetails?.gstNumber?.trim());

  async function handlePayNow() {
    if (!selected) return;
    setPayError(null);

    if (!tokenId || !transactionId) {
      setPayError("Missing session details. Please go back and try again.");
      return;
    }

    const pgId = selected.pgDetails?.pgId;
    const pgCode = selected.pgDetails?.pgCode;
    const amountToBePaid = selected.amountToBePaid;

    if (!pgId || !pgCode || amountToBePaid == null) {
      setPayError("Missing payment gateway details for this option.");
      return;
    }

    setPaying(true);

    const res = await getAirlinePaymentUrl({
      tokenId,
      transactionId,
      pgId,
      pgCode,
      amountToBePaid,
    });

    if (!res.success || !res.paymentUrl) {
      setPaying(false);
      setPayError(res.message || "Could not start payment. Please try again.");
      return;
    }

    window.location.href = res.paymentUrl;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 sm:px-8 py-4">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div>
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" />
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-5 grid grid-cols-[minmax(0,1fr)_650px] sm:grid-cols-[minmax(0,1fr)_300px] gap-3 sm:gap-5 items-start">
          {/* Left: payment methods skeleton */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
              <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div>
                <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-1.5" />
                <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="h-3.5 w-2/3 max-w-[160px] rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-1.5" />
                      <div className="h-3 w-1/2 max-w-[120px] rounded bg-gray-100 dark:bg-gray-800/70 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-3.5 w-14 rounded bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                </div>
              ))}
            </div>

            <div className="mx-5 mb-5 mt-2 h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-800/70 animate-pulse" />
          </div>

          {/* Right: fare summary skeleton */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
              <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-3" />
              <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800/70 animate-pulse mb-2" />
              <div className="h-7 w-36 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>

            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800/70 animate-pulse" />
              </div>
              <div className="h-3 w-40 rounded bg-gray-100 dark:bg-gray-800/70 animate-pulse mb-4" />
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 flex items-center justify-between gap-3">
                  <div>
                    <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-1.5" />
                    <div className="h-3 w-8 rounded bg-gray-100 dark:bg-gray-800/70 animate-pulse" />
                  </div>
                  <div className="flex-1 flex flex-col items-center px-1">
                    <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800/70 animate-pulse mb-1" />
                    <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="text-right">
                    <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-1.5 ml-auto" />
                    <div className="h-3 w-8 rounded bg-gray-100 dark:bg-gray-800/70 animate-pulse ml-auto" />
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="h-3.5 w-20 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-2.5" />
                <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800/70 animate-pulse mb-1.5" />
                <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800/70 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom bar skeleton */}
        <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2.5 w-20 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-1.5" />
              <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
            <div className="h-12 w-36 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Couldn't load payment options</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">{error}</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-full bg-[#1c8fc7] text-white text-sm font-semibold hover:bg-[#177aab] transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32">
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Go back"
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              ←
            </button>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Step 4 of 4</p>
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">Review & Pay</h1>
            </div>
          </div>
        </div>
      </div>

      {fareInfo.length === 0 ? (
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No payment options are available for this booking.</p>
          </div>
        </div>
      ) : (
  <>
    <div className="max-w-7xl mx-auto px-4 pt-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-3 sm:gap-5 items-start">
      {/* LEFT COLUMN: trip/traveller details + payment methods */}
      <div className="space-y-4 min-w-0">
        {(itineraryLegs.length > 0 || travellers.length > 0) && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            {itineraryLegs.length > 0 && (
              <div className="flex items-center justify-end px-5 pt-3.5">
                <button
                  type="button"
                  onClick={() => setLegDetailsOpen((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1c8fc7] hover:underline"
                >
                  {legDetailsOpen ? "HIDE DETAILS" : "SHOW DETAILS"}
                  {legDetailsOpen ? (
                    <HiOutlineChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <HiOutlineChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
            {itineraryLegs.map((leg: any, i: number) => (
              <TripLegSummaryRow key={i} leg={leg} showDetails={legDetailsOpen} />
            ))}

            {travellers.length > 0 && (
              <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800">
                {legDetailsOpen ? (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
                      Travellers ({travellers.length})
                    </p>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {travellers.map((p: any, i: number) => {
                        const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ").toUpperCase();
                        const gender = genderFromTitle(p.title);
                        return (
                          <div
                            key={i}
                            className="grid grid-cols-[28px_1fr_28px_72px] items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                          >
                            <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[11px] font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                              {fullName || `Traveller ${i + 1}`}
                            </span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center">
                              {gender || "—"}
                            </span>
                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 text-right">
                              {ptcLabel(p.ptc)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <HiOutlineUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                      {travellers
                        .map((p: any) => [p.firstName, p.lastName].filter(Boolean).join(" ").toUpperCase())
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {(bookingData?.contact?.mobile || bookingData?.contact?.email) && (
              <div className="flex items-start gap-3 px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/40">
                <span className="mt-0.5 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0">
                  <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Booking details will be sent to:{" "}
                    {[travellers[0]?.firstName, travellers[0]?.lastName].filter(Boolean).join(" ")}
                    {travellers.length > 1
                      ? `, +${travellers.length - 1} traveller${travellers.length - 1 > 1 ? "s" : ""}`
                      : ""}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {bookingData.contact.countryCode ? `${bookingData.contact.countryCode}-` : ""}
                    {bookingData.contact.mobile}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {hasGstDetails && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-3.5 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-[#e8f4fb] dark:bg-gray-800 text-[#1c8fc7] shrink-0">
                <HiOutlineDocumentText className="w-4 h-4" />
              </span>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">GST Details</p>
            </div>
            <div className="px-5 py-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                  GSTIN
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 break-words">
                  {gstDetails.gstNumber}
                </p>
              </div>
              {gstDetails.companyName && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                    Company Name
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 break-words">
                    {gstDetails.companyName}
                  </p>
                </div>
              )}
              {gstDetails.email && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 break-words">
                    {gstDetails.email}
                  </p>
                </div>
              )}
              {gstDetails.address && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                    Registered Address
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 break-words">
                    {gstDetails.address}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#1c8fc7]">
              <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 16.9 5.8 20.3l1.6-6.8-5.2-4.6 6.9-.6z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-[#1c8fc7] leading-tight">Recommended</p>
              <p className="text-xs text-gray-400 leading-tight">Recently Used Methods</p>
            </div>
          </div>

   <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[70vh] overflow-y-auto">
  {groupedMethods.map((group) => {
    const isSingle = group.options.length === 1;
    const groupSelected = group.options.some((o) => o.index === selectedIndex);
    const logos = isSingle ? (group.options[0].f.pgLogos ?? []) : [];

    return (
      <div key={group.key}>
        <button
          onClick={() => setSelectedIndex(group.options[0].index)}
          className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors border-l-4 ${
            groupSelected
              ? "bg-[#1c8fc7]/10 dark:bg-[#1c8fc7]/15 border-[#1c8fc7]"
              : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 border-transparent"
          }`}
        >
          {/* Left: icon + label */}
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                groupSelected
                  ? "bg-[#1c8fc7]/10 text-[#1c8fc7]"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              <CategoryIcon categoryKey={group.key} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {group.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {group.subtitle}
              </p>
            </div>
          </div>

          {/* Right: logos + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {logos.length > 0 && (
              <div className="flex items-center gap-1">
                {logos.map((logo: { name: string; path: string }, i: number) => (
                  <span key={i} className="inline-flex items-center">
                    <img
                      src={resolveLogoUrl(logo.path)}
                      alt={logo.name}
                      title={logo.name}
                      className="h-10 w-auto max-w-[36px] object-contain"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = "none";
                        const fallback = el.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "inline";
                      }}
                    />
                    <span className="hidden text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5">
                      {logo.name}
                    </span>
                  </span>
                ))}
              </div>
            )}
            {isSingle && !groupSelected && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4 text-orange-400 flex-shrink-0"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {groupSelected && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4 text-[#1c8fc7] flex-shrink-0"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>

        {!isSingle && (
          <div className="px-5 pb-3 space-y-1.5">
            {group.options.map(({ index, f }) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "border-[#1c8fc7] bg-[#1c8fc7]/5 dark:bg-[#1c8fc7]/10"
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "border-[#1c8fc7]" : "border-gray-300 dark:border-gray-700"
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#1c8fc7]" />}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                      {f.pgDetails?.pgDescription || f.pgDetails?.pgName || "Payment option"}
                    </span>
                  </span>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f.pgLogos?.length > 0 && (
                      <div className="flex items-center gap-1">
                        {f.pgLogos.map((logo: { name: string; path: string }, i: number) => (
                          <span key={i} className="inline-flex items-center">
                            <img
                              src={resolveLogoUrl(logo.path)}
                              alt={logo.name}
                              title={logo.name}
                              className="h-5 w-auto max-w-[32px] object-contain"
                              onError={(e) => {
                                const el = e.currentTarget;
                                el.style.display = "none";
                                const fallback = el.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = "inline";
                              }}
                            />
                            <span className="hidden text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5">
                              {logo.name}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                      {currency(f.amountToBePaid)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  })}
</div>

          {payError && (
            <div className="mx-5 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {payError}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center px-5 pb-5 leading-relaxed">
            You'll be redirected to a secure payment page to complete this transaction. Your card and bank details
            are never stored by us.
          </p>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-[76px]">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          {displayFare && (
            <>
              <button
                onClick={() => setBreakdownOpen((v) => !v)}
                className="w-full flex items-start justify-between p-5 text-left group"
              >
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Fare Summary</p>
                  <p className="mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">Amount To Be Paid</p>
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">
                      {currency(displayFare.amountToBePaid)}
                    </span>
                  </div>
                  {displayFare.convenienceFee > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      ({currency(displayFare.convenienceFee)} conv. fee included)
                    </p>
                  )}
                  {!selected && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      Select a payment method to see any applicable discount
                    </p>
                  )}
                </div>
                <span className="mt-1 flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 pl-1.5 pr-1.5 py-1.5 text-xs font-bold text-[#1c8fc7] transition-colors group-hover:bg-[#1c8fc7]/5 group-hover:border-[#1c8fc7]/40 flex-shrink-0">
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full bg-[#1c8fc7]/10 text-[#1c8fc7] transition-transform duration-200 ${
                      breakdownOpen ? "rotate-180" : ""
                    }`}
                  >
                    <HiOutlineChevronDown className="w-3 h-3" />
                  </span>
                </span>
              </button>

              {selected && savings > 0 && (
                <div className="mx-5 mb-4 -mt-1 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <span>🎉</span>
                  <span>Yay! You saved {currency(savings)} on this booking</span>
                </div>
              )}

              {breakdownOpen && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 space-y-3 bg-gray-50/60 dark:bg-gray-950/40">
                  {(displayFare.ptcFares || []).map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{PTC_LABEL[p.ptc] || p.ptc} fare</span>
                      <span className="text-gray-900 dark:text-gray-200 tabular-nums">{currency(p.fare)}</span>
                    </div>
                  ))}
                  <FareRow label="Taxes & fees" value={displayFare.tax} />
                  <FareRow label="Convenience fee" value={displayFare.convenienceFee} />
                  {displayFare.addOns > 0.00 && <FareRow label="Add-ons" value={displayFare.addOns} />}
                  {displayFare.markUp > 0 && <FareRow label="Markup" value={displayFare.markUp} />}
                  {selected && displayFare.discount > 0 && (
                    <FareRow label="Discount" value={-displayFare.discount} positiveIsGood />
                  )}
                  {selected && displayFare.instantOff > 0 && (
                    <FareRow label="Instant discount" value={-displayFare.instantOff} positiveIsGood />
                  )}
                  {selected && displayFare.wallet > 0 && (
                    <FareRow label="Wallet applied" value={-displayFare.wallet} positiveIsGood />
                  )}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-sm font-bold">
                    <span className="text-gray-900 dark:text-gray-100">Total payable</span>
                    <span className="text-gray-900 dark:text-gray-100 tabular-nums">
                      {currency(displayFare.amountToBePaid)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="text-center py-2">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">100% Safe Payment Process</p>
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-gray-400">
            <span>VERIFIED by VISA</span>
            <span>Mastercard SecureCode</span>
            <span>RuPay</span>
            <span>Diners Club</span>
            <span>PCI DSS</span>
          </div>
        </div>
      </div>
    </div>
  </>
      )}

  {fareInfo.length > 0 && (
  <div className="sticky bottom-0 z-40 w-full mt-4">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] rounded-2xl py-4 px-4 flex items-center justify-between gap-4 mb-4">
        <div>
          {displayFare && (
            <>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {currency(displayFare.amountToBePaid)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {selected
                  ? `${travellers.length} Traveller${travellers.length > 1 ? "s" : ""}`
                  : "Select a payment method to continue"}
              </p>
            </>
          )}
        </div>
        <button
          onClick={handlePayNow}
          disabled={paying || !selected}
          className="h-12 px-6 rounded-full text-sm font-bold flex items-center gap-2 bg-[#FF7626] hover:bg-[#e6661f] disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors"
        >
          {paying ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Redirecting…
            </>
          ) : (
            "Proceed to pay"
          )}
        </button>
      </div>
    </div>
  </div>
)}
      {sessionExpired && <SessionExpiredModal onGoBack={handleSessionExpiredGoBack} />}
    </div>
  );
}

function FareRow({
  label,
  value,
  positiveIsGood = false,
}: {
  label: string;
  value: number;
  positiveIsGood?: boolean;
}) {
  const isNegative = value < 0;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span
        className={`tabular-nums ${
          isNegative && positiveIsGood ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-gray-200"
        }`}
      >
        {isNegative ? "− " : ""}
        {currency(Math.abs(value))}
      </span>
    </div>
  );
}