"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HiMenu, HiX, HiSupport, HiSun } from "react-icons/hi";
import { MdFlight } from "react-icons/md";
import { FiClipboard } from "react-icons/fi";
import LoginDrawer, { isLoggedInSession, clearLoginSession } from "@/app/components/booking/LoginDrawer";

const NAV_LINKS = [
    { href: "/", label: "Search", icon: MdFlight },
    { href: "/my-bookings", label: "My Trips", icon: FiClipboard },
    { href: "/support", label: "Support", icon: HiSupport },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const pathname = usePathname();

    // Check on mount + when other tabs/pages log in
    useEffect(() => {
        const check = () => setLoggedIn(isLoggedInSession());
        check(); 

        window.addEventListener("flyomint:login", check);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") check();
        });

        return () => {
            window.removeEventListener("flyomint:login", check);
        };
    }, []);

    useEffect(() => {
        if (!loginOpen) {
            setLoggedIn(isLoggedInSession());
        }
    }, [loginOpen]);

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

    function handleLogout() {
        clearLoginSession();
        setLoggedIn(false);
    }

    return (
        <>
            <header
                className={`fixed inset-x-0 top-0 z-50 w-full h-16 transition-all duration-300 ${
                    scrolled
                        ? "bg-white/85 backdrop-blur-xl border-b border-gray-200 shadow-sm"
                        : "bg-white border-b border-gray-100"
                }`}
            >
                <div className="max-w-8xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Flyomint home">
                        <Image src="/assets/logo.jpg" alt="Flyomint" width={180} height={52} className="h-9 w-auto" priority />
                    </Link>

                    {/* Center nav */}
                    <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
                        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-medium transition-colors ${
                                        active
                                            ? "text-[#FF7626]"
                                            : "text-gray-700 hover:text-gray-900"
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
                            aria-label="Toggle theme"
                            className="w-8 h-8 rounded-full border border-gray-200 grid place-items-center text-gray-500 hover:bg-gray-50 transition"
                        >
                            <HiSun className="w-4 h-4" />
                        </button>

                        {loggedIn ? (
                            <button
                                onClick={handleLogout}
                                className="hidden sm:inline-flex items-center justify-center h-9 px-4 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Sign out
                            </button>
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
                            className="lg:hidden p-2 rounded-full hover:bg-gray-100"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {mobileOpen && (
                    <div className="lg:hidden border-t border-gray-100 bg-white">
                        <div className="max-w-7xl mx-auto px-4 py-3 space-y-0.5">
                            {loggedIn ? (
                                <button
                                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                                    className="block w-full text-center mb-2 py-2.5 rounded-full border border-gray-200 text-gray-700 font-semibold text-sm"
                                >
                                    Sign out
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
                                    className="block w-full text-center mb-2 py-2.5 rounded-full bg-[#FF7626] text-white font-semibold text-sm"
                                >
                                    Sign in
                                </button>
                            )}
                            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    <Icon className="w-4 h-4 text-gray-400" />
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