import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Number Heist — Hack the Vault",
  description: "Test your math skills in this thrilling hacker-themed brain game. Solve puzzles, break combos, and crack the vault!",
  keywords: ["math game", "brain teaser", "number puzzle", "hacker game", "mental math"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased grid-bg scanline-overlay relative">
        {children}
      </body>
    </html>
  );
}
