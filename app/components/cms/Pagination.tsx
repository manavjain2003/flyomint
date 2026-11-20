import Link from "next/link";

type Props = { page: number; pages: number; basePath: string; params?: Record<string, string | undefined> };

export default function Pagination({ page, pages, basePath, params = {} }: Props) {
    if (pages <= 1) return null;
    const href = (p: number) => {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
        if (p > 1) sp.set("page", String(p));
        const s = sp.toString();
        return s ? `${basePath}?${s}` : basePath;
    };
    const cls = "h-9 min-w-9 px-3 inline-flex items-center justify-center rounded-full border text-sm font-medium";
    const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
    return (
        <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {page > 1 && <Link href={href(page - 1)} className={`${cls} border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300`}>Previous</Link>}
            {numbers.map((p, i) => (
                <span key={p} className="flex items-center gap-2">
                    {i > 0 && numbers[i - 1] !== p - 1 && <span className="text-gray-400">…</span>}
                    <Link
                        href={href(p)}
                        aria-current={p === page ? "page" : undefined}
                        className={`${cls} ${p === page ? "bg-[#FF7626] border-[#FF7626] text-white" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"}`}
                    >
                        {p}
                    </Link>
                </span>
            ))}
            {page < pages && <Link href={href(page + 1)} className={`${cls} border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300`}>Next</Link>}
        </nav>
    );
}
