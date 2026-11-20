import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/components/cms/Breadcrumbs";
import CmsImage from "@/app/components/cms/CmsImage";
import JsonLd from "@/app/components/cms/JsonLd";
import RichText from "@/app/components/cms/RichText";
import { PageContainer, PreviewBanner, SectionHeading } from "@/app/components/cms/Layout";
import { TrackView } from "@/app/components/cms/Tracking";
import { firstParam, getDetail, getSiteBundle } from "@/app/lib/cms/server";
import { formatDate, formatFare } from "@/app/lib/cms/format";
import { seoToMetadata } from "@/app/lib/cms/seo";
import type { Offer } from "@/app/lib/cms/types";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const [{ slug }, sp] = await Promise.all([params, searchParams]);
    const preview = firstParam(sp.preview);
    const offer = await getDetail<Offer>("offers", slug, preview);
    return offer ? seoToMetadata(offer.seo, { preview: Boolean(preview) }) : {};
}

export default async function OfferPage({ params, searchParams }: Props) {
    const [{ slug }, sp, site] = await Promise.all([params, searchParams, getSiteBundle()]);
    const preview = firstParam(sp.preview);
    const offer = await getDetail<Offer>("offers", slug, preview);
    if (!offer) notFound();
    const theme = site?.theme;

    return (
        <>
            <PreviewBanner show={Boolean(preview)} />
            <JsonLd seo={offer.seo} />
            <TrackView refType="offer" refId={offer.id} label={offer.title} disabled={Boolean(preview)} />
            <PageContainer narrow>
                <Breadcrumbs seo={offer.seo} />
                <CmsImage image={offer.image} fallbackAlt={offer.title} eager className="w-full rounded-2xl object-cover max-h-80 mb-8" />
                {offer.discount && <span className="rounded-full bg-[#FF7626]/10 text-[#FF7626] text-xs font-semibold px-3 py-1">{offer.discount}</span>}
                <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{offer.title}</h1>

                <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-[#eaf4fb] dark:bg-gray-800 p-5 text-sm">
                    {offer.couponCode && <div><dt className="text-xs text-gray-500">Coupon code</dt><dd className="font-bold text-lg text-gray-900 dark:text-gray-100">{offer.couponCode}</dd></div>}
                    {offer.minBookingAmount ? <div><dt className="text-xs text-gray-500">Minimum booking</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formatFare(offer.minBookingAmount, theme)}</dd></div> : null}
                    {offer.validFrom && <div><dt className="text-xs text-gray-500">Valid from</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(offer.validFrom, theme?.dateFormat)}</dd></div>}
                    {offer.validTill && <div><dt className="text-xs text-gray-500">Valid till</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(offer.validTill, theme?.dateFormat)}</dd></div>}
                </dl>

                <RichText html={offer.description} className="mt-8" />
                {offer.terms && (
                    <section className="mt-10">
                        <SectionHeading>Terms &amp; conditions</SectionHeading>
                        <RichText html={offer.terms} className="text-[13px]" />
                    </section>
                )}
                <Link href="/" className="mt-10 inline-flex h-12 items-center rounded-full bg-[#FF7626] px-8 text-sm font-semibold text-white hover:bg-[#e6661f]">Search flights</Link>
            </PageContainer>
        </>
    );
}
