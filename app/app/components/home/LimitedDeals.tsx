"use client";

import { HiOutlineArrowRight } from "react-icons/hi";
import { HiOutlineReceiptPercent } from "react-icons/hi2";

type Deal = {
    badge?: string;
    title: string;
    description: string;
    code: string;
};

const DEALS: Deal[] = [
    {
        title: "Weekend Getaway — ₹300 off",
        description: "Book by Friday, fly Sat–Sun. ₹300 off domestic round-trips.",
        code: "WEEKEND300",
    },
    {
        badge: "5% off",
        title: "5% cashback on UPI",
        description: "Pay with any UPI app and get 5% cashback (up to ₹500) to your UPI handle within 7 days.",
        code: "UPI5",
    },
    {
        badge: "10% off",
        title: "10% off International Round Trips",
        description: "Planning a holiday abroad? Get 10% off (up to ₹3,000) on international round-trip bookings.",
        code: "GLOBE10",
    },
    {
        title: "First Booking — ₹500 off",
        description: "Flat ₹500 off on your first flight booking above ₹3,500. One-time use per user.",
        code: "FIRSTFLY",
    },
];

export default function LimitedDeals() {
    return (
        <section className="bg-dark dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <span className="inline-block rounded-full bg-[#FF7626]/10 text-[#FF7626] text-xs font-medium px-3 py-1 mb-4">
                    Live offers
                </span>

                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                    Deals worth grabbing.
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {DEALS.map((deal) => (
                        <DealCard key={deal.code} {...deal} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function DealCard({ badge, title, description, code }: Deal) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <span className="grid place-items-center w-9 h-9 rounded-full bg-[#eaf4fb]">
                    <HiOutlineReceiptPercent className="w-4 h-4 text-[#1c8fc7]" />
                </span>
                {badge && (
                    <span className="rounded-full bg-[#FF7626]/10 text-[#FF7626] text-xs font-semibold px-2.5 py-1">
                        {badge}
                    </span>
                )}
            </div>

            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">{description}</p>

            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-wide">CODE</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{code}</p>
                </div>
                <button
                    type="button"
                    aria-label={`Use code ${code}`}
                    className="grid place-items-center w-8 h-8 rounded-full text-gray-400 dark:text-gray-500 hover:text-[#FF7626] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <HiOutlineArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}