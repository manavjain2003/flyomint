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
    const { gross, net, message } = getDisplayFareValues(fare);
    const type = fare.FareDisplayType;
    const priceClass = size === "lg" ? "text-xl font-bold" : "text-sm font-bold";

    if (type === "G") {
        return (
            <div className="text-right">
                <p className={`${priceClass} text-[#1c8fc7] whitespace-nowrap leading-tight`}>{formatPrice(gross)}</p>
                {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
            </div>
        );
    }

    if (type === "N") {
        return (
            <div className="text-right">
                <p className={`${priceClass} text-[#1c8fc7] whitespace-nowrap leading-tight`}>{formatPrice(net)}</p>
                {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
            </div>
        );
    }

    if (type === "S") {
        return (
            <div className="text-right">
                <p className="text-xs text-gray-400 line-through whitespace-nowrap leading-tight">
                    {formatPrice(gross)}
                </p>
                <p className={`${priceClass} text-[#1c8fc7] whitespace-nowrap leading-tight`}>{formatPrice(net)}</p>
                {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
            </div>
        );
    }

    /* P — Published fare: Gross + "Extra X Off" */
    const offLabel = formatOffMessage(message);
    return (
        <div className="text-right">
            <p className={`${priceClass} text-[#1c8fc7] whitespace-nowrap leading-tight`}>{formatPrice(gross)}</p>
            {offLabel && (
                <span className="inline-block text-[10px] font-semibold text-green-600 bg-green-50 rounded-full px-2 py-0.5 whitespace-nowrap mt-0.5">
                    {offLabel}
                </span>
            )}
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    );
}