"use client";

import { useState } from "react";
import { HiOutlineChevronDown, HiOutlineInformationCircle } from "react-icons/hi2";

export type DBCancelWindow = {
    allowed: boolean;
    ruleText: string;
    start: string;
    end: string;
    airlineCharge: number;
    serviceCharge: number;
    refundAmount: number;
    info: string;
    currency: string;
};

export type DBChangeWindow = {
    allowed: boolean;
    ruleText: string;
    start: string;
    end: string;
    airlineCharge: number;
    serviceCharge: number;
    changeFee: number;
    info: string;
    currency: string;
};

export type DBPolicy = { cancel: DBCancelWindow[]; change: DBChangeWindow[] };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// API sends airline-local time without a timezone ("2026-11-19T19:45:00").
// Parse the string directly so the browser's timezone never shifts it.
function parseParts(iso: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || "");
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5] };
}

function fmtDateTime(iso: string) {
    const p = parseParts(iso);
    if (!p) return iso || "";
    return `${p.d} ${MONTHS[p.mo - 1]}, ${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

function isPastOrNow(iso: string) {
    const p = parseParts(iso);
    if (!p) return false;
    return new Date(p.y, p.mo - 1, p.d, p.h, p.mi).getTime() <= Date.now();
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

// green -> amber -> red as departure gets closer
function barColor(i: number, total: number) {
    if (total <= 1) return "bg-green-500";
    const pos = i / (total - 1);
    if (pos < 0.34) return "bg-green-500";
    if (pos < 0.67) return "bg-amber-400";
    return "bg-red-500";
}

type TimelineItem = {
    start: string;
    end: string;
    value: string;
    tooltip?: string;
    note?: string;
};

const LABEL_COL = "w-[104px] sm:w-[128px] shrink-0 pr-2";
const MIN_WINDOW_PX = 128;

function PolicySection({
    title,
    rowLabel,
    valueLabel,
    items,
    footnote,
}: {
    title: string;
    rowLabel: string;
    valueLabel: string;
    items: TimelineItem[];
    footnote: string;
}) {
    const [open, setOpen] = useState(true);
    if (items.length === 0) return null;

    const n = items.length;
    // Boundaries sit on the junctions between bar segments:
    // start of every window + end of the last one.
    const boundaries = [...items.map((it) => it.start), items[n - 1].end];

    return (
        <div className="px-4 py-3">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-2 text-left"
            >
                <HiOutlineChevronDown
                    className={`w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
                />
                <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{title}</span>
            </button>

            {open && (
                <div className="mt-4 overflow-x-auto no-scrollbar">
                    <div style={{ minWidth: `calc(128px + ${n * MIN_WINDOW_PX}px)` }}>
                        {/* Row 1: "Cancel between" + boundary times */}
                        <div className="flex items-end">
                            <div className={`${LABEL_COL} text-xs sm:text-[13px] text-gray-900 dark:text-gray-100 leading-[1.3]`}>
                                {rowLabel}
                            </div>
                            <div className="relative flex-1 h-5">
                                {boundaries.map((b, i) => {
                                    const isFirst = i === 0;
                                    const isLast = i === n;
                                    const label = isFirst && isPastOrNow(b) ? "Now" : fmtDateTime(b);
                                    return (
                                        <span
                                            key={i}
                                            className="absolute bottom-0 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400"
                                            style={{
                                                left: `${(i / n) * 100}%`,
                                                transform: isFirst ? "none" : isLast ? "translateX(-100%)" : "translateX(-50%)",
                                            }}
                                        >
                                            {label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Row 2: coloured timeline bar */}
                        <div className="flex items-center mt-1.5">
                            <div className={LABEL_COL} />
                            <div className="flex-1 flex gap-1">
                                {items.map((_, i) => (
                                    <div key={i} className={`flex-1 h-1.5 rounded-full ${barColor(i, n)}`} />
                                ))}
                            </div>
                        </div>

                        {/* Row 3: "Amount refundable" + value under each segment */}
                        <div className="flex items-start mt-4">
                            <div className={`${LABEL_COL} text-xs sm:text-[13px] text-gray-900 dark:text-gray-100 leading-[1.3]`}>
                                {valueLabel}
                            </div>
                            <div className="flex-1 flex gap-1">
                                {items.map((it, i) => (
                                    <div key={i} className="flex-1 text-center px-1">
                                        <span className="inline-flex items-center gap-1 text-[13px] text-gray-700 dark:text-gray-300">
                                            {it.value}
                                            {it.tooltip && (
                                                <span title={it.tooltip} className="inline-flex cursor-help">
                                                    <HiOutlineInformationCircle className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                                </span>
                                            )}
                                        </span>
                                        {it.note && (
                                            <p className="text-[11px] text-red-500 dark:text-red-400 leading-[1.3] mt-0.5">{it.note}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500 leading-[1.4]">{footnote}</p>
                </div>
            )}
        </div>
    );
}

export default function DBFarePolicy({ policy }: { policy: DBPolicy }) {
    const cancelItems: TimelineItem[] = policy.cancel.map((c) => {
        const charges = c.airlineCharge + c.serviceCharge;
        return {
            start: c.start,
            end: c.end,
            value: fmtMoney(c.refundAmount, c.currency),
            tooltip:
                `Cancellation charges: ${fmtMoney(charges, c.currency)}` +
                ` (Airline ${fmtMoney(c.airlineCharge, c.currency)} + Service ${fmtMoney(c.serviceCharge, c.currency)})`,
            note: c.allowed ? undefined : "Cancellation not allowed",
        };
    });

    const changeItems: TimelineItem[] = policy.change.map((c) => ({
        start: c.start,
        end: c.end,
        value: c.allowed ? `${fmtMoney(c.changeFee, c.currency)} + Fare Difference` : "Not allowed",
        tooltip:
            c.allowed
                ? `Airline ${fmtMoney(c.airlineCharge, c.currency)} + Service ${fmtMoney(c.serviceCharge, c.currency)} + Fare Difference`
                : undefined,
    }));

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            <PolicySection
                title="Cancellation policy"
                rowLabel="Cancel between"
                valueLabel="Amount refundable"
                items={cancelItems}
                footnote="Refund is calculated per traveller and may vary for partial cancellation."
            />
            <PolicySection
                title="Date change policy"
                rowLabel="Change between"
                valueLabel="Date change charges"
                items={changeItems}
                footnote="Rescheduling fee is per traveller, plus any fare difference."
            />
        </div>
    );
}