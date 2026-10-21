import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/config/brand";

export default function Home() {
  return (
    <main>
      <h1>{PRODUCT_NAME}</h1>
      <p>{PRODUCT_TAGLINE}</p>
      <p>
        <a href="/workbook">Open the workbook</a> · <a href="/skills">Build your skills</a> · <a href="/check">Check a draft</a> · <a href="/login">Sign in</a>
      </p>
    </main>
  );
}
