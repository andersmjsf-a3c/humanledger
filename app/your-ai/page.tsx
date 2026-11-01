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
        <h1>Your AI</h1>
        <p className="section-sub">What you&apos;ve built, what&apos;s current, what to do next.</p>
        <p className="meta">A keep is a file your AI reads before it works for you: a standing order you own. Claude calls them skills.</p>
        <p className="meta">
          <a href="/history">Soundings you&apos;ve sent</a> · <a href="/privacy">What we can see</a>
        </p>
      </section>
      <YourAI />
    </main>
  );
}
