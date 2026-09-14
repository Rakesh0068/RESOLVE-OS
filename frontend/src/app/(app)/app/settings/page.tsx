"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, Button } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, signout } = useAuth();
  const router = useRouter();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Workspace and account settings</p>
      </div>

      <Card className="p-6">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Profile</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[var(--text-tertiary)] mb-1">Name</div>
            <div className="text-sm">{user?.name}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-tertiary)] mb-1">Email</div>
            <div className="text-sm">{user?.email}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-tertiary)] mb-1">Business</div>
            <div className="text-sm">{user?.businessName}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-tertiary)] mb-1">Industry</div>
            <div className="text-sm">{user?.industry}</div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Integrations</div>
        <div className="space-y-3">
          {["Email", "Inventory System", "Accounting", "Calendar"].map(name => (
            <div key={name} className="flex items-center justify-between py-2">
              <span className="text-sm">{name}</span>
              <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-3 py-1 rounded-full">Demo mode</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 border-[var(--red-500)]/20">
        <div className="text-[10px] text-[var(--red-400)] uppercase tracking-wider mb-3">Danger Zone</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Sign out</div>
            <div className="text-xs text-[var(--text-tertiary)]">End your current session</div>
          </div>
          <Button variant="danger" size="sm" onClick={() => { signout(); router.push("/signin"); }}>Sign out</Button>
        </div>
      </Card>
    </div>
  );
}
