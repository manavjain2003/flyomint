import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/app/components/home/BlogSection";
import Pagination from "@/app/components/cms/Pagination";
import { EmptyState, PageContainer, PageTitle } from "@/app/components/cms/Layout";
import { firstParam, listResource } from "@/app/lib/cms/server";
import type { Blog } from "@/app/lib/cms/types";

export const metadata: Metadata = {
    title: "Travel Journal",
    description: "Guides, tips and opinionated takes from travelers who actually fly.",
    alternates: { canonical: "/blog" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BlogListPage({ searchParams }: Props) {
    const sp = await searchParams;
    const page = Number(firstParam(sp.page)) || 1;
    const q = firstParam(sp.q);
    const category = firstParam(sp.category);
    const data = await listResource<Blog>("blogs", { page, limit: 12, q, category, sort: "latest" });

    return (
        <PageContainer>
            <PageTitle eyebrow="Travel Journal" title="Reads for the runway." intro="Guides, tips, and opinionated takes from travelers who actually fly — no SEO fluff, no listicles." />

            <form action="/blog" className="mb-8 flex gap-3 max-w-md">
                <input
                    name="q"
                    defaultValue={q}
                    placeholder="Search articles"
                    aria-label="Search articles"
                    className="flex-1 h-11 px-5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-[#1c8fc7]/30"
                />
                <button className="h-11 px-6 rounded-full bg-[#FF7626] text-white text-sm font-semibold">Search</button>
            </form>
            {category && (
                <p className="mb-6 text-sm text-gray-500">
                    Category: <span className="font-semibold text-gray-800 dark:text-gray-200">{category}</span>{" "}
                    <Link href="/blog" className="text-[#1c8fc7] underline">clear</Link>
                </p>
            )}

            {data && data.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.items.map((post) => <PostCard key={post.id} post={post} />)}
                </div>
            ) : (
                <EmptyState message="No articles found." />
            )}
            {data && <Pagination page={data.page} pages={data.pages} basePath="/blog" params={{ q, category }} />}
        </PageContainer>
    );
}
