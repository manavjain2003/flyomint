import { Suspense } from "react";
import NewsletterAction from "@/app/components/cms/NewsletterAction";

export const metadata = { title: "Newsletter", robots: { index: false, follow: false } };

export default function Page() {
    return (
        <Suspense fallback={null}>
            <NewsletterAction mode="unsubscribe" />
        </Suspense>
    );
}
