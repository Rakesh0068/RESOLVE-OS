"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { href: "/", label: "Overview", icon: "◉" },
      { href: "/cases", label: "Cases", icon: "◎" },
      { href: "/decisions", label: "Decisions", icon: "⬡" },
      { href: "/monitoring", label: "Monitoring", icon: "◔" },
      { href: "/activity", label: "Activity", icon: "≡" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/inventory", label: "Inventory", icon: "▦" },
      { href: "/suppliers", label: "Suppliers", icon: "◈" },
      { href: "/orders", label: "Orders", icon: "▤" },
      { href: "/invoices", label: "Invoices", icon: "▧" },
    ],
  },
  {
    label: "Control",
    items: [
      { href: "/policies", label: "Policies", icon: "⊞" },
      { href: "/autonomy", label: "Autonomy", icon: "⟡" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-screen bg-bg-secondary border-r border-bg-tertiary flex flex-col shrink-0 sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-bg-tertiary">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center font-bold text-white text-sm">
            R
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">ResolveOS</div>
            <div className="text-[10px] text-text-secondary tracking-wide uppercase">Operations</div>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      active
                        ? "bg-bg-tertiary text-foreground font-medium"
                        : "text-text-secondary hover:text-foreground hover:bg-bg-tertiary/50"
                    }`}
                  >
                    <span className="w-5 text-center text-xs opacity-60">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom status */}
      <div className="px-5 py-4 border-t border-bg-tertiary">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse-dot" />
          <span className="text-xs text-text-secondary">System Operational</span>
        </div>
      </div>
    </aside>
  );
}
