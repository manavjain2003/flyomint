"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";



const DEFAULT_MESSAGE =
  "We're having trouble processing your payment. Please try again or contact support for further queries.";

function currency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n ?? 0);
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-[#1c8fc7]/20 border-t-[#1c8fc7] animate-spin" />
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const transactionId =
    searchParams.get("txnid") ||
    searchParams.get("txnid1") ||
    searchParams.get("txnId") ||
    searchParams.get("TransactionID") ||
    searchParams.get("transactionId") ||
    searchParams.get("id") ||
    searchParams.get("tid") ||
    "—";

  const reason = searchParams.get("reason") || searchParams.get("message") || DEFAULT_MESSAGE;

  const amountParam = searchParams.get("amount");
  const amount = amountParam ? Number(amountParam) : null;

  const dateTime = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 px-6 py-8 text-center">
        {/* Failure icon */}
        <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-7 h-7 text-red-500"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 mb-2">
          Oh no! Payment Failed.
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{reason}</p>

        <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100 dark:border-gray-800">
          <span className="text-gray-400">Transaction ID</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">{transactionId}</span>
        </div>

        {amount !== null && !Number.isNaN(amount) && (
          <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-gray-400">Amount</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
              {currency(amount)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100 dark:border-gray-800 mb-6">
          <span className="text-gray-400">Date &amp; Time</span>
          <span className="text-gray-700 dark:text-gray-300">{dateTime}</span>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 leading-relaxed">
          If any amount was deducted from your account, it will be refunded automatically within
          5–7 business days if the booking didn't go through.
        </p>

        <div className="flex flex-col gap-2.5">
        
          <button
            type="button"
            onClick={() => router.push("/support")}
            className="w-full h-11 rounded-full border border-gray-200 dark:border-gray-700 text-[#FF7626] font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}