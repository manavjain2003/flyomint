import Link from "next/link";
import SectionShell from "@/app/components/cms/SectionShell";
import CmsImage from "@/app/components/cms/CmsImage";
import type { Blog } from "@/app/lib/cms/types";

type Props = { blogs: Blog[]; heading?: string; text?: string };

export default function BlogSection({ blogs, heading, text }: Props) {
    if (blogs.length === 0) return null;
    return (
        <SectionShell eyebrow="Travel journal" title={heading || "Reads for the runway."} text={text} href="/blog" hrefLabel="All posts">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {blogs.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </SectionShell>
    );
}

export function PostCard({ post }: { post: Blog }) {
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group block bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-shadow"
        >
            {post.image?.url ? (
                <CmsImage image={post.image} fallbackAlt={post.title} className="aspect-[4/3] w-full object-cover" />
            ) : (
                <div className="aspect-[4/3] w-full" style={{ background: "linear-gradient(135deg, #eaf6fd 0%, #7cc9f0 100%)" }} aria-hidden />
            )}
            <div className="p-5">
                {post.category && (
                    <p className="text-[11px] font-semibold tracking-wide text-gray-400 dark:text-gray-500 uppercase mb-2">{post.category}</p>
                )}
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-[#1c8fc7] transition-colors">{post.title}</h3>
            </div>
        </Link>
    );
}
