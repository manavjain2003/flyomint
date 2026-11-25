import SectionShell from "@/app/components/cms/SectionShell";
import RouteCards, { SearchCard } from "@/app/components/cms/RouteCards";
import CmsImage from "@/app/components/cms/CmsImage";
import { formatFare, isExternal, safeHref } from "@/app/lib/cms/format";
import type {
    DealCard, MobileAppDoc, RouteCard, SiteTheme, Testimonial, TrustGroups, WhyItem,
} from "@/app/lib/cms/types";

type Common = { heading?: string; text?: string };

export function RoutesSection({ routes, theme, type, heading, text }: Common & { routes: RouteCard[]; theme: SiteTheme | null; type: "domestic" | "international" }) {
    if (routes.length === 0) return null;
    return (
        <SectionShell
            eyebrow={type === "domestic" ? "Domestic" : "International"}
            title={heading || (type === "domestic" ? "Popular domestic routes." : "Popular international routes.")}
            text={text}
        >
            <RouteCards routes={routes} theme={theme} />
        </SectionShell>
    );
}

export function FareDealsSection({ deals, theme, heading, text }: Common & { deals: DealCard[]; theme: SiteTheme | null }) {
    if (deals.length === 0) return null;
    return (
        <SectionShell eyebrow="Cheapest fares" title={heading || "Low fares, right now."} text={text}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {deals.map((d) => {
                    const body = (
                        <>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{d.section.replace("-", " ")}</p>
                            <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{d.title}</p>
                            {d.route && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{d.route.from.code} → {d.route.to.code}</p>}
                            {d.fare !== null && (
                                <p className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                                    {theme?.fareLabel || "Starting from"}
                                    <span className="block text-lg font-bold text-[#FF7626]">{formatFare(d.fare, theme)}</span>
                                </p>
                            )}
                        </>
                    );
                    const cls = "block bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-shadow";
                    // A deal on a route runs that search; any other deal uses the link set in the CMS (if it is not a page we no longer have).
                    if (d.route) {
                        return (
                            <SearchCard key={d.id} from={d.route.from.code} to={d.route.to.code} fromCity={d.route.from.name} toCity={d.route.to.name} className={cls}>{body}</SearchCard>
                        );
                    }
                    const href = safeHref(d.link);
                    if (href === "#") return <div key={d.id} className={cls}>{body}</div>;
                    return isExternal(href)
                        ? <a key={d.id} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
                        : <a key={d.id} href={href} className={cls}>{body}</a>;
                })}
            </div>
            {theme?.fareDisclaimer && <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{theme.fareDisclaimer}</p>}
        </SectionShell>
    );
}

export function WhyChooseUsSection({ items, heading, text }: Common & { items: WhyItem[] }) {
    if (!items || items.length === 0) return null;
    return (
        <SectionShell eyebrow="Why Flyomint" title={heading || "Why choose us."} text={text}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {items.map((it, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <span className="grid place-items-center w-11 h-11 rounded-full bg-[#eaf4fb] ring-1 ring-sky-100 dark:ring-0 mb-4">
                            <CmsImage image={it.icon} fallbackAlt="" className="w-6 h-6 object-contain" />
                        </span>
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{it.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{it.text}</p>
                    </div>
                ))}
            </div>
        </SectionShell>
    );
}

export function TrustSection({ groups, heading, text }: Common & { groups: TrustGroups }) {
    const { badges, counters, certificates } = groups;
    if (badges.length + counters.length + certificates.length === 0) return null;
    return (
        <SectionShell eyebrow="Trusted" title={heading || "Travel with confidence."} text={text}>
            {counters.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {counters.map((c) => (
                        <div key={c.id} className="text-center rounded-2xl bg-[#eaf4fb] dark:bg-gray-800 py-6">
                            <p className="text-3xl font-bold text-[#1c8fc7]">{c.value}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{c.title}</p>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
                {[...badges, ...certificates].map((b) => (
                    <div key={b.id} className="flex items-center gap-3">
                        <span className="grid place-items-center rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200 dark:ring-gray-700">
                            <CmsImage image={b.image} fallbackAlt={b.title} className="h-10 w-auto object-contain" />
                        </span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{b.title}</span>
                    </div>
                ))}
            </div>
        </SectionShell>
    );
}

export function TestimonialsSection({ items, heading, text }: Common & { items: Testimonial[] }) {
    if (items.length === 0) return null;
    return (
        <SectionShell eyebrow="Reviews" title={heading || "Loved by travellers."} text={text}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((t) => (
                    <figure key={t.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
                        <div className="text-[#FF7626] mb-3" aria-label={`${t.rating} out of 5 stars`}>{"★".repeat(t.rating)}<span className="text-gray-300 dark:text-gray-600">{"★".repeat(5 - t.rating)}</span></div>
                        <blockquote className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-1">{t.review}</blockquote>
                        <figcaption className="mt-5 flex items-center gap-3">
                            {t.photo?.url ? (
                                <CmsImage image={t.photo} fallbackAlt={t.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <span className="grid place-items-center w-10 h-10 rounded-full bg-[#eaf4fb] dark:bg-sky-500/15 text-[#0b78ad] dark:text-sky-300 font-bold">{t.name.charAt(0)}</span>
                            )}
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.name}</p>
                                {t.city && <p className="text-xs text-gray-500 dark:text-gray-400">{t.city}</p>}
                            </div>
                        </figcaption>
                    </figure>
                ))}
            </div>
        </SectionShell>
    );
}

export function MobileAppSection({ app, heading, text }: Common & { app: MobileAppDoc | null }) {
    if (!app || (!app.androidUrl && !app.iosUrl)) return null;
    const btn = "inline-flex h-11 items-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 text-sm font-semibold hover:opacity-90";
    return (
        <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="rounded-3xl bg-[#eaf4fb] dark:bg-gray-800 px-6 sm:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{heading || app.heading || "Download our app"}</h2>
                        {(text || app.text) && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-lg">{text || app.text}</p>}
                        <div className="mt-6 flex flex-wrap gap-3">
                            {app.androidUrl && <a href={safeHref(app.androidUrl)} target="_blank" rel="noopener noreferrer" className={btn}>Google Play</a>}
                            {app.iosUrl && <a href={safeHref(app.iosUrl)} target="_blank" rel="noopener noreferrer" className={btn}>App Store</a>}
                        </div>
                    </div>
                    <CmsImage image={app.qrImage} fallbackAlt="Scan to download the app" className="w-32 h-32 rounded-xl bg-white p-2" />
                </div>
            </div>
        </section>
    );
}
