import type { Metadata } from "next";

import { HistoryList } from "@/components/history/HistoryList";

export const metadata: Metadata = {
  title: "History — Delva",
};

export default function HistoryPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-medium">Your sessions</h1>
      <p className="mt-2 text-sm text-muted">
        Grouped by day, in your own timezone. Durations are what you actually
        served, not what the timer promised.
      </p>
      <div className="mt-10">
        <HistoryList />
      </div>
    </main>
  );
}
