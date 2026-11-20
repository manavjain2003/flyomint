import Link from "next/link";
import { isExternal, safeHref } from "@/app/lib/cms/format";
import type { SiteBundle } from "@/app/lib/cms/types";

function Strip({ text, link, tone }: { text: string; link?: string; tone: string }) {
    const href = link ? safeHref(link) : "";
    const inner = <span className="text-[13px] font-medium">{text}</span>;
    return (
        <div className={`${tone} text-center py-2 px-4`}>
            {href && href !== "#" ? (
                isExternal(href)
                    ? <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">{inner}</a>
                    : <Link href={href} className="hover:underline">{inner}</Link>
            ) : inner}
        </div>
    );
}

/** Top offer strip (Header settings) and the live announcement bar. Rendered below the fixed navbar. */
export default function SiteBanners({ site }: { site: SiteBundle | null }) {
    if (!site) return null;
    const { header, announcementBar } = site;
    const showOffer = header.showTopOfferStrip && header.topOfferText;
    if (!showOffer && !announcementBar) return null;
    return (
        <div>
            {showOffer && <Strip text={header.topOfferText} link={header.topOfferLink} tone="bg-[#1c8fc7] text-white" />}
            {announcementBar && <Strip text={announcementBar.message} link={announcementBar.link} tone="bg-[#FF7626] text-white" />}
        </div>
    );
}
