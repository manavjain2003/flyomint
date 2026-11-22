"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@/app/lib/cms/browser";
import { isExternal, safeHref } from "@/app/lib/cms/format";
import type { Banner } from "@/app/lib/cms/types";

/** Autoplay index shared by the backdrop and the text so both stay in sync. */
export function useBannerIndex(count: number, intervalMs = 6000) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    useEffect(() => {
        if (count < 2 || paused) return;
        const t = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
        return () => clearInterval(t);
    }, [count, paused, intervalMs]);
    return { index: count ? index % count : 0, setIndex, setPaused };
}

/** Full-bleed CMS banner images behind the search card (cross-fade). */
export function BannerBackdrop({ banners, index }: { banners: Banner[]; index: number }) {
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#0b1b2e]" aria-hidden>
            {banners.map((b, i) => {
                const desktop = b.desktopImage?.url;
                const mobile = b.mobileImage?.url || desktop;
                if (!desktop) return null;
                return (
                    <picture key={b.id}>
                        {mobile && <source media="(max-width: 639px)" srcSet={mobile} />}
                        <img
                            src={desktop}
                            alt=""
                            loading={i === 0 ? "eager" : "lazy"}
                            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"}`}
                        />
                    </picture>
                );
            })}
            {/* legibility: dark on the left where the copy sits, soft fade at the bottom */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/5" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
    );
}

/** Title / text / button of the active banner, plus slide dots. Sits in the strip above the search card. */
export function BannerCopy({
    banners, index, onSelect, onPause,
}: { banners: Banner[]; index: number; onSelect: (i: number) => void; onPause: (p: boolean) => void }) {
    const b = banners[index];
    if (!b) return null;
    const href = b.buttonLink ? safeHref(b.buttonLink) : "";
    const hasLink = href && href !== "#";
    const cta = "inline-flex h-11 items-center rounded-full bg-[#FF7626] px-7 text-sm font-semibold text-white shadow-lg hover:bg-[#e6661f] transition-colors";
    const onClick = () => track({ type: "click", refType: "banner", refId: b.id, label: b.title });

    return (
        <div
            className="relative flex h-full flex-col justify-center"
            onMouseEnter={() => onPause(true)}
            onMouseLeave={() => onPause(false)}
        >
            <div key={b.id} className="max-w-xl animate-[heroCopyIn_.6s_ease-out]">
                {b.title && <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight text-white drop-shadow-lg">{b.title}</h2>}
                {b.text && <p className="mt-3 text-sm sm:text-lg text-white/90 drop-shadow">{b.text}</p>}
                {hasLink && (
                    <div className="mt-5">
                        {isExternal(href)
                            ? <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cta}>{b.buttonLabel || "Learn more"}</a>
                            : <Link href={href} onClick={onClick} className={cta}>{b.buttonLabel || "Learn more"}</Link>}
                    </div>
                )}
            </div>
            {banners.length > 1 && (
                <div className="absolute bottom-0 left-0 flex gap-2 pb-1">
                    {banners.map((x, i) => (
                        <button
                            key={x.id}
                            type="button"
                            aria-label={`Show banner ${i + 1}`}
                            onClick={() => onSelect(i)}
                            className={`h-2 rounded-full transition-all ${i === index ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                        />
                    ))}
                </div>
            )}
            <style>{`@keyframes heroCopyIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){[class*="heroCopyIn"]{animation:none!important}}`}</style>
        </div>
    );
}
