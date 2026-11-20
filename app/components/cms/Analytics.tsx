import Script from "next/script";
import type { SiteBundle } from "@/app/lib/cms/types";

const GA_ID = /^(G|UA|AW)-[A-Z0-9-]{4,20}$/i;
const GTM_ID = /^GTM-[A-Z0-9]{4,12}$/i;
const PIXEL_ID = /^\d{5,20}$/;

/** Pulls <script> tags out of an admin-supplied HTML snippet so they run via next/script. */
function parseScripts(html: string) {
    const out: { src?: string; body?: string }[] = [];
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        const src = match[1].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
        if (src) {
            if (/^https:\/\//i.test(src) || src.startsWith("//")) out.push({ src: src.startsWith("//") ? `https:${src}` : src });
        } else if (match[2].trim()) {
            out.push({ body: match[2] });
        }
    }
    return out;
}

function Snippet({ html, prefix }: { html: string; prefix: string }) {
    return (
        <>
            {parseScripts(html).map((s, i) =>
                s.src
                    ? <Script key={`${prefix}-${i}`} id={`${prefix}-${i}`} src={s.src} strategy="afterInteractive" />
                    : <Script key={`${prefix}-${i}`} id={`${prefix}-${i}`} strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: s.body! }} />,
            )}
        </>
    );
}

/** Google Analytics, Tag Manager, Facebook Pixel, custom header/footer scripts and the live-chat widget. */
export default function Analytics({ site }: { site: SiteBundle | null }) {
    if (!site) return null;
    const ga = site.settings.googleAnalyticsId?.trim();
    const gtm = site.seo.gtmId?.trim();
    const pixel = site.seo.facebookPixelId?.trim();

    return (
        <>
            {ga && GA_ID.test(ga) && (
                <>
                    <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
                    <Script id="cms-ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}</Script>
                </>
            )}
            {gtm && GTM_ID.test(gtm) && (
                <Script id="cms-gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}</Script>
            )}
            {pixel && PIXEL_ID.test(pixel) && (
                <Script id="cms-fbq" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script>
            )}
            {site.seo.headerScripts && <Snippet html={site.seo.headerScripts} prefix="cms-header" />}
            {site.seo.footerScripts && <Snippet html={site.seo.footerScripts} prefix="cms-footer" />}
            {site.whatsapp.enabled && site.whatsapp.liveChatCode && <Snippet html={site.whatsapp.liveChatCode} prefix="cms-livechat" />}
        </>
    );
}
