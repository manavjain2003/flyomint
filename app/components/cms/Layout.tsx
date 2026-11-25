import type { ReactNode } from "react";

/** Standard page container + heading used by all CMS pages. */
export function PageContainer({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
    return <div className={`${narrow ? "max-w-4xl" : "max-w-7xl"} w-full mx-auto px-4 sm:px-6 py-10 sm:py-14`}>{children}</div>;
}

export function PageTitle({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
    return (
        <header className="mb-10">
            {eyebrow && <p className="text-xs font-medium text-[#1c8fc7] tracking-wide uppercase mb-2">{eyebrow}</p>}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">{title}</h1>
            {intro && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">{intro}</p>}
        </header>
    );
}

/** Eyebrow + title + optional meta line, shared by article-style pages (legal pages, guides). */
export function ArticleHeader({ eyebrow, title, meta }: { eyebrow?: string; title: string; meta?: string }) {
    return (
        <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-[#0b78ad] dark:text-[#5cc0f0] mb-2">{eyebrow}</p>}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{title}</h1>
            {meta && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{meta}</p>}
        </header>
    );
}

/** Readable surface for long CMS content: same contrast in light and dark. */
export function ArticleCard({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <article className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm px-5 py-7 sm:px-10 sm:py-10 ${className}`}>
            {children}
        </article>
    );
}

export function PreviewBanner({ show }: { show?: boolean }) {
    if (!show) return null;
    return (
        <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-center text-xs font-semibold py-2 px-4">
            Preview mode — this draft is not public yet.
        </div>
    );
}

export function SectionHeading({ children }: { children: ReactNode }) {
    return <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5">{children}</h2>;
}

export function EmptyState({ message }: { message: string }) {
    return <p className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">{message}</p>;
}
