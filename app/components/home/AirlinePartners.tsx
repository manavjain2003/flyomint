import Link from "next/link";
import type { Airline } from "@/app/lib/cms/types";

type Props = { airlines: Airline[]; heading?: string; text?: string };

/** Airline marquee from CMS airlines. Falls back to the public logo CDN when no logo was uploaded. */
export default function AirlinePartners({ airlines, heading, text }: Props) {
    if (airlines.length === 0) return null;
    return (
        <section className="bg-dark dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-16 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
                <span className="inline-block rounded-full bg-[#1c8fc7]/10 text-[#1c8fc7] text-xs font-medium px-3 py-1 mb-4">Airline partners</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{heading || "Carriers we fly with."}</h2>
                {text && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">{text}</p>}
            </div>

            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-white dark:from-gray-900 to-transparent" aria-hidden />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-white dark:from-gray-900 to-transparent" aria-hidden />
                <div className="cms-marquee flex w-max">
                    <AirlineList airlines={airlines} />
                    <AirlineList airlines={airlines} hidden />
                </div>
            </div>

            <style>{`
                .cms-marquee { animation: cms-marquee-scroll 28s linear infinite; }
                .cms-marquee:hover { animation-play-state: paused; }
                @keyframes cms-marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                @media (prefers-reduced-motion: reduce) { .cms-marquee { animation: none; } }
            `}</style>
        </section>
    );
}

function AirlineList({ airlines, hidden }: { airlines: Airline[]; hidden?: boolean }) {
    return (
        <ul className="flex items-start shrink-0" aria-hidden={hidden}>
            {airlines.map((a) => (
                <li key={`${a.id}`} className="shrink-0">
                    <Link href={`/airlines/${a.slug}`} tabIndex={hidden ? -1 : undefined} className="flex flex-col items-center gap-3 px-8 sm:px-10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={a.logo?.url || `https://www.gstatic.com/flights/airline_logos/70px/${a.code}.png`}
                            alt={a.logo?.alt || `${a.name} logo`}
                            className="h-10 w-auto object-contain"
                            loading="lazy"
                        />
                        <span className="text-[15px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{a.name}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
