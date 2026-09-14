"use client";

import { useState } from "react";
import { createCase, runCase } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function GoalInput({ onCreated }: { onCreated?: () => void }) {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || loading) return;

    setLoading(true);
    try {
      const caseData = await createCase(goal.trim());
      await runCase(caseData.id);
      setGoal("");
      onCreated?.();
      router.push(`/cases/${caseData.id}`);
    } catch (err) {
      console.error("Failed to create case:", err);
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "The supplier says our tea leaves delivery will be late by 3 days. Make sure we dont run out of stock.",
    "We received an invoice that doesnt match our purchase order. Resolve this discrepancy.",
    "A customer is complaining about a delayed order. Handle this.",
  ];

  return (
    <div className="bg-bg-secondary rounded-xl border border-bg-tertiary p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-text-secondary mb-4">
        What outcome needs resolving?
      </h2>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Describe the outcome you need..."
          className="flex-1 bg-bg-tertiary rounded-lg px-4 py-3 text-foreground placeholder:text-text-secondary/60 border border-transparent focus:border-accent-blue focus:outline-none text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!goal.trim() || loading}
          className="bg-accent-blue hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
        >
          {loading ? "Starting..." : "Resolve"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => setGoal(ex)}
            className="text-xs bg-bg-tertiary/50 hover:bg-bg-tertiary text-text-secondary px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-bg-tertiary"
          >
            {ex.substring(0, 45)}...
          </button>
        ))}
      </div>
    </div>
  );
}
