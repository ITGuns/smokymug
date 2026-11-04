"use client";

import Image from "next/image";
import { Reorder, useDragControls } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteGalleryImage, reorderGalleryImages } from "@/actions/gallery";
import { ConfirmDialog, Drawer } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Card, EmptyState, Spinner, Tag } from "@/components/admin/ui";
import type { GalleryImage } from "@/db/schema";
import { cn } from "@/lib/cn";
import { galleryTagLabel } from "@/lib/gallery-tags";
import { GalleryPhotoForm } from "./GalleryPhotoForm";

// Full CRUD (4 Nov 2026): add, edit (description, category, show/hide), remove, reorder.
// No crop or caption controls.

type Dir = "up" | "down";

export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(images);
  const [editing, setEditing] = useState<GalleryImage | "new" | null>(null);
  const [removing, setRemoving] = useState<GalleryImage | null>(null);
  const { busy: saving, run } = useAction();
  const removeAction = useAction();
  const dirty = useRef(false);
  useEffect(() => setList(images), [images]);

  const save = async (next: GalleryImage[]) => {
    const res = await run(() => reorderGalleryImages(next.map((i) => i.id)));
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

  const remove = async () => {
    if (!removing) return;
    const { id } = removing;
    const res = await removeAction.run(() => deleteGalleryImage(id));
    setRemoving(null);
    if (res.ok) {
      // Drop the row now so a reorder made before the refresh lands isn't refused as stale.
      setList((l) => l.filter((x) => x.id !== id));
      toast.success("Photo removed", "It's off the gallery and home page.");
      router.refresh();
    } else toast.error(res.error);
  };

  const addButton = (
    <Btn size="sm" variant="primary" onClick={() => setEditing("new")}>
      + Add photo
    </Btn>
  );
  const hiddenCount = list.filter((i) => !i.active).length;

  return (
    <>
      {list.length === 0 ? (
        <EmptyState title="No gallery photos yet" body="Upload food, coffee and pit photos. They show on /gallery and the home page strip." action={addButton} />
      ) : (
        <Card
          title="Photo order"
          description={`Top of the list shows first. Drag ⋮⋮ or use the arrows.${hiddenCount ? ` ${hiddenCount} hidden photo${hiddenCount === 1 ? " keeps its" : "s keep their"} place but stay off the site.` : ""}`}
          actions={
            <div className="flex shrink-0 items-center gap-3">
              {saving && <span className="flex items-center gap-2 text-[13px] text-zinc-500"><Spinner /> Saving…</span>}
              {addButton}
            </div>
          }
          padded={false}
        >
          <Reorder.Group axis="y" values={list} onReorder={(n) => { setList(n); dirty.current = true; }} className="divide-y divide-zinc-100" aria-label="Gallery photo order">
            {list.map((img, i) => (
              <GalleryRow key={img.id} image={img} position={i + 1} total={list.length} saving={saving} onMove={(dir) => move(i, dir)} onDragEnd={commitDrag} onEdit={() => setEditing(img)} onRemove={() => setRemoving(img)} />
            ))}
          </Reorder.Group>
        </Card>
      )}

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a photo" : "Edit photo"} width="max-w-md">
        {editing !== null && (
          <GalleryPhotoForm key={editing === "new" ? "new" : editing.id} image={editing === "new" ? null : editing} onDone={() => { setEditing(null); router.refresh(); }} />
        )}
      </Drawer>
      <ConfirmDialog
        open={!!removing}
        title="Remove this photo?"
        body="It comes off the gallery and home page right away and can't be brought back here. To keep it for later, edit it and untick Show on the website."
        confirmLabel="Remove photo"
        loading={removeAction.busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </>
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

type RowProps = { image: GalleryImage; position: number; total: number; saving: boolean; onMove: (dir: Dir) => void; onDragEnd: () => void; onEdit: () => void; onRemove: () => void };

function GalleryRow({ image, position, total, saving, onMove, onDragEnd, onEdit, onRemove }: RowProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={image} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} className={cn("flex flex-wrap items-center gap-3 bg-white px-4 py-2.5 sm:flex-nowrap", !image.active && "opacity-60")}>
      <button type="button" tabIndex={-1} onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none text-zinc-400 hover:text-zinc-700 active:cursor-grabbing" aria-label="Drag to reorder">⋮⋮</button>
      <span className="w-6 shrink-0 text-right text-[12px] tabular-nums text-zinc-500">{position}</span>
      <Thumb src={image.file} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-zinc-900">{image.alt}</p>
        <p className="mt-0.5 flex items-center gap-1.5">
          <Tag className="shrink-0 whitespace-nowrap">{galleryTagLabel(image.tag)}</Tag>
          {!image.active && <Tag tone="gray" className="shrink-0">Hidden</Tag>}
          <span className="truncate font-mono text-[11px] text-zinc-500">{image.file.split("/").pop()}</span>
        </p>
      </div>
      <div className="ml-auto flex shrink-0 gap-1">
        <Btn size="sm" variant="ghost" data-move={`${image.id}-up`} aria-label={`Move photo ${position} up`} aria-disabled={saving} disabled={position === 1} onClick={() => onMove("up")}>↑</Btn>
        <Btn size="sm" variant="ghost" data-move={`${image.id}-down`} aria-label={`Move photo ${position} down`} aria-disabled={saving} disabled={position === total} onClick={() => onMove("down")}>↓</Btn>
        <Btn size="sm" aria-label={`Edit photo ${position}`} onClick={onEdit}>Edit</Btn>
        <Btn size="sm" variant="dangerGhost" aria-label={`Remove photo ${position}`} onClick={onRemove}>Remove</Btn>
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
