"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCase, approveAction, rejectAction } from "@/lib/api";
import { Case } from "@/types";
import CaseDetail from "@/components/CaseDetail";

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCase = useCallback(async () => {
    try {
      const data = await getCase(caseId);
      setCaseData(data);
    } catch (err) {
      console.error("Failed to load case:", err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadCase();
    const interval = setInterval(loadCase, 3000); // Refresh every 3s
    return () => clearInterval(interval);
  }, [loadCase]);

  const handleApprove = async () => {
    try {
      await approveAction(caseId);
      loadCase();
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  const handleReject = async () => {
    try {
      await rejectAction(caseId);
      loadCase();
    } catch (err) {
      console.error("Failed to reject:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Loading case...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">Case not found</div>
          <button onClick={() => router.push("/")} className="text-accent-blue hover:underline">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <CaseDetail
      caseData={caseData}
      onApprove={handleApprove}
      onReject={handleReject}
      onBack={() => router.push("/")}
    />
  );
}
