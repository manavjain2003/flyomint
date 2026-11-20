import Link from "next/link";
import { MdFlight } from "react-icons/md";
import { formatFare } from "@/app/lib/cms/format";
import type { RouteCard, SiteTheme } from "@/app/lib/cms/types";

export default function RouteCards({ routes, theme, fareLabel }: { routes: RouteCard[]; theme?: SiteTheme | null; fareLabel?: string }) {
    if (routes.length === 0) return null;
    const label = fareLabel ?? theme?.fareLabel ?? "Starting from";
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {routes.map((r) => (
                <Link
                    key={r.id}
                    href={r.path}
                    className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-shadow"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <span className="grid place-items-center w-9 h-9 rounded-full bg-[#eaf4fb]"><MdFlight className="w-4 h-4 text-[#1c8fc7] rotate-90" /></span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{r.type}</span>
                    </div>
                    <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#1c8fc7] transition-colors">
                        {r.from.name} <span className="text-gray-400">→</span> {r.to.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.from.code} – {r.to.code}</p>
                    {r.fare !== null && (
                        <p className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                            {label} <span className="block text-lg font-bold text-[#FF7626]">{formatFare(r.fare, theme)}</span>
                        </p>
                    )}
                </Link>
            ))}
        </div>
    );
}
