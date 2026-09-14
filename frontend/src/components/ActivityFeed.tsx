"use client";

import { useEffect, useRef, useState } from "react";
import { ActivityEvent } from "@/types";

const STEP_CONFIG: Record<string, { color: string; icon: string }> = {
  investigate: { color: "text-accent-blue", icon: "🔍" },
  plan: { color: "text-accent-purple", icon: "📋" },
  act: { color: "text-accent-green", icon: "⚡" },
  verify: { color: "text-accent-green", icon: "✓" },
  escalate: { color: "text-accent-red", icon: "⚠" },
  replan: { color: "text-accent-yellow", icon: "↻" },
  reason: { color: "text-text-secondary", icon: "→" },
};

// Map technical messages to human-readable summaries
function humanize(message: string): string {
  if (message.includes("Objective") || message.includes("objective")) return "Understanding the objective";
  if (message.includes("Outcome contract")) return "Outcome contract created";
  if (message.includes("Generating execution plan")) return "Generating plan";
  if (message.includes("Plan generated")) return "Plan ready";
  if (message.includes("Check current inventory")) return "Checking inventory levels";
  if (message.includes("Check existing purchase orders")) return "Reviewing purchase orders";
  if (message.includes("Calculate projected shortage")) return "Calculating projected shortage";
  if (message.includes("Check supplier history")) return "Analyzing supplier reliability";
  if (message.includes("Search alternative suppliers")) return "Searching for alternative suppliers";
  if (message.includes("Compare supplier options")) return "Comparing supplier options";
  if (message.includes("Request human approval")) return "Approval needed for emergency purchase";
  if (message.includes("Approved")) return "Approval received — proceeding";
  if (message.includes("Auto-approved")) return "Auto-approved by business policy";
  if (message.includes("Create purchase order")) return "Creating purchase order";
  if (message.includes("Send order confirmation")) return "Notifying supplier";
  if (message.includes("Verify order")) return "Verifying order confirmation";
  if (message.includes("Check updated inventory")) return "Verifying inventory levels";
  if (message.includes("Verifying resolution")) return "Verifying outcome";
  if (message.includes("CASE RESOLVED")) return "Outcome resolved successfully";
  if (message.includes("REPLAN")) return "Plan invalidated — generating new approach";
  if (message.includes("MAX REPLANS")) return "Maximum replans reached — escalating";
  if (message.includes("Inventory check:")) return "Inventory status verified";
  return message;
}

function isActionResult(message: string): boolean {
  return message.startsWith("[OK]") || message.startsWith("[X]") || message.startsWith("[~]");
}

export default function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events.length]);

  const toggleExpand = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Filter out repetitive "Goal: ..." lines and plan-generated noise
  const filteredEvents = events.filter((e) => {
    if (e.message.startsWith("   ")) return false; // indented detail lines
    return true;
  });

  return (
    <div className="bg-bg-secondary rounded-xl border border-bg-tertiary overflow-hidden">
      <div className="px-4 py-3 border-b border-bg-tertiary flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Agent Activity
        </h3>
        <span className="text-xs text-text-secondary font-mono">{filteredEvents.length} events</span>
      </div>

      <div ref={feedRef} className="max-h-[400px] overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-text-secondary text-sm">
            Waiting for agent activity...
          </div>
        ) : (
          <div className="divide-y divide-bg-tertiary">
            {filteredEvents.map((event, i) => {
              const ts = event.timestamp.length > 19
                ? event.timestamp.substring(11, 19)
                : event.timestamp.substring(0, 8);
              const config = STEP_CONFIG[event.step_type] || STEP_CONFIG.reason;
              const isAction = isActionResult(event.message);
              const isImportant = event.step_type === "escalate" || event.step_type === "replan";

              return (
                <div
                  key={i}
                  className={`px-4 py-3 flex items-start gap-3 hover:bg-bg-tertiary/30 transition-colors ${
                    isImportant ? "bg-accent-yellow/5" : ""
                  }`}
                >
                  {/* Timestamp */}
                  <span className="text-xs text-text-secondary font-mono mt-0.5 shrink-0 w-14">
                    {ts}
                  </span>

                  {/* Status dot */}
                  <div className="mt-1.5 shrink-0">
                    <span
                      className={`block w-2 h-2 rounded-full ${
                        isAction
                          ? event.message.startsWith("[OK]")
                            ? "bg-accent-green"
                            : "bg-accent-red"
                          : isImportant
                          ? "bg-accent-yellow animate-pulse-dot"
                          : "bg-bg-tertiary"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm ${
                        isAction
                          ? event.message.startsWith("[OK]")
                            ? "text-accent-green"
                            : "text-accent-red"
                          : "text-foreground/80"
                      }`}
                    >
                      {humanize(event.message)}
                    </div>

                    {/* Expandable details */}
                    {isAction && (
                      <button
                        onClick={() => toggleExpand(i)}
                        className="text-[10px] text-text-secondary hover:text-foreground mt-1 transition-colors"
                      >
                        {expanded.has(i) ? "Hide details" : "Why?"}
                      </button>
                    )}
                    {expanded.has(i) && (
                      <div className="mt-2 text-xs text-text-secondary bg-bg-tertiary/50 rounded p-2 font-mono">
                        {event.message}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
