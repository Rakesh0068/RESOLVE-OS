"use client";

import { useEffect, useRef } from "react";
import { ActivityEvent } from "@/types";

const STEP_COLORS: Record<string, string> = {
  investigate: "text-accent-blue",
  plan: "text-accent-purple",
  act: "text-accent-green",
  verify: "text-accent-green",
  escalate: "text-accent-red",
  replan: "text-accent-yellow",
  reason: "text-text-secondary",
};

export default function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <div className="bg-bg-secondary rounded-lg border border-bg-tertiary overflow-hidden">
      <div className="px-4 py-3 border-b border-bg-tertiary bg-bg-tertiary/50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span className="text-accent-green">{'[>]'}</span>
          Agent Activity
        </h3>
      </div>

      <div ref={feedRef} className="p-4 max-h-[500px] overflow-y-auto space-y-1 font-mono text-sm">
        {events.length === 0 ? (
          <div className="text-text-secondary text-center py-4">Waiting for agent activity...</div>
        ) : (
          events.map((event, i) => {
            const ts = event.timestamp.length > 19
              ? event.timestamp.substring(11, 19)
              : event.timestamp.substring(0, 8);

            return (
              <div
                key={i}
                className="flex items-start gap-3 py-1 animate-slide-in"
              >
                <span className="text-text-secondary text-xs mt-0.5 shrink-0 w-16">
                  {ts}
                </span>
                <span className={`text-xs mt-0.5 shrink-0 w-20 capitalize ${STEP_COLORS[event.step_type] || "text-text-secondary"}`}>
                  [{event.step_type}]
                </span>
                <span className="text-sm text-foreground/90 break-words">
                  {event.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
