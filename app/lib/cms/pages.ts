/** Fixed CMS pages (key -> default URL). Mirrors flyomint-cms/server/src/constants/paths.js. */
export const CMS_PAGE_PATHS: Record<string, string> = {
    about: "/about-us",
    privacy: "/privacy-policy",
    terms: "/terms-and-conditions",
    disclaimer: "/disclaimer",
    "payment-refund": "/payment-and-refund-policy",
    "student-fare": "/student-fare",
    "senior-citizen-fare": "/senior-citizen-fare",
    "armed-forces-fare": "/armed-forces-fare",
    "doctors-nurses-fare": "/doctors-and-nurses-fare",
};

export const pageKeyForSlug = (slug: string): string | undefined =>
    Object.entries(CMS_PAGE_PATHS).find(([, path]) => path === `/${slug}`)?.[0];
