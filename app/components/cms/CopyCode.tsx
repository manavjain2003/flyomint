"use client";

import { useState } from "react";

/** Copies an offer's coupon code to the clipboard. */
export default function CopyCode({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* clipboard unavailable (insecure context): the code is still visible to copy by hand */
        }
    };
    return (
        <button
            type="button"
            onClick={copy}
            aria-label={`Copy code ${code}`}
            className="rounded-full border border-dashed border-[#FF7626] px-3 py-1.5 text-xs font-bold tracking-wide text-[#FF7626] hover:bg-[#FF7626]/10 transition-colors"
        >
            {copied ? "Copied!" : code}
        </button>
    );
}
