import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Marvello — Marketing AI Platform",
  description: "Agentic marketing workflow platform powered by Claude AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#0A0A0F] text-white antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-56 flex-1 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
