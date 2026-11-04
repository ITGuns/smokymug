import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/toast";
import { requireAdminPage } from "@/lib/auth";
import { getClock } from "@/lib/availability";
import { countNewOrderRequests } from "@/lib/data/ordering";
import { dashboardStats } from "@/lib/data/reservations";
import { readBookingSettings } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Smoky Mug Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  const clock = getClock((await readBookingSettings()).timezone);
  // Phase 2: a missing order table (prod before db:push) gives null, never a crash
  const [{ pendingCount }, newOrders] = await Promise.all([dashboardStats(clock.date), countNewOrderRequests()]);
  return (
    <div className="admin-body flex min-h-screen flex-col lg:flex-row">
      <ToastProvider>
        <Sidebar user={{ name: session.name, email: session.email }} pendingCount={pendingCount} newOrderCount={newOrders ?? 0} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </ToastProvider>
    </div>
  );
}
