import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import Hero from "@/app/components/home/Home";
import BannerSlider from "@/app/components/home/BannerSlider";
import LimitedDeals from "@/app/components/home/LimitedDeals";
import AirlinePartners from "@/app/components/home/AirlinePartners";
import FaqSection from "@/app/components/home/FaqSection";
import NewsletterBox from "@/app/components/home/NewsletterBox";
import {
    FareDealsSection, MobileAppSection, RoutesSection, TestimonialsSection, TrustSection, WhyChooseUsSection,
} from "@/app/components/home/CmsSections";
import JsonLd from "@/app/components/cms/JsonLd";
import { getHome, getSiteBundle } from "@/app/lib/cms/server";
import { seoToMetadata } from "@/app/lib/cms/seo";
import type {
    Airline, Banner, DealCard, FaqDoc, HomeSection, Offer, RouteCard, SearchBoxConfig, Testimonial, TrustGroups, WhyItem, MobileAppDoc,
} from "@/app/lib/cms/types";

export async function generateMetadata(): Promise<Metadata> {
    const home = await getHome();
    return home ? seoToMetadata(home.seo) : {};
}

export default async function HomePage() {
    const [home, site] = await Promise.all([getHome(), getSiteBundle()]);
    const theme = site?.theme ?? null;

    // CMS unreachable: the booking search still works.
    if (!home) return <Hero config={site?.searchBox} />;

    // Banners become the hero backdrop when the search box section is on; otherwise they are a standalone slider.
    const sectionOn = (key: string) => home.sections.find((x) => x.key === key && x.enabled);
    const heroBanners = ((sectionOn("banners")?.data as Banner[] | undefined) ?? []).filter((b) => b.desktopImage?.url);
    const searchOn = Boolean(sectionOn("searchBox"));

    const render = (s: HomeSection): ReactNode => {
        const common = { heading: s.heading || undefined, text: s.text || undefined };
        const data = s.data;
        switch (s.key) {
            case "banners": return searchOn ? null : <BannerSlider banners={(data as Banner[]) ?? []} />;
            case "searchBox": return <Hero config={(data as SearchBoxConfig | null) ?? site?.searchBox} banners={heroBanners} />;
            case "domesticRoutes": return <RoutesSection type="domestic" routes={(data as RouteCard[]) ?? []} theme={theme} {...common} />;
            case "internationalRoutes": return <RoutesSection type="international" routes={(data as RouteCard[]) ?? []} theme={theme} {...common} />;
            case "cheapestDeals": return <FareDealsSection deals={(data as DealCard[]) ?? []} theme={theme} {...common} />;
            case "offers": return <LimitedDeals offers={(data as Offer[]) ?? []} dateFormat={theme?.dateFormat} {...common} />;
            case "airlines": return <AirlinePartners airlines={(data as Airline[]) ?? []} {...common} />;
            // Destinations and blog posts have no pages on this site, so these CMS sections are not shown.
            case "destinations":
            case "blogs": return null;
            case "whyChooseUs": return <WhyChooseUsSection items={(data as WhyItem[]) ?? []} {...common} />;
            case "trustBadges": return data ? <TrustSection groups={data as TrustGroups} {...common} /> : null;
            case "testimonials": return <TestimonialsSection items={(data as Testimonial[]) ?? []} {...common} />;
            case "faqs": return <FaqSection faqs={(data as FaqDoc[]) ?? []} {...common} />;
            case "newsletter": return <NewsletterBox {...common} />;
            case "mobileApp": return <MobileAppSection app={(data as MobileAppDoc) ?? site?.mobileApp ?? null} {...common} />;
            default: return null;
        }
    };

    return (
        <>
            <JsonLd seo={home.seo} />
            {home.sections.map((s) => (
                <Fragment key={s.key}>{render(s)}</Fragment>
            ))}
        </>
    );
}
