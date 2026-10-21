import { Checker } from "@/vault/ui/Checker";

export const metadata = { title: "Check a draft" };

export default function Check() {
  return (
    <main>
      <h1>Check a draft</h1>
      <p className="lede">
        Two checks. The first looks for the signs of AI writing that Wikipedia's editors catalogued. The second checks your own
        rules, from your worksheets and your writing-voice skill. Nothing leaves this page.
      </p>
      <Checker />
    </main>
  );
}
