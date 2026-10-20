import type { ReactNode } from "react";
import { PRODUCT_NAME } from "@/config/brand";
import "./globals.css";

export const metadata = { title: PRODUCT_NAME, description: "A private ledger for people who lead their AI." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
