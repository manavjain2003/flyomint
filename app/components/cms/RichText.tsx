import { cleanHtml } from "@/app/lib/cms/sanitize";

/** Sanitised admin HTML (server component). */
export default function RichText({ html, className = "" }: { html?: string | null; className?: string }) {
    const clean = cleanHtml(html);
    if (!clean) return null;
    return <div className={`cms-richtext ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
