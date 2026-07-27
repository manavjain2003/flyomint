"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FlightResults from "@/app/components/flights/FlightResults";
import ReviewBooking from "@/app/components/booking/ReviewBooking";

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
            from={from}
            to={to}
            fromCity={params.get("fromCity") || from}
            toCity={params.get("toCity") || to}
            departureDate={departureDate}
            returnDate={returnDateParam ? new Date(returnDateParam) : null}
            tripType={tripType}
            adults={adults}
            children={childrenCount}
            infants={infants}
            cabinClass={cabinClass}
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