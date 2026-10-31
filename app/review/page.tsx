import { Review } from "@/review/Review";

export const metadata = { title: "Review your sounding" };

export default function ReviewPage() {
  return (
    <main>
      <h1>Your sounding</h1>
      <p className="meta">The depth check you take yourself: counts of what&apos;s current, what&apos;s due, what passed.</p>
      <Review />
    </main>
  );
}
