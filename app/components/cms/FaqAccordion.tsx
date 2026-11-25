"use client";

import { useState } from "react";
import { HiOutlineChevronDown, HiOutlineChevronUp } from "react-icons/hi2";

/** `answer` must already be sanitised HTML (call cleanHtml on the server before passing). */
export type FaqEntry = { question: string; answer: string };

export default function FaqAccordion({ items, defaultOpen = 0 }: { items: FaqEntry[]; defaultOpen?: number | null }) {
    const [open, setOpen] = useState<number | null>(defaultOpen);
    if (items.length === 0) return null;
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {items.map((faq, i) => {
                const isOpen = open === i;
                return (
                    <div key={`${faq.question}-${i}`}>
                        <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : i)}
                            aria-expanded={isOpen}
                            className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1c8fc7] transition-colors"
                        >
                            <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{faq.question}</span>
                            {isOpen ? <HiOutlineChevronUp className="w-4 h-4 text-[#1c8fc7] shrink-0" /> : <HiOutlineChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />}
                        </button>
                        {isOpen && (
                            <div className="px-6 pb-6 max-w-3xl">
                                <div className="cms-richtext text-sm" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
