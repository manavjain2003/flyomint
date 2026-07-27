import type { Metadata } from "next";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
    title: "Flyomint",
    description: "Find flights you'll actually want to book.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
       <html lang="en" suppressHydrationWarning>
           <body className="min-h-screen bg-white flex flex-col" suppressHydrationWarning>
                <Navbar />
                 <main className="flex-1 flex flex-col">{children}</main>
                <Footer />
            </body>
        </html>
    );
}