"use client";

import { Calendar, CalendarDays, Clock, ConciergeBell, House, ImageIcon, List, Menu, MessageSquareText, Settings, ShoppingBag, Star, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { NewTabCue } from "@/components/ui/NewTabCue";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: House },
  { href: "/admin/reservations", label: "Reservations", icon: Calendar },
  // Phase 2 (4 Nov): order requests + catering inquiries; badge = new requests
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  {
    href: "/admin/menu",
    label: "Menu",
    icon: List,
    children: [
      { href: "/admin/menu", label: "Items" },
      { href: "/admin/menu/categories", label: "Categories" },
      { href: "/admin/menu/modifiers", label: "Modifiers" },
      { href: "/admin/menu/ordering", label: "Express + Holiday" },
    ],
  },
  { href: "/admin/catering", label: "Catering", icon: ConciergeBell },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/special-events", label: "Special Events", icon: Star },
  { href: "/admin/hours", label: "Hours", icon: Clock },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user, pendingCount, newOrderCount = 0 }: { user: { name: string; email: string }; pendingCount: number; newOrderCount?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Admin">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition", active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")}
              aria-current={active ? "page" : undefined}
            >
              <item.icon aria-hidden className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin/reservations" && pendingCount > 0 && (
                <span className={cn("rounded-full px-1.5 text-[11px] font-semibold", active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800")}>{pendingCount}</span>
              )}
              {item.href === "/admin/orders" && newOrderCount > 0 && (
                <span className={cn("rounded-full px-1.5 text-[11px] font-semibold", active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800")}>{newOrderCount}</span>
              )}
            </Link>
            {item.children && active && (
              <div className="ml-4 mt-1 flex flex-col border-l border-zinc-200 pl-3">
                {item.children.map((c) => {
                  const sub = pathname === c.href;
                  return (
                    <Link key={c.href} href={c.href} onClick={() => setOpen(false)} className={cn("rounded-md px-2 py-1.5 text-[13px]", sub ? "font-semibold text-zinc-900" : "text-zinc-500 hover:text-zinc-900")} aria-current={sub ? "page" : undefined}>
                      {c.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-zinc-200 px-4 py-3">
      <p className="truncate text-[13px] font-medium text-zinc-800">{user.name}</p>
      <p className="truncate text-[12px] text-zinc-500">{user.email}</p>
      <div className="mt-2 flex gap-3 text-[12px]">
        <Link href="/" target="_blank" className="text-zinc-500 hover:text-zinc-900">View site ↗<NewTabCue /></Link>
        <form action="/admin/logout" method="post"><button type="submit" className="text-zinc-500 hover:text-zinc-900">Sign out</button></form>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Admin</p>
          <p className="mt-1 text-[15px] font-semibold text-zinc-900">The Smoky Mug</p>
        </div>
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Admin</p>
          <p className="text-[14px] font-semibold text-zinc-900">The Smoky Mug</p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle navigation" className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300">
          {open ? <X aria-hidden className="h-4 w-4" /> : <Menu aria-hidden className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 top-[61px] z-30 flex flex-col bg-white lg:hidden">
          <div className="py-3">{nav}</div>
          {footer}
        </div>
      )}
    </>
  );
}
