import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "STRATIQ - AI Strategy Assistant",
  description:
    "Enterprise AI-powered brief intelligence and deck generation for marketing agencies.",
  keywords: ["AI", "marketing", "strategy", "brief analysis", "deck generation"],
  openGraph: {
    title: "STRATIQ - AI Strategy Assistant",
    description:
      "Your brief is read. Your deck is ready. Enterprise AI strategy assistant.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            theme="dark"
            closeButton
          />
        </Providers>
      </body>
    </html>
  );
}
