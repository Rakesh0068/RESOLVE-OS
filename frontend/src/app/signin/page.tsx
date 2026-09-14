"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input } from "@/components/ui";

export default function SignInPage() {
  const { signin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Email and password are required."); return; }
    setLoading(true);
    const result = await signin(email, password);
    setLoading(false);
    if (result.success) {
      router.push("/app");
    } else {
      setError(result.error || "Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--blue-500)] flex items-center justify-center font-bold text-white text-sm">R</div>
            <span className="font-semibold text-lg">ResolveOS</span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-[var(--red-400)] bg-[var(--red-950)] border border-[var(--red-500)]/20 rounded-[var(--radius-md)] px-4 py-3">{error}</div>}
          <Input label="Email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-[var(--text-secondary)]">
              <input type="checkbox" className="rounded" /> Remember me
            </label>
            <Link href="/forgot-password" className="text-[var(--blue-400)] hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" loading={loading} className="w-full">Sign in</Button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          Don&apos;t have an account? <Link href="/signup" className="text-[var(--blue-400)] hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
