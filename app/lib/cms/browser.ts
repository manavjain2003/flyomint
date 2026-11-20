"use client";
/** Browser-side calls to the CMS public API: forms and analytics tracking. */

const BASE = (process.env.NEXT_PUBLIC_CMS_API_URL || "").replace(/\/$/, "");

export class CmsFormError extends Error {}

async function post<T>(path: string, body: unknown): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${BASE}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch {
        throw new CmsFormError("Network error. Please check your connection and try again.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new CmsFormError(data?.message || data?.error || "Something went wrong. Please try again.");
    return data as T;
}

export const submitEnquiry = (body: {
    name: string; email: string; phone?: string; subject?: string; message: string; captchaToken?: string;
}) => post<{ id: string; message: string }>("/enquiries", body);

export const subscribeNewsletter = (email: string) => post<{ message: string }>("/newsletter/subscribe", { email });
export const confirmNewsletter = (token: string) => post<{ message: string }>("/newsletter/confirm", { token });
export const unsubscribeNewsletter = (token: string) => post<{ message: string }>("/newsletter/unsubscribe", { token });

export type TrackPayload = {
    type: "view" | "click";
    path?: string;
    refType?: "route" | "banner" | "offer" | "blog";
    refId?: string;
    label?: string;
};

/** Fire-and-forget analytics. Never throws and never blocks navigation. */
export function track(payload: TrackPayload) {
    if (!BASE || typeof window === "undefined") return;
    const body = JSON.stringify({ path: window.location.pathname, ...payload });
    try {
        fetch(`${BASE}/track`, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    } catch {
        /* analytics must never break the page */
    }
}
