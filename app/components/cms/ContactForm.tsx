"use client";

import { useEffect, useRef, useState } from "react";
import { CmsFormError, submitEnquiry } from "@/app/lib/cms/browser";
import { getUserProfile } from "@/app/lib/authApi";
import { isLoggedInSession } from "@/app/components/booking/LoginDrawer";

type Props = { submitLabel: string; thankYouMessage: string; captchaSiteKey?: string };

declare global {
    interface Window {
        grecaptcha?: {
            render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void; "expired-callback": () => void }) => number;
            reset: (id?: number) => void;
        };
        onCmsRecaptchaLoad?: () => void;
    }
}

const input = "w-full px-3 py-2.5 border border-slate-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg text-sm text-slate-900 dark:text-gray-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent";

export default function ContactForm({ submitLabel, thankYouMessage, captchaSiteKey }: Props) {
    const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
    const [status, setStatus] = useState<{ kind: "idle" | "sending" | "done" | "error"; message?: string }>({ kind: "idle" });
    const captchaEl = useRef<HTMLDivElement>(null);
    const captchaToken = useRef("");
    const widgetId = useRef<number | null>(null);

    useEffect(() => {
        if (!isLoggedInSession()) return;
        getUserProfile().then((p) => {
            if (p?.success) setForm((f) => ({ ...f, name: f.name || p.name || "", email: f.email || p.email || "", phone: f.phone || p.mobile || "" }));
        });
    }, []);

    useEffect(() => {
        if (!captchaSiteKey) return;
        const render = () => {
            if (captchaEl.current && window.grecaptcha && widgetId.current === null) {
                widgetId.current = window.grecaptcha.render(captchaEl.current, {
                    sitekey: captchaSiteKey,
                    callback: (t) => { captchaToken.current = t; },
                    "expired-callback": () => { captchaToken.current = ""; },
                });
            }
        };
        if (window.grecaptcha?.render) { render(); return; }
        window.onCmsRecaptchaLoad = render;
        const s = document.createElement("script");
        s.src = "https://www.google.com/recaptcha/api.js?onload=onCmsRecaptchaLoad&render=explicit";
        s.async = true;
        document.head.appendChild(s);
    }, [captchaSiteKey]);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (captchaSiteKey && !captchaToken.current) {
            setStatus({ kind: "error", message: "Please complete the captcha." });
            return;
        }
        setStatus({ kind: "sending" });
        try {
            const res = await submitEnquiry({ ...form, captchaToken: captchaToken.current || undefined });
            setStatus({ kind: "done", message: res.message || thankYouMessage });
            setForm((f) => ({ ...f, subject: "", message: "" }));
            captchaToken.current = "";
            if (widgetId.current !== null) window.grecaptcha?.reset(widgetId.current);
        } catch (err) {
            setStatus({ kind: "error", message: err instanceof CmsFormError ? err.message : "Something went wrong." });
            if (widgetId.current !== null) { window.grecaptcha?.reset(widgetId.current); captchaToken.current = ""; }
        }
    }

    if (status.kind === "done") {
        return (
            <div role="status" className="rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 p-6 text-sm text-green-800 dark:text-green-300">
                {status.message}
            </div>
        );
    }

    const label = "block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1.5";
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div><label className={label} htmlFor="c-name">Full name <span className="text-red-500">*</span></label><input id="c-name" required className={input} value={form.name} onChange={set("name")} /></div>
                <div><label className={label} htmlFor="c-email">Email <span className="text-red-500">*</span></label><input id="c-email" required type="email" className={input} value={form.email} onChange={set("email")} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div><label className={label} htmlFor="c-phone">Phone <span className="text-slate-400 font-normal">(optional)</span></label><input id="c-phone" type="tel" className={input} value={form.phone} onChange={set("phone")} /></div>
                <div><label className={label} htmlFor="c-subject">Subject <span className="text-slate-400 font-normal">(optional)</span></label><input id="c-subject" className={input} value={form.subject} onChange={set("subject")} placeholder="Refund, booking issue, etc." /></div>
            </div>
            <div>
                <label className={label} htmlFor="c-message">Message <span className="text-red-500">*</span></label>
                <textarea id="c-message" required rows={5} maxLength={4000} className={`${input} resize-y`} value={form.message} onChange={set("message")} placeholder="Tell us what's going on. If it's about a booking, include your reference." />
                <div className="text-right text-xs text-slate-400 mt-1">{form.message.length} / 4000</div>
            </div>
            {captchaSiteKey && <div ref={captchaEl} />}
            {status.kind === "error" && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{status.message}</p>}
            <button type="submit" disabled={status.kind === "sending"} className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white text-sm font-medium rounded-full transition-colors">
                {status.kind === "sending" ? "Sending…" : submitLabel || "Send enquiry"}
            </button>
        </form>
    );
}
