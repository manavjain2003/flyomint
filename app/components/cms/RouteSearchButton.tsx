"use client";

import { useRouter } from "next/navigation";

type Props = { from: string; to: string; fromCity?: string; toCity?: string; label?: string; className?: string };

const apiDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Deep-links into the booking search. The date is computed on click so cached pages never go stale. */
export default function RouteSearchButton({ from, to, fromCity, toCity, label = "Search flights", className }: Props) {
    const router = useRouter();
    const go = () => {
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
        <button
            type="button"
            onClick={go}
            className={className || "inline-flex h-12 items-center rounded-full bg-[#FF7626] px-8 text-sm font-semibold text-white hover:bg-[#e6661f] transition-colors"}
        >
            {label}
        </button>
    );
}
