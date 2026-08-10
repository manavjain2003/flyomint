"use client";

import { type Filters } from "./types";
import { formatPrice, toggleSetValue } from "./utils";

export default function FilterSidebar({
    filters,
    setFilters,
    setPriceTouched,
    options,
    onClear,
}: {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    setPriceTouched: (v: boolean) => void;
    options: {
        minPrice: number;
        maxPrice: number;
        stops: { stops: number; price: number }[];
        airlines: { code: string; name: string; price: number }[];
    };
    onClear: () => void;
}) {
    const stopLabel = (stops: number) => (stops === 0 ? "Non Stop" : `${stops} Stop${stops > 1 ? "s" : ""}`);

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Filters</h3>
                <button type="button" onClick={onClear} className="text-xs font-semibold text-[#1c8fc7]">
                    Clear All
                </button>
            </div>

            {/* Price Range */}
            <div className="mb-5">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price Range</p>
                <input
                    type="range"
                    min={options.minPrice}
                    max={Math.max(options.maxPrice, options.minPrice + 1)}
                    value={filters.maxPrice ?? options.maxPrice}
                    onChange={(e) => {
                        setPriceTouched(true);
                        setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }));
                    }}
                    className="w-full"
                    style={{ accentColor: "#1c8fc7" }}
                />
                <div className="flex items-center justify-between text-xs font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    <span>{formatPrice(options.minPrice)}</span>
                    <span>{formatPrice(filters.maxPrice ?? options.maxPrice)}</span>
                </div>
            </div>

            {/* Stops */}
            <div className="mb-5">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Stops</p>
                <div className="space-y-2">
                    {options.stops.map(({ stops, price }) => (
                        <label key={stops} className="flex items-center justify-between text-sm cursor-pointer">
                            <span className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={filters.stops.has(stops)}
                                    onChange={() =>
                                        setFilters((f) => ({ ...f, stops: toggleSetValue(f.stops, stops) }))
                                    }
                                    className="accent-[#1c8fc7]"
                                />
                                <span className="text-gray-700 dark:text-gray-300">{stopLabel(stops)}</span>
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">{formatPrice(price)}</span>
                        </label>
                    ))}
                    {options.stops.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500">No options yet</p>}
                </div>
            </div>

            {/* Airlines */}
            <div className="mb-5">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Airlines</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {options.airlines.map(({ code, name, price }) => (
                        <label key={code} className="flex items-center justify-between text-sm cursor-pointer">
                            <span className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={filters.airlines.has(code)}
                                    onChange={() =>
                                        setFilters((f) => ({ ...f, airlines: toggleSetValue(f.airlines, code) }))
                                    }
                                    className="accent-[#1c8fc7]"
                                />
                                <span className="text-gray-700 dark:text-gray-300 truncate">{name}</span>
                            </span>
                            <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap">{formatPrice(price)}</span>
                        </label>
                    ))}
                    {options.airlines.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500">No options yet</p>}
                </div>
            </div>

            {/* Departure Time */}
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Departure Time</p>
                <div className="space-y-2">
                    {(["early", "morning", "afternoon", "evening"] as const).map((slot) => (
                        <label key={slot} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.timeSlots.has(slot)}
                                onChange={() =>
                                    setFilters((f) => ({ ...f, timeSlots: toggleSetValue(f.timeSlots, slot) }))
                                }
                                className="accent-[#1c8fc7]"
                            />
                            <span className="text-gray-700 dark:text-gray-300">
                                {slot === "early" && "Before 6 AM"}
                                {slot === "morning" && "6 AM – 12 PM"}
                                {slot === "afternoon" && "12 PM – 6 PM"}
                                {slot === "evening" && "After 6 PM"}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}