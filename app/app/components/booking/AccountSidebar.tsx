"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
    HiOutlineUser,
    HiOutlinePaperAirplane,
    HiOutlineUserGroup,
    HiOutlineCreditCard,
    HiOutlineCog6Tooth,
    HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";
import { logoutUser } from "@/app/lib/authApi";

type NavItem = {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
    { label: "Profile", href: "/my-profile", icon: HiOutlineUser },
    { label: "My bookings", href: "/my-bookings", icon: HiOutlinePaperAirplane },
    { label: "Travellers", href: "/account/travellers", icon: HiOutlineUserGroup },
    { label: "Payment methods", href: "/account/payment-methods", icon: HiOutlineCreditCard },
    { label: "Settings", href: "/account/settings", icon: HiOutlineCog6Tooth },
];

export default function AccountSidebar() {
    const pathname = usePathname();
    const router = useRouter();

async function handleLogout() {
    await logoutUser();
    window.dispatchEvent(new Event("flyomint:logout")); 
    router.push("/");
}

    return (
        <nav className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-2 flex flex-col">
            <ul className="flex flex-col">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                                    isActive
                                        ? "bg-[#eaf4fb] text-[#1c8fc7] font-semibold"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                    <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </nav>
    );
}