"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HiMenu, HiX, HiSupport, HiSun, HiMoon } from "react-icons/hi";
import { HiOutlineUserCircle, HiOutlineUser, HiOutlineArrowRightOnRectangle, HiChevronDown } from "react-icons/hi2";
import { MdFlight } from "react-icons/md";
import { FiClipboard } from "react-icons/fi";
import LoginDrawer, { isLoggedInSession } from "@/app/components/booking/LoginDrawer";
import { getUserProfile, logoutUser } from "@/app/lib/authApi";
import { useTheme } from "@/app/components/shared/ThemeProvider";
import { HiOutlineClock } from "react-icons/hi";

const NAV_LINKS = [
    { href: "/", label: "Search", icon: MdFlight },
    { href: "/my-bookings", label: "My Trips", icon: FiClipboard, authOnly: true },
    { href: "/support", label: "Support", icon: HiSupport },
];

const PROFILE_NAME_STORAGE = "profileName";

// Hard payment-session timeout: starts once the person actually reaches the
// payment step (not on review), and lives in the navbar so it's visible no
// matter what's happening in the page content below it.
const SESSION_DURATION = 10 * 60; // 10 minutes in seconds

function SessionTimer({ seconds }: { seconds: number }) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const label = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    const urgent = seconds <= 60;
    return (
        <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold ${
                urgent
                    ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                    : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
            }`}
        >
            <HiOutlineClock className="w-4 h-4" />
            {label}
            <span className={`text-[11px] font-semibold ${urgent ? "text-red-400" : "text-green-500"}`}>
                SAFE &amp; SECURED
            </span>
        </div>
    );
}

function SessionExpiredModal({ onGoBack }: { onGoBack: () => void }) {
    return (
        <>
            {/* Grey overlay — blocks all interaction */}
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
                    {/* Hourglass illustration */}
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950">
                        <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none">
                            <path d="M20 8h24M20 56h24" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
                            <path d="M22 8c0 12 10 16 10 24S22 44 22 56" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M42 8c0 12-10 16-10 24s10 12 10 24" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                            <ellipse cx="32" cy="32" rx="8" ry="4" fill="#fed7aa" />
                        </svg>
                    </div>
                    <h2 className="text-[20px] font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Payments timed out
                    </h2>
                    <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6">
                        Current payment session got expired
                    </p>
                    <button
                        type="button"
                        onClick={onGoBack}
                        className="w-full h-11 rounded-full bg-[#1c8fc7] text-white text-[14px] font-bold hover:bg-[#177aab] transition-colors"
                    >
                        Go back
                    </button>
                </div>
            </div>
        </>
    );
}

// Isolated reader for the `bookingStep` search param. Kept as its own
// component so the useSearchParams() call can be wrapped in <Suspense>
// without pulling the rest of the navbar out of static rendering.
function PaymentStepFlag({ onChange }: { onChange: (isPaymentStep: boolean) => void }) {
    const searchParams = useSearchParams();
    const isPaymentStep = searchParams.get("bookingStep") === "payment";

    useEffect(() => {
        onChange(isPaymentStep);
    }, [isPaymentStep, onChange]);

    return null;
}

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const [profileName, setProfileName] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [isPaymentStep, setIsPaymentStep] = useState(false);
    const [sessionSeconds, setSessionSeconds] = useState(SESSION_DURATION);
    const [sessionExpired, setSessionExpired] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    const visibleNavLinks = NAV_LINKS.filter((link) => !link.authOnly || loggedIn);

    // Reset the countdown fresh each time the payment step is entered, and
    // leave it alone once it's already expired so it doesn't restart itself.
    useEffect(() => {
        if (isPaymentStep) {
            setSessionSeconds(SESSION_DURATION);
            setSessionExpired(false);
        }
    }, [isPaymentStep]);

    useEffect(() => {
        if (!isPaymentStep || sessionExpired) return;
        if (sessionSeconds <= 0) {
            setSessionExpired(true);
            return;
        }
        const t = setTimeout(() => setSessionSeconds((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [isPaymentStep, sessionSeconds, sessionExpired]);

    function handleSessionExpiredGoBack() {
        window.location.href = "/";
    }

    useEffect(() => {
        const check = () => setLoggedIn(isLoggedInSession());
        check();

        function handleVisibility() {
            if (document.visibilityState === "visible") check();
        }

        window.addEventListener("flyomint:login", check);
        window.addEventListener("flyomint:logout", check);
        // Dispatched by app/lib/api.js when a login token's refresh fails —
        // without this, the navbar could keep showing "My Trips"/profile
        // menus after the token underneath has already fallen back to a
        // guest token.
        window.addEventListener("flyomint:sessionExpired", check);
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            window.removeEventListener("flyomint:login", check);
            window.removeEventListener("flyomint:logout", check);
            window.removeEventListener("flyomint:sessionExpired", check);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    useEffect(() => {
        if (!loginOpen) {
            setLoggedIn(isLoggedInSession());
        }
    }, [loginOpen]);


    useEffect(() => {
        if (!loggedIn) {
            setProfileName("");
            localStorage.removeItem(PROFILE_NAME_STORAGE);
            return;
        }

        const cached = localStorage.getItem(PROFILE_NAME_STORAGE);
        if (cached) setProfileName(cached);

        let cancelled = false;
        getUserProfile().then((res) => {
            if (cancelled || !res.success) return;
            const name = res.name || "";
            setProfileName(name);
            if (name) {
                localStorage.setItem(PROFILE_NAME_STORAGE, name);
            } else {
                localStorage.removeItem(PROFILE_NAME_STORAGE);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [loggedIn]);

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
        localStorage.removeItem(PROFILE_NAME_STORAGE);
        router.push("/");
    }

    return (
        <>
            {/* Reads ?bookingStep=payment without blocking the rest of the navbar
                from static rendering. Renders nothing visually. */}
            <Suspense fallback={null}>
                <PaymentStepFlag onChange={setIsPaymentStep} />
            </Suspense>

            <header
                className={`fixed inset-x-0 top-0 z-50 w-full h-16 transition-all duration-300 ${
                    scrolled
                        ? "bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm"
                        : "bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
                }`}
            >
                <div className="max-w-8xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0 bg-white rounded-full" aria-label="Flyomint home">
                        <Image src="/assets/logo.jpg" alt="Flyomint" width={180} height={52} className="h-9 w-auto" priority />
                    </Link>

                    {/* Center nav — hidden on the payment step so there's nowhere to
                        navigate away to mid-checkout. */}
                    {!isPaymentStep && (
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
                    )}

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {/* Payment-session countdown — only visible on the payment step,
                            in place of the other (hidden) menu options. */}
                        {isPaymentStep && <SessionTimer seconds={sessionSeconds} />}

                        {/* Theme toggle — also hidden on the payment step, along with
                            every other menu option. */}
                        {!isPaymentStep && (
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
                        )}

                        {!isPaymentStep && (
                            <>
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

            <Link
                href="/my-bookings"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
                <FiClipboard className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                My Trips
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
                            </>
                        )}

                        {!isPaymentStep && (
                            <button
                                onClick={() => setMobileOpen((v) => !v)}
                                className="lg:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                aria-label="Toggle menu"
                            >
                                {mobileOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>

                {!isPaymentStep && mobileOpen && (
                    <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <div className="max-w-7xl mx-auto px-4 py-3 space-y-0.5">
                            
                            {!isPaymentStep && (
                                <>
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
<Link
    href="/my-bookings"
    onClick={() => setMobileOpen(false)}
    className="flex items-center gap-2 justify-center mb-2 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm"
>
    <FiClipboard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
    My Trips
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
                                </>
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

            {sessionExpired && <SessionExpiredModal onGoBack={handleSessionExpiredGoBack} />}
        </>
    );
}