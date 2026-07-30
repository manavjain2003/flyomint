"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FlightResults from "@/app/components/flights/FlightResults";
import ReviewBooking from "@/app/components/booking/ReviewBooking";
import { readCachedSearch } from "@/app/components/flights/searchCache";

function toApiDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function FlightResultsPage() {
    const router = useRouter();
    const params = useSearchParams();
    const [reviewPayload, setReviewPayload] = useState<any>(null);

    const from = params.get("from") || "";
    const to = params.get("to") || "";
    const departureDate = new Date(params.get("departureDate") || "");
    const returnDateParam = params.get("returnDate");
    const tripType = (params.get("tripType") as "oneway" | "roundtrip") || "oneway";
    const adults = Number(params.get("adults") || 1);
    const childrenCount = Number(params.get("children") || 0);
    const infants = Number(params.get("infants") || 0);
    const cabinClass = (params.get("cabinClass") as any) || "economy";
    const specialFare = (params.get("specialFare") as any) || "regular";

    // The URL only carries plain codes/city names (kept short and
    // shareable). The full Airport record — which is what has StateName —
    // lives in the search cache Home/ModifySearchPanel already write to.
    // Pull it from there for display purposes, but only trust it when the
    // cached from/to codes still match the URL, so a stale or unrelated
    // cache entry never gets attributed to a different route.
    const cachedSearch = readCachedSearch();
    const fromAirport = cachedSearch && cachedSearch.from === from ? cachedSearch.fromAirport : null;
    const toAirport = cachedSearch && cachedSearch.to === to ? cachedSearch.toAirport : null;

    if (reviewPayload) {
        return (
            <ReviewBooking
                from={from}
                to={to}
                tripType={tripType}
                onward={reviewPayload.onward}
                ret={reviewPayload.ret}
                adults={adults}
                children={childrenCount}
                infants={infants}
                cabinClass={cabinClass}
                tokenId={reviewPayload.tokenId}
                bookingId={reviewPayload.bookingId}
                index={reviewPayload.index}
                onBack={() => setReviewPayload(null)}
                onContinueToPayment={(data) => {
                    console.log("Proceeding to payment with", data);
                }}
            />
        );
    }

    return (
        <FlightResults
            // Remounting on every distinct search (instead of letting React
            // reuse the previous instance) is what guarantees the results
            // page always reflects exactly one search. Without this key,
            // FlightResults' internal `criteria`/`selectedDate`/`returnDate`
            // state (seeded from props via useState(() => ...) only once)
            // never re-derives when new query params arrive for the same
            // route — e.g. after Next.js reuses the page instance on
            // back/forward navigation or a repeated push to /flights-results.
            // That's what produced the "mixed" results (some parts showing
            // the new search, some parts still showing the previous one).
            key={params.toString()}
            from={from}
            to={to}
            fromCity={params.get("fromCity") || from}
            toCity={params.get("toCity") || to}
            fromAirport={fromAirport}
            toAirport={toAirport}
            departureDate={departureDate}
            returnDate={returnDateParam ? new Date(returnDateParam) : null}
            tripType={tripType}
            adults={adults}
            children={childrenCount}
            infants={infants}
            cabinClass={cabinClass}
            specialFare={specialFare}
            directOnly={params.get("direct") === "1"}
            onModifySearch={(newCriteria, newDeparture, newReturn) => {
                const p = new URLSearchParams({
                    from: newCriteria.from,
                    to: newCriteria.to,
                    fromCity: newCriteria.fromCity,
                    toCity: newCriteria.toCity,
                    departureDate: toApiDate(newDeparture),
                    tripType: newCriteria.tripType,
                    adults: String(newCriteria.adults),
                    children: String(newCriteria.children),
                    infants: String(newCriteria.infants),
                    cabinClass: newCriteria.cabinClass,
                    specialFare: newCriteria.specialFare,
                    direct: newCriteria.directOnly ? "1" : "0",
                });
                if (newReturn) p.set("returnDate", toApiDate(newReturn));
                router.replace(`/flights-results?${p.toString()}`);
            }}
            onReviewBooking={(payload) => {
                if (payload.onward) setReviewPayload(payload);
            }}
        />
    );
}