"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HiMenu, HiX, HiSupport, HiSun, HiMoon, HiOutlineUserGroup } from "react-icons/hi";
import { HiOutlineUserCircle, HiOutlineUser, HiOutlineArrowRightOnRectangle, HiChevronDown } from "react-icons/hi2";
import { MdFlight } from "react-icons/md";
import { FiClipboard } from "react-icons/fi";
import LoginDrawer, { isLoggedInSession } from "@/app/components/booking/LoginDrawer";
import { getUserProfile, logoutUser } from "@/app/lib/authApi";
import { useTheme } from "@/app/components/shared/ThemeProvider";
import { HiOutlineClock } from "react-icons/hi";
import { isExternal, safeHref } from "@/app/lib/cms/format";
import type { MenuItem } from "@/app/lib/cms/types";

// Navigation itself comes from the CMS "main" menu. These are app features (My Trips needs a login),
// plus a fallback so the header is never empty if the CMS cannot be reached.
const NAV_LINKS: { href: string; label: string; icon: typeof MdFlight; authOnly?: boolean; fallback?: boolean }[] = [
    { href: "/", label: "Search", icon: MdFlight, fallback: true },
    { href: "/my-bookings", label: "My Trips", icon: FiClipboard, authOnly: true },
    { href: "/help-center", label: "Support", icon: HiSupport, fallback: true },
];

const PROFILE_NAME_STORAGE = "profileName";

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
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />

            <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
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

function PaymentStepFlag({ onChange }: { onChange: (isPaymentStep: boolean) => void }) {
    const searchParams = useSearchParams();
    const isPaymentStep = searchParams.get("bookingStep") === "payment";

    useEffect(() => {
        onChange(isPaymentStep);
    }, [isPaymentStep, onChange]);

    return null;
}

type NavbarProps = {
    logoUrl?: string;
    logoAlt?: string;
    menu?: MenuItem[];
    phone?: string;
    sticky?: boolean;
    showAuthButtons?: boolean;
};

function MenuLink({ item, className, onClick }: { item: MenuItem; className: string; onClick?: () => void }) {
    const href = safeHref(item.url);
    if (item.target === "_blank" || isExternal(href)) {
        return <a href={href} target={item.target || "_blank"} rel="noopener noreferrer" className={className} onClick={onClick}>{item.label}</a>;
    }
    return <Link href={href} className={className} onClick={onClick}>{item.label}</Link>;
}

/** Items of the CMS "main" menu; top-level items may have a sub menu. */
function CmsDesktopMenu({ items, pathname }: { items: MenuItem[]; pathname: string }) {
    return (
        <>
            {items.map((item) => {
                const children = (item.children ?? []).filter((c) => c.isActive !== false);
                const active = pathname === item.url;
                const base = `inline-flex items-center gap-1 h-9 px-3.5 rounded-full text-sm font-medium transition-colors ${
                    active ? "text-[#FF7626]" : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                }`;
                if (children.length === 0) return <MenuLink key={item.label + item.url} item={item} className={base} />;
                return (
                    <div key={item.label + item.url} className="relative group">
                        <MenuLink item={item} className={base} />
                        <div className="absolute left-0 top-full pt-2 hidden group-hover:block group-focus-within:block min-w-52 z-50">
                            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1.5">
                                {children.map((c) => (
                                    <MenuLink key={c.label + c.url} item={c} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" />
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
}

export default function Navbar({ logoUrl, logoAlt, menu = [], phone, sticky = true, showAuthButtons = true }: NavbarProps) {
    const cmsMenu = menu.filter((m) => m.isActive !== false);
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

    const visibleNavLinks = NAV_LINKS.filter((link) => (!link.authOnly || loggedIn) && (!link.fallback || cmsMenu.length === 0));

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
            <Suspense fallback={null}>
                <PaymentStepFlag onChange={setIsPaymentStep} />
            </Suspense>

            <header
                className={`${sticky ? "fixed" : "absolute"} inset-x-0 top-0 z-50 w-full h-16 transition-all duration-300 ${
                    scrolled
                        ? "bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm"
                        : "bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
                }`}
            >
                <div className="max-w-8xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-6">
                    <Link href="/" className="flex items-center gap-2 shrink-0 bg-white rounded-full" aria-label="Flyomint home">
                        {logoUrl ? (
                            <img src={logoUrl} alt={logoAlt || "Flyomint"} className="h-9 w-auto" />
                        ) : (
                            <Image src="/assets/logo.jpg" alt="Flyomint" width={180} height={52} className="h-9 w-auto" priority />
                        )}
                    </Link>

          
                    {!isPaymentStep && (
                        <nav className="hidden lg:flex items-center justify-center gap-1 flex-1 min-w-0">
                            <CmsDesktopMenu items={cmsMenu} pathname={pathname} />
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

                    <div className="flex items-center gap-3">
                        {isPaymentStep && <SessionTimer seconds={sessionSeconds} />}

                        {!isPaymentStep && phone && (
                            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="hidden xl:inline text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#FF7626] whitespace-nowrap">
                                {phone}
                            </a>
                        )}

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
        className="absolute right-0 top-full pt-2 w-64"
    >
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1.5 overflow-hidden">
            <Link
                href="/my-profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
                <HiOutlineUser className="w-4 h-4 mt-0.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        My Profile
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        Manage your account
                    </span>
                </span>
            </Link>

            <Link
                href="/my-bookings"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
                <FiClipboard className="w-4 h-4 mt-0.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        My Trips
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        View &amp; manage bookings
                    </span>
                </span>
            </Link>
               <Link
                href="/travellers"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
                <HiOutlineUserGroup className="w-4 h-4 mt-0.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        My Travellers
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        View all saved travellers
                    </span>
                </span>
            </Link>

            <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-red-50 dark:hover:bg-red-950/40"
            >
                <HiOutlineArrowRightOnRectangle className="w-4 h-4 mt-0.5 text-red-400 shrink-0" />
                <span className="flex flex-col">
                    <span className="text-sm font-medium text-red-500 dark:text-red-400">
                        Log out
                    </span>
                    <span className="text-xs text-red-300 dark:text-red-500/70">
                        Sign out of your account
                    </span>
                </span>
            </button>
        </div>
    </div>
)}
                                    </div>
                                ) : !showAuthButtons ? null : (
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
<Link
    href="/travellers"
    onClick={() => setMobileOpen(false)}
    className="flex items-center gap-2 justify-center mb-2 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm"
>
    <HiOutlineUserGroup className="w-5 h-5 text-gray-500 dark:text-gray-400" />
    My Travellers
</Link>
                                            <button
                                                onClick={() => { handleLogout(); setMobileOpen(false); }}
                                                className="block w-full text-center mb-2 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-red-500 dark:text-red-400 font-semibold text-sm"
                                            >
                                                Log out
                                            </button>
                                        </>
                                    ) : !showAuthButtons ? null : (
                                        <button
                                            onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
                                            className="block w-full text-center mb-2 py-2.5 rounded-full bg-[#FF7626] text-white font-semibold text-sm"
                                        >
                                            Sign in
                                        </button>
                                    )}
                                </>
                            )}
                            {cmsMenu.map((item) => (
                                <div key={item.label + item.url}>
                                    <MenuLink item={item} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" />
                                    {(item.children ?? []).filter((c) => c.isActive !== false).map((c) => (
                                        <MenuLink key={c.label + c.url} item={c} onClick={() => setMobileOpen(false)} className="flex items-center pl-9 pr-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800" />
                                    ))}
                                </div>
                            ))}
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