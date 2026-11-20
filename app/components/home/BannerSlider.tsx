"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@/app/lib/cms/browser";
import { isExternal, safeHref } from "@/app/lib/cms/format";
import type { Banner } from "@/app/lib/cms/types";

/** Home banner slider (CMS banners, honouring start/end dates and order on the server). */
export default function BannerSlider({ banners }: { banners: Banner[] }) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const count = banners.length;

    useEffect(() => {
        if (count < 2 || paused) return;
        const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
        return () => clearInterval(t);
    }, [count, paused]);

    if (count === 0) return null;

    return (
        <section
            className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6"
            aria-roledescription="carousel"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="relative overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-800">
                <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
                    {banners.map((b, i) => {
                        const href = b.buttonLink ? safeHref(b.buttonLink) : "";
                        const desktop = b.desktopImage?.url;
                        const mobile = b.mobileImage?.url || desktop;
                        const content = (
                            <div className="relative w-full aspect-[16/9] sm:aspect-[3/1]">
                                {desktop && (
                                    <picture>
                                        {mobile && <source media="(max-width: 639px)" srcSet={mobile} />}
                                        <img src={desktop} alt={b.desktopImage?.alt || b.title} className="absolute inset-0 w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                                    </picture>
                                )}
                                {(b.text || b.buttonLabel) && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent flex flex-col justify-center gap-3 px-6 sm:px-12">
                                        <p className="text-white text-xl sm:text-3xl font-bold max-w-lg">{b.title}</p>
                                        {b.text && <p className="text-white/90 text-sm sm:text-base max-w-md">{b.text}</p>}
                                        {b.buttonLabel && href && (
                                            <span className="self-start rounded-full bg-[#FF7626] text-white text-sm font-semibold px-5 py-2">{b.buttonLabel}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                        const onClick = () => track({ type: "click", refType: "banner", refId: b.id, label: b.title });
                        return (
                            <div key={b.id} className="w-full shrink-0" aria-hidden={i !== index} role="group" aria-roledescription="slide">
                                {href ? (
                                    isExternal(href) ? (
                                        <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} tabIndex={i === index ? 0 : -1}>{content}</a>
                                    ) : (
                                        <Link href={href} onClick={onClick} tabIndex={i === index ? 0 : -1}>{content}</Link>
                                    )
                                ) : (
                                    content
                                )}
                            </div>
                        );
                    })}
                </div>

                {count > 1 && (
                    <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">
                        {banners.map((b, i) => (
                            <button
                                key={b.id}
                                type="button"
                                aria-label={`Go to slide ${i + 1}`}
                                onClick={() => setIndex(i)}
                                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/60"}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
