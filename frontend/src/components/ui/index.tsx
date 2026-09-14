"use client";

import React from "react";

/* ── Button ───────────────────────────────────────────── */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-[var(--blue-500)] hover:bg-[var(--blue-400)] text-white",
  secondary: "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)]",
  ghost: "bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]",
  danger: "bg-[var(--red-500)] hover:bg-[var(--red-400)] text-white",
  success: "bg-[var(--green-500)] hover:bg-[var(--green-400)] text-white",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${BUTTON_STYLES[variant]} ${BUTTON_SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

/* ── Input ────────────────────────────────────────────── */

export function Input({
  label,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`w-full h-10 px-3 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--blue-500)] focus:ring-1 focus:ring-[var(--blue-500)] transition-colors ${error ? "border-[var(--red-500)]" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[var(--red-400)]">{error}</p>}
    </div>
  );
}

/* ── Badge ────────────────────────────────────────────── */

type BadgeVariant = "default" | "green" | "amber" | "red" | "blue" | "purple";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  default: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
  green: "bg-[var(--green-950)] text-[var(--green-400)]",
  amber: "bg-[var(--amber-950)] text-[var(--amber-400)]",
  red: "bg-[var(--red-950)] text-[var(--red-400)]",
  blue: "bg-[var(--blue-950)] text-[var(--blue-400)]",
  purple: "bg-purple-950 text-[var(--purple-400)]",
};

export function Badge({
  variant = "default",
  pulse = false,
  className = "",
  children,
}: {
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full ${BADGE_STYLES[variant]} ${className}`}
    >
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === "green" ? "bg-[var(--green-400)]" :
          variant === "amber" ? "bg-[var(--amber-400)]" :
          variant === "red" ? "bg-[var(--red-400)]" :
          variant === "blue" ? "bg-[var(--blue-400)]" :
          "bg-[var(--text-secondary)]"
        } animate-pulse-subtle`} />
      )}
      {children}
    </span>
  );
}

/* ── Card ─────────────────────────────────────────────── */

export function Card({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] w-full max-w-lg mx-4 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ── ConfirmDialog ────────────────────────────────────── */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-[var(--text-secondary)] mb-6">{description}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/* ── Toast ────────────────────────────────────────────── */

type ToastType = "success" | "error" | "info";

let toastTimeout: NodeJS.Timeout | null = null;

export function showToast(message: string, type: ToastType = "success") {
  const existing = document.getElementById("resolveos-toast");
  if (existing) existing.remove();
  if (toastTimeout) clearTimeout(toastTimeout);

  const colors: Record<ToastType, string> = {
    success: "bg-[var(--green-900)] border-[var(--green-500)] text-[var(--green-400)]",
    error: "bg-[var(--red-900)] border-[var(--red-500)] text-[var(--red-400)]",
    info: "bg-[var(--blue-900)] border-[var(--blue-500)] text-[var(--blue-400)]",
  };

  const el = document.createElement("div");
  el.id = "resolveos-toast";
  el.className = `fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-[var(--radius-md)] border text-sm font-medium animate-slide-up ${colors[type]}`;
  el.textContent = message;
  document.body.appendChild(el);

  toastTimeout = setTimeout(() => el.remove(), 3000);
}

/* ── Skeleton ─────────────────────────────────────────── */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/* ── EmptyState ───────────────────────────────────────── */

export function EmptyState({
  icon = "◉",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 opacity-20">{icon}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

/* ── Progress ─────────────────────────────────────────── */

export function Progress({
  value,
  max = 100,
  color = "blue",
  size = "md",
}: {
  value: number;
  max?: number;
  color?: "green" | "amber" | "red" | "blue";
  size?: "sm" | "md";
}) {
  const pct = Math.min(100, (value / max) * 100);
  const colors = {
    green: "bg-[var(--green-500)]",
    amber: "bg-[var(--amber-500)]",
    red: "bg-[var(--red-500)]",
    blue: "bg-[var(--blue-500)]",
  };
  return (
    <div className={`w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden ${size === "sm" ? "h-1" : "h-2"}`}>
      <div className={`h-full rounded-full transition-all duration-700 ${colors[color]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────── */

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-[var(--border-subtle)]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            active === tab.key
              ? "border-[var(--blue-500)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-[11px] opacity-60">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
