"use client";

import { PendingApproval } from "@/types";

interface ApprovalGateProps {
  approval: PendingApproval;
  onApprove: () => void;
  onReject: () => void;
}

export default function ApprovalGate({ approval, onApprove, onReject }: ApprovalGateProps) {
  const details = approval.action_details || {};

  // Extract key details for display
  const description = details.description || approval.reason;
  const cost = details.total_cost || details.cost;
  const quantity = details.quantity;
  const supplier = details.supplier_id;

  return (
    <div className="bg-bg-secondary rounded-xl border-2 border-accent-red/30 overflow-hidden">
      <div className="px-5 py-4 border-b border-accent-red/10 bg-accent-red/5 flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-accent-red animate-pulse-dot" />
        <div>
          <h3 className="font-bold text-accent-red text-sm uppercase tracking-wider">Decision Required</h3>
          <p className="text-xs text-text-secondary mt-0.5">Human approval needed to proceed</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Action summary */}
        <div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Action</div>
          <div className="text-base font-semibold">{description || approval.action_type.replace(/_/g, " ")}</div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-4">
          {cost && (
            <div className="bg-bg-tertiary/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold font-mono">{typeof cost === "number" ? `Rs.${cost.toLocaleString()}` : cost}</div>
              <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">Cost</div>
            </div>
          )}
          {quantity && (
            <div className="bg-bg-tertiary/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold font-mono">{quantity}</div>
              <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">Quantity</div>
            </div>
          )}
          {supplier && (
            <div className="bg-bg-tertiary/50 rounded-lg p-3 text-center">
              <div className="text-sm font-bold">{supplier}</div>
              <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">Supplier</div>
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="bg-bg-tertiary/30 rounded-lg p-3">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Why</div>
          <div className="text-sm text-text-secondary">{approval.reason}</div>
        </div>

        {/* Approve / Reject */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onReject}
            className="flex-1 bg-bg-tertiary hover:bg-gray-600 text-foreground font-medium py-3 rounded-lg transition-colors text-sm"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="flex-1 bg-accent-green hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors text-sm"
          >
            Approve & Execute
          </button>
        </div>
      </div>
    </div>
  );
}
