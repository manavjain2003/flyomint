import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageContainer, PageTitle } from "@/app/components/cms/Layout";
import Pagination from "@/app/components/cms/Pagination";
import { firstParam, listResource } from "@/app/lib/cms/server";
import type { Airline } from "@/app/lib/cms/types";

export const metadata: Metadata = {
    title: "Airlines",
    description: "Baggage rules, web check-in, refunds and customer care for every airline we sell.",
    alternates: { canonical: "/airlines" },
};

export default async function AirlinesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const page = Number(firstParam(sp.page)) || 1;
    const data = await listResource<Airline>("airlines", { page, limit: 48 });
    return (
        <PageContainer>
            <PageTitle eyebrow="Airlines" title="Airlines" intro="Baggage rules, web check-in, refunds and customer care for every airline we sell." />
            {data && data.items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {data.items.map((a) => (
                        <Link key={a.id} href={`/airlines/${a.slug}`} className="flex flex-col items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.logo?.url || `https://www.gstatic.com/flights/airline_logos/70px/${a.code}.png`} alt={a.logo?.alt || `${a.name} logo`} className="h-10 w-auto object-contain" loading="lazy" />
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">{a.name}</span>
                        </Link>
                    ))}
                </div>
            ) : <EmptyState message="No airlines found." />}
            {data && <Pagination page={data.page} pages={data.pages} basePath="/airlines" />}
        </PageContainer>
    );
}
