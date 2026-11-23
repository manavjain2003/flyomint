import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import "./globals.css";
import ThemeProvider, { noFlashThemeScript } from "./components/shared/ThemeProvider";
import SiteBanners from "@/app/components/cms/SiteBanners";
import CookieConsent from "@/app/components/cms/CookieConsent";
import WhatsAppButton from "@/app/components/cms/WhatsAppButton";
import PopupManager from "@/app/components/cms/PopupManager";
import Analytics from "@/app/components/cms/Analytics";
import { getSiteBundle } from "@/app/lib/cms/server";
import { metadataBase } from "@/app/lib/cms/seo";

const fontSans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

/** Search Console accepts either the bare token or the whole <meta> tag in the CMS field. */
const verificationToken = (code?: string) => code?.match(/content\s*=\s*["']([^"']+)["']/i)?.[1] ?? (code && !code.includes("<") ? code.trim() : undefined);

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteBundle();
  const name = site?.theme?.siteName || "Flyomint";
  return {
    metadataBase,
    title: { default: name, template: `%s | ${name}` },
    description: "Find flights you'll actually want to book.",
    icons: { icon: site?.theme?.favicon?.url || "/icon.png" },
    verification: { google: verificationToken(site?.settings?.searchConsoleCode) },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteBundle();
  const maintenance = site?.settings?.maintenanceMode;
  const logoUrl = site?.header?.logo?.url || site?.theme?.logo?.url;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable}`}
      style={
        site?.theme
          ? ({ "--cms-primary": site.theme.primaryColor, "--cms-secondary": site.theme.secondaryColor } as React.CSSProperties)
          : undefined
      }
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <Navbar
            logoUrl={logoUrl}
            logoAlt={site?.theme?.siteName}
            phone={site?.header?.phone}
            sticky={site?.header?.stickyHeader !== false}
            showAuthButtons={site?.header?.showAuthButtons !== false}
          />
          <SiteBanners site={site} />
          <main className="flex-1 flex flex-col">
            {maintenance ? (
              <div className="flex-1 grid place-items-center px-6 py-24 text-center">
                <div className="max-w-md">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">We&apos;ll be right back</h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    {site?.settings?.maintenanceMessage || "The website is under maintenance. Please check back shortly."}
                  </p>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
          <Footer site={site} />
          {site && <WhatsAppButton config={site.whatsapp} />}
          {site?.cookieConsent?.cookieConsentEnabled && (
            <CookieConsent
              message={site.cookieConsent.cookieMessage}
              buttonText={site.cookieConsent.cookieButtonText}
              policyLink={site.cookieConsent.cookiePolicyLink}
            />
          )}
          {site && !maintenance && <PopupManager popups={site.popups} />}
        </ThemeProvider>
        <Analytics site={site} />
      </body>
    </html>
  );
}
