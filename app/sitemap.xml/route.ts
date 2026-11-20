import { CMS_API_URL } from "@/app/lib/cms/server";

/** Serves the CMS-generated sitemap (every published page, offer, route, blog...). */
export async function GET() {
    try {
        const res = await fetch(`${CMS_API_URL}/sitemap.xml`, { next: { revalidate: 300 } });
        if (!res.ok) throw new Error(String(res.status));
        return new Response(await res.text(), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
    } catch {
        return new Response("Sitemap unavailable", { status: 503 });
    }
}
