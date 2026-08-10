"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HiMenu, HiX, HiSupport, HiSun, HiMoon } from "react-icons/hi";
import { HiOutlineUserCircle, HiOutlineUser, HiOutlineArrowRightOnRectangle, HiChevronDown } from "react-icons/hi2";
import { MdFlight } from "react-icons/md";
import { FiClipboard } from "react-icons/fi";
import LoginDrawer, { isLoggedInSession } from "@/app/components/booking/LoginDrawer";
import { getUserProfile, logoutUser } from "@/app/lib/authApi";
import { useTheme } from "@/app/components/shared/ThemeProvider";

const NAV_LINKS = [
    { href: "/", label: "Search", icon: MdFlight },
    { href: "/my-bookings", label: "My Trips", icon: FiClipboard, authOnly: true },
    { href: "/support", label: "Support", icon: HiSupport },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const [profileName, setProfileName] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    const visibleNavLinks = NAV_LINKS.filter((link) => !link.authOnly || loggedIn);

    // Check on mount + when other tabs/pages log in
    useEffect(() => {
        const check = () => setLoggedIn(isLoggedInSession());
        check();

        window.addEventListener("flyomint:login", check);
        window.addEventListener("flyomint:logout", check);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") check();
        });

        return () => {
            window.removeEventListener("flyomint:login", check);
            window.removeEventListener("flyomint:logout", check);
        };
    }, []);

    useEffect(() => {
        if (!loginOpen) {
            setLoggedIn(isLoggedInSession());
        }
    }, [loginOpen]);

    // Fetch the logged-in user's name for the navbar dropdown
    useEffect(() => {
        if (!loggedIn) {
            setProfileName("");
            return;
        }
        let cancelled = false;
        getUserProfile().then((res) => {
            if (!cancelled && res.success) setProfileName(res.name || "");
        });
        return () => {
            cancelled = true;
        };
    }, [loggedIn]);

    // Close the dropdown on outside click
    useEffect(() => {
        if (!menuOpen) return;
        function onClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [menuOpen]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 6);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    function handleLoginSuccess(uniqueKey: string) {
        setLoggedIn(true);
        setLoginOpen(false);
    }

    async function handleLogout() {
        setMenuOpen(false);
        await logoutUser();
        window.dispatchEvent(new Event("flyomint:logout"));
        setLoggedIn(false);
        setProfileName("");
    }

    return (
        <>
            <header
                className={`fixed inset-x-0 top-0 z-50 w-full h-16 transition-all duration-300 ${
                    scrolled
                        ? "bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm"
                        : "bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
                }`}
            >
                <div className="max-w-8xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Flyomint home">
                        <Image src="/assets/logo.jpg" alt="Flyomint" width={180} height={52} className="h-9 w-auto" priority />
                    </Link>

                    {/* Center nav */}
                    <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
                        {visibleNavLinks.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-medium transition-colors ${
                                        active
                                            ? "text-[#FF7626]"
                                            : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            aria-pressed={theme === "dark"}
                            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 grid place-items-center text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            {theme === "dark" ? (
                                <HiMoon className="w-4 h-4" />
                            ) : (
                                <HiSun className="w-4 h-4" />
                            )}
                        </button>

                        {loggedIn ? (
                            <div
                                ref={menuRef}
                                className="hidden sm:block relative"
                                onMouseEnter={() => setMenuOpen(true)}
                                onMouseLeave={() => setMenuOpen(false)}
                            >
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((v) => !v)}
                                    aria-haspopup="menu"
                                    aria-expanded={menuOpen}
                                    className="flex items-center gap-1.5 h-9 pl-2 pr-3 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <HiOutlineUserCircle className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                    <span className="max-w-[110px] truncate text-sm font-medium">
                                        {profileName || "Account"}
                                    </span>
                                    <HiChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                                </button>

                                {menuOpen && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 top-full pt-2 w-48"
                                    >
                                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1.5 overflow-hidden">
                                            <Link
                                                href="/my-profile"
                                                role="menuitem"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <HiOutlineUser className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                My Profile
                                            </Link>
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                                            >
                                                <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                                                Log out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setLoginOpen(true)}
                                className="hidden sm:inline-flex items-center justify-center h-9 px-4 rounded-full bg-[#FF7626] text-white text-sm font-semibold hover:bg-[#e6661f] transition-colors"
                            >
                                Sign in
                            </button>
                        )}

                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="lg:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {mobileOpen && (
                    <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <div className="max-w-7xl mx-auto px-4 py-3 space-y-0.5">
                            {loggedIn ? (
                                <>
                                    <Link
                                        href="/my-profile"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-2 justify-center mb-2 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm"
                                    >
                                        <HiOutlineUserCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        {profileName || "My Profile"}
                                    </Link>
                                    <button
                                        onClick={() => { handleLogout(); setMobileOpen(false); }}
                                        className="block w-full text-center mb-2 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-red-500 dark:text-red-400 font-semibold text-sm"
                                    >
                                        Log out
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
                                    className="block w-full text-center mb-2 py-2.5 rounded-full bg-[#FF7626] text-white font-semibold text-sm"
                                >
                                    Sign in
                                </button>
                            )}
                            {visibleNavLinks.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </header>
            <div aria-hidden className="h-16" />

            <LoginDrawer
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />
        </>
    );
}