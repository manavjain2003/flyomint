import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/components/cms/Breadcrumbs";
import FaqAccordion from "@/app/components/cms/FaqAccordion";
import JsonLd from "@/app/components/cms/JsonLd";
import RichText from "@/app/components/cms/RichText";
import RouteCards from "@/app/components/cms/RouteCards";
import { PageContainer, PreviewBanner, SectionHeading } from "@/app/components/cms/Layout";
import { firstParam, getDetail, getSiteBundle } from "@/app/lib/cms/server";
import { cleanHtml } from "@/app/lib/cms/sanitize";
import { formatDate, safeHref } from "@/app/lib/cms/format";
import { seoToMetadata } from "@/app/lib/cms/seo";
import type { Airline } from "@/app/lib/cms/types";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const [{ slug }, sp] = await Promise.all([params, searchParams]);
    const preview = firstParam(sp.preview);
    const a = await getDetail<Airline>("airlines", slug, preview);
    return a ? seoToMetadata(a.seo, { preview: Boolean(preview) }) : {};
}

function InfoBlock({ title, html }: { title: string; html?: string }) {
    if (!html) return null;
    return (
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">{title}</h2>
            <RichText html={html} className="text-sm" />
        </section>
    );
}

export default async function AirlinePage({ params, searchParams }: Props) {
    const [{ slug }, sp, site] = await Promise.all([params, searchParams, getSiteBundle()]);
    const preview = firstParam(sp.preview);
    const airline = await getDetail<Airline>("airlines", slug, preview);
    if (!airline) notFound();
    const care = airline.customerCare;

    return (
        <>
            <PreviewBanner show={Boolean(preview)} />
            <JsonLd seo={airline.seo} />
            <PageContainer>
                <Breadcrumbs seo={airline.seo} />
                <div className="flex items-center gap-5 mb-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={airline.logo?.url || `https://www.gstatic.com/flights/airline_logos/70px/${airline.code}.png`} alt={airline.logo?.alt || `${airline.name} logo`} className="h-14 w-auto object-contain" />
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{airline.name} <span className="text-gray-400 text-xl">({airline.code})</span></h1>
                </div>

                <RichText html={airline.about} className="max-w-3xl" />

                <div className="mt-10 grid md:grid-cols-2 gap-5">
                    {(airline.baggage?.cabin || airline.baggage?.checkin) && (
                        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Baggage allowance</h2>
                            <dl className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                                {airline.baggage?.cabin && <div><dt className="text-xs text-gray-400">Cabin</dt><dd>{airline.baggage.cabin}</dd></div>}
                                {airline.baggage?.checkin && <div><dt className="text-xs text-gray-400">Check-in</dt><dd>{airline.baggage.checkin}</dd></div>}
                            </dl>
                        </section>
                    )}
                    <InfoBlock title="Web check-in" html={airline.webCheckin} />
                    <InfoBlock title="Cancellation & refund" html={airline.cancellationRefund} />
                    {care && (care.phone || care.email || care.website) && (
                        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Customer care</h2>
                            <ul className="text-sm space-y-1.5 text-gray-600 dark:text-gray-300">
                                {care.phone && <li><a href={`tel:${care.phone.replace(/[^+\d]/g, "")}`} className="hover:text-[#1c8fc7]">{care.phone}</a></li>}
                                {care.email && <li><a href={`mailto:${care.email}`} className="hover:text-[#1c8fc7]">{care.email}</a></li>}
                                {care.website && <li><a href={safeHref(care.website)} target="_blank" rel="noopener noreferrer" className="hover:text-[#1c8fc7]">{care.website}</a></li>}
                            </ul>
                        </section>
                    )}
                </div>

                {airline.popularRoutes && airline.popularRoutes.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>Popular {airline.name} routes</SectionHeading>
                        <RouteCards routes={airline.popularRoutes} theme={site?.theme} />
                    </section>
                )}

                {airline.offers && airline.offers.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>{airline.name} offers</SectionHeading>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {airline.offers.map((o) => (
                                <Link key={o.id} href={`/offers/${o.slug}`} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{o.title}</p>
                                    {o.couponCode && <p className="mt-2 text-xs text-gray-400">CODE <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{o.couponCode}</span></p>}
                                    {o.validTill && <p className="mt-1 text-xs text-gray-400">Valid till {formatDate(o.validTill, site?.theme?.dateFormat)}</p>}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {airline.faqs && airline.faqs.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>Frequently asked questions</SectionHeading>
                        <FaqAccordion items={airline.faqs.map((f) => ({ question: f.question, answer: cleanHtml(f.answer) }))} defaultOpen={null} />
                    </section>
                )}
            </PageContainer>
        </>
    );
}
