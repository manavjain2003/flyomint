export type CmsImage = { url?: string; alt?: string } | null | undefined;

export type CmsSeo = {
    title: string;
    description: string;
    keywords: string;
    canonical: string;
    robots: string;
    og: { title: string; description: string; image: string; url: string; type: string };
    breadcrumbs: { name: string; url: string }[];
    jsonLd: Record<string, unknown>[];
};

export type CmsFaq = { question: string; answer: string };
export type MenuItem = { label: string; url: string; target?: "_self" | "_blank"; isActive?: boolean; children?: MenuItem[] };
export type CityBrief = { id?: string; name: string; code: string; country?: string; image?: CmsImage };
export type FooterLink = { label: string; url: string };

export type RouteCard = {
    id: string;
    name: string;
    slug: string;
    type: "domestic" | "international";
    path: string;
    from: { name?: string; code?: string };
    to: { name?: string; code?: string };
    fare: number | null;
};

export type DealCard = {
    id: string;
    section: string;
    title: string;
    link?: string;
    fare: number | null;
    route: RouteCard | null;
};

export type SiteTheme = {
    siteName: string;
    logo: CmsImage;
    favicon: CmsImage;
    primaryColor: string;
    secondaryColor: string;
    currencySymbol: string;
    fareFormat: string;
    dateFormat: string;
    fareLabel: string;
    showFareOnRoutePages: boolean;
    fareDisclaimer: string;
};

export type SearchBoxConfig = {
    tripTypes: { oneWay: boolean; roundTrip: boolean; multiCity: boolean };
    defaultFrom: CityBrief | null;
    defaultTo: CityBrief | null;
    popularCities: CityBrief[];
    maxAdults: number;
    maxChildren: number;
    maxInfants: number;
    cabinClasses: { economy: boolean; premiumEconomy: boolean; business: boolean; first: boolean };
    specialFares: { student: boolean; seniorCitizen: boolean; armedForces: boolean; doctorsNurses: boolean };
    directFlightsOption: boolean;
    maxAdvanceBookingDays: number;
    placeholders: { from: string; to: string; departure: string; return: string; travellers: string };
    errorMessages: { sameCity: string; missingFrom: string; missingTo: string; missingDate: string };
};

export type TrustItem = { id: string; kind: string; title: string; image?: CmsImage; value?: string; link?: string };
export type TrustGroups = {
    badges: TrustItem[];
    airlinePartners: TrustItem[];
    paymentPartners: TrustItem[];
    certificates: TrustItem[];
    counters: TrustItem[];
};

export type SiteBundle = {
    header: {
        logo: CmsImage; phone: string; email: string; showAuthButtons: boolean; showLanguageSelector: boolean;
        showCurrencySelector: boolean; stickyHeader: boolean; showTopOfferStrip: boolean; topOfferText: string; topOfferLink: string;
    };
    theme: SiteTheme;
    whatsapp: {
        enabled: boolean; number: string; defaultMessage: string; showCallButton: boolean; callNumber: string;
        liveChatCode: string; visibility: "all" | "selected"; selectedPaths: string;
    };
    mobileApp: { heading: string; text: string; androidUrl: string; iosUrl: string; qrImage: CmsImage };
    cookieConsent: { cookieConsentEnabled: boolean; cookieMessage: string; cookieButtonText: string; cookiePolicyLink: string };
    settings: {
        phone: string; email: string; address: string; social: Record<string, string>;
        googleAnalyticsId: string; searchConsoleCode: string; maintenanceMode: boolean; maintenanceMessage: string;
    };
    searchBox: SearchBoxConfig;
    footer: {
        quickLinks: FooterLink[]; phone: string; email: string; address: string; social: Record<string, string>;
        showPaymentLogos: boolean; showAppButtons: boolean; showCertificates: boolean; seoText: string; copyright: string;
        popularDomesticRoutes: FooterLink[]; popularInternationalRoutes: FooterLink[];
        popularAirlines: FooterLink[]; popularDestinations: FooterLink[];
        paymentPartners: TrustItem[]; certificates: TrustItem[];
    };
    menus: { main: MenuItem[]; footer: MenuItem[] };
    announcementBar: { id: string; message: string; link?: string } | null;
    popups: Popup[];
    seo: {
        headerScripts: string; footerScripts: string; gtmId: string; facebookPixelId: string;
        notFound: { title: string; message: string; buttonLabel: string };
    };
};

