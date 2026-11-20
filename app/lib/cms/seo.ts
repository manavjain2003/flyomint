import type { Metadata } from "next";
import type { CmsSeo } from "./types";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const metadataBase = new URL(SITE_URL);

/** Converts the CMS-computed `seo` object into Next.js metadata. */
export function seoToMetadata(seo?: CmsSeo | null, opts: { preview?: boolean } = {}): Metadata {
    if (!seo) return {};
    const noindex = opts.preview || /noindex/i.test(seo.robots || "");
    return {
        title: { absolute: seo.title },
        description: seo.description || undefined,
        keywords: seo.keywords || undefined,
        alternates: { canonical: seo.canonical },
        robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
        openGraph: {
            title: seo.og?.title || seo.title,
            description: seo.og?.description || seo.description,
            url: seo.og?.url || seo.canonical,
            type: (seo.og?.type as "website" | "article") || "website",
            images: seo.og?.image ? [{ url: seo.og.image }] : undefined,
        },
        twitter: {
            card: seo.og?.image ? "summary_large_image" : "summary",
            title: seo.og?.title || seo.title,
            description: seo.og?.description || seo.description,
            images: seo.og?.image ? [seo.og.image] : undefined,
        },
    };
}
