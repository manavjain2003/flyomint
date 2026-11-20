import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/components/cms/Breadcrumbs";
import JsonLd from "@/app/components/cms/JsonLd";
import RichText from "@/app/components/cms/RichText";
import { PageContainer, PreviewBanner } from "@/app/components/cms/Layout";
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
        <>
            <PreviewBanner show={Boolean(preview)} />
            <JsonLd seo={guide.seo} />
            <PageContainer narrow>
                <Breadcrumbs seo={guide.seo} />
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">{guide.title}</h1>
                <RichText html={guide.content} />
            </PageContainer>
        </>
    );
}
