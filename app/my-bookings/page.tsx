"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi2";
import { MdOutlineLuggage, MdOutlineCancel, MdOutlineCheckCircle } from "react-icons/md";
import AccountSidebar from "@/app/components/booking/AccountSidebar";
import { getTransactionHistory } from "@/app/lib/flightsapi";
import { useRequireAuth } from "@/app/lib/useRequireAuth";


const PAGE_SIZE = 9;
const BOOKING_STATUS_PATH = "/booking";

const TABS = [
  { id: 1, label: "Upcoming",  Icon: MdOutlineLuggage },
  { id: 3, label: "Cancelled", Icon: MdOutlineCancel },
  { id: 2, label: "Completed", Icon: MdOutlineCheckCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

type SearchType = "ON" | "RT" | "RS" | string;


type Leg = {
  sector: string;
  date: string;
};

type Booking = {
  transactionId: string | number;
  referenceNo?: string;
  airlinePnr?: string;
  crsPnr?: string;
  travelerName?: string;
  legs: Leg[];
  createdDate?: string;
  totalPax: number;
  adt: number;
  chd: number;
  inf: number;
  bookingStatus: string;
  statusMessage?: string;
  tripType?: string;
  searchType?: SearchType;
};


function sectorLabel(sector?: string): string {
  return (sector || "").replace("/", " → ") || "—";
}

function formatDate(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isRoundTrip(legs: Leg[]): boolean {
  return legs.length === 2;
}

function looksInternational(legs: Leg[]): boolean {
  return legs.some((leg) => (leg.sector || "").split("/").filter(Boolean).length >= 3);
}

function tripTypeLabel(booking: Booking): string {
  const type = (booking.searchType || "").trim().toUpperCase();

  switch (type) {
    case "ON":
      return "One Way Flight";
    case "RT":
      return "Round Trip Flight";
    case "RS":
      return "International Flight";
    default:
      if (booking.tripType) return booking.tripType;
      if (looksInternational(booking.legs)) return "International Flight";
      return isRoundTrip(booking.legs) ? "Round Trip Flight" : "One Way Flight";
  }
}

function statusLabel(code: string): string {
  const map: Record<string, string> = {
    "0":  "Processing",
    "1":  "Upcoming",
    "2":  "Completed",
    "3":  "Cancelled",
    "4":  "Failed",
    "":   "Processing",
  };
  return map[code] ?? code;
}

function statusBadgeClass(code: string): string {
  const map: Record<string, string> = {
    "0":  "bg-amber-50  text-amber-700",
    "1":  "bg-blue-50   text-blue-700",
    "2":  "bg-green-50  text-green-700",
    "3":  "bg-red-50    text-red-600",
    "4":  "bg-red-50    text-red-600",
    "":   "bg-gray-100  text-gray-600",
  };
  return map[code] ?? "bg-gray-100 text-gray-600";
}

function isCancelled(code: string): boolean {
  return code === "3";
}

function routeArrow(legs: Leg[]): string {
  return isRoundTrip(legs) ? "⇌" : "→";
}

function primaryRoute(legs: Leg[]): { from: string; to: string } | null {
  if (!legs.length) return null;
  const parts = (legs[0].sector || "").split("/");
  return { from: parts[0] || "—", to: parts[1] || "—" };
}

function formatTravelerName(name?: string): string {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}


function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-56 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-72 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-10 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}


interface BookingCardProps {
  booking: Booking;
  onClick: () => void;
}

function BookingCard({ booking, onClick }: BookingCardProps) {
  const route = primaryRoute(booking.legs);
  const cancelled = isCancelled(booking.bookingStatus);
  const travelerName = formatTravelerName(booking.travelerName);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 grid place-items-center text-gray-500 dark:text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
            />
          </svg>
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {route ? (
                <>
                  {route.from}{" "}
                  <span className="text-gray-400 dark:text-gray-500 font-normal text-sm mx-0.5">
                    {routeArrow(booking.legs)}
                  </span>{" "}
                  {route.to}
                </>
              ) : (
                "—"
              )}
            </h3>

            {booking.legs.slice(1).map((leg, i) => {
              const parts = (leg.sector || "").split("/");
              return (
                <span
                  key={i}
                  className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md"
                >
                  {parts[0]} → {parts[1]}
                </span>
              );
            })}

            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusBadgeClass(
                booking.bookingStatus
              )}`}
            >
              {statusLabel(booking.bookingStatus)}
            </span>

            {booking.statusMessage && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                {booking.statusMessage}
              </span>
            )}
          </div>

          {travelerName && (
            <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 font-medium">
              {travelerName}
            </p>
          )}

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {cancelled ? (
              <span className="text-[#FF7626] font-medium">
                Cancelled on {formatDate(booking.createdDate)}
              </span>
            ) : (
              <span>Booked on {formatDate(booking.createdDate)}</span>
            )}
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span>{tripTypeLabel(booking)}</span>
            {booking.referenceNo && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span>
                  Booking ID -{" "}
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {booking.referenceNo}
                  </span>
                </span>
              </>
            )}
            {booking.totalPax > 0 && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span>
                  {booking.totalPax} Traveller{booking.totalPax !== 1 ? "s" : ""}
                  {(booking.chd > 0 || booking.inf > 0) && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                      ({booking.adt} adt
                      {booking.chd ? `, ${booking.chd} chd` : ""}
                      {booking.inf ? `, ${booking.inf} inf` : ""})
                    </span>
                  )}
                </span>
              </>
            )}
          </p>

          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {booking.legs.map((leg, i) => (
              <span key={i} className="text-xs text-gray-400 dark:text-gray-500">
                {sectorLabel(leg.sector)}{" "}
                <span className="text-gray-300 dark:text-gray-600">·</span> {leg.date}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClick}
          className="shrink-0 px-5 py-2.5 rounded-full bg-[#2196F3] hover:bg-[#1976D2] text-white text-sm font-semibold transition-colors whitespace-nowrap"
        >
          View Booking
        </button>
      </div>

      {cancelled && (
        <div className="mx-5 mb-5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            Your flight booking has been cancelled.
          </p>
        </div>
      )}
    </div>
  );
}


export default function MyBookingsPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>(1);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadBookings(
    tabId: TabId,
    pageNumber: number,
    signal?: AbortSignal
  ) {
    setLoading(true);
    setLoadError("");
    let res: any;
    try {
      res = await getTransactionHistory({ tabId, pageNumber, pageSize: PAGE_SIZE, signal });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setLoading(false);
      setLoadError("Something went wrong. Please try again.");
      return;
    }
    setLoading(false);

    if (!res.success) {
      setLoadError(res.message || "Could not load your bookings.");
      return;
    }
    setBookings((res.bookings as Booking[]) || []);
    setHasMore(Boolean(res.hasMore));
  }

  useEffect(() => {
    const controller = new AbortController();
    loadBookings(activeTab, page, controller.signal);
    return () => controller.abort();
  }, [activeTab, page]);

  function handleTabChange(tabId: TabId) {
    if (tabId === activeTab) return;
    setActiveTab(tabId);
    setPage(1);
    setBookings([]);
  }

  function goToBookingStatus(transactionId?: string | number) {
    if (!transactionId) {
      console.warn("goToBookingStatus called with no transactionId");
      return;
    }
    router.push(`${BOOKING_STATUS_PATH}?txnid=${encodeURIComponent(transactionId)}`);
  }

  if (!ready) return null;

  return (
    <div className="flex-1 min-h-screen bg-[#f5f8fb] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-[#FF7626]/10 shrink-0">
            <HiOutlineClipboardDocumentList className="w-5 h-5 text-[#FF7626]" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My bookings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All your past and upcoming bookings
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-64 shrink-0">
            <AccountSidebar />
          </aside>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex border-b border-gray-100 dark:border-gray-800">
                {TABS.map(({ id, label, Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleTabChange(id)}
                      className={`
                        relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors
                        ${
                          active
                            ? "text-[#2196F3] dark:text-blue-400"
                            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                      {active && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2196F3] rounded-t" />
                      )}
                    </button>
                  );
                })}
              </div>

            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto filter-scrollbar">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                ) : loadError ? (
                  <div className="py-6 px-4">
                    <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 px-4 py-2.5 rounded-xl">
                      {loadError}
                    </p>
                    <button
                      type="button"
                      onClick={() => loadBookings(activeTab, page)}
                      className="mt-4 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Retry
                    </button>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="py-16 flex flex-col items-center gap-3 text-center">
                    <span className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 grid place-items-center text-gray-400">
                      <HiOutlineClipboardDocumentList className="w-7 h-7" />
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No{" "}
                      {TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}{" "}
                      bookings found.
                    </p>
                  </div>
                ) : (
                  bookings.map((b) => (
                    <BookingCard
                      key={b.referenceNo || b.transactionId}
                      booking={b}
                      onClick={() => goToBookingStatus(b.transactionId)}
                    />
                  ))
                )}
              </div>

              {!loading && !loadError && (page > 1 || hasMore) && (
                <div className="flex items-center justify-between px-4 pb-4">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Page {page}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                      aria-label="Previous page"
                    >
                      <HiOutlineChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!hasMore}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                      aria-label="Next page"
                    >
                      <HiOutlineChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}