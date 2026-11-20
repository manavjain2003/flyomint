import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/components/cms/Breadcrumbs";
import CmsImage from "@/app/components/cms/CmsImage";
import FaqAccordion from "@/app/components/cms/FaqAccordion";
import JsonLd from "@/app/components/cms/JsonLd";
import RichText from "@/app/components/cms/RichText";
import RouteCards from "@/app/components/cms/RouteCards";
import { PageContainer, PreviewBanner, SectionHeading } from "@/app/components/cms/Layout";
import { firstParam, getDetail, getSiteBundle } from "@/app/lib/cms/server";
import { cleanHtml } from "@/app/lib/cms/sanitize";
import { formatFare } from "@/app/lib/cms/format";
import { seoToMetadata } from "@/app/lib/cms/seo";
import type { Destination } from "@/app/lib/cms/types";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const [{ slug }, sp] = await Promise.all([params, searchParams]);
    const preview = firstParam(sp.preview);
    const d = await getDetail<Destination>("destinations", slug, preview);
    return d ? seoToMetadata(d.seo, { preview: Boolean(preview) }) : {};
}

export default async function DestinationPage({ params, searchParams }: Props) {
    const [{ slug }, sp, site] = await Promise.all([params, searchParams, getSiteBundle()]);
    const preview = firstParam(sp.preview);
    const dest = await getDetail<Destination>("destinations", slug, preview);
    if (!dest) notFound();
    const theme = site?.theme;
    const airlines = (dest.airlines ?? []).filter((a) => a && a.slug);

    return (
        <>
            <PreviewBanner show={Boolean(preview)} />
            <JsonLd seo={dest.seo} />
            <PageContainer>
                <Breadcrumbs seo={dest.seo} />
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{dest.heading || dest.name}</h1>
                <CmsImage image={dest.bannerImage} fallbackAlt={dest.name} eager className="mt-6 w-full rounded-2xl object-cover max-h-96" />
                <RichText html={dest.description} className="mt-6 max-w-3xl" />

                {dest.cheapestFares && dest.cheapestFares.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>Cheapest flights to {dest.name}</SectionHeading>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {dest.cheapestFares.map((f, i) => (
                                <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                                    <p className="text-sm text-gray-500">From {f.fromCity?.name}</p>
                                    <p className="mt-2 text-xl font-bold text-[#FF7626]">{formatFare(f.fare, theme)}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {dest.popularRoutes && dest.popularRoutes.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>Popular routes</SectionHeading>
                        <RouteCards routes={dest.popularRoutes} theme={theme} />
                    </section>
                )}

                {(dest.bestTimeToVisit || dest.travelTips) && (
                    <div className="mt-12 grid md:grid-cols-2 gap-5">
                        {dest.bestTimeToVisit && (
                            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Best time to visit</h2>
                                <RichText html={dest.bestTimeToVisit} className="text-sm" />
                            </section>
                        )}
                        {dest.travelTips && (
                            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Travel tips</h2>
                                <RichText html={dest.travelTips} className="text-sm" />
                            </section>
                        )}
                    </div>
                )}

                {airlines.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>Airlines flying to {dest.name}</SectionHeading>
                        <div className="flex flex-wrap gap-3">
                            {airlines.map((a) => (
                                <Link key={a.id} href={`/airlines/${a.slug}`} className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-[#1c8fc7]">{a.name}</Link>
                            ))}
                        </div>
                    </section>
                )}

                {dest.faqs && dest.faqs.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>Frequently asked questions</SectionHeading>
                        <FaqAccordion items={dest.faqs.map((f) => ({ question: f.question, answer: cleanHtml(f.answer) }))} defaultOpen={null} />
                    </section>
                )}
            </PageContainer>
        </>
    );
}
