import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Natural Language Golf Search",
  description: "AI-powered golf equipment search for 2nd Swing Golf",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="m-0 text-base bg-white min-h-screen">{children}</body>
    </html>
  );
}
