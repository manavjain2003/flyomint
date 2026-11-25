import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/components/cms/Breadcrumbs";
import JsonLd from "@/app/components/cms/JsonLd";
import RichText from "@/app/components/cms/RichText";
import { ArticleCard, ArticleHeader, PageContainer, PreviewBanner } from "@/app/components/cms/Layout";
import { firstParam, getDetail } from "@/app/lib/cms/server";
import { seoToMetadata } from "@/app/lib/cms/seo";
import type { Guide } from "@/app/lib/cms/types";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const [{ slug }, sp] = await Promise.all([params, searchParams]);
    const preview = firstParam(sp.preview);
    const guide = await getDetail<Guide>("guides", slug, preview);
    return guide ? seoToMetadata(guide.seo, { preview: Boolean(preview) }) : {};
}

export default async function GuidePage({ params, searchParams }: Props) {
    const [{ slug }, sp] = await Promise.all([params, searchParams]);
    const preview = firstParam(sp.preview);
    const guide = await getDetail<Guide>("guides", slug, preview);
    if (!guide) notFound();
    return (
        <div className="flex-1 bg-slate-50 dark:bg-neutral-950">
            <PreviewBanner show={Boolean(preview)} />
            <JsonLd seo={guide.seo} />
            <PageContainer narrow>
                <Breadcrumbs seo={guide.seo} />
                <ArticleHeader eyebrow="Travel guide" title={guide.title} />
                <ArticleCard>
                    <RichText html={guide.content} />
                </ArticleCard>
            </PageContainer>
        </div>
    );
}
