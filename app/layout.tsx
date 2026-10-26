import type { ReactNode } from "react";
import "@fontsource-variable/inter";
import { PRODUCT_NAME } from "@/config/brand";
import { SiteFooter, SiteHeader } from "@/service/SiteChrome";
import "./globals.css";

export const metadata = {
  title: PRODUCT_NAME,
  description: "Helping every person lead AI, keep what they learn, and build on it.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
