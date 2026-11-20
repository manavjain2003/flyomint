import type { SiteTheme } from "./types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Applies theme.fareFormat ("{symbol} {amount}") and theme.currencySymbol. */
export function formatFare(fare: number | null | undefined, theme?: Partial<SiteTheme> | null): string {
    if (fare === null || fare === undefined || Number.isNaN(Number(fare))) return "";
    const symbol = theme?.currencySymbol || "₹";
    const amount = Number(fare).toLocaleString("en-IN");
    return (theme?.fareFormat || "{symbol} {amount}").replace("{symbol}", symbol).replace("{amount}", amount);
}

/** Supports the tokens the CMS offers: YYYY, MMMM, MMM, MM, DD, D (12h/24h handled separately). */
export function formatDate(value?: string | Date | null, pattern = "DD MMM YYYY"): string {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const day = d.getUTCDate();
    const month = d.getUTCMonth();
    return pattern
        .replace("YYYY", String(d.getUTCFullYear()))
        .replace("MMMM", MONTHS[month])
        .replace("MMM", MONTHS[month].slice(0, 3))
        .replace("MM", String(month + 1).padStart(2, "0"))
        .replace("DD", String(day).padStart(2, "0"))
        .replace(/\bD\b/, String(day));
}

export const isExternal = (url?: string) => /^https?:\/\//i.test(url || "");

/** Only allow http(s) and site-relative links coming from the CMS. */
export function safeHref(url?: string | null): string {
    if (!url) return "#";
    const trimmed = url.trim();
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
    if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
    return "#";
}
