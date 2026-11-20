import type { Metadata } from "next";
import Link from "next/link";
import FaqAccordion from "@/app/components/cms/FaqAccordion";
import JsonLd from "@/app/components/cms/JsonLd";
import { PageContainer, PageTitle, SectionHeading } from "@/app/components/cms/Layout";
import { getHelpCenter } from "@/app/lib/cms/server";
import { cleanHtml } from "@/app/lib/cms/sanitize";
import { seoToMetadata } from "@/app/lib/cms/seo";

export async function generateMetadata(): Promise<Metadata> {
    const page = await getHelpCenter();
    return page ? seoToMetadata(page.seo) : { title: "Help center" };
}

const lines = (text: string) => text.split(/[\n,]+/).map((t) => t.trim()).filter(Boolean);

export default async function HelpCenterPage() {
    const page = await getHelpCenter();
    if (!page) return null;
    const phones = lines(page.phones);
    const emails = lines(page.emails);
    return (
        <>
            <JsonLd seo={page.seo} />
            <PageContainer narrow>
                <PageTitle title={page.title} intro="Most questions are answered below. If you need a human, reach us any time." />

                <div className="grid sm:grid-cols-2 gap-5 mb-12">
                    {phones.length > 0 && (
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">Call us</h2>
                            {phones.map((p) => <p key={p}><a href={`tel:${p.replace(/[^+\d]/g, "")}`} className="text-[#1c8fc7] hover:underline">{p}</a></p>)}
                            {page.supportTimings && <p className="mt-2 text-xs text-gray-400">Support hours: {page.supportTimings}</p>}
                        </div>
                    )}
                    {emails.length > 0 && (
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">Email us</h2>
                            {emails.map((e) => <p key={e}><a href={`mailto:${e}`} className="text-[#1c8fc7] hover:underline">{e}</a></p>)}
                        </div>
                    )}
                    {page.officeAddress && (
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:col-span-2">
                            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">Office</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{page.officeAddress}</p>
                        </div>
                    )}
                </div>

                {page.faqs.length > 0 && (
                    <section>
                        <SectionHeading>Help topics</SectionHeading>
                        <FaqAccordion items={page.faqs.map((f) => ({ question: f.question, answer: cleanHtml(f.answer) }))} defaultOpen={null} />
                    </section>
                )}

                <p className="mt-10 text-sm text-gray-500">
                    Can&apos;t find what you need? <Link href="/contact-us" className="text-[#1c8fc7] underline">Contact us</Link>.
                </p>
            </PageContainer>
        </>
    );
}
