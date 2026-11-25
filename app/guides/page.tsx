import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageContainer, PageTitle } from "@/app/components/cms/Layout";
import { listResource } from "@/app/lib/cms/server";
import type { Guide } from "@/app/lib/cms/types";

export const metadata: Metadata = {
    title: "Travel Guides",
    description: "Practical guides to help you plan and book your flights.",
    alternates: { canonical: "/guides" },
};

export default async function GuidesPage() {
    const data = await listResource<Guide>("guides", { limit: 100 });
    return (
        <PageContainer>
            <PageTitle eyebrow="Guides" title="Travel Guides" intro="Practical guides to help you plan and book your flights." />
            {data && data.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {data.items.map((g) => (
                        <Link key={g.id} href={`/guides/${g.slug}`} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 block hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-shadow">
                            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{g.title}</h2>
                            <span className="mt-4 inline-block text-xs font-semibold text-[#0b78ad] dark:text-[#5cc0f0]">Read guide →</span>
                        </Link>
                    ))}
                </div>
            ) : <EmptyState message="No guides yet." />}
        </PageContainer>
    );
}
