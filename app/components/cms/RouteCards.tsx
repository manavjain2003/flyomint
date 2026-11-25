"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MdFlight } from "react-icons/md";
import { formatFare } from "@/app/lib/cms/format";
import type { RouteCard, SiteTheme } from "@/app/lib/cms/types";

const apiDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type Endpoints = { from?: string; to?: string; fromCity?: string; toCity?: string };

/** A card that runs a flight search for the route. The date is picked on click so cached pages never go stale. */
export function SearchCard({ from, to, fromCity, toCity, className, children }: Endpoints & { className?: string; children: ReactNode }) {
    const router = useRouter();
    const go = () => {
        if (!from || !to) return;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const params = new URLSearchParams({
            from, to,
            fromCity: fromCity || from,
            toCity: toCity || to,
            departureDate: apiDate(tomorrow),
            tripType: "oneway",
            adults: "1", children: "0", infants: "0",
            cabinClass: "economy",
            specialFare: "regular",
            direct: "0",
        });
        router.push(`/flights-results?${params.toString()}`);
    };
    return (
        <button type="button" onClick={go} className={`text-left w-full ${className ?? ""}`}>
            {children}
        </button>
    );
}

export default function RouteCards({ routes, theme }: { routes: RouteCard[]; theme?: SiteTheme | null }) {
    if (routes.length === 0) return null;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {routes.map((r) => (
                <SearchCard
                    key={r.id}
                    from={r.from.code}
                    to={r.to.code}
                    fromCity={r.from.name}
                    toCity={r.to.name}
                    className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-shadow"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <span className="grid place-items-center w-9 h-9 rounded-full bg-[#eaf4fb] dark:bg-sky-500/15"><MdFlight className="w-4 h-4 text-[#1c8fc7] rotate-90" /></span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{r.type}</span>
                    </div>
                    <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#1c8fc7] transition-colors">
                        {r.from.name} <span className="text-gray-400 dark:text-gray-500">→</span> {r.to.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.from.code} – {r.to.code}</p>
                    {r.fare !== null && (
                        <p className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                            {theme?.fareLabel || "Starting from"} <span className="block text-lg font-bold text-[#FF7626]">{formatFare(r.fare, theme)}</span>
                        </p>
                    )}
                </SearchCard>
            ))}
        </div>
    );
}
