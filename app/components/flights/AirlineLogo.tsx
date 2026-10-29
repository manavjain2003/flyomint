"use client";

import { useState } from "react";
import { getAirlineLogo } from "@/app/components/flights/utils";

export default function AirlineLogo({
    seg,
    code,
    className = "w-9 h-9",
}: {
    seg?: { VACLogo?: string; MACLogo?: string; OACLogo?: string };
    code?: string;
    className?: string;
}) {
    const [failed, setFailed] = useState(false);
    const logoUrl = getAirlineLogo(seg);

    if (!logoUrl || failed) {
        return (
            <div className={`${className} rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center justify-center shrink-0`}>
                {code}
            </div>
        );
    }

    return (
        <div className={`${className} rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden`}>
            <img
                src={logoUrl}
                alt={code || "airline logo"}
                className="w-full h-full object-contain p-1"
                onError={() => setFailed(true)}
            />
        </div>
    );
}