import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/components/cms/Breadcrumbs";
import CmsImage from "@/app/components/cms/CmsImage";
import FaqAccordion from "@/app/components/cms/FaqAccordion";
import JsonLd from "@/app/components/cms/JsonLd";
import Pagination from "@/app/components/cms/Pagination";
import RichText from "@/app/components/cms/RichText";
import RouteCards from "@/app/components/cms/RouteCards";
import RouteSearchButton from "@/app/components/cms/RouteSearchButton";
import { EmptyState, PageContainer, PageTitle, PreviewBanner, SectionHeading } from "@/app/components/cms/Layout";
import { TrackView } from "@/app/components/cms/Tracking";
import { firstParam, getDetail, getSiteBundle, listResource } from "@/app/lib/cms/server";
import { cleanHtml } from "@/app/lib/cms/sanitize";
import { formatFare } from "@/app/lib/cms/format";
import { seoToMetadata } from "@/app/lib/cms/seo";
import type { Route } from "@/app/lib/cms/types";
import type { RouteCard } from "@/app/lib/cms/types";

type SP = Record<string, string | string[] | undefined>;
export type RouteType = "domestic" | "international";

const TITLES: Record<RouteType, { title: string; intro: string; base: string }> = {
    domestic: { title: "Domestic Flights", intro: "Compare fares and book popular domestic routes.", base: "/domestic-flights" },
    international: { title: "International Flights", intro: "Compare fares and book popular international routes.", base: "/international-flights" },
};

export function routeListMetadata(type: RouteType): Metadata {
    const t = TITLES[type];
    return { title: t.title, description: t.intro, alternates: { canonical: t.base } };
}

export async function RouteListPage({ type, searchParams }: { type: RouteType; searchParams: Promise<SP> }) {
    const sp = await searchParams;
    const page = Number(firstParam(sp.page)) || 1;
    const q = firstParam(sp.q);
    const [data, site] = await Promise.all([listResource<RouteCard>("routes", { type, page, limit: 24, q }), getSiteBundle()]);
    const t = TITLES[type];
    return (
        <PageContainer>
            <PageTitle eyebrow="Flights" title={t.title} intro={t.intro} />
            <form action={t.base} className="mb-8 flex gap-3 max-w-md">
                <input name="q" defaultValue={q} placeholder="Search routes, e.g. Delhi" aria-label="Search routes" className="flex-1 h-11 px-5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-[#1c8fc7]/30" />
                <button className="h-11 px-6 rounded-full bg-[#FF7626] text-white text-sm font-semibold">Search</button>
            </form>
            {data && data.items.length > 0 ? <RouteCards routes={data.items} theme={site?.theme} /> : <EmptyState message="No routes found." />}
            {data && <Pagination page={data.page} pages={data.pages} basePath={t.base} params={{ q }} />}
        </PageContainer>
    );
}

type DetailProps = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

export async function routeDetailMetadata({ params, searchParams }: DetailProps): Promise<Metadata> {
    const [{ slug }, sp] = await Promise.all([params, searchParams]);
    const preview = firstParam(sp.preview);
    const route = await getDetail<Route>("routes", slug, preview);
    return route ? seoToMetadata(route.seo, { preview: Boolean(preview) }) : {};
}

function Chips({ title, routes }: { title: string; routes: RouteCard[] }) {
    if (routes.length === 0) return null;
    return (
        <section className="mt-12">
            <SectionHeading>{title}</SectionHeading>
            <div className="flex flex-wrap gap-2">
                {routes.map((r) => (
                    <Link key={r.id} href={r.path} className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-[#1c8fc7] hover:text-[#1c8fc7]">{r.name}</Link>
                ))}
            </div>
        </section>
    );
}

export async function RouteDetailPage({ type, params, searchParams }: DetailProps & { type: RouteType }) {
    const [{ slug }, sp, site] = await Promise.all([params, searchParams, getSiteBundle()]);
    const preview = firstParam(sp.preview);
    const route = await getDetail<Route>("routes", slug, preview);
    if (!route || route.type !== type) notFound();
    const theme = site?.theme;
    const fromCode = route.fromCity?.code || "";
    const toCode = route.toCity?.code || "";
    const info: [string, string | number | undefined][] = [
        ["Duration", route.duration], ["Distance", route.distance], ["Flights per day", route.flightsPerDay],
        ["First flight", route.firstFlight], ["Last flight", route.lastFlight], ["Best time to book", route.bestTimeToBook],
    ];
    const infoRows = info.filter(([, v]) => v !== undefined && v !== "" && v !== null);
    const airlines = (route.airlines ?? []).filter((a) => a && a.slug);

    return (
        <>
            <PreviewBanner show={Boolean(preview)} />
            <JsonLd seo={route.seo} />
            <TrackView refType="route" refId={route.id} label={route.name} disabled={Boolean(preview)} />
            <PageContainer>
                <Breadcrumbs seo={route.seo} />
                <div className="grid lg:grid-cols-[1fr_340px] gap-10 items-start">
                    <div className="min-w-0">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{route.heading || route.name}</h1>
                        <CmsImage image={route.bannerImage} fallbackAlt={route.name} eager className="mt-6 w-full rounded-2xl object-cover max-h-80" />
                        <RichText html={route.description} className="mt-6" />
                    </div>

                    <aside className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 lg:sticky lg:top-24">
                        <p className="text-sm text-gray-500">{route.fromCity?.name} ({fromCode}) → {route.toCity?.name} ({toCode})</p>
                        {theme?.showFareOnRoutePages !== false && route.cheapestFare !== null && (
                            <p className="mt-3 text-xs text-gray-500">
                                {theme?.fareLabel || "Starting from"}
                                <span className="block text-3xl font-bold text-[#FF7626]">{formatFare(route.cheapestFare, theme)}</span>
                                {theme?.fareDisclaimer && <span className="block mt-1 text-[11px] text-gray-400">{theme.fareDisclaimer}</span>}
                            </p>
                        )}
                        <RouteSearchButton from={fromCode} to={toCode} fromCity={route.fromCity?.name} toCity={route.toCity?.name} className="mt-5 w-full h-12 rounded-full bg-[#FF7626] text-white text-sm font-semibold hover:bg-[#e6661f]" />
                    </aside>
                </div>

                {infoRows.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>Route information</SectionHeading>
                        <dl className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {infoRows.map(([k, v]) => (
                                <div key={k} className="rounded-2xl bg-[#eaf4fb] dark:bg-gray-800 p-4">
                                    <dt className="text-xs text-gray-500">{k}</dt>
                                    <dd className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                )}

                {route.popularFlights && route.popularFlights.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>Popular flights</SectionHeading>
                        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase text-gray-500">
                                    <tr><th className="px-4 py-3">Airline</th><th className="px-4 py-3">Flight</th><th className="px-4 py-3">Departure</th><th className="px-4 py-3">Arrival</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3 text-right">Fare</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                                    {route.popularFlights.map((f, i) => (
                                        <tr key={i}><td className="px-4 py-3">{f.airline}</td><td className="px-4 py-3">{f.flightNumber}</td><td className="px-4 py-3">{f.departure}</td><td className="px-4 py-3">{f.arrival}</td><td className="px-4 py-3">{f.duration}</td><td className="px-4 py-3 text-right font-semibold">{formatFare(f.fare, theme)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {airlines.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>Airlines on this route</SectionHeading>
                        <div className="flex flex-wrap gap-3">
                            {airlines.map((a) => (
                                <Link key={a.id} href={`/airlines/${a.slug}`} className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-[#1c8fc7]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={a.logo?.url || `https://www.gstatic.com/flights/airline_logos/70px/${a.code}.png`} alt="" className="h-5 w-auto" loading="lazy" />
                                    {a.name}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {route.deals.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>Deals on this route</SectionHeading>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {route.deals.map((d) => (
                                <div key={d.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{d.title}</p>
                                    {d.fare !== null && <p className="mt-2 text-lg font-bold text-[#FF7626]">{formatFare(d.fare, theme)}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {route.faqs.length > 0 && (
                    <section className="mt-12">
                        <SectionHeading>Frequently asked questions</SectionHeading>
                        <FaqAccordion items={route.faqs.map((f) => ({ question: f.question, answer: cleanHtml(f.answer) }))} defaultOpen={null} />
                    </section>
                )}

                <Chips title="Return & related routes" routes={route.relatedRoutes} />
                <Chips title="Other routes to this destination" routes={route.nearbyRoutes} />
                <Chips title={`Popular from ${route.fromCity?.name ?? "this city"}`} routes={route.popularFromCity} />

                {route.seoText && <RichText html={route.seoText} className="mt-14 text-[13px]" />}
            </PageContainer>
        </>
    );
}
