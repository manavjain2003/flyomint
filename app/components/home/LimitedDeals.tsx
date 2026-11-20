import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi";
import { HiOutlineReceiptPercent } from "react-icons/hi2";
import SectionShell from "@/app/components/cms/SectionShell";
import { plainText } from "@/app/lib/cms/sanitize";
import type { Offer } from "@/app/lib/cms/types";

type Props = { offers: Offer[]; heading?: string; text?: string };

/** "Live offers" section, driven by CMS offers (coupon code, discount badge, detail page). */
export default function LimitedDeals({ offers, heading, text }: Props) {
    if (offers.length === 0) return null;
    return (
        <SectionShell eyebrow="Live offers" title={heading || "Deals worth grabbing."} text={text} href="/offers" hrefLabel="All offers">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {offers.map((offer) => (
                    <DealCard key={offer.id} offer={offer} />
                ))}
            </div>
        </SectionShell>
    );
}

function DealCard({ offer }: { offer: Offer }) {
    return (
        <Link
            href={`/offers/${offer.slug}`}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-shadow"
        >
            <div className="flex items-start justify-between mb-4">
                <span className="grid place-items-center w-9 h-9 rounded-full bg-[#eaf4fb]">
                    <HiOutlineReceiptPercent className="w-4 h-4 text-[#1c8fc7]" />
                </span>
                {offer.discount && (
                    <span className="rounded-full bg-[#FF7626]/10 text-[#FF7626] text-xs font-semibold px-2.5 py-1">{offer.discount}</span>
                )}
            </div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{offer.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">{plainText(offer.description, 120)}</p>
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                    {offer.couponCode && (
                        <>
                            <p className="text-[10px] font-medium text-gray-400 tracking-wide">CODE</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{offer.couponCode}</p>
                        </>
                    )}
                </div>
                <span className="grid place-items-center w-8 h-8 rounded-full text-gray-400"><HiOutlineArrowRight className="w-4 h-4" /></span>
            </div>
        </Link>
    );
}
