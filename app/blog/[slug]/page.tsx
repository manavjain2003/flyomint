import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/components/cms/Breadcrumbs";
import CmsImage from "@/app/components/cms/CmsImage";
import JsonLd from "@/app/components/cms/JsonLd";
import RichText from "@/app/components/cms/RichText";
import { PageContainer, PreviewBanner } from "@/app/components/cms/Layout";
import { TrackView } from "@/app/components/cms/Tracking";
import { PostCard } from "@/app/components/home/BlogSection";
import { firstParam, getDetail, getSiteBundle } from "@/app/lib/cms/server";
import { formatDate } from "@/app/lib/cms/format";
import { seoToMetadata } from "@/app/lib/cms/seo";
import type { Blog } from "@/app/lib/cms/types";

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const [{ slug }, sp] = await Promise.all([params, searchParams]);
    const preview = firstParam(sp.preview);
    const blog = await getDetail<Blog>("blogs", slug, preview);
    return blog ? seoToMetadata(blog.seo, { preview: Boolean(preview) }) : {};
}

export default async function BlogPostPage({ params, searchParams }: Props) {
    const [{ slug }, sp, site] = await Promise.all([params, searchParams, getSiteBundle()]);
    const preview = firstParam(sp.preview);
    const blog = await getDetail<Blog>("blogs", slug, preview);
    if (!blog) notFound();

    return (
        <>
            <PreviewBanner show={Boolean(preview)} />
            <JsonLd seo={blog.seo} />
            <TrackView refType="blog" refId={blog.id} label={blog.title} disabled={Boolean(preview)} />
            <PageContainer>
                <div className="grid lg:grid-cols-[1fr_320px] gap-12">
                    <article className="min-w-0">
                        <Breadcrumbs seo={blog.seo} />
                        {blog.category && (
                            <Link href={`/blog?category=${encodeURIComponent(blog.category)}`} className="text-xs font-semibold uppercase tracking-wide text-[#1c8fc7]">{blog.category}</Link>
                        )}
                        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{blog.title}</h1>
                        <p className="mt-3 text-sm text-gray-500">
                            {blog.author ? `By ${blog.author} · ` : ""}
                            {formatDate(blog.publishAt ?? blog.createdAt, site?.theme?.dateFormat)}
                        </p>
                        <CmsImage image={blog.image} fallbackAlt={blog.title} eager className="mt-6 w-full rounded-2xl object-cover max-h-[420px]" />
                        <RichText html={blog.content} className="mt-8" />

                        {blog.tags && blog.tags.length > 0 && (
                            <div className="mt-8 flex flex-wrap gap-2">
                                {blog.tags.map((t) => (
                                    <span key={t} className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-600 dark:text-gray-300">#{t}</span>
                                ))}
                            </div>
                        )}

                        {blog.shareLinks && (
                            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
                                <span className="text-gray-500">Share:</span>
                                {(["whatsapp", "facebook", "twitter"] as const).map((k) => (
                                    <a key={k} href={blog.shareLinks![k]} target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-1.5 capitalize text-gray-700 dark:text-gray-300 hover:border-[#1c8fc7]">{k}</a>
                                ))}
                            </div>
                        )}
                    </article>

                    <aside className="space-y-8">
                        {blog.popularBlogs && blog.popularBlogs.length > 0 && (
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">Popular posts</h2>
                                <ul className="space-y-3">
                                    {blog.popularBlogs.map((p) => (
                                        <li key={p.id}><Link href={`/blog/${p.slug}`} className="text-sm text-gray-700 dark:text-gray-300 hover:text-[#1c8fc7]">{p.title}</Link></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </aside>
                </div>

                {blog.relatedBlogs && blog.relatedBlogs.length > 0 && (
                    <section className="mt-14">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">Related articles</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {blog.relatedBlogs.map((p) => <PostCard key={p.id} post={p} />)}
                        </div>
                    </section>
                )}
            </PageContainer>
        </>
    );
}
