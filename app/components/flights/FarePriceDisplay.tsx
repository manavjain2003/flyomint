"use client";

import { type FareInfo } from "@/app/components/flights/types";
import { getDisplayFareValues, formatPrice, formatOffMessage } from "@/app/components/flights/utils";

export default function FarePriceDisplay({
    fare,
    size = "lg",
    subtitle,
}: {
    fare: FareInfo;
    size?: "lg" | "sm";
    subtitle?: string;
}) {
    const { gross, message } = getDisplayFareValues(fare);
    const priceClass = size === "lg" ? "text-xl font-bold" : "text-sm font-bold";

    const offLabel = formatOffMessage(message);
    return (
        <div className="text-right">
            <p className={`${priceClass} text-[#1c8fc7] whitespace-nowrap leading-tight`}>{formatPrice(gross)}</p>
            {offLabel && (
                <span className="inline-block text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 rounded-full px-2 py-0.5 whitespace-nowrap mt-0.5">
                    {offLabel}
                </span>
            )}
            {subtitle && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
    );
}