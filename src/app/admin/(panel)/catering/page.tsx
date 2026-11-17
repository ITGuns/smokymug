import type { Metadata } from "next";
import { CateringPackagesManager } from "@/components/admin/catering/CateringPackagesManager";
import { PageHeader } from "@/components/admin/ui";
import { readCateringPackages } from "@/lib/data/catering";
import { NEEDS_DB_PUSH } from "@/lib/db-errors";

export const metadata: Metadata = { title: "Catering" };

// Audit F12 (18 Nov 2026): the package cards on /catering. The page intro and the inquiry form stay in code.
export default async function CateringAdminPage() {
  const packages = await readCateringPackages();
  return (
    <>
      <PageHeader title="Catering" description="The packages shown on the public Catering page. Add, edit, hide or remove them and set their order. Changes go live immediately." />
      {packages === null ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{NEEDS_DB_PUSH}</p>
      ) : (
        <CateringPackagesManager packages={packages} />
      )}
    </>
  );
}
