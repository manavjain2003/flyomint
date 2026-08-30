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
} from "react-icons/hi2";

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
  return `${BASE_IMAGE_URL}${logo.replace(/^\/+/, "")}`;
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

type Category = {
  key: string;
  label: string;
  subtitle: string;
  Icon: (props: { className?: string }) => JSX.Element;
};

const CATEGORY_DEFS: { key: string; label: string; subtitle: string; match: RegExp }[] = [
  { key: "upi", label: "Pay via any UPI app", subtitle: "Scan and pay with UPI", match: /upi/i },
  {
    key: "card",
    label: "Credit / Debit / ATM Card",
    subtitle: "Visa, Mastercard, Amex, RuPay & more",
    match: /credit ?card|debit ?card|debit ?with ?atm|atm ?card|\bcard\b|visa|master|rupay|amex|maestro/i,
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
    case "card":
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

// ---- Traveller + flight-leg summary helpers ---------------------------------

/** Adult/child titles map to gender for the "F"/"M" column in the traveller list. */
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


function TripLegSummaryRow({ leg, showDetails }: { leg: any; showDetails: boolean }) {
  const journey = leg?.journey;
  if (!journey) return null;
  const firstSeg = journey.Segments?.[0];
  const stopsLabel = journey.Stops === 0 ? "Direct" : `${journey.Stops} stop${journey.Stops > 1 ? "s" : ""}`;
  const logoUrl = resolveLogoUrl(firstSeg?.VACLogo || firstSeg?.MACLogo);

  return (
    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex items-center gap-2.5 mb-2">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="w-7 h-7 rounded-full object-contain border border-gray-100 dark:border-gray-800 flex-shrink-0"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
        )}
        <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100 truncate">
          {journey.From} <span className="text-gray-400">&rarr;</span> {journey.To}
        </p>
      </div>

      {showDetails && (
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap pl-9">
          {firstSeg && (
            <span className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
              <HiOutlinePaperAirplane className="w-3.5 h-3.5 -rotate-45 text-gray-400" />
              {firstSeg.AirlineCode}-{firstSeg.FlightNo}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <HiOutlineCalendarDays className="w-3.5 h-3.5 text-gray-400" />
            {formatSegDate(journey.DepartureDateTime)}
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <HiOutlineClock className="w-3.5 h-3.5 text-gray-400" />
            {formatSegTime(journey.DepartureDateTime)} &rarr; {formatSegTime(journey.ArrivalDateTime)}
          </span>
          {journey.Duration && <span>({journey.Duration})</span>}
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [legDetailsOpen, setLegDetailsOpen] = useState(true);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let cancelled = false;

    async function load() {
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
        passportExpiry: p.passportExpiry || "",
        passportIssuingCountry: p.passportIssuingCountry || "",
        paxType: p.ptc === "INF" ? "I" : p.ptc === "CHD" ? "C" : "A",
      }));

      const contact = bookingData.contact ?? {};

      const rawRes = await getAirlineTrvlItinerary({
        tokenId: reviewPayload.tokenId,
        bookingId: bookingData.bookingId || reviewPayload.bookingId,
        contactInfo: {
          mobile: contact.mobile || "",
          email: contact.email || "",
          gstCompanyName: bookingData.gst?.companyName || "",
          gstTin: bookingData.gst?.tin || "",
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

      if (cancelled) return;

      const res = normalizeServiceResponse(rawRes);

      setLoading(false);

      if (!res.success) {
        setError(res.message || "Could not create itinerary");
        return;
      }

      setFareInfo(res.fareInfo);
      setTokenId(res.tokenId ?? reviewPayload.tokenId ?? null);
      setTransactionId(res.transactionId ?? null);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const selected = fareInfo[selectedIndex];

  const savings = useMemo(() => {
    if (!selected) return 0;
    return (selected.discount || 0) + (selected.instantOff || 0);
  }, [selected]);

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

    return Array.from(groups.values()).filter((g) => g.options.length > 1);
  }, [fareInfo]);

  useEffect(() => {
    if (groupedMethods.length > 0) {
      setSelectedIndex(groupedMethods[0].options[0].index);
    }
  }, [groupedMethods]);

  const travellers = bookingData?.passengers ?? [];

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
        <div className="max-w-5xl mx-auto flex items-center gap-3">
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

      {fareInfo.length === 0 ? (
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No payment options are available for this booking.</p>
          </div>
        </div>
      ) : (
        selected && (
          <>
          
            {(bookingData?.pricing?.onward || travellers.length > 0) && (
              <div className="max-w-5xl mx-auto px-4 pt-5">
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
       {(bookingData?.pricing?.onward || bookingData?.pricing?.ret) && (
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
{bookingData?.pricing?.onward && (
  <TripLegSummaryRow leg={bookingData.pricing.onward} showDetails={legDetailsOpen} />
)}
{bookingData?.pricing?.ret && (
  <TripLegSummaryRow leg={bookingData.pricing.ret} showDetails={legDetailsOpen} />
)}

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
              </div>
            )}

            <div className="max-w-5xl mx-auto px-4 pt-5 grid grid-cols-[minmax(0,1fr)_650px] sm:grid-cols-[minmax(0,1fr)_300px] gap-3 sm:gap-5 items-start">
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-[76px]">
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

                    return (
                      <div key={group.key}>
                        <button
                          onClick={() => setSelectedIndex(group.options[0].index)}
                          className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors ${
                            groupSelected
                              ? "bg-[#1c8fc7]/5 dark:bg-[#1c8fc7]/10"
                              : "bg-gray-50 dark:bg-gray-950/30 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                          }`}
                        >
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
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{group.label}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{group.subtitle}</p>
                            </div>
                          </div>
                          {isSingle && (
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums flex-shrink-0">
                              {currency(group.options[0].f.amountToBePaid)}
                            </span>
                          )}
                        </button>

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
                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 tabular-nums flex-shrink-0">
                                  {currency(f.amountToBePaid)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
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

              <div className="space-y-4">
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <button
                    onClick={() => setBreakdownOpen((v) => !v)}
                    className="w-full flex items-start justify-between p-5 text-left"
                  >
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Fare Summary</p>
                      <p className="mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">Amount To Be Paid</p>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">
                          {currency(selected.amountToBePaid)}
                        </span>
                      </div>
                      {selected.convenienceFee > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          ({currency(selected.convenienceFee)} conv. fee included)
                        </p>
                      )}
                    </div>
                    <span className={`mt-1 text-gray-400 transition-transform ${breakdownOpen ? "rotate-180" : ""}`}>▾</span>
                  </button>

                  {savings > 0 && (
                    <div className="mx-5 mb-4 -mt-1 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <span>🎉</span>
                      <span>Yay! You saved {currency(savings)} on this booking</span>
                    </div>
                  )}

                  {breakdownOpen && (
                    <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 space-y-3 bg-gray-50/60 dark:bg-gray-950/40">
                      {(selected.ptcFares || []).map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{PTC_LABEL[p.ptc] || p.ptc} fare</span>
                          <span className="text-gray-900 dark:text-gray-200 tabular-nums">{currency(p.fare)}</span>
                        </div>
                      ))}
                      <FareRow label="Taxes & fees" value={selected.tax} />
                      <FareRow label="Convenience fee" value={selected.convenienceFee} />
                      {selected.addOns > 0 && <FareRow label="Add-ons" value={selected.addOns} />}
                      {selected.markUp > 0 && <FareRow label="Markup" value={selected.markUp} />}
                      {selected.discount > 0 && <FareRow label="Discount" value={-selected.discount} positiveIsGood />}
                      {selected.instantOff > 0 && (
                        <FareRow label="Instant discount" value={-selected.instantOff} positiveIsGood />
                      )}
                      {selected.wallet > 0 && <FareRow label="Wallet applied" value={-selected.wallet} positiveIsGood />}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-sm font-bold">
                        <span className="text-gray-900 dark:text-gray-100">Total payable</span>
                        <span className="text-gray-900 dark:text-gray-100 tabular-nums">
                          {currency(selected.amountToBePaid)}
                        </span>
                      </div>
                    </div>
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
        )
      )}

      {selected && (
        <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Total payable</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">
                {currency(selected.amountToBePaid)}
              </p>
            </div>
            <button
              onClick={handlePayNow}
              disabled={paying}
              className="h-12 px-8 rounded-full bg-[#FF7626] text-white font-semibold text-sm hover:bg-[#e6661f] disabled:opacity-60 transition-colors flex items-center gap-2"
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
      )}
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