import type { CmsSeo } from "@/app/lib/cms/types";

export default function JsonLd({ seo }: { seo?: CmsSeo | null }) {
    if (!seo?.jsonLd?.length) return null;
    return (
        <>
            {seo.jsonLd.map((block, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, "\\u003c") }}
                />
            ))}
        </>
    );
}
