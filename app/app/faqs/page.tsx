"use client";

import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface Category {
  title: string;
  description: string;
  items: FAQItem[];
}

const categories: Category[] = [
  {
    title: "Cancellation & Changes",
    description: "Cancellation policies, date changes, name corrections.",
    items: [
      { question: "Can I change the passenger name?", answer: "" },
      { question: "Can I change the date of my ticket?", answer: "" },
      { question: "How do I cancel my booking?", answer: "" },
    ],
  },
  {
    title: "Baggage & Check-in",
    description: "Cabin and check-in baggage rules, web check-in, boarding pass.",
    items: [
      { question: "Can I do web check-in from Flyomint?", answer: "" },
      { question: "What's my baggage allowance?", answer: "" },
    ],
  },
  {
    title: "Payments & Refunds",
    description: "Payment methods, failures, refunds, and chargebacks.",
    items: [
      { question: "How are cancellation refunds processed?", answer: "" },
      { question: "My payment failed but money was debited. What now?", answer: "" },
      { question: "Which payment methods are supported?", answer: "" },
    ],
  },
  {
    title: "Booking",
    description: "Questions about searching flights and creating bookings.",
    items: [
      { question: "Will I get an e-ticket or a paper ticket?", answer: "" },
      { question: "Can I hold a fare without paying?", answer: "" },
      { question: "How do I book a flight on Flyomint?", answer: "" },
    ],
  },
];

export default function HelpCenterPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenIndex((prev) => (prev === key ? null : key));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-slate-50 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            How can we help you?
          </h1>
          <p className="text-sm text-slate-500">
            Search our knowledge base for answers to common questions regarding
            your bookings, flights, and account.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        {categories.map((cat, catIdx) => (
          <section key={catIdx}>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-slate-900">
                {cat.title}
              </h2>
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
            <p className="text-xs text-slate-400 mb-4">{cat.description}</p>

            <div className="space-y-3">
              {cat.items.map((item, itemIdx) => {
                const key = `${catIdx}-${itemIdx}`;
                const isOpen = openIndex === key;
                return (
                  <div
                    key={key}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-slate-700 font-medium">
                        {item.question}
                      </span>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-sm text-slate-600">
                        {item.answer || "Answer content goes here."}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}