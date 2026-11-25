"use client";

import { useState } from "react";
import { HiOutlineChevronRight } from "react-icons/hi2";

/* ------------------------------------------------------------------ */
/* Types (mirror the object built by getAirlineFareRule for the new    */
/* `FareRule[]` response format)                                       */
/* ------------------------------------------------------------------ */

export type TimelineCancelWindow = {
    start: string;
    end: string;
    totalFare: number;
    airlineCharge: number;
    serviceCharge: number;
    totalCharge: number;
    refundAmount: number;
};

export type TimelineChangeWindow = {
    allowed: boolean;
    start: string;
    end: string;
    totalFare: number;
    airlineCharge: number;
    serviceCharge: number;
    totalCharge: number;
};

export type TextRuleRow = {
    description: string;
    adultAmount: string;
    childAmount: string;
    infantAmount: string;
    allowed?: boolean;
};

export type FareRuleEntry = {
    newFormat?: boolean;
    originDestination?: string;
    stops?: number;
    timeline?: {
        currency: string;
        cancel: TimelineCancelWindow[];
        change: TimelineChangeWindow[];
    } | null;
    textRule?: {
        currency: string;
        cancel: { ruleText: string; rows: TextRuleRow[] };
        change: { ruleText: string; rows: TextRuleRow[] };
    } | null;
    terms?: string[];
};

/** Fixed note shown under the fare rule table (client requirement). */
export const FARE_RULE_DISCLAIMER =
    "*Important: The Airline fee is indicative. We do not guarantee the accuracy of this information. All refunds are subject to Airline approval.";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseParts(iso: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || "");
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5] };
}

function isPastOrNow(iso: string) {
    const p = parseParts(iso);
    if (!p) return false;
    return new Date(p.y, p.mo - 1, p.d, p.h, p.mi).getTime() <= Date.now();
}

function fmtDay(iso: string) {
    const p = parseParts(iso);
    return p ? `${p.d} ${MONTHS[p.mo - 1]}` : iso || "";
}

function fmtTime(iso: string) {
    const p = parseParts(iso);
    return p ? `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}` : "";
}

function fmtMoney(amount: number, currency = "INR") {
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency || "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `₹${amount}`;
    }
}

/** "4515 + 300" -> "₹4,515 + ₹300". Anything non numeric ("Non Refundable") is returned unchanged. */
function formatAmountText(text: string, currency = "INR") {
    const t = (text || "").trim();
    if (!t) return "";
    if (/^\d+(\.\d+)?(\s*\+\s*\d+(\.\d+)?)*$/.test(t)) {
        return t
            .split("+")
            .map((part) => fmtMoney(Number(part.trim()), currency))
            .join(" + ");
    }
    return t;
}

/** "0 Hrs to 4 hrs" -> "0 hours to 4 hours*" */
function formatTimeFrame(text: string) {
    const t = (text || "").trim();
    if (!t) return "—";
    const out = t.replace(/(\d+)\s*hrs?\b/gi, (_, n) => `${n} ${Number(n) === 1 ? "hour" : "hours"}`);
    return `${out}*`;
}

/** Collapses neighbouring windows that have the same refund so the timeline stays readable. */
function mergeCancelWindows(windows: TimelineCancelWindow[]) {
    const merged: TimelineCancelWindow[] = [];
    for (const w of windows) {
        const prev = merged[merged.length - 1];
        if (prev && prev.refundAmount === w.refundAmount) {
            prev.end = w.end;
        } else {
            merged.push({ ...w });
        }
    }
    return merged;
}

/** True when the response has a usable date-time based cancellation timeline (the "red" part). */
export function hasRefundTimeline(entry?: FareRuleEntry | null) {
    return !!entry?.timeline && entry.timeline.cancel.length > 0;
}

/** True when the response has the hour based text rules (the "yellow" part). */
export function hasFareRuleTable(entry?: FareRuleEntry | null) {
    return (
        !!entry?.textRule &&
        (entry.textRule.cancel.rows.length > 0 || entry.textRule.change.rows.length > 0)
    );
}

/* ------------------------------------------------------------------ */
/* RED: Refund on Cancellation timeline                                */
/* ------------------------------------------------------------------ */

export function RefundTimeline({
    entry,
    onPolicyClick,
}: {
    entry: FareRuleEntry;
    /** When provided, shows the "Cancellation & Rescheduling Policy >" link (Review page). */
    onPolicyClick?: () => void;
}) {
    if (!hasRefundTimeline(entry)) return null;

    const currency = entry.timeline!.currency;
    const windows = mergeCancelWindows(entry.timeline!.cancel);
    const n = windows.length;
    const boundaries = [windows[0].start, ...windows.map((w) => w.end)];

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-4">
            <div className="flex items-start justify-between gap-3 mb-3">
                <h4 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 leading-[1.4]">
                    Refund on Cancellation
                </h4>
                {onPolicyClick && (
                    <button
                        type="button"
                        onClick={onPolicyClick}
                        className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-[#FF7626] hover:underline whitespace-nowrap leading-[1.4]"
                    >
                        Cancellation &amp; Rescheduling Policy
                        <HiOutlineChevronRight className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {entry.originDestination && (
                <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3 leading-[1.4]">
                    {entry.originDestination.replace("-", " - ")}
                </p>
            )}

            <div className="overflow-x-auto no-scrollbar">
                <div className="px-6" style={{ minWidth: `${Math.max(n * 140, 300)}px` }}>
                    {/* refund value above each window */}
                    <div className="flex">
                        {windows.map((w, i) => (
                            <div key={i} className="flex-1 text-center px-1">
                                <span
                                    className={`text-[13px] leading-[1.3] ${
                                        w.refundAmount > 0
                                            ? "text-gray-800 dark:text-gray-200"
                                            : "text-gray-500 dark:text-gray-400"
                                    }`}
                                >
                                    {w.refundAmount > 0 ? `${fmtMoney(w.refundAmount, currency)} refund` : "Non Refundable"}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* line + nodes */}
                    <div className="relative h-5 mt-2">
                        <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-gradient-to-r from-amber-300 to-red-500 rounded-full" />
                        {boundaries.map((b, i) => {
                            const isFirst = i === 0;
                            const isLast = i === n;
                            return (
                                <span
                                    key={i}
                                    className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-gray-900 ${
                                        isLast
                                            ? "w-4 h-4 bg-red-500"
                                            : isFirst
                                            ? "w-4 h-4 bg-amber-400"
                                            : "w-3 h-3 bg-orange-400"
                                    }`}
                                    style={{ left: `${(i / n) * 100}%` }}
                                />
                            );
                        })}
                    </div>

                    {/* labels below each node */}
                    <div className="relative h-11 mt-1">
                        {boundaries.map((b, i) => {
                            const isFirst = i === 0;
                            const isLast = i === n;
                            const isNow = isFirst && isPastOrNow(b);
                            const title = isLast ? "Departure" : isNow ? "Now" : fmtDay(b);
                            const sub = isLast ? `${fmtDay(b)}, ${fmtTime(b)}` : fmtTime(b);
                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 -translate-x-1/2 text-center whitespace-nowrap"
                                    style={{ left: `${(i / n) * 100}%` }}
                                >
                                    <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 leading-[1.3]">
                                        {title}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-[1.3]">
                                        {sub}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* YELLOW: Fare rules table (Cancellation / Date change) + T&C         */
/* ------------------------------------------------------------------ */

function AmountCell({ row, currency }: { row: TextRuleRow; currency: string }) {
    const lines: { label: string; value: string }[] = [];
    if (row.adultAmount) lines.push({ label: "ADULT", value: row.adultAmount });
    if (row.childAmount) lines.push({ label: "CHILD", value: row.childAmount });
    if (row.infantAmount) lines.push({ label: "INFANT", value: row.infantAmount });

    if (lines.length === 0) return <span className="text-gray-400 dark:text-gray-500">—</span>;

    return (
        <div className="space-y-0.5">
            {lines.map((l) => {
                const text = formatAmountText(l.value, currency);
                const isNumeric = text !== l.value.trim() || /\d/.test(text);
                return (
                    <p key={l.label} className="text-[12px] text-gray-700 dark:text-gray-300 leading-[1.4]">
                        <span className="text-gray-500 dark:text-gray-400">{l.label} : </span>
                        <span className={isNumeric ? "font-semibold" : "font-bold"}>{text}</span>
                    </p>
                );
            })}
        </div>
    );
}

export function FareRuleTable({ entry }: { entry: FareRuleEntry }) {
    const textRule = entry.textRule;
    const hasCancel = (textRule?.cancel.rows.length ?? 0) > 0;
    const hasChange = (textRule?.change.rows.length ?? 0) > 0;
    const [tab, setTab] = useState<"cancel" | "change">(hasCancel ? "cancel" : "change");

    if (!textRule || (!hasCancel && !hasChange)) return null;

    const active = tab === "cancel" ? textRule.cancel : textRule.change;
    const feeHeader =
        tab === "cancel" ? "Airline Fee + Flyomint Fee" : "Airline Fee + Flyomint Fee + Fare Difference";
    const terms = entry.terms ?? [];

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex gap-1 px-4 pt-2 border-b border-gray-100 dark:border-gray-800">
                    {hasCancel && (
                        <button
                            type="button"
                            onClick={() => setTab("cancel")}
                            className={`px-3 py-2.5 text-[13px] font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors leading-[1.4] ${
                                tab === "cancel"
                                    ? "border-[#1c8fc7] text-[#1c8fc7]"
                                    : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                        >
                            Cancellation Charges
                        </button>
                    )}
                    {hasChange && (
                        <button
                            type="button"
                            onClick={() => setTab("change")}
                            className={`px-3 py-2.5 text-[13px] font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors leading-[1.4] ${
                                tab === "change"
                                    ? "border-[#1c8fc7] text-[#1c8fc7]"
                                    : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                        >
                            Date change charges
                        </button>
                    )}
                </div>

                <div className="p-4">
                    {entry.originDestination && (
                        <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3 leading-[1.4]">
                            {entry.originDestination}
                        </p>
                    )}

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-3 py-2.5 align-top w-1/2">
                                            <p className="text-[12px] font-bold text-gray-900 dark:text-gray-100 leading-[1.3]">
                                                Time frame
                                            </p>
                                            <p className="text-[10px] font-normal text-gray-500 dark:text-gray-400 leading-[1.3]">
                                                (From Scheduled Flight departure)
                                            </p>
                                        </th>
                                        <th className="px-3 py-2.5 align-top">
                                            <p className="text-[12px] font-bold text-gray-900 dark:text-gray-100 leading-[1.3]">
                                                {feeHeader}
                                            </p>
                                            <p className="text-[10px] font-normal text-gray-500 dark:text-gray-400 leading-[1.3]">
                                                (Per passenger)
                                            </p>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {active.rows.map((row, i) => (
                                        <tr key={i}>
                                            <td className="px-3 py-3 align-top text-[12px] text-gray-600 dark:text-gray-400 leading-[1.4]">
                                                {formatTimeFrame(row.description)}
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <AmountCell row={row} currency={textRule.currency} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {active.ruleText && (
                        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 leading-[1.4]">{active.ruleText}</p>
                    )}
                </div>
            </div>

            {/* Fixed disclaimer */}
            <p className="text-[12px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2.5 leading-[1.5]">
                {FARE_RULE_DISCLAIMER}
            </p>

            {/* Terms & Conditions from the response */}
            {terms.length > 0 && (
                <div className="px-1">
                    <h4 className="text-[14px] font-bold text-gray-900 dark:text-gray-100 mb-2 leading-[1.4]">
                        Terms &amp; Conditions
                    </h4>
                    <ol className="space-y-1.5 list-decimal list-outside pl-5">
                        {terms.map((t, i) => (
                            <li key={i} className="text-[12px] text-gray-500 dark:text-gray-400 leading-[1.5]">
                                {t}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* SRP: show the red timeline if present, otherwise the yellow table   */
/* ------------------------------------------------------------------ */

export function FareRuleSrp({ entry }: { entry: FareRuleEntry }) {
    if (hasRefundTimeline(entry)) return <RefundTimeline entry={entry} />;
    if (hasFareRuleTable(entry)) return <FareRuleTable entry={entry} />;
    return null;
}
