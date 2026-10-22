import { Review } from "@/review/Review";

export const metadata = { title: "Review your scorecard" };

export default function ReviewPage() {
  return (
    <main>
      <h1>Your scorecard</h1>
      <Review />
    </main>
  );
}
