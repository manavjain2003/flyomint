import { CMS_API_URL } from "@/app/lib/cms/server";

/** Paths the CMS lists in its sitemap but that this website does not have pages for. */
const NOT_ON_THIS_SITE = /^\/(blog|offers|airlines|destinations|domestic-flights|international-flights)(\/|$)/;

const pathOf = (loc: string) => {
    try { return new URL(loc).pathname; } catch { return loc; }
};

/** Serves the CMS-generated sitemap, without URLs for sections that do not exist on this site. */
export async function GET() {
    try {
        const res = await fetch(`${CMS_API_URL}/sitemap.xml`, { next: { revalidate: 300 } });
        if (!res.ok) throw new Error(String(res.status));
        const xml = (await res.text()).replace(/<url>[\s\S]*?<\/url>/g, (block) => {
            const loc = block.match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1] ?? "";
            return NOT_ON_THIS_SITE.test(pathOf(loc)) ? "" : block;
        });
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
    } catch {
        return new Response("Sitemap unavailable", { status: 503 });
    }
}