export type Popup = {
    id: string; name: string; kind: "offer" | "newsletter"; title?: string; text?: string; image?: CmsImage;
    buttonLabel?: string; buttonLink?: string; trigger: "on-load" | "after-delay" | "on-exit";
    delaySeconds: number; oncePerVisitor: boolean; showOnMobile: boolean;
};

export type Banner = {
    id: string; title: string; text?: string; buttonLabel?: string; buttonLink?: string;
    desktopImage?: CmsImage; mobileImage?: CmsImage;
};
export type Airline = {
    id: string; name: string; slug: string; code: string; logo?: CmsImage; type?: string; about?: string;
    baggage?: { cabin?: string; checkin?: string }; webCheckin?: string; cancellationRefund?: string;
    customerCare?: { phone?: string; email?: string; website?: string };
    popularRoutes?: RouteCard[]; offers?: Offer[]; faqs?: CmsFaq[]; seo: CmsSeo;
};
export type Offer = {
    id: string; title: string; slug: string; image?: CmsImage; description?: string; offerType?: string;
    couponCode?: string; discount?: string; minBookingAmount?: number; terms?: string;
    validFrom?: string; validTill?: string; seo: CmsSeo;
};
export type Destination = {
    id: string; name: string; slug: string; kind?: string; heading?: string; description?: string; bannerImage?: CmsImage;
    cheapestFares?: { fromCity?: { name?: string; code?: string }; fare?: number }[]; popularRoutes?: RouteCard[];
    airlines?: Airline[]; bestTimeToVisit?: string; travelTips?: string; faqs?: CmsFaq[]; seo: CmsSeo;
};
export type Route = {
    id: string; name: string; slug: string; type: "domestic" | "international"; heading?: string; description?: string;
    bannerImage?: CmsImage; fromCity?: CityBrief; toCity?: CityBrief; airlines?: Airline[]; duration?: string;
    distance?: string; flightsPerDay?: number; firstFlight?: string; lastFlight?: string; bestTimeToBook?: string;
    popularFlights?: { airline?: string; flightNumber?: string; departure?: string; arrival?: string; duration?: string; fare?: number }[];
    seoText?: string; cheapestFare: number | null; relatedRoutes: RouteCard[]; nearbyRoutes: RouteCard[];
    popularFromCity: RouteCard[]; deals: DealCard[]; faqs: CmsFaq[]; seo: CmsSeo;
};
export type Blog = {
    id: string; title: string; slug: string; image?: CmsImage; excerpt?: string; content?: string; category?: string;
    tags?: string[]; author?: string; views?: number; createdAt: string; publishAt?: string; seo: CmsSeo;
    relatedBlogs?: Blog[]; popularBlogs?: Blog[]; shareLinks?: { whatsapp: string; facebook: string; twitter: string };
};
export type Guide = { id: string; title: string; slug: string; content?: string; seo: CmsSeo };
export type Testimonial = { id: string; name: string; city?: string; rating: number; review: string; photo?: CmsImage };
export type FaqDoc = { id: string; category: string; question: string; answer: string; order: number };
export type CmsPage = {
    id: string; key: string; kind: "static" | "special-fare"; title?: string; heading?: string; banner?: CmsImage;
    content?: string; eligibility?: string; requiredDocuments?: string; faqs?: CmsFaq[]; seo: CmsSeo; preview?: boolean;
    updatedAt?: string;
};
export type HelpCenter = {
    title: string; phones: string; emails: string; supportTimings: string; officeAddress: string; faqs: CmsFaq[]; seo: CmsSeo;
};
export type ContactPageDoc = {
    title: string; intro: string; officeName: string; address: string; phone: string; email: string; mapEmbedUrl: string;
    submitLabel: string; thankYouMessage: string; captchaSiteKey: string; seo: CmsSeo;
};

export type HomeSection = { key: string; label: string; enabled: boolean; heading: string; text: string; limit?: number; data: unknown };
export type HomePage = { sections: HomeSection[]; seo: CmsSeo };
export type ListResult<T> = { items: T[]; total: number; page: number; pages: number };
export type WhyItem = { icon?: CmsImage; title: string; text: string };
export type MobileAppDoc = SiteBundle["mobileApp"];
