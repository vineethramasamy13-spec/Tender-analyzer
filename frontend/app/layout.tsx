import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: "TenderAI — AI-Powered Tender Intelligence Platform",
    template: "%s | TenderAI",
  },
  description:
    "Discover, analyze, and win government tenders with 6 specialized AI agents. Powered by Groq Llama 3.3 and Gemini 2.5.",
  keywords: [
    "tender analysis",
    "government tenders",
    "AI tender",
    "GeM portal",
    "CPPP tenders",
    "tender intelligence",
    "bid management",
  ],
  openGraph: {
    title: "TenderAI — AI-Powered Tender Intelligence",
    description: "Win more government tenders with AI-powered analysis",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Navbar />
        <main>{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              backdropFilter: 'blur(20px)',
              fontFamily: 'Fira Sans, sans-serif',
            },
            success: {
              iconTheme: { primary: '#22C55E', secondary: 'var(--bg-primary)' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: 'var(--bg-primary)' },
            },
          }}
        />
      </body>
    </html>
  );
}
