"use client";

import Image from "next/image";
import { Reorder, useDragControls } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { reorderGalleryImages } from "@/actions/gallery";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, EmptyState, Spinner, Tag } from "@/components/admin/ui";
import type { GalleryImage } from "@/db/schema";
import { cn } from "@/lib/cn";

// B5 scope: reorder only. No upload, delete, crop, caption, tag or active controls
// until that work has its own scope sign-off.

type Dir = "up" | "down";

export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(images);
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);
  useEffect(() => setList(images), [images]);

  const save = async (next: GalleryImage[]) => {
    setSaving(true);
    const res = await reorderGalleryImages(next.map((i) => i.id));
    setSaving(false);
    if (res.ok) {
      toast.success("Gallery order saved");
      router.refresh();
    } else {
      setList(images);
      toast.error(res.error);
    }
  };

  const commitDrag = () => {
    if (!dirty.current) return;
    dirty.current = false;
    void save(list);
  };

  const move = (index: number, dir: Dir) => {
    const target = dir === "up" ? index - 1 : index + 1;
    if (saving || target < 0 || target >= list.length) return;
    const next = list.map((img, i) => (i === index ? list[target] : i === target ? list[index] : img));
    setList(next);
    refocus(list[index].id, dir);
    void save(next);
  };

  if (list.length === 0) return <EmptyState title="No gallery photos yet" />;
  const hiddenCount = list.filter((i) => !i.active).length;

  return (
    <Card
      title="Photo order"
      description={`Top of the list shows first. Drag ⋮⋮ or use the arrows.${hiddenCount ? ` ${hiddenCount} hidden photo${hiddenCount === 1 ? " keeps its" : "s keep their"} place but stay off the site.` : ""}`}
      actions={saving ? <span className="flex items-center gap-2 text-[13px] text-zinc-500"><Spinner /> Saving…</span> : null}
      padded={false}
    >
      <Reorder.Group axis="y" values={list} onReorder={(n) => { setList(n); dirty.current = true; }} className="divide-y divide-zinc-100" aria-label="Gallery photo order">
        {list.map((img, i) => (
          <GalleryRow key={img.id} image={img} position={i + 1} total={list.length} saving={saving} onMove={(dir) => move(i, dir)} onDragEnd={commitDrag} />
        ))}
      </Reorder.Group>
    </Card>
  );
}

/** React re-inserts the moved row's DOM node, which drops focus; put it back on the arrow the user pressed. */
function refocus(id: number, dir: Dir) {
  requestAnimationFrame(() => {
    const same = document.querySelector<HTMLButtonElement>(`[data-move="${id}-${dir}"]:not(:disabled)`);
    const other = document.querySelector<HTMLButtonElement>(`[data-move="${id}-${dir === "up" ? "down" : "up"}"]`);
    (same ?? other)?.focus();
  });
}

function GalleryRow({ image, position, total, saving, onMove, onDragEnd }: { image: GalleryImage; position: number; total: number; saving: boolean; onMove: (dir: Dir) => void; onDragEnd: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={image} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} className={cn("flex items-center gap-3 bg-white px-4 py-2.5", !image.active && "opacity-60")}>
      <button type="button" tabIndex={-1} onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none text-zinc-400 hover:text-zinc-700 active:cursor-grabbing" aria-label="Drag to reorder">⋮⋮</button>
      <span className="w-6 shrink-0 text-right text-[12px] tabular-nums text-zinc-400">{position}</span>
      <Thumb src={image.file} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-zinc-900">{image.alt}</p>
        <p className="mt-0.5 flex items-center gap-1.5">
          <Tag>{image.tag}</Tag>
          {!image.active && <Tag tone="gray">Hidden</Tag>}
          <span className="truncate font-mono text-[11px] text-zinc-400">{image.file.split("/").pop()}</span>
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Btn size="sm" variant="ghost" data-move={`${image.id}-up`} aria-label={`Move photo ${position} up`} aria-disabled={saving} disabled={position === 1} onClick={() => onMove("up")}>↑</Btn>
        <Btn size="sm" variant="ghost" data-move={`${image.id}-down`} aria-label={`Move photo ${position} down`} aria-disabled={saving} disabled={position === total} onClick={() => onMove("down")}>↓</Btn>
      </div>
    </Reorder.Item>
  );
}

/** Local paths go through next/image; full URLs use a plain <img> so a host missing from images.remotePatterns can't break the page. */
function Thumb({ src }: { src: string }) {
  const local = src.startsWith("/") && !src.startsWith("//");
  return (
    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-100">
      {local ? <Image src={src} alt="" fill sizes="56px" className="object-cover" /> : <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />}
    </span>
  );
}
