import Link from "next/link";
import type { ReactNode } from "react";
import { HiOutlineArrowRight } from "react-icons/hi";

type Props = {
    eyebrow?: string;
    title: string;
    text?: string;
    href?: string;
    hrefLabel?: string;
    children: ReactNode;
    overflowHidden?: boolean;
};

/** Common frame for every home page section (matches the existing look). */
export default function SectionShell({ eyebrow, title, text, href, hrefLabel = "View all", children, overflowHidden }: Props) {
    return (
        <section className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-16 ${overflowHidden ? "overflow-hidden" : ""}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-end justify-between mb-8 gap-4">
                    <div>
                        {eyebrow && <span className="inline-block text-[#1c8fc7] text-xs font-medium mb-3">{eyebrow}</span>}
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
                        {text && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">{text}</p>}
                    </div>
                    {href && (
                        <Link
                            href={href}
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
                        >
                            {hrefLabel}
                            <HiOutlineArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
                {children}
                {href && (
                    <Link
                        href={href}
                        className="sm:hidden mt-6 inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100"
                    >
                        {hrefLabel}
                        <HiOutlineArrowRight className="w-4 h-4" />
                    </Link>
                )}
            </div>
        </section>
    );
}
