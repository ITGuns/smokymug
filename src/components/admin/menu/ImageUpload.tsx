"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/actions/menu";
import { Btn, Input } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";

const LIBRARY = [
  "/images/bbq-platter-mac.jpg", "/images/bbq-platter-full.jpg", "/images/brisket-sliced.jpg", "/images/brisket-smoker.jpg", "/images/brisket-taco.jpg",
  "/images/spare-ribs-rack.jpg", "/images/spare-ribs-sliced.jpg", "/images/beef-ribs.jpg", "/images/sausage-hatch-fontina.jpg", "/images/chorizo-sausage.jpg",
  "/images/sausage-prep.jpg", "/images/breakfast-sandwich-chorizo.jpg", "/images/avocado-toast.jpg", "/images/latte-art-1.jpg", "/images/latte-art-2.jpg",
  "/images/sweet-cream-cold-brew.jpg", "/images/topo-chico-drink.jpg", "/images/vegan-cauliflower.jpg", "/images/salsa-verde-prep.jpg", "/images/pitmaster-ryan.jpg",
];

export function ImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadImage(fd);
    setBusy(false);
    if (res.ok) {
      onChange(res.data.path);
      toast.success("Image uploaded");
    } else toast.error(res.error);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[12px] text-zinc-400">No image</div>}
        </div>
        <div className="flex-1 space-y-2">
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/images/… or https://…" />
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Btn size="sm" onClick={() => fileRef.current?.click()} loading={busy}>Upload image</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setShowLibrary((v) => !v)}>{showLibrary ? "Hide library" : "Choose from library"}</Btn>
            {value && <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => onChange("")}>Remove</Btn>}
          </div>
          <p className="text-[12px] text-zinc-500">JPG, PNG or WebP up to 6 MB.</p>
        </div>
      </div>
      {showLibrary && (
        <div className="grid grid-cols-5 gap-2 rounded-lg border border-zinc-200 p-2 sm:grid-cols-7">
          {LIBRARY.map((src) => (
            <button key={src} type="button" onClick={() => { onChange(src); setShowLibrary(false); }} className={`aspect-square overflow-hidden rounded-md border-2 ${value === src ? "border-zinc-900" : "border-transparent hover:border-zinc-300"}`} aria-label={src}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
