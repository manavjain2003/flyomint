"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CmsFormError, confirmNewsletter, unsubscribeNewsletter } from "@/app/lib/cms/browser";

/** Handles the links in newsletter emails: /newsletter/confirm?token=… and /newsletter/unsubscribe?token=… */
export default function NewsletterAction({ mode }: { mode: "confirm" | "unsubscribe" }) {
    const token = useSearchParams().get("token") || "";
    const [result, setResult] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
    const state = !token
        ? { kind: "error" as const, message: "This link is invalid." }
        : result ?? { kind: "loading" as const, message: "Please wait…" };

    useEffect(() => {
        if (!token) return;
        const run = mode === "confirm" ? confirmNewsletter : unsubscribeNewsletter;
        run(token)
            .then((r) => setResult({ kind: "ok", message: r.message }))
            .catch((e) => setResult({ kind: "error", message: e instanceof CmsFormError ? e.message : "Something went wrong." }));
    }, [token, mode]);

    return (
        <div className="max-w-md mx-auto text-center py-24 px-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{mode === "confirm" ? "Newsletter subscription" : "Unsubscribe"}</h1>
            <p role="status" className={state.kind === "error" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}>{state.message}</p>
            <Link href="/" className="mt-8 inline-flex h-11 items-center rounded-full bg-[#FF7626] px-7 text-sm font-semibold text-white">Back to home</Link>
        </div>
    );
}
