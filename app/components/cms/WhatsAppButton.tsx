"use client";

import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";
import { HiPhone } from "react-icons/hi";
import type { SiteBundle } from "@/app/lib/cms/types";

const HIDDEN_PREFIXES = ["/booking", "/paymentfailed", "/bookingstatus", "/flights-results"];

export default function WhatsAppButton({ config }: { config: SiteBundle["whatsapp"] }) {
    const pathname = usePathname() || "/";
    if (!config.enabled || !config.number) return null;
    if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
    if (config.visibility === "selected") {
        const paths = config.selectedPaths.split(/[\n,]+/).map((p) => p.trim()).filter(Boolean);
        if (!paths.includes(pathname)) return null;
    }
    const digits = config.number.replace(/\D/g, "");
    const href = `https://wa.me/${digits}?text=${encodeURIComponent(config.defaultMessage || "")}`;
    return (
        <div className="fixed bottom-5 right-5 z-[54] flex flex-col gap-3 items-end">
            {config.showCallButton && config.callNumber && (
                <a href={`tel:${config.callNumber.replace(/[^+\d]/g, "")}`} aria-label="Call us" className="grid place-items-center w-12 h-12 rounded-full bg-[#1c8fc7] text-white shadow-lg hover:scale-105 transition">
                    <HiPhone className="w-5 h-5" />
                </a>
            )}
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="grid place-items-center w-14 h-14 rounded-full bg-[#25d366] text-white shadow-lg hover:scale-105 transition">
                <FaWhatsapp className="w-7 h-7" />
            </a>
        </div>
    );
}
