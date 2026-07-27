"use client";

import { useState } from "react";
import { HiOutlineArrowRight, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineLifebuoy } from "react-icons/hi2";

type FaqItem = {
    question: string;
    answer: string;
};

const FAQS: FaqItem[] = [
    {
        question: "Can I change the passenger name?",
        answer:
            "Most Indian carriers only allow a name spelling correction, not a full-name change. File a request and our team will handle it with the airline.",
    },
    {
        question: "Can I change the date of my ticket?",
        answer:
            "Yes, most fares allow date changes for a fee plus any fare difference. Go to Manage Booking to see the exact charges for your ticket.",
    },
    {
        question: "How do I cancel my booking?",
        answer:
            "Open Manage Booking, select your trip, and choose Cancel. Refund eligibility depends on your fare type and how close it is to departure.",
    },
    {
        question: "Can I do web check-in from Flyomint?",
        answer:
            "Yes. Web check-in opens 48 hours before departure for most airlines — you'll get a reminder with a direct link once it's live.",
    },
    {
        question: "What's my baggage allowance?",
        answer:
            "Baggage allowance depends on your airline, route, and fare class. It's shown on your ticket and again during checkout before you pay.",
    },
    {
        question: "How are cancellation refunds processed?",
        answer:
            "Refunds are initiated once the airline approves the cancellation and typically reflect in your original payment method within 7–10 business days.",
    },
];

export default function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (index: number) => {
        setOpenIndex((prev) => (prev === index ? null : index));
    };

    return (
        <section className="bg-[#f5f8fb] py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-end justify-between mb-8 gap-4">
                    <div>
                        <span className="inline-block text-[#1c8fc7] text-xs font-medium mb-3">
                            Common questions
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            Before you book.
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-colors shrink-0"
                    >
                        All questions
                        <HiOutlineArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                    {FAQS.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div key={faq.question}>
                                <button
                                    type="button"
                                    onClick={() => toggle(index)}
                                    aria-expanded={isOpen}
                                    className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 hover:bg-gray-50/60 transition-colors"
                                >
                                    <span className="text-[15px] font-medium text-gray-900">
                                        {faq.question}
                                    </span>
                                    {isOpen ? (
                                        <HiOutlineChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                                    ) : (
                                        <HiOutlineChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                    )}
                                </button>

                                {isOpen && (
                                    <div className="px-6 pb-5 -mt-1">
                                        <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
                                            {faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <a
                        href="#"
                        className="group flex items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 px-6 py-5 hover:border-gray-300 hover:shadow-sm transition"
                    >
                        <div>
                            <p className="text-[15px] font-semibold text-gray-900">5+ more answers</p>
                            <p className="text-sm text-gray-500 mt-0.5">Browse our full knowledge base.</p>
                        </div>
                        <HiOutlineArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 shrink-0" />
                    </a>

                    <a
                        href="#"
                        className="group flex items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 px-6 py-5 hover:border-gray-300 hover:shadow-sm transition"
                    >
                        <div className="flex items-center gap-3">
                            <span className="grid place-items-center w-9 h-9 rounded-full bg-[#eaf4fb] shrink-0">
                                <HiOutlineLifebuoy className="w-4 h-4 text-[#1c8fc7]" />
                            </span>
                            <div>
                                <p className="text-[15px] font-semibold text-gray-900">
                                    Still stuck? Talk to a human.
                                </p>
                                <p className="text-sm text-gray-500 mt-0.5">Help center — real 24×7 support.</p>
                            </div>
                        </div>
                        <HiOutlineArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 shrink-0" />
                    </a>
                </div>
            </div>
        </section>
    );
}