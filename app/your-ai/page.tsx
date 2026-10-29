import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, userIdForSession } from "@/lib/auth/session";
import { YourAI } from "@/account/YourAI";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your AI" };

export default async function YourAIPage() {
  const userId = await userIdForSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) redirect("/login");
  return (
    <main className="home dashboard">
      <section className="wrap dash-head">
        <p className="eyebrow">Your AI</p>
        <h1>What you&apos;ve taught it, and what&apos;s next</h1>
        <p className="section-sub">
          We keep the scores. Your files stay in your vault. <a href="/privacy">What we can see</a>
        </p>
      </section>
      <YourAI />
    </main>
  );
}
