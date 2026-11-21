import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


type Redirect = { fromPath: string; toPath: string; statusCode: 301 | 302 };

const CMS = (process.env.CMS_API_URL || process.env.NEXT_PUBLIC_CMS_API_URL || "").replace(/\/$/, "");
const TTL_MS = 60_000;
const RETRY_MS = 15_000;

let cache: { map: Map<string, Redirect>; expires: number } = { map: new Map(), expires: 0 };
let inflight: Promise<void> | null = null;

async function refresh() {
    try {
        const res = await fetch(`${CMS}/redirects`, { cache: "no-store", signal: AbortSignal.timeout(1500) });
        if (!res.ok) throw new Error(String(res.status));
        const list = (await res.json()) as Redirect[];
        cache = { map: new Map(list.map((r) => [r.fromPath.replace(/\/$/, "") || "/", r])), expires: Date.now() + TTL_MS };
    } catch {
        cache = { ...cache, expires: Date.now() + RETRY_MS };
    } finally {
        inflight = null;
    }
}

export async function proxy(request: NextRequest) {
    if (!CMS) return NextResponse.next();
    if (Date.now() > cache.expires) {
        inflight ??= refresh();
        if (cache.map.size === 0) await inflight;
    }

    const path = request.nextUrl.pathname.replace(/\/$/, "") || "/";
    const hit = cache.map.get(path);
    if (!hit) return NextResponse.next();

    const target = /^https?:\/\//i.test(hit.toPath) ? new URL(hit.toPath) : new URL(hit.toPath, request.url);
    if (target.pathname === request.nextUrl.pathname && target.origin === request.nextUrl.origin) return NextResponse.next();
    return NextResponse.redirect(target, hit.statusCode === 302 ? 302 : 301);
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
