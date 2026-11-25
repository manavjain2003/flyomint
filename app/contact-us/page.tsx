import type { Metadata } from "next";
import ContactForm from "@/app/components/cms/ContactForm";
import JsonLd from "@/app/components/cms/JsonLd";
import { PageContainer, PageTitle } from "@/app/components/cms/Layout";
import { getContactPage } from "@/app/lib/cms/server";
import { seoToMetadata } from "@/app/lib/cms/seo";

export async function generateMetadata(): Promise<Metadata> {
    const page = await getContactPage();
    return page ? seoToMetadata(page.seo) : { title: "Contact us" };
}

/** Only embed maps from https URLs. */
const safeEmbed = (url: string) => (/^https:\/\//i.test(url) ? url : "");

export default async function ContactPage() {
    const page = await getContactPage();
    if (!page) return null;
    const map = safeEmbed(page.mapEmbedUrl);
    return (
        <>
            <JsonLd seo={page.seo} />
            <PageContainer>
                <PageTitle eyebrow="Contact" title={page.title} intro={page.intro} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-700 p-8 space-y-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100">Get in touch</h2>
                        <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-300">
                            {page.officeName && <li className="font-semibold text-slate-900 dark:text-gray-100">{page.officeName}</li>}
                            {page.address && <li className="whitespace-pre-line">{page.address}</li>}
                            {page.phone && <li><span className="font-medium text-slate-800 dark:text-gray-200">Phone: </span><a href={`tel:${page.phone.replace(/[^+\d]/g, "")}`} className="text-sky-700 dark:text-sky-400 hover:underline">{page.phone}</a></li>}
                            {page.email && <li><span className="font-medium text-slate-800 dark:text-gray-200">Email: </span><a href={`mailto:${page.email}`} className="text-sky-700 dark:text-sky-400 hover:underline">{page.email}</a></li>}
                        </ul>
                        {map && <iframe src={map} title="Office location" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-64 rounded-xl border-0" />}
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-700 p-8">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-6">Send us a message</h2>
                        <ContactForm submitLabel={page.submitLabel} thankYouMessage={page.thankYouMessage} captchaSiteKey={page.captchaSiteKey} />
                    </div>
                </div>
            </PageContainer>
        </>
    );
}
