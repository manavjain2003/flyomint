"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FlightResults from "@/app/components/flights/FlightResults";
import ReviewBooking from "@/app/components/booking/ReviewBooking";
import FlightAddOns, { type AddOnPassenger } from "@/app/components/booking/FlightAddOns";
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

    const [step, setStep] = useState<"results" | "review" | "addons">("results");
    const [reviewPayload, setReviewPayload] = useState<any>(null);
    const [bookingData, setBookingData] = useState<any>(null);

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

    const cachedSearch = readCachedSearch();
    const fromAirport = cachedSearch && cachedSearch.from === from ? cachedSearch.fromAirport : null;
    const toAirport = cachedSearch && cachedSearch.to === to ? cachedSearch.toAirport : null;

    // ─── Add-Ons step ───
    if (step === "addons" && reviewPayload && bookingData) {
        const passengersForAddOns: AddOnPassenger[] = bookingData.passengers.map(
            (p: any, i: number) => {
                const type: "ADT" | "CHD" | "INF" =
                    p.type ||
                    p.passengerType ||
                    (i >= adults + childrenCount ? "INF" : i >= adults ? "CHD" : "ADT");
                return {
                    id: p.id || `${type}-${i}`,
                    label:
                        [p.title, p.firstName, p.lastName].filter(Boolean).join(" ") ||
                        `${type === "INF" ? "Infant" : type === "CHD" ? "Child" : "Adult"} ${i + 1}`,
                    type,
                };
            }
        );

        return (
          <FlightAddOns
    tokenId={reviewPayload.tokenId}
    bookingId={bookingData.bookingId ?? reviewPayload.bookingId}
                passengers={passengersForAddOns}
                tripSummary={{
                    from,
                    to,
                    date: departureDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    }),
                    isRoundtrip: tripType === "roundtrip",
                }}
                baseFareTotal={bookingData.totalAmount}
                onBack={() => setStep("review")}
                onContinue={(addOnData) => {
                    // TODO: wire to payment / PNR creation
                    console.log("Proceed to payment", { bookingData, addOnData });
                }}
            />
        );
    }

    // ─── Review step ───
    if (step === "review" && reviewPayload) {
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
                onBack={() => {
                    setReviewPayload(null);
                    setStep("results");
                }}
              onContinue={(data) => {
    setBookingData(data);
    setStep("addons");
}}
            />
        );
    }

    // ─── Search results step ───
    return (
        <FlightResults
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
                if (payload.onward) {
                    setReviewPayload(payload);
                    setStep("review");
                }
            }}
        />
    );
}