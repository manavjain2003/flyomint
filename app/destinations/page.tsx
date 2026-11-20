import type { Metadata } from "next";
import Link from "next/link";
import CmsImage from "@/app/components/cms/CmsImage";
import Pagination from "@/app/components/cms/Pagination";
import { EmptyState, PageContainer, PageTitle } from "@/app/components/cms/Layout";
import { firstParam, listResource } from "@/app/lib/cms/server";
import type { Destination } from "@/app/lib/cms/types";

export const metadata: Metadata = {
    title: "Destinations",
    description: "Find cheap flights, best time to visit and travel tips for popular destinations.",
    alternates: { canonical: "/destinations" },
};

export default async function DestinationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const page = Number(firstParam(sp.page)) || 1;
    const data = await listResource<Destination>("destinations", { page, limit: 24 });
    return (
        <PageContainer>
            <PageTitle eyebrow="Explore" title="Destinations" intro="Find cheap flights, best time to visit and travel tips for popular destinations." />
            {data && data.items.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {data.items.map((d) => (
                        <Link key={d.id} href={`/destinations/${d.slug}`} className="group relative block overflow-hidden rounded-2xl aspect-[4/3] bg-gradient-to-br from-sky-100 to-sky-400">
                            <CmsImage image={d.bannerImage} fallbackAlt={d.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <p className="absolute bottom-3 left-4 right-4 text-white font-semibold">{d.name}</p>
                        </Link>
                    ))}
                </div>
            ) : <EmptyState message="No destinations found." />}
            {data && <Pagination page={data.page} pages={data.pages} basePath="/destinations" />}
        </PageContainer>
    );
}
