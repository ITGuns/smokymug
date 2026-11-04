"use client";

/* eslint-disable @next/next/no-img-element -- previews of the chosen file (blob: URL) and admin uploads */

import { useEffect, useState } from "react";
import { addGalleryImage, updateGalleryImage } from "@/actions/gallery";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Checkbox, Field, Select, Textarea } from "@/components/admin/ui";
import type { GalleryImage } from "@/db/schema";
import { GALLERY_TAGS } from "@/lib/gallery-tags";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 3 * 1024 * 1024;

type Picked = { file: File; url: string; width: number; height: number };

/** Pixel size as the browser shows the photo (EXIF rotation applied), which is what the masonry needs. */
async function measure(url: string): Promise<{ width: number; height: number }> {
  const img = new window.Image();
  img.src = url;
  await img.decode();
  return { width: img.naturalWidth, height: img.naturalHeight };
}

/** Add (image = null) or edit one gallery photo. Replacing the file itself = remove + add. */
export function GalleryPhotoForm({ image, onDone }: { image: GalleryImage | null; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ alt: image?.alt ?? "", tag: image?.tag ?? "", active: image?.active ?? true });
  const [picked, setPicked] = useState<Picked | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { busy, run } = useAction();
  useEffect(() => () => { if (picked) URL.revokeObjectURL(picked.url); }, [picked]);

  const setFileError = (msg: string | null) =>
    setErrors((e) => {
      const next = { ...e };
      delete next.file;
      return msg ? { ...next, file: msg } : next;
    });

  const choose = async (file: File | undefined) => {
    setPicked(null);
    if (!file) return;
    if (!TYPES.includes(file.type)) return setFileError("Use a JPG, PNG or WebP image.");
    if (file.size > MAX_BYTES) return setFileError("That image is over 3 MB. Resize it and try again.");
    const url = URL.createObjectURL(file);
    try {
      setPicked({ file, url, ...(await measure(url)) });
      setFileError(null);
    } catch {
      URL.revokeObjectURL(url);
      setFileError("That file can't be read as an image. Try another photo.");
    }
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (image) {
      const res = await run(() => updateGalleryImage({ id: image.id, ...f }));
      if (res.ok) {
        toast.success("Photo saved", "Live on the website now.");
        onDone();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
      return;
    }
    if (!picked) return setFileError("Choose a photo to upload.");
    const fd = new FormData();
    fd.append("file", picked.file);
    fd.append("alt", f.alt);
    fd.append("tag", f.tag);
    fd.append("active", String(f.active));
    fd.append("width", String(picked.width));
    fd.append("height", String(picked.height));
    const res = await run(() => addGalleryImage(fd));
    if (res.ok) {
      toast.success("Photo added", "It sits at the end of the order. Move it up to show it sooner.");
      onDone();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  const preview = picked?.url ?? image?.file;
  const size = picked ?? image;

  return (
    <form onSubmit={submit} className="space-y-4">
      {!image && (
        <Field label="Photo" htmlFor="gp-file" error={errors.file} hint="JPG, PNG or WebP up to 3 MB." required>
          <input
            id="gp-file"
            type="file"
            accept={TYPES.join(",")}
            aria-invalid={!!errors.file || undefined}
            onChange={(e) => void choose(e.target.files?.[0])}
            className="block w-full text-[13px] text-zinc-700 file:mr-3 file:h-9 file:cursor-pointer file:rounded-lg file:border file:border-zinc-300 file:bg-white file:px-3 file:text-[13px] file:font-medium file:text-zinc-800 hover:file:bg-zinc-50"
          />
        </Field>
      )}
      {preview && (
        <figure className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
          <img src={preview} alt="" className="max-h-64 w-full object-contain" />
          {size && <figcaption className="border-t border-zinc-200 bg-white px-3 py-1.5 text-[12px] tabular-nums text-zinc-600">{size.width} × {size.height} px</figcaption>}
        </figure>
      )}
      <Field label="Description" htmlFor="gp-alt" error={errors.alt} hint="Say what's in the photo. Screen readers read it out, and it shows when guests hover the photo." required>
        <Textarea id="gp-alt" value={f.alt} onChange={(e) => setF({ ...f, alt: e.target.value })} maxLength={200} rows={3} required aria-invalid={!!errors.alt || undefined} placeholder="Sliced brisket on butcher paper with pickles" />
      </Field>
      <Field label="Category" htmlFor="gp-tag" error={errors.tag} hint="Sets the filter on /gallery. Catering photos stay off the home page strip." required>
        <Select id="gp-tag" value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} required aria-invalid={!!errors.tag || undefined}>
          <option value="" disabled>Pick a category</option>
          {GALLERY_TAGS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>
      <Checkbox checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Show on the website" />
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onDone}>Cancel</Btn>
        <Btn type="submit" variant="primary" loading={busy}>{image ? "Save" : "Add photo"}</Btn>
      </div>
    </form>
  );
}
