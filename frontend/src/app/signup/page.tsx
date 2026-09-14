"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input } from "@/components/ui";

export default function SignUpPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", businessName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.email.trim()) errs.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.password) errs.password = "Required";
    else if (form.password.length < 8) errs.password = "Minimum 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    if (!form.businessName.trim()) errs.businessName = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await signup({ name: form.name, email: form.email, password: form.password, businessName: form.businessName });
    setLoading(false);
    if (result.success) router.push("/onboarding");
  };

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--blue-500)] flex items-center justify-center font-bold text-white text-sm">R</div>
            <span className="font-semibold text-lg">ResolveOS</span>
          </Link>
          <h1 className="text-2xl font-bold">Create your workspace</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Start resolving operational problems</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" placeholder="Your name" value={form.name} onChange={e => update("name", e.target.value)} error={errors.name} />
          <Input label="Email" type="email" placeholder="you@company.com" value={form.email} onChange={e => update("email", e.target.value)} error={errors.email} />
          <Input label="Business name" placeholder="Your business" value={form.businessName} onChange={e => update("businessName", e.target.value)} error={errors.businessName} />
          <Input label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={e => update("password", e.target.value)} error={errors.password} />
          <Input label="Confirm password" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} error={errors.confirmPassword} />
          <div className="text-xs text-[var(--text-secondary)]">
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </div>
          <Button type="submit" loading={loading} className="w-full">Create workspace</Button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          Already have an account? <Link href="/signin" className="text-[var(--blue-400)] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
