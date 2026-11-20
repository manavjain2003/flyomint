import type { CmsSeo } from "@/app/lib/cms/types";

/** Emits the structured data (page, breadcrumbs, FAQ) computed by the CMS. */
export default function JsonLd({ seo }: { seo?: CmsSeo | null }) {
    if (!seo?.jsonLd?.length) return null;
    return (
        <>
            {seo.jsonLd.map((block, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    // "<" is escaped so admin text can never close the script tag
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, "\\u003c") }}
                />
            ))}
        </>
    );
}
