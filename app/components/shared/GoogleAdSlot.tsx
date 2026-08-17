"use client";

type AdImage = {
    src: string;
    alt: string;
    href?: string;
};

type GoogleAdSlotProps = {
    width?: number;
    imageHeight?: number;
    label?: string;
    className?: string;
    images?: AdImage[];
};

const DEFAULT_ADS: AdImage[] = [
    {
        src: "https://picsum.photos/seed/flightad1/300/250",
        alt: "Sponsored offer",
        href: "#",
    },
    {
        src: "https://picsum.photos/seed/flightad2/300/250",
        alt: "Sponsored offer",
        href: "#",
    },
    {
        src: "https://picsum.photos/seed/flightad3/300/250",
        alt: "Sponsored offer",
        href: "#",
    },
];

export default function GoogleAdSlot({
    width = 300,
    imageHeight = 250,
    label = "Advertisement",
    className = "",
    images = DEFAULT_ADS,
}: GoogleAdSlotProps) {
    return (
        <div
            className={`sticky top-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden ${className}`}
            style={{ width }}
        >
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                {images.map((ad, i) => (
                    <div key={i} className="relative mb-4">
                        <span className="absolute top-2 left-2 z-10 text-[9px] font-medium tracking-wide text-white/90 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5 uppercase">
                            {label}
                        </span>

                        {ad.href ? (
                            <a
                                href={ad.href}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="block"
                            >
                                <img
                                    src={ad.src}
                                    alt={ad.alt}
                                    width={width}
                                    height={imageHeight}
                                    loading="lazy"
                                    className="w-full object-cover bg-gray-100 dark:bg-gray-800"
                                    style={{ height: imageHeight }}
                                />
                            </a>
                        ) : (
                            <img
                                src={ad.src}
                                alt={ad.alt}
                                width={width}
                                height={imageHeight}
                                loading="lazy"
                                className="w-full object-cover bg-gray-100 dark:bg-gray-800"
                                style={{ height: imageHeight }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}