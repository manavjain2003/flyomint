"use client";

import type { Airport, CabinClass, FlightType, SearchCriteria, TripType } from "@/app/components/flights/types";

const LAST_SEARCH_STORAGE_KEY = "flights:lastSearch";
const LAST_SEARCH_MAX_AGE_MS = 24 * 60 * 60 * 1000; 

export type CachedSearch = {
    tripType: TripType;
    flightType: FlightType;
    specialFare: SearchCriteria["specialFare"];
    from: string;
    to: string;
    fromCity: string;
    toCity: string;
    fromAirport: Airport | null;
    toAirport: Airport | null;
    departureDate: string; // ISO yyyy-mm-dd
    returnDate: string | null;
    adults: number;
    children: number;
    infants: number;
    cabinClass: CabinClass;
    savedAt: number;
};

const DEFAULTS: Omit<CachedSearch, "savedAt"> = {
    tripType: "oneway",
    flightType: "all",
    specialFare: "regular",
    from: "",
    to: "",
    fromCity: "",
    toCity: "",
    fromAirport: null,
    toAirport: null,
    departureDate: "",
    returnDate: null,
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: "economy",
};

export function readCachedSearch(): CachedSearch | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(LAST_SEARCH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CachedSearch;
        if (!parsed || typeof parsed.savedAt !== "number") return null;
        if (Date.now() - parsed.savedAt > LAST_SEARCH_MAX_AGE_MS) {
            window.localStorage.removeItem(LAST_SEARCH_STORAGE_KEY);
            return null;
        }
        return parsed;
    } catch (err) {
        console.error("Failed to read cached flight search:", err);
        return null;
    }
}

export function writeCachedSearch(data: Partial<Omit<CachedSearch, "savedAt">>) {
    if (typeof window === "undefined") return;
    try {
        const existing = readCachedSearch();
        const payload: CachedSearch = {
            ...DEFAULTS,
            ...(existing ?? {}),
            ...data,
            savedAt: Date.now(),
        };
        window.localStorage.setItem(LAST_SEARCH_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
        console.error("Failed to cache flight search:", err);
    }
}

export function clearCachedSearch() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(LAST_SEARCH_STORAGE_KEY);
    } catch (err) {
        console.error("Failed to clear cached flight search:", err);
    }
}