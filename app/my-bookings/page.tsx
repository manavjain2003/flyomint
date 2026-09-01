"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineClipboardDocumentList, HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import AccountSidebar from "@/app/components/booking/AccountSidebar";
import { getTransactionHistory } from "@/app/lib/flightsapi";
import { useRequireAuth } from "@/app/lib/useRequireAuth";

const PAGE_SIZE = 9;

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
};


const STATUS_LABELS: Record<string, string> = {
  "0": "Processing",
  "": "Processing",
};

const STATUS_STYLES: Record<string, string> = {
  "0": "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

function statusLabel(code: string): string {
  return STATUS_LABELS[code] ?? `${code}`;
}

function statusClass(code: string): string {
  return STATUS_STYLES[code] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
}

function sectorLabel(sector?: string): string {
  return (sector || "").replace("/", " → ") || "—";
}

function formatCreatedDate(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString();
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800 align-top">
      <td className="py-3 pr-4">
        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-1.5" />
        <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-8 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-6 w-20 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </td>
    </tr>
  );
}

const BOOKING_STATUS_PATH = "/booking";

export default function MyBookingsPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadBookings(pageNumber: number, signal?: AbortSignal) {
    setLoading(true);
    setLoadError("");
    let res: any;
    try {
      res = await getTransactionHistory({ tabId: 1, pageNumber, pageSize: PAGE_SIZE, signal });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      throw err;
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
    loadBookings(page, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function goToBookingStatus(transactionId?: string | number) {
    if (!transactionId) {
      console.warn("goToBookingStatus called with no transactionId — check the booking object shape.");
      return;
    }
    router.push(`${BOOKING_STATUS_PATH}?txnid=${encodeURIComponent(transactionId)}`);
  }

  if (!ready) return null;

  return (
    <div className="flex-1 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-1 bg-[#f5f8fb]">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-[#FF7626]/10 shrink-0">
            <HiOutlineClipboardDocumentList className="w-5 h-5 text-[#FF7626]" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My bookings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">All your past and upcoming bookings</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-64 shrink-0">
            <AccountSidebar />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              {loading ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                        <th className="py-2 pr-4 font-medium">Reference</th>
                        <th className="py-2 pr-4 font-medium">Traveler</th>
                        <th className="py-2 pr-4 font-medium">Route(s)</th>
                        <th className="py-2 pr-4 font-medium">Booked on</th>
                        <th className="py-2 pr-4 font-medium">Pax</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <SkeletonRow key={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : loadError ? (
                <div>
                  <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 px-4 py-2.5 rounded-xl">
                    {loadError}
                  </p>
                  <button
                    type="button"
                    onClick={() => loadBookings(page)}
                    className="mt-4 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Retry
                  </button>
                </div>
              ) : bookings.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                  You don&apos;t have any bookings yet.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                          <th className="py-2 pr-4 font-medium">Reference</th>
                          <th className="py-2 pr-4 font-medium">Traveler Name</th>
                          <th className="py-2 pr-4 font-medium">Trip Route</th>
                          <th className="py-2 pr-4 font-medium">Booked on</th>
                          <th className="py-2 pr-4 font-medium">Travellers</th>
                          <th className="py-2 pr-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => (
                          <tr
                            key={b.referenceNo || b.transactionId}
                            onClick={() => goToBookingStatus(b.transactionId)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                goToBookingStatus(b.transactionId);
                              }
                            }}
                            className="cursor-pointer border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 align-top"
                          >
                          <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
  {b.referenceNo}
</td>
                            <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{b.travelerName || "—"}</td>
                            <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                              {b.legs.map((leg, i) => (
                                <div key={i} className="whitespace-nowrap">
                                  {sectorLabel(leg.sector)}
                                  <span className="text-gray-400 dark:text-gray-500"> · {leg.date}</span>
                                </div>
                              ))}
                            </td>
                            <td className="py-3 pr-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {formatCreatedDate(b.createdDate)}
                            </td>
                            <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                              {b.totalPax}
                              {(b.chd > 0 || b.inf > 0) && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {" "}
                                  ({b.adt} adt{b.chd ? `, ${b.chd} chd` : ""}
                                  {b.inf ? `, ${b.inf} inf` : ""})
                                </span>
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${statusClass(
                                  b.bookingStatus
                                )}`}
                              >
                                {statusLabel(b.bookingStatus)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {(page > 1 || hasMore) && (
                    <div className="flex items-center justify-between pt-6">
                      <p className="text-xs text-gray-400 dark:text-gray-500">Page {page}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40"
                          aria-label="Previous page"
                        >
                          <HiOutlineChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={!hasMore}
                          onClick={() => setPage((p) => p + 1)}
                          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40"
                          aria-label="Next page"
                        >
                          <HiOutlineChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}