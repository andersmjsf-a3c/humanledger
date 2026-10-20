import type { ReactNode } from "react";
import { PRODUCT_NAME } from "@/config/brand";

export const metadata = { title: PRODUCT_NAME, description: "A private ledger for people who lead their AI." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "48px auto", padding: "0 16px" }}>
        {children}
      </body>
    </html>
  );
}
