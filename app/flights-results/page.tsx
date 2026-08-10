"use client";

import { useEffect, useMemo, useState } from "react";
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

function getSearchKey(params: URLSearchParams) {
  return [
    params.get("from"),
    params.get("to"),
    params.get("departureDate"),
    params.get("returnDate"),
    params.get("tripType"),
    params.get("adults"),
    params.get("children"),
    params.get("infants"),
    params.get("cabinClass"),
  ].join("|");
}

const REVIEW_KEY = "flyomint_review_payload";
const BOOKING_KEY = "flyomint_booking_data";

export default function FlightResultsPage() {
  const router = useRouter();
  const params = useSearchParams();

  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const fromCityParam = params.get("fromCity") || "";
  const toCityParam = params.get("toCity") || "";
  const departureDate = new Date(params.get("departureDate") || "");
  const returnDateParam = params.get("returnDate");
  const tripType = (params.get("tripType") as "oneway" | "roundtrip") || "oneway";
  const adults = Number(params.get("adults") || 1);
  const childrenCount = Number(params.get("children") || 0);
  const infants = Number(params.get("infants") || 0);
  const cabinClass = (params.get("cabinClass") as any) || "economy";
  const specialFare = (params.get("specialFare") as any) || "regular";

  const urlStep = params.get("bookingStep") as "review" | "addons" | null;

  const searchKey = getSearchKey(params);

  const [cachedSearch, setCachedSearch] = useState<ReturnType<typeof readCachedSearch> | null>(null);

  useEffect(() => {
    // Re-read on every new search (not just on mount) — otherwise, after
    // "Modify Search" does a client-side navigation to a new `to`/`from`,
    // this would keep showing the previous search's cached city names
    // paired with the new airport codes.
    setCachedSearch(readCachedSearch());
  }, [searchKey]);

  // Guard against a stale cached city name ever being paired with a
  // different airport code (e.g. cache write hasn't landed yet). The URL
  // params (set by both the home search and Modify Search) are always
  // fresh, so prefer them; fall back to the cache only if a param is missing
  // (e.g. someone opened a flights-results link without those params).
  const fromCity = fromCityParam || (cachedSearch && cachedSearch.from === from ? cachedSearch.fromCity : undefined);
  const toCity = toCityParam || (cachedSearch && cachedSearch.to === to ? cachedSearch.toCity : undefined);
  const fromAirport = cachedSearch && cachedSearch.from === from ? cachedSearch.fromAirport : null;
  const toAirport = cachedSearch && cachedSearch.to === to ? cachedSearch.toAirport : null;

  const [reviewPayload, setReviewPayload] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    try {
      const storedKey = sessionStorage.getItem("flyomint_search_key");
      if (storedKey === searchKey) {
        const rp = sessionStorage.getItem(REVIEW_KEY);
        const bd = sessionStorage.getItem(BOOKING_KEY);
        if (rp) setReviewPayload(JSON.parse(rp));
        if (bd) setBookingData(JSON.parse(bd));
      } else {
        sessionStorage.removeItem("flyomint_search_key");
        sessionStorage.removeItem(REVIEW_KEY);
        sessionStorage.removeItem(BOOKING_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [searchKey]);

  function goToReview(payload: any) {
    setReviewPayload(payload);
    try {
      sessionStorage.setItem("flyomint_search_key", searchKey);
      sessionStorage.setItem(REVIEW_KEY, JSON.stringify(payload));
    } catch { /* ignore */ }
    const p = new URLSearchParams(params.toString());
    p.set("bookingStep", "review");
    router.replace(`/flights-results?${p.toString()}`, { scroll: false });
  }

  function goToAddons(data: any) {
    setBookingData(data);
    try {
      sessionStorage.setItem("flyomint_search_key", searchKey);
      sessionStorage.setItem(BOOKING_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
    const p = new URLSearchParams(params.toString());
    p.set("bookingStep", "addons");
    router.replace(`/flights-results?${p.toString()}`, { scroll: false });
  }

  function goToResults() {
    setReviewPayload(null);
    setBookingData(null);
    try {
      sessionStorage.removeItem("flyomint_search_key");
      sessionStorage.removeItem(REVIEW_KEY);
      sessionStorage.removeItem(BOOKING_KEY);
    } catch { /* ignore */ }
    const p = new URLSearchParams(params.toString());
    p.delete("bookingStep");
    router.replace(`/flights-results?${p.toString()}`, { scroll: false });
  }

  if (urlStep === "addons" && reviewPayload && bookingData) {
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
        bookingId={bookingData.bookingId || reviewPayload.bookingId}
        passengers={passengersForAddOns}
        tripSummary={{
          from: reviewPayload.onward?.journey?.From || from,
          to: reviewPayload.onward?.journey?.To || to,
          date: reviewPayload.onward?.journey?.DepartureDateTime || "",
          isRoundtrip: tripType === "roundtrip",
        }}
        baseFareTotal={
          (reviewPayload.onward?.fare?.GrossFare || 0) +
          (reviewPayload.ret?.fare?.GrossFare || 0)
        }
        onBack={goToResults}
        onContinue={(addOnData) => {
          console.log("Proceed to payment", { bookingData, addOnData });
        }}
      />
    );
  }

  if (urlStep === "review" && reviewPayload) {
    return (
      <ReviewBooking
        from={from}
        to={to}
        tripType={tripType}
        onward={reviewPayload.onward}
        ret={reviewPayload.ret || undefined}
        adults={adults}
        children={childrenCount}
        infants={infants}
        cabinClass={cabinClass}
        tokenId={reviewPayload.tokenId}
        bookingId={reviewPayload.bookingId}
        index={reviewPayload.index}
        searchType={reviewPayload.searchType || (tripType === "roundtrip" ? "R" : "O")}
        onBack={goToResults}
        onContinue={goToAddons}
      />
    );
  }

  // ─── Search results step ───
  return (
    <FlightResults
      from={from}
      to={to}
      fromCity={fromCity}
      toCity={toCity}
      departureDate={departureDate}
      returnDate={returnDateParam ? new Date(returnDateParam) : null}
      tripType={tripType}
      fromAirport={fromAirport}
      toAirport={toAirport}
      adults={adults}
      children={childrenCount}
      infants={infants}
      cabinClass={cabinClass}
      specialFare={specialFare}
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
        if (payload.onward) goToReview(payload);
      }}
    />
  );
}