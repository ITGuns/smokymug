import type { Metadata } from "next";
import { GalleryManager } from "@/components/admin/gallery/GalleryManager";
import { PageHeader } from "@/components/admin/ui";
import { readGallery } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryAdminPage() {
  const images = await readGallery(true);
  return (
    <>
      <PageHeader title="Gallery" description={`${images.length} photos. Add, edit or remove photos, and drag to set the order they appear on the website gallery and home page. Changes go live immediately.`} />
      <GalleryManager images={images} />
    </>
  );
}
