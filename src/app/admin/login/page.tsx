import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: { absolute: "Staff login | The Smoky Mug" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [session, { next }] = await Promise.all([getSession(), searchParams]);
  if (session) redirect(next?.startsWith("/admin") ? next : "/admin");
  return (
    <div className="admin-body flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/images/logo.png" alt="The Smoky Mug" width={120} height={66} />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Staff control panel</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Sign in</h1>
          <p className="mt-1 text-[13px] text-zinc-500">Manage reservations, the menu and hours.</p>
          <div className="mt-5"><LoginForm next={next ?? "/admin"} /></div>
        </div>
      </div>
    </div>
  );
}
