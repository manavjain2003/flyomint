import Link from "next/link";
import type { CmsSeo } from "@/app/lib/cms/types";

const toPath = (url: string) => {
    try { return new URL(url).pathname || "/"; } catch { return url; }
};

export default function Breadcrumbs({ seo }: { seo?: CmsSeo | null }) {
    const crumbs = seo?.breadcrumbs;
    if (!crumbs || crumbs.length < 2) return null;
    return (
        <nav aria-label="Breadcrumb" className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            <ol className="flex flex-wrap items-center gap-1.5">
                {crumbs.map((c, i) => (
                    <li key={c.url} className="flex items-center gap-1.5">
                        {i > 0 && <span aria-hidden>/</span>}
                        {i < crumbs.length - 1 ? (
                            <Link href={toPath(c.url)} className="hover:text-[#1c8fc7]">{c.name}</Link>
                        ) : (
                            <span className="text-gray-700 dark:text-gray-300" aria-current="page">{c.name}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
