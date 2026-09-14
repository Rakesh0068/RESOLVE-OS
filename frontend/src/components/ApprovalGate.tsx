"use client";

import { PendingApproval } from "@/types";

interface ApprovalGateProps {
  approval: PendingApproval;
  onApprove: () => void;
  onReject: () => void;
}

export default function ApprovalGate({ approval, onApprove, onReject }: ApprovalGateProps) {
  const details = approval.action_details || {};

  return (
    <div className="bg-accent-red/5 rounded-lg border border-accent-red/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-accent-red/20 bg-accent-red/10 flex items-center gap-2">
        <span className="text-accent-red text-lg">!</span>
        <h3 className="font-semibold text-sm text-accent-red">Decision Required</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Action Type */}
        <div>
          <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">Action</div>
          <div className="text-sm font-medium">{approval.action_type.replace(/_/g, " ")}</div>
        </div>

        {/* Description */}
        <div>
          <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">Details</div>
          <div className="text-sm">{approval.reason}</div>
        </div>

        {/* Parameters */}
        {Object.keys(details).length > 0 && (
          <div className="bg-bg-tertiary rounded p-3">
            <div className="text-xs text-text-secondary uppercase tracking-wide mb-2">Parameters</div>
            <div className="space-y-1">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{key.replace(/_/g, " ")}</span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approve / Reject buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onApprove}
            className="flex-1 bg-accent-green hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 bg-bg-tertiary hover:bg-gray-600 text-foreground font-medium py-3 rounded-lg border border-bg-tertiary transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
