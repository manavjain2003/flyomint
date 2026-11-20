"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { safeHref } from "@/app/lib/cms/format";

const KEY = "flyomint_cookie_consent";

export default function CookieConsent({ message, buttonText, policyLink }: { message: string; buttonText: string; policyLink?: string }) {
    const [dismissed, setDismissed] = useState(false);
    // Server snapshot is "accepted" so nothing renders during SSR/hydration; the client reads real storage.
    const stored = useSyncExternalStore(
        () => () => {},
        () => { try { return localStorage.getItem(KEY); } catch { return null; } },
        () => "accepted",
    );

    if (dismissed || stored === "accepted") return null;
    const accept = () => {
        try { localStorage.setItem(KEY, "accepted"); } catch { /* storage unavailable */ }
        setDismissed(true);
    };
    return (
        <div role="dialog" aria-label="Cookie consent" className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-[55] rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl p-4 flex flex-col gap-3">
            <p className="text-[13px] text-gray-600 dark:text-gray-300">
                {message}{" "}
                {policyLink && <Link href={safeHref(policyLink)} className="text-[#1c8fc7] underline">Learn more</Link>}
            </p>
            <button type="button" onClick={accept} className="self-end h-9 px-5 rounded-full bg-[#FF7626] text-white text-sm font-semibold hover:bg-[#e6661f]">
                {buttonText || "Accept"}
            </button>
        </div>
    );
}
