
import type {
    ContactPageDoc, HelpCenter, HomePage, ListResult, SiteBundle,
} from "./types";

export const CMS_API_URL = (process.env.CMS_API_URL || process.env.NEXT_PUBLIC_CMS_API_URL || "").replace(/\/$/, "");
export const REVALIDATE_SECONDS = 60; // CMS itself caches public responses for 60s

export type CmsResult<T> = { ok: true; data: T } | { ok: false; status: number };

type Opts = { revalidate?: number | false; noStore?: boolean };

export async function cmsFetch<T>(path: string, opts: Opts = {}): Promise<CmsResult<T>> {
    if (!CMS_API_URL) {
        console.error("[cms] NEXT_PUBLIC_CMS_API_URL is not set");
        return { ok: false, status: 0 };
    }
    try {
        const res = await fetch(`${CMS_API_URL}${path}`, {
            ...(opts.noStore
                ? { cache: "no-store" as const }
                : { next: { revalidate: opts.revalidate ?? REVALIDATE_SECONDS } }),
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return { ok: false, status: res.status };
        return { ok: true, data: (await res.json()) as T };
    } catch (err) {
        console.error(`[cms] GET ${path} failed:`, (err as Error).message);
        return { ok: false, status: 0 };
    }
}

/** Optional data: returns null on any failure (used for layout/home so the site degrades gracefully). */
export async function cmsOptional<T>(path: string, opts?: Opts): Promise<T | null> {
    const r = await cmsFetch<T>(path, opts);
    return r.ok ? r.data : null;
}

/**
 * Required data for a page: 404 -> notFound() is handled by the caller via `null`,
 * any other failure throws so Next shows error.tsx and does NOT cache a broken page.
 */
export async function cmsRequired<T>(path: string, opts?: Opts): Promise<T | null> {
    const r = await cmsFetch<T>(path, opts);
    if (r.ok) return r.data;
    if (r.status === 404) return null;
    throw new Error(`CMS request failed (${r.status || "network"}): ${path}`);
}

export const qs = (params: Record<string, string | number | undefined | null>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
    });
    const s = sp.toString();
    return s ? `?${s}` : "";
};

export const getSiteBundle = () => cmsOptional<SiteBundle>("/site-config");
export const getHome = () => cmsOptional<HomePage>("/home");
export const getHelpCenter = () => cmsRequired<HelpCenter>("/help-center");
export const getContactPage = () => cmsRequired<ContactPageDoc>("/contact-page");

export function listResource<T>(resource: string, params: Record<string, string | number | undefined> = {}) {
    return cmsRequired<ListResult<T>>(`/${resource}${qs(params)}`);
}

export async function getDetail<T>(resource: string, slug: string, preview?: string): Promise<T | null> {
    if (preview) {
        const draft = await cmsOptional<T>(`/preview/${encodeURIComponent(preview)}`, { noStore: true });
        if (draft) return draft;
    }
    return cmsRequired<T>(`/${resource}/${encodeURIComponent(slug)}`);
}

export const firstParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
