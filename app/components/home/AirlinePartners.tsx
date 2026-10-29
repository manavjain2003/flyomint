"use client";

const AIRLINES = [
    { name: "Qantas", code: "QF" },
    { name: "Delta Air Lines", code: "DL" },
    { name: "United Airlines", code: "UA" },
    { name: "American Airlines", code: "AA" },
    { name: "Air France", code: "AF" },
    { name: "Lufthansa", code: "LH" },
    { name: "British Airways", code: "BA" },
    { name: "Malaysia Airlines", code: "MH" },
    { name: "Cathay Pacific", code: "CX" },
    { name: "Thai Airways", code: "TG" },
];

export default function AirlinePartners() {
    return (
        <section className="bg-dark dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-16 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
                <span className="inline-block rounded-full bg-[#1c8fc7]/10 text-[#1c8fc7] text-xs font-medium px-3 py-1 mb-4">
                    Airline partners
                </span>

                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                    Carriers we fly with.
                </h2>
            </div>

            <div className="relative">
                {/* Edge fade masks */}
              <div
                    className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-white dark:from-gray-900 to-transparent"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-white dark:from-gray-900 to-transparent"
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
        <ul className="flex items-start shrink-0" aria-hidden={ariaHidden}>
            {AIRLINES.map((airline, i) => (
                <li
                    key={`${airline.name}-${i}`}
                    className="flex flex-col items-center gap-3 px-8 sm:px-10 shrink-0"
                >
                    <img
    src={`https://www.gstatic.com/flights/airline_logos/70px/${airline.code}.png`}
    alt={`${airline.name} logo`}
    className="h-10 w-auto object-contain transition-all duration-300"
    loading="lazy"
/>
                    <span className="text-[15px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {airline.name}
                    </span>
                </li>
            ))}
        </ul>
    );
}