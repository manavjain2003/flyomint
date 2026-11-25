import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/components/cms/Breadcrumbs";
import CmsImage from "@/app/components/cms/CmsImage";
import FaqAccordion from "@/app/components/cms/FaqAccordion";
import JsonLd from "@/app/components/cms/JsonLd";
import RichText from "@/app/components/cms/RichText";
import { ArticleCard, ArticleHeader, PageContainer, PreviewBanner, SectionHeading } from "@/app/components/cms/Layout";
import { firstParam, getDetail } from "@/app/lib/cms/server";
import { cleanHtml } from "@/app/lib/cms/sanitize";
import { pageKeyForSlug } from "@/app/lib/cms/pages";
import { seoToMetadata } from "@/app/lib/cms/seo";
import type { CmsPage } from "@/app/lib/cms/types";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Fixed CMS pages: about-us, privacy-policy, terms-and-conditions, disclaimer, payment-and-refund-policy
 * and the four special-fare pages. Every other unknown URL is a normal 404.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const [{ slug }, sp] = await Promise.all([params, searchParams]);
    const key = pageKeyForSlug(slug);
    if (!key) return {};
    const preview = firstParam(sp.preview);
    const page = await getDetail<CmsPage>("pages", key, preview);
    return page ? seoToMetadata(page.seo, { preview: Boolean(preview) }) : {};
}

export default async function CmsStaticPage({ params, searchParams }: Props) {
    const [{ slug }, sp] = await Promise.all([params, searchParams]);
    const key = pageKeyForSlug(slug);
    if (!key) notFound();
    const preview = firstParam(sp.preview);
    const page = await getDetail<CmsPage>("pages", key, preview);
    if (!page) notFound();

    const special = page.kind === "special-fare";
    const updated = page.updatedAt ? new Date(page.updatedAt) : null;
    const meta = updated && !Number.isNaN(updated.getTime())
        ? `Last updated ${updated.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}`
        : undefined;
    const eyebrow = special ? "Special fares" : key === "about" ? "Company" : "Legal";
    const hasFaqs = Boolean(page.faqs && page.faqs.length > 0);

    return (
        <div className="flex-1 bg-slate-50 dark:bg-neutral-950">
            <PreviewBanner show={Boolean(preview)} />
            <JsonLd seo={page.seo} />
            <PageContainer narrow>
                <Breadcrumbs seo={page.seo} />
                <ArticleHeader eyebrow={eyebrow} title={page.heading || page.title || ""} meta={meta} />
                <CmsImage image={page.banner} fallbackAlt={page.title || ""} eager className="w-full rounded-2xl object-cover max-h-72 mb-8" />

                <ArticleCard>
                    <RichText html={page.content} />

                    {special && page.eligibility && (
                        <section className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
                            <SectionHeading>Eligibility</SectionHeading>
                            <RichText html={page.eligibility} />
                        </section>
                    )}
                    {special && page.requiredDocuments && (
                        <section className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
                            <SectionHeading>Required documents</SectionHeading>
                            <RichText html={page.requiredDocuments} />
                        </section>
                    )}
                    {special && (
                        <Link href="/" className="mt-10 inline-flex h-12 items-center rounded-full bg-[#FF7626] px-8 text-sm font-semibold text-white hover:bg-[#e6661f] transition-colors">Search flights</Link>
                    )}
                </ArticleCard>

                {hasFaqs && (
                    <section className="mt-12">
                        <SectionHeading>Frequently asked questions</SectionHeading>
                        <FaqAccordion items={page.faqs!.map((f) => ({ question: f.question, answer: cleanHtml(f.answer) }))} defaultOpen={null} />
                    </section>
                )}
            </PageContainer>
        </div>
    );
}
