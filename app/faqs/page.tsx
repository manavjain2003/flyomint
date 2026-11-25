import type { Metadata } from "next";
import FaqAccordion from "@/app/components/cms/FaqAccordion";
import { EmptyState, PageContainer, SectionHeading } from "@/app/components/cms/Layout";
import { listResource } from "@/app/lib/cms/server";
import { cleanHtml } from "@/app/lib/cms/sanitize";
import type { FaqDoc } from "@/app/lib/cms/types";

export const metadata: Metadata = {
    title: "FAQs",
    description: "Answers about cancellations, baggage, payments, refunds and booking.",
    alternates: { canonical: "/faqs" },
};

const CATEGORIES: { key: string; title: string; description: string }[] = [
    { key: "cancellation", title: "Cancellation & Changes", description: "Cancellation policies, date changes, name corrections." },
    { key: "baggage", title: "Baggage & Check-in", description: "Cabin and check-in baggage rules, web check-in, boarding pass." },
    { key: "payment", title: "Payments & Refunds", description: "Payment methods, failures, refunds, and chargebacks." },
    { key: "booking", title: "Booking", description: "Questions about searching flights and creating bookings." },
    { key: "other", title: "Other", description: "Everything else." },
];

export default async function FaqsPage() {
    const data = await listResource<FaqDoc>("faqs", { limit: 200 });
    const faqs = data?.items ?? [];
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <div className="bg-slate-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-3xl mx-auto px-6 py-16 text-center">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 mb-3">How can we help you?</h1>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Answers to common questions about your bookings, flights, and account.</p>
                </div>
            </div>
            <PageContainer narrow>
                {faqs.length === 0 && <EmptyState message="No questions yet." />}
                <div className="space-y-10">
                    {CATEGORIES.map((cat) => {
                        const items = faqs.filter((f) => f.category === cat.key);
                        if (items.length === 0) return null;
                        return (
                            <section key={cat.key}>
                                <SectionHeading>{cat.title}</SectionHeading>
                                <p className="text-sm text-slate-500 dark:text-gray-400 -mt-3 mb-4">{cat.description}</p>
                                <FaqAccordion items={items.map((f) => ({ question: f.question, answer: cleanHtml(f.answer) }))} defaultOpen={null} />
                            </section>
                        );
                    })}
                </div>
            </PageContainer>
        </div>
    );
}
