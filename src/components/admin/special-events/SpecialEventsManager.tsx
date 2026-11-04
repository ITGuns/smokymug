"use client";

/* eslint-disable @next/next/no-img-element -- admin thumbnails of admin uploads */

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { saveSpecialEventImages, saveSpecialEvents } from "@/actions/events";
import { uploadImage } from "@/actions/menu";
import type { SpecialEventImage, SpecialEventsSettings } from "@/db/schema";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Card, Field, Input, Tag, Textarea, Toggle } from "@/components/admin/ui";

type Draft = { id?: number; file: string; alt: string };

/** NW02 admin: the Special Events switch, its title/subtitle, and the flyer
 *  grid (add / remove / reorder / upload). */
export function SpecialEventsManager({ settings, images }: { settings: SpecialEventsSettings; images: SpecialEventImage[] }) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({ enabled: settings.enabled, title: settings.title, subtitle: settings.subtitle ?? "" });
  const [list, setList] = useState<Draft[]>(images.map((i) => ({ id: i.id, file: i.file, alt: i.alt })));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const settingsAction = useAction();
  const imagesAction = useAction();

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await settingsAction.run(() => saveSpecialEvents(f));
    if (res.ok) {
      toast.success("Page settings saved", f.enabled ? "/special-events is live." : "/special-events now returns a 404.");
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  const upload = async (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      toast.error("That image is over 3 MB. Resize it and try again.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImage(fd);
      if (res.ok) setList((l) => [...l, { file: res.data.path, alt: "" }]);
      else toast.error(res.error);
    } catch {
      toast.error("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const move = (i: number, dir: -1 | 1) =>
    setList((l) => {
      const j = i + dir;
      if (j < 0 || j >= l.length) return l;
      const next = [...l];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const saveImages = async () => {
    if (list.some((img) => !img.alt.trim())) {
      toast.error("Give every image a short description (shown to screen readers).");
      return;
    }
    const res = await imagesAction.run(() => saveSpecialEventImages(list));
    if (res.ok) {
      toast.success("Flyers saved", "Live on the website now.");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <div className="space-y-6">
      <Card title="Page settings" description="The headline block guests see at the top of /special-events.">
        <form onSubmit={saveSettings} className="max-w-xl space-y-4">
          <Toggle
            checked={f.enabled}
            onChange={(v) => setF({ ...f, enabled: v })}
            label="Show the Special Events page"
            description="Off = /special-events returns a 404 everywhere."
          />
          <Field label="Title" htmlFor="se-title" error={errors.title} required>
            <Input id="se-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required maxLength={120} />
          </Field>
          <Field label="Subtitle" htmlFor="se-subtitle" error={errors.subtitle}>
            <Textarea id="se-subtitle" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} maxLength={300} />
          </Field>
          <div className="flex justify-end">
            <Btn type="submit" variant="primary" loading={settingsAction.busy}>Save settings</Btn>
          </div>
        </form>
      </Card>

      <Card
        title="Flyers & menus"
        description="Uploaded images show as a grid on the page, in this order. JPG, PNG or WebP up to 3 MB."
        actions={
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Btn size="sm" onClick={() => fileRef.current?.click()} loading={uploading}>+ Upload image</Btn>
            <Btn size="sm" variant="primary" onClick={saveImages} loading={imagesAction.busy}>Save flyers</Btn>
          </div>
        }
      >
        {list.length === 0 ? (
          <p className="text-[14px] text-zinc-500">No flyers yet. Upload event posters, holiday menus or specials boards.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((img, i) => (
              <li key={img.id ?? `new-${i}-${img.file}`} className="rounded-lg border border-zinc-200 p-3">
                <div className="relative h-44 overflow-hidden rounded-md bg-zinc-100">
                  <img src={img.file} alt="" className="h-full w-full object-contain" />
                  {img.id == null && <Tag tone="amber" className="absolute left-2 top-2">Unsaved</Tag>}
                </div>
                <Input
                  className="mt-2"
                  value={img.alt}
                  placeholder="Describe the image (required)"
                  onChange={(e) => setList((l) => l.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex gap-1">
                    <Btn size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier">↑</Btn>
                    <Btn size="sm" variant="ghost" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move later">↓</Btn>
                  </div>
                  <Btn size="sm" variant="dangerGhost" onClick={() => setList((l) => l.filter((_, j) => j !== i))}>
                    Remove
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[12px] text-zinc-500">Adding, removing and reordering take effect when you press Save flyers.</p>
      </Card>
    </div>
  );
}
