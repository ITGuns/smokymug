import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/menu/CategoriesManager";
import { PageHeader } from "@/components/admin/ui";
import { readMenuTree } from "@/lib/data/menu";

export const metadata: Metadata = { title: "Menu categories" };

export default async function CategoriesPage() {
  const tree = await readMenuTree(true);
  return (
    <>
      <PageHeader title="Categories" description="Top-level menus (Breakfast, Craft Barbecue…). Drag to reorder; sections live inside each category on the Items page." />
      <CategoriesManager categories={tree.categories} />
    </>
  );
}
