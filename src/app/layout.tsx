import type { Metadata, Viewport } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./responsive.css";
import { Suspense } from "react";

// const geistSans = Geist({
//     variable: "--font-geist-sans",
//     subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//     variable: "--font-geist-mono",
//     subsets: ["latin"],
// });

export const metadata: Metadata = {
    title: "日常工具",
    description: "技术就要为自己产生价值",
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                // ${geistSans.variable} ${geistMono.variable}
                className={`antialiased`}
            >
                <Suspense fallback={<div>Loading...</div>}>
                    {children}
                </Suspense>
            </body>
        </html>
    );
}
