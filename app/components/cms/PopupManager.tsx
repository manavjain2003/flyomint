"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiX } from "react-icons/hi";
import NewsletterBox from "@/app/components/home/NewsletterBox";
import { track } from "@/app/lib/cms/browser";
import { isExternal, safeHref } from "@/app/lib/cms/format";
import type { Popup } from "@/app/lib/cms/types";

const SEEN_KEY = "flyomint_seen_popups";
const SUPPRESSED = ["/booking", "/flights-results", "/paymentfailed", "/bookingstatus", "/login"];

function readSeen(): string[] {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"); } catch { return []; }
}
function markSeen(id: string) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...readSeen(), id])])); } catch { /* ignore */ }
}

/** Shows at most one CMS popup per visit, honouring trigger, delay, once-per-visitor and mobile settings. */
export default function PopupManager({ popups }: { popups: Popup[] }) {
    const pathname = usePathname() || "/";
    const [active, setActive] = useState<Popup | null>(null);
    const suppressed = SUPPRESSED.some((p) => pathname.startsWith(p));

    useEffect(() => {
        if (suppressed || popups.length === 0) return;
        const isMobile = window.matchMedia("(max-width: 639px)").matches;
        const seen = readSeen();
        const popup = popups.find((p) => (!isMobile || p.showOnMobile) && !(p.oncePerVisitor && seen.includes(p.id)));
        if (!popup) return;

        const show = () => setActive(popup);
        if (popup.trigger === "on-load") { show(); return; }
        if (popup.trigger === "after-delay") {
            const t = setTimeout(show, Math.max(popup.delaySeconds, 0) * 1000);
            return () => clearTimeout(t);
        }
        const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) show(); };
        document.addEventListener("mouseleave", onLeave);
        return () => document.removeEventListener("mouseleave", onLeave);
    }, [popups, suppressed]);

    if (!active || suppressed) return null;

    const close = () => { markSeen(active.id); setActive(null); };
    const href = active.buttonLink ? safeHref(active.buttonLink) : "";
    const btn = "inline-flex h-11 items-center rounded-full bg-[#FF7626] px-7 text-sm font-semibold text-white hover:bg-[#e6661f]";

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} aria-hidden />
            <div role="dialog" aria-modal="true" aria-label={active.title || active.name} className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
                <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-gray-700 shadow">
                    <HiX className="h-4 w-4" />
                </button>
                {active.image?.url && (
                    <img src={active.image.url} alt={active.image.alt || ""} className="w-full max-h-56 object-cover" />
                )}
                <div className="p-6 flex flex-col gap-3">
                    {active.title && <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{active.title}</h2>}
                    {active.text && <p className="text-sm text-gray-600 dark:text-gray-300">{active.text}</p>}
                    {active.kind === "newsletter" ? (
                        <NewsletterBox compact />
                    ) : (
                        active.buttonLabel && href && (
                            isExternal(href)
                                ? <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => { track({ type: "click", refType: "banner", refId: active.id, label: active.name }); close(); }} className={btn}>{active.buttonLabel}</a>
                                : <Link href={href} onClick={() => { track({ type: "click", refType: "banner", refId: active.id, label: active.name }); close(); }} className={btn}>{active.buttonLabel}</Link>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
