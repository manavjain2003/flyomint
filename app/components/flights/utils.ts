import {
    type FareInfo,
    type Journey,
    type JourneyPair,
    type TimeSlot,
    type Filters,
    type Airport,
    type PTCFareEntry,
    type CabinClass,
    type SpecialFare,
} from "./types";

export const SPECIAL_FARE_LABEL: Record<SpecialFare, string> = {
    regular: "Regular",
    student: "Student",
    senior: "Senior Citizen",
    armed: "Armed Forces",
};

export const SPECIAL_FARE_SAVE: Partial<Record<SpecialFare, string>> = {
    student: "Save 10%",
    senior: "Save 10%",
    armed: "Save 10%",
};

export const CABIN_CODE: Record<CabinClass, string> = {
    economy: "E",
    premium: "PE",
    business: "B",
    first: "F",
};

export const PTC_LABEL: Record<string, string> = {
    A: "Adult",
    C: "Child",
    I: "Infant",
};

export const CABIN_LABEL: Record<CabinClass, string> = {
    economy: "Economy",
    premium: "Premium Economy",
    business: "Business",
    first: "First Class",
};

export const TIME_SLOT_LABEL: Record<TimeSlot, string> = {
    early: "Before 6 AM",
    morning: "6 AM – 12 PM",
    afternoon: "12 PM – 6 PM",
    evening: "After 6 PM",
};

export const EMPTY_FILTERS: Filters = {
    maxPrice: null,
    stops: new Set(),
    airlines: new Set(),
    timeSlots: new Set(),
};

export const PROMOS = [
    { title: "Weekend Getaway — ₹300 off", subtitle: "Book by Friday, fly Sat-Sun. ₹300 off." },
    { title: "5% cashback on UPI", subtitle: "Pay with any UPI app and get 5%..." },
    { title: "10% off International Round Trips", subtitle: "Planning a holiday abroad? Get 10%..." },
    { title: "First Booking — ₹500 off", subtitle: "Flat ₹500 off on your first flight..." },
];

export function toApiDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
export function roundPrice(amount: number): number {
    return Math.round(amount);
}

export function formatTime(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDayLabel(d: Date) {
    return {
        dow: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
        day: d.getDate(),
        mon: d.toLocaleDateString("en-US", { month: "short" }),
    };
}

export function formatPrice(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatAirportLocation(airport: Airport) {
    return `${airport.CityName} (${airport.AirportCode}), ${airport.CountryName}`;
}

/**
 * "CODE - City, State" (or just "CODE - City" when there's no distinct
 * state, or bare "CODE" when we don't have the full Airport record at all).
 * Shared so ModifySearchPanel and FlightResults render airports identically
 * instead of each keeping their own slightly different formatting.
 */
export function formatAirportCodeLabel(code: string, city: string, airport?: Airport | null) {
    if (!code) return "";
    if (airport?.StateName && airport.StateName !== airport.CityName) {
        return `${code} - ${city}, ${airport.StateName}`;
    }
    if (city) return `${code} - ${city}`;
    return code;
}

export function getAirlineLogo(seg?: { VACLogo?: string; MACLogo?: string; OACLogo?: string }) {
    const file = seg?.VACLogo || seg?.MACLogo || seg?.OACLogo;
    if (!file) return null;
    const base = process.env.NEXT_PUBLIC_BASE_IMAGE_URL || "";
    return `${base}${file}`;
}

export function getAdtPtcFare(fare: FareInfo): PTCFareEntry | null {
    if (!fare.PTCFare || fare.PTCFare.length === 0) return null;
    return fare.PTCFare.find((p) => p.PTC === "ADT") ?? null;
}

export function getDisplayFareValues(fare: FareInfo) {
    const adt = getAdtPtcFare(fare);
    return {
        gross: Math.round(adt?.GrossFare ?? fare.GrossFare),
        net: Math.round(adt?.NetFare ?? fare.NetFare),
        message: adt?.FareMessage,
    };
}

export function formatOffMessage(message?: string) {
    if (!message) return null;
    return message.replace(/[\d,.]+/, (m) => formatPrice(Math.round(Number(m.replace(/,/g, "")))));
}
export function primaryFareAmount(fare: FareInfo): number {
    const { gross, net } = getDisplayFareValues(fare);
    // P = Published fare → show Gross
    // G = Published fare without Discount → show Gross
    // S = Strike Thru fare → show Net (with Gross struck through)
    // N = Display fare with Discount → show Net
   return fare.FareDisplayType === "G" || fare.FareDisplayType === "P" ? gross : net;
 }

export function cheapestFare(journey: Journey): FareInfo | undefined {
    if (!journey.FareInfo || journey.FareInfo.length === 0) return undefined;
    return [...journey.FareInfo].sort((a, b) => primaryFareAmount(a) - primaryFareAmount(b))[0];
}
export function totalFareForTravelers(fare: FareInfo, travelerCounts?: TravelerCounts): number {
    if (!fare.PTCFare || fare.PTCFare.length === 0 || !travelerCounts) {
        return primaryFareAmount(fare);
    }
    const countFor: Record<string, number> = {
        ADT: travelerCounts.adults,
        CHD: travelerCounts.children,
        INF: travelerCounts.infants,
    };
    return fare.PTCFare.reduce((sum, p) => {
        const count = countFor[p.PTC] ?? 0;
        const amount = fare.FareDisplayType === "G" ? p.GrossFare : p.NetFare;
        return sum + amount * count;
    }, 0);
}
export function getTimeSlot(iso: string): TimeSlot {
    const hour = new Date(iso).getHours();
    if (hour < 6) return "early";
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
}

export function journeyPasses(journey: Journey, filters: Filters): boolean {
    const fare = cheapestFare(journey);
    if (!fare) return false;
    if (filters.maxPrice != null && primaryFareAmount(fare) > filters.maxPrice) return false;
    if (filters.stops.size > 0 && !filters.stops.has(journey.Stops)) return false;
    const firstSeg = journey.Segments[0];
    if (filters.airlines.size > 0 && firstSeg && !filters.airlines.has(firstSeg.AirlineCode)) return false;
    if (filters.timeSlots.size > 0 && !filters.timeSlots.has(getTimeSlot(journey.DepartureDateTime))) return false;
    return true;
}

export function pairPasses(pair: JourneyPair, filters: Filters): boolean {
    const totalFare = primaryFareAmount(pair.onwardFare) + primaryFareAmount(pair.retFare);
    if (filters.maxPrice != null && totalFare > filters.maxPrice) return false;
    if (filters.stops.size > 0 && !filters.stops.has(pair.onward.Stops)) return false;
    const firstSeg = pair.onward.Segments[0];
    if (filters.airlines.size > 0 && firstSeg && !filters.airlines.has(firstSeg.AirlineCode)) return false;
    if (filters.timeSlots.size > 0 && !filters.timeSlots.has(getTimeSlot(pair.onward.DepartureDateTime))) return false;
    return true;
}

export function toggleSetValue<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
}