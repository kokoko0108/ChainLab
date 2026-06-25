import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Web3 Wallet App",
  description:
    "Connect your wallet, view your balance, and switch networks — built with Next.js, wagmi v2, viem and RainbowKit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This is a Server Component. We keep all client-only providers inside
  // <Providers /> so the document shell can still render on the server.
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
