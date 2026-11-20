"use client";

import { useState } from "react";
import { CmsFormError, subscribeNewsletter } from "@/app/lib/cms/browser";

type Props = { heading?: string; text?: string; compact?: boolean };

/** Newsletter subscribe form (double opt-in handled by the CMS). */
export default function NewsletterBox({ heading, text, compact }: Props) {
    const [email, setEmail] = useState("");
    const [state, setState] = useState<{ kind: "idle" | "loading" | "ok" | "error"; message?: string }>({ kind: "idle" });

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setState({ kind: "loading" });
        try {
            const res = await subscribeNewsletter(email.trim());
            setState({ kind: "ok", message: res.message });
            setEmail("");
        } catch (err) {
            setState({ kind: "error", message: err instanceof CmsFormError ? err.message : "Something went wrong." });
        }
    }

    const form = (
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md" noValidate>
            <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Email address"
                className="flex-1 h-12 px-5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#1c8fc7]/30"
            />
            <button
                type="submit"
                disabled={state.kind === "loading"}
                className="h-12 px-7 rounded-full bg-[#FF7626] text-white text-sm font-semibold hover:bg-[#e6661f] disabled:opacity-60 transition-colors"
            >
                {state.kind === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
        </form>
    );
    const status = state.message && (
        <p role="status" className={`mt-3 text-sm ${state.kind === "error" ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>{state.message}</p>
    );

    if (compact) return <div>{form}{status}</div>;

    return (
        <section className="bg-dark dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="rounded-3xl bg-[#eaf4fb] dark:bg-gray-800 px-6 sm:px-12 py-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{heading || "Get the best fares in your inbox."}</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-lg">{text || "Subscribe for flight offers and travel tips. Unsubscribe any time."}</p>
                    </div>
                    <div className="w-full max-w-md">{form}{status}</div>
                </div>
            </div>
        </section>
    );
}
