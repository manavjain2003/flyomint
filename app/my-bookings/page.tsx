// app/my-bookings/page.tsx

"use client";

import { useState } from "react";
import { HiOutlineUser, HiOutlinePaperAirplane } from "react-icons/hi2";
import AccountSidebar from "@/app/components/booking/AccountSidebar";

type BookingStatus = "confirmed" | "cancelled";

type Booking = {
    id: string;
    status: BookingStatus;
};

const BOOKINGS: Booking[] = [];

type Tab = "all" | "confirmed" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All Bookings" },
    { key: "confirmed", label: "Confirmed" },
    { key: "cancelled", label: "Cancelled" },
];

export default function MyBookingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("all");

    const filteredBookings = BOOKINGS.filter((b) =>
        activeTab === "all" ? true : b.status === activeTab
    );

    const emptyCopy: Record<Tab, { title: string; subtitle: string }> = {
        all: { title: "No bookings found", subtitle: "You haven't made any bookings yet." },
        confirmed: { title: "No confirmed bookings", subtitle: "Bookings you've paid for will show up here." },
        cancelled: { title: "No cancelled bookings", subtitle: "Bookings you cancel will show up here." },
    };

    return (
        <div className="flex-1 bg-[#f5f8fb]">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-3">
                    <span className="grid place-items-center w-9 h-9 rounded-full bg-[#FF7626]/10 shrink-0">
                        <HiOutlineUser className="w-5 h-5 text-[#FF7626]" />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>
                        <p className="text-sm text-gray-500">View and manage your flight history</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col md:flex-row gap-6">
                    <aside className="w-full md:w-64 shrink-0">
                        <AccountSidebar />
                    </aside>

                    <div className="flex-1 min-w-0">
                        <div className="inline-flex rounded-full bg-white border border-gray-200 p-1 gap-1 mb-6">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                        activeTab === tab.key
                                            ? "bg-[#0f172a] text-white"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 min-h-[380px]">
                            {filteredBookings.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center py-24 px-6">
                                    <span className="grid place-items-center w-14 h-14 rounded-full bg-gray-100 mb-5">
                                        <HiOutlinePaperAirplane className="w-6 h-6 text-gray-400 -rotate-45" />
                                    </span>
                                    <p className="text-base font-semibold text-gray-900 mb-1">
                                        {emptyCopy[activeTab].title}
                                    </p>
                                    <p className="text-sm text-gray-500">{emptyCopy[activeTab].subtitle}</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {filteredBookings.map((booking) => (
                                        <li key={booking.id} className="p-5">
                                            {/* Booking card content goes here once real data exists */}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}