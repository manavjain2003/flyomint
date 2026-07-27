"use client";

const AIRLINES: string[] = [
    "Qantas",
    "Delta Air Lines",
    "United Airlines",
    "American Airlines",
    "Air France",
    "Lufthansa",
    "British Airways",
    "Malaysia Airlines",
    "Cathay Pacific",
    "Thai Airways",
];

export default function AirlinePartners() {
    return (
        <section className="bg-[#f5f8fb] py-16 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
                <span className="inline-block rounded-full bg-[#1c8fc7]/10 text-[#1c8fc7] text-xs font-medium px-3 py-1 mb-4">
                    Airline partners
                </span>

                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                    Carriers we fly with.
                </h2>
            </div>

            <div className="relative">
                {/* Edge fade masks */}
                <div
                    className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-[#f5f8fb] to-transparent"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-[#f5f8fb] to-transparent"
                    aria-hidden
                />

                <div className="marquee-track flex w-max">
                    <AirlineList />
                    <AirlineList aria-hidden />
                </div>
            </div>

            <style jsx>{`
                .marquee-track {
                    animation: marquee-scroll 28s linear infinite;
                }

                .marquee-track:hover {
                    animation-play-state: paused;
                }

                @keyframes marquee-scroll {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .marquee-track {
                        animation: none;
                    }
                }
            `}</style>
        </section>
    );
}

function AirlineList({ "aria-hidden": ariaHidden }: { "aria-hidden"?: boolean }) {
    return (
        <ul
            className="flex items-start shrink-0"
            aria-hidden={ariaHidden}
        >
            {AIRLINES.map((name, i) => (
                <li
                    key={`${name}-${i}`}
                    className="flex flex-col items-center gap-2 px-8 sm:px-10 shrink-0"
                >
                    <span className="text-[15px] font-semibold text-gray-700 whitespace-nowrap">
                        {name}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{name}</span>
                </li>
            ))}
        </ul>
    );
}