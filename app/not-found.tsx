import Link from "next/link";
import { getSiteBundle } from "@/app/lib/cms/server";

export default async function NotFound() {
    const site = await getSiteBundle();
    const nf = site?.seo?.notFound;
    return (
        <div className="flex-1 grid place-items-center px-6 py-24 text-center">
            <div className="max-w-md">
                <p className="text-sm font-semibold text-[#1c8fc7] mb-2">404</p>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{nf?.title || "Page not found"}</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{nf?.message || "The page you are looking for does not exist."}</p>
                <Link href="/" className="inline-flex h-11 items-center rounded-full bg-[#FF7626] px-7 text-sm font-semibold text-white hover:bg-[#e6661f]">
                    {nf?.buttonLabel || "Back to home"}
                </Link>
            </div>
        </div>
    );
}
