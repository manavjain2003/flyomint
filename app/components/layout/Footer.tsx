import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";

const GROUPS = [
    {
        heading: "Product",
        links: [
            { href: "/", label: "Flight search" },
            { href: "/my-bookings", label: "My bookings" },
            { href: "/group-booking", label: "Group bookings" },
            { href: "/blogs", label: "Travel guides" },
        ],
    },
    {
        heading: "Company",
        links: [
            { href: "/about", label: "About" },
            { href: "/partners", label: "Partners" },
            { href: "/careers", label: "Careers" },
            { href: "/press", label: "Press" },
        ],
    },
    {
        heading: "Support",
        links: [
            { href: "/support", label: "Help center" },
            { href: "/contact", label: "Contact us" },
            { href: "/faqs", label: "FAQs" },
            { href: "/refunds", label: "Refunds" },
        ],
    },
    {
        heading: "Legal",
        links: [
            { href: "/terms", label: "Terms of service" },
            { href: "/privacy", label: "Privacy policy" },
            { href: "/cookies", label: "Cookie policy" },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
                    <div className="space-y-3">
                        <Image src="/assets/logo.jpg" alt="Flyomint" width={120} height={30} className="h-7 w-auto" />
                        <p className="text-[13px] leading-relaxed text-gray-500 max-w-sm">
                            Flights that fit your schedule, at prices we stand behind. Real-time fares, no surprises at checkout.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                            {[FaTwitter, FaInstagram, FaLinkedinIn, FaFacebookF].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 grid place-items-center transition"
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>
                    {GROUPS.map((g) => (
                        <div key={g.heading}>
                            <h4 className="text-[13px] font-semibold text-gray-900 mb-3 tracking-wide">
                                {g.heading}
                            </h4>
                            <ul className="space-y-2">
                                {g.links.map((l) => (
                                    <li key={l.href}>
                                        <Link
                                            href={l.href}
                                            className="text-[13px] text-gray-600 hover:text-black transition"
                                        >
                                            {l.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 items-center justify-between">
                    <p className="text-[11px] text-gray-400">
                        © {new Date().getFullYear()} Flyomint. All rights reserved.
                    </p>
                    <div className="flex items-center gap-5 text-[11px] text-blue-500">
                        <span>IATA accredited</span>
                        <span>PCI-DSS compliant</span>
                        <span>24×7 support</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}