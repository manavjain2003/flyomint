import type { Metadata } from "next";
import Link from "next/link";
import CmsImage from "@/app/components/cms/CmsImage";
import Pagination from "@/app/components/cms/Pagination";
import { EmptyState, PageContainer, PageTitle } from "@/app/components/cms/Layout";
import { firstParam, listResource } from "@/app/lib/cms/server";
import { plainText } from "@/app/lib/cms/sanitize";
import type { Offer } from "@/app/lib/cms/types";

export const metadata: Metadata = {
    title: "Flight Offers",
    description: "Coupons, bank offers and festival deals on flight bookings.",
    alternates: { canonical: "/offers" },
};

const TYPES = [
    { value: "", label: "All" },
    { value: "flight", label: "Flight" },
    { value: "bank", label: "Bank" },
    { value: "airline", label: "Airline" },
    { value: "festival", label: "Festival" },
];

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function OffersPage({ searchParams }: Props) {
    const sp = await searchParams;
    const page = Number(firstParam(sp.page)) || 1;
    const offerType = firstParam(sp.offerType) || "";
    const data = await listResource<Offer>("offers", { page, limit: 12, offerType });

    return (
        <PageContainer>
            <PageTitle eyebrow="Offers" title="Flight offers & coupons" intro="Coupons, bank offers and festival deals on flight bookings." />
            <div className="mb-8 flex flex-wrap gap-2">
                {TYPES.map((t) => (
                    <Link
                        key={t.value}
                        href={t.value ? `/offers?offerType=${t.value}` : "/offers"}
                        className={`px-4 py-1.5 rounded-full border text-sm font-medium ${offerType === t.value ? "border-[#FF7626] text-[#FF7626] bg-[#FF7626]/5" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}
                    >
                        {t.label}
                    </Link>
                ))}
            </div>
            {data && data.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.items.map((o) => (
                        <Link key={o.id} href={`/offers/${o.slug}`} className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                            <CmsImage image={o.image} fallbackAlt={o.title} className="w-full aspect-[16/9] object-cover" />
                            <div className="p-5">
                                {o.discount && <span className="rounded-full bg-[#FF7626]/10 text-[#FF7626] text-xs font-semibold px-2.5 py-1">{o.discount}</span>}
                                <h2 className="mt-3 text-[15px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#1c8fc7]">{o.title}</h2>
                                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{plainText(o.description, 110)}</p>
                                {o.couponCode && <p className="mt-4 text-xs text-gray-400">CODE <span className="ml-1 text-sm font-bold text-gray-900 dark:text-gray-100">{o.couponCode}</span></p>}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : <EmptyState message="No offers available right now. Check back soon." />}
            {data && <Pagination page={data.page} pages={data.pages} basePath="/offers" params={{ offerType }} />}
        </PageContainer>
    );
}
