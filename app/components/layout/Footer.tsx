import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import RichText from "@/app/components/cms/RichText";
import CmsImage from "@/app/components/cms/CmsImage";
import { isExternal, safeHref } from "@/app/lib/cms/format";
import type { FooterLink, MenuItem, SiteBundle } from "@/app/lib/cms/types";

/** App pages that are not CMS content. */
const PRODUCT_LINKS: FooterLink[] = [
    { url: "/", label: "Flight search" },
    { url: "/my-bookings", label: "My bookings" },
    { url: "/group-booking", label: "Group bookings" },
    { url: "/guides", label: "Travel guides" },
];
const SUPPORT_LINKS: FooterLink[] = [
    { url: "/help-center", label: "Help center" },
    { url: "/contact-us", label: "Contact us" },
    { url: "/faqs", label: "FAQs" },
];

const SOCIAL = [
    { key: "twitter", Icon: FaTwitter, label: "Twitter" },
    { key: "instagram", Icon: FaInstagram, label: "Instagram" },
    { key: "linkedin", Icon: FaLinkedinIn, label: "LinkedIn" },
    { key: "facebook", Icon: FaFacebookF, label: "Facebook" },
    { key: "youtube", Icon: FaYoutube, label: "YouTube" },
] as const;

function FooterAnchor({ link }: { link: FooterLink }) {
    const href = safeHref(link.url);
    const cls = "text-[13px] text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition";
    return isExternal(href)
        ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{link.label}</a>
        : <Link href={href} className={cls}>{link.label}</Link>;
}

function Group({ heading, links }: { heading: string; links: FooterLink[] }) {
    if (links.length === 0) return null;
    return (
        <div>
            <h4 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-3 tracking-wide">{heading}</h4>
            <ul className="space-y-2">
                {links.map((l) => (
                    <li key={l.url + l.label}><FooterAnchor link={l} /></li>
                ))}
            </ul>
        </div>
    );
}

const menuToLinks = (items: MenuItem[]): FooterLink[] =>
    items.filter((i) => i.isActive !== false).map(({ label, url }) => ({ label, url }));

export default function Footer({ site }: { site: SiteBundle | null }) {
    const f = site?.footer;
    const logo = site?.theme?.logo?.url || site?.header?.logo?.url;
    const social = f?.social ?? {};
    const phone = f?.phone || site?.settings?.phone;
    const email = f?.email || site?.settings?.email;
    const address = f?.address || site?.settings?.address;
    const menuLinks = menuToLinks(site?.menus?.footer ?? []);
    const quick = menuLinks.length > 0 ? menuLinks : f?.quickLinks ?? [];
    const year = new Date().getFullYear();
    const siteName = site?.theme?.siteName || "Flyomint";
    const app = site?.mobileApp;

    return (
        <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[1.3fr_repeat(3,1fr)]">
                    <div className="space-y-3 sm:col-span-2 lg:col-span-4 xl:col-span-1">
                        {logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logo} alt={siteName} className="h-7 w-auto" />
                        ) : (
                            <Image src="/assets/logo.jpg" alt={siteName} width={120} height={30} className="h-7 w-auto" />
                        )}
                        <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400 max-w-sm">
                            Flights that fit your schedule, at prices we stand behind. Real-time fares, no surprises at checkout.
                        </p>
                        {(phone || email || address) && (
                            <address className="not-italic text-[13px] text-gray-500 dark:text-gray-400 space-y-1">
                                {phone && <p><a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="hover:text-[#FF7626]">{phone}</a></p>}
                                {email && <p><a href={`mailto:${email}`} className="hover:text-[#FF7626]">{email}</a></p>}
                                {address && <p className="whitespace-pre-line">{address}</p>}
                            </address>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                            {SOCIAL.filter(({ key }) => social[key]).map(({ key, Icon, label }) => (
                                <a
                                    key={key}
                                    href={safeHref(social[key])}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 grid place-items-center transition"
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <Group heading="Product" links={PRODUCT_LINKS} />
                    <Group heading="Company" links={quick} />
                    <Group heading="Support" links={SUPPORT_LINKS} />
                </div>

                {f?.seoText && <RichText html={f.seoText} className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 text-xs" />}

                {((f?.paymentPartners?.length ?? 0) > 0 || (f?.certificates?.length ?? 0) > 0 || (f?.showAppButtons && (app?.androidUrl || app?.iosUrl))) && (
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-x-8 gap-y-4">
                        {[...(f?.paymentPartners ?? []), ...(f?.certificates ?? [])].map((p) => (
                            <CmsImage key={p.id} image={p.image} fallbackAlt={p.title} className="h-7 w-auto object-contain" />
                        ))}
                        {f?.showAppButtons && app?.androidUrl && (
                            <a href={safeHref(app.androidUrl)} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold rounded-full border border-gray-200 dark:border-gray-700 px-4 py-1.5 text-gray-700 dark:text-gray-300">Google Play</a>
                        )}
                        {f?.showAppButtons && app?.iosUrl && (
                            <a href={safeHref(app.iosUrl)} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold rounded-full border border-gray-200 dark:border-gray-700 px-4 py-1.5 text-gray-700 dark:text-gray-300">App Store</a>
                        )}
                    </div>
                )}

                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col-reverse sm:flex-row gap-3 items-center justify-between">
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">{f?.copyright || `© ${year} ${siteName}. All rights reserved.`}</p>
                    <div className="flex items-center gap-5 text-[11px] text-blue-500 dark:text-blue-400">
                        <span>IATA accredited</span>
                        <span>PCI-DSS compliant</span>
                        <span>24×7 support</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
