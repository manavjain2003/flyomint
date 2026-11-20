import { CMS_API_URL } from "@/app/lib/cms/server";

const FALLBACK = "User-agent: *\nAllow: /\n";

/** robots.txt is edited in the CMS (SEO settings). */
export async function GET() {
    try {
        const res = await fetch(`${CMS_API_URL}/robots.txt`, { next: { revalidate: 300 } });
        if (!res.ok) throw new Error(String(res.status));
        return new Response(await res.text(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    } catch {
        return new Response(FALLBACK, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
}
