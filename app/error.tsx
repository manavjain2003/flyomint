"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
    return (
        <div className="flex-1 grid place-items-center px-6 py-24 text-center">
            <div className="max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Something went wrong</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">We couldn&apos;t load this page right now. Please try again in a moment.</p>
                <button onClick={reset} className="inline-flex h-11 items-center rounded-full bg-[#FF7626] px-7 text-sm font-semibold text-white hover:bg-[#e6661f]">
                    Try again
                </button>
            </div>
        </div>
    );
}
