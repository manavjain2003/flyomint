import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import "./globals.css";
import ThemeProvider, { noFlashThemeScript } from "./components/shared/ThemeProvider";

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

export const metadata: Metadata = {
  title: "Flyomint",
  description: "Find flights you'll actually want to book.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: noFlashThemeScript }}
        />
      </head>
      <body
        className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}