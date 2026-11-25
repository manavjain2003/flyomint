import Link from "next/link";
import { HiOutlineArrowRight, HiOutlineLifebuoy } from "react-icons/hi2";
import SectionShell from "@/app/components/cms/SectionShell";
import FaqAccordion from "@/app/components/cms/FaqAccordion";
import { cleanHtml } from "@/app/lib/cms/sanitize";
import type { FaqDoc } from "@/app/lib/cms/types";

type Props = { faqs: FaqDoc[]; heading?: string; text?: string };

export default function FaqSection({ faqs, heading, text }: Props) {
    if (faqs.length === 0) return null;
    const items = faqs.map((f) => ({ question: f.question, answer: cleanHtml(f.answer) }));
    return (
        <SectionShell eyebrow="Common questions" title={heading || "Before you book."} text={text} href="/faqs" hrefLabel="All questions">
            <FaqAccordion items={items} />
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Link href="/faqs" className="group flex items-center justify-between gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 px-6 py-5 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition">
                    <div>
                        <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">More answers</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Browse our full knowledge base.</p>
                    </div>
                    <HiOutlineArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
                </Link>
                <Link href="/help-center" className="group flex items-center justify-between gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 px-6 py-5 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition">
                    <div className="flex items-center gap-3">
                        <span className="grid place-items-center w-9 h-9 rounded-full bg-[#eaf4fb] dark:bg-sky-500/15 shrink-0"><HiOutlineLifebuoy className="w-4 h-4 text-[#1c8fc7]" /></span>
                        <div>
                            <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Still stuck? Talk to a human.</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Help center and support.</p>
                        </div>
                    </div>
                    <HiOutlineArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
                </Link>
            </div>
        </SectionShell>
    );
}
