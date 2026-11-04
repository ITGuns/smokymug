import { describe, expect, it } from "vitest";
import { GALLERY_TAG_KEYS, galleryTagLabel } from "@/lib/gallery-tags";
import { balanceColumns } from "@/lib/masonry";
import { MAX_UPLOAD_BYTES, readImageUpload, uploadNameFromPath } from "@/lib/uploads";
import { galleryPhotoEditInput, galleryPhotoNewInput } from "@/lib/validation";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const file = (bytes: number[] | Uint8Array, type: string, name = "photo") => new File([new Uint8Array(bytes)], name, { type });

describe("gallery photo validation", () => {
  const ok = { alt: "  Brisket on butcher paper  ", tag: "bbq", active: true, width: "828", height: "636" };

  it("accepts a new photo, trims the description and coerces the measured size", () => {
    expect(galleryPhotoNewInput.parse(ok)).toEqual({ alt: "Brisket on butcher paper", tag: "bbq", active: true, width: 828, height: 636 });
  });

  it("covers every public filter except Everything", () => {
    expect(GALLERY_TAG_KEYS).toEqual(["bbq", "tacos", "breakfast", "coffee", "drinks", "prep", "people", "catering"]);
    expect(galleryTagLabel("prep")).toBe("Behind the scenes");
  });

  it("rejects a missing or long description, an unknown category and an unread size", () => {
    expect(galleryPhotoNewInput.safeParse({ ...ok, alt: "   " }).success).toBe(false);
    expect(galleryPhotoNewInput.safeParse({ ...ok, alt: "x".repeat(201) }).success).toBe(false);
    expect(galleryPhotoNewInput.safeParse({ ...ok, alt: "x".repeat(200) }).success).toBe(true);
    expect(galleryPhotoNewInput.safeParse({ ...ok, tag: "all" }).success).toBe(false);
    expect(galleryPhotoNewInput.safeParse({ ...ok, tag: "" }).success).toBe(false);
    expect(galleryPhotoNewInput.safeParse({ ...ok, width: "0" }).success).toBe(false);
    expect(galleryPhotoNewInput.safeParse({ ...ok, height: null }).success).toBe(false);
    expect(galleryPhotoNewInput.safeParse({ ...ok, width: "12.5" }).success).toBe(false);
  });

  it("edits need an id and never carry a size", () => {
    const fields = { alt: "Brisket on butcher paper", tag: "bbq", active: false };
    expect(galleryPhotoEditInput.parse({ id: 7, ...fields, width: 1 })).toEqual({ id: 7, ...fields });
    expect(galleryPhotoEditInput.safeParse(fields).success).toBe(false);
  });
});

describe("upload checks shared by menu photos, flyers and the gallery", () => {
  it("accepts JPG, PNG and WebP whose bytes match the declared type", async () => {
    for (const [bytes, type, ext] of [
      [[0xff, 0xd8, 0xff, 0xe0, 0, 0], "image/jpeg", ".jpg"],
      [[...PNG_SIGNATURE, 0, 0], "image/png", ".png"],
      [[...Buffer.from("RIFF\0\0\0\0WEBPVP8 ")], "image/webp", ".webp"],
    ] as const) {
      const res = await readImageUpload(file([...bytes], type));
      expect(res.ok, type).toBe(true);
      if (res.ok) expect(res.upload.name.endsWith(ext)).toBe(true);
    }
  });

  it("refuses a renamed non-image, other types, oversize files and non-files", async () => {
    expect(await readImageUpload(file([...Buffer.from("<html>")], "image/png"))).toMatchObject({ ok: false });
    expect(await readImageUpload(file([...PNG_SIGNATURE], "image/gif"))).toMatchObject({ ok: false, error: "Use a JPG, PNG or WebP image." });
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    big.set(PNG_SIGNATURE);
    expect(await readImageUpload(file(big, "image/png"))).toMatchObject({ ok: false, error: "Image must be under 3 MB." });
    expect(await readImageUpload("just text")).toMatchObject({ ok: false });
    expect(await readImageUpload(null)).toMatchObject({ ok: false });
  });

  it("only /uploads/ paths map to an upload row; seeded /images/ files never do", () => {
    expect(uploadNameFromPath("/uploads/0b9c-4f.png")).toBe("0b9c-4f.png");
    expect(uploadNameFromPath("/images/brisket-sliced.jpg")).toBeNull();
    expect(uploadNameFromPath("https://example.com/uploads/a.png")).toBeNull();
    expect(uploadNameFromPath("/uploads/../images/a.jpg")).toBeNull();
    expect(uploadNameFromPath("/uploads/")).toBeNull();
  });
});

describe("GA03 masonry with admin-added and removed photos", () => {
  // Seeded gallery sizes (width, height), in admin order, as in board-3nov.test.ts.
  const SEEDED: [number, number][] = [
    [828, 636], [739, 1012], [668, 811], [732, 763], [828, 703], [828, 560], [668, 804], [679, 991],
    [706, 980], [735, 744], [687, 1062], [828, 555], [599, 581], [581, 799], [828, 812], [828, 798],
    [753, 801], [828, 814], [790, 780], [649, 425], [696, 871], [764, 871], [696, 871], [656, 821],
  ];
  const cases: [string, [number, number][]][] = [
    ["a tall phone photo added at the end", [...SEEDED, [3024, 4032]]],
    ["a wide panorama and a square added", [...SEEDED, [4000, 1200], [1080, 1080]]],
    ["a photo removed from the middle", SEEDED.filter((_, i) => i !== 9)],
    ["the first photo removed and a tall one added", [...SEEDED.slice(1), [60, 90]]],
  ];
  for (const [label, sizes] of cases) {
    for (const [count, colWidth] of [[4, 284], [3, 299], [2, 167]]) {
      it(`${label}: ${count} columns at ${colWidth}px end within 80px`, () => {
        const ratios = sizes.map(([w, h]) => h / w);
        const gap = 16 / colWidth;
        const cols = balanceColumns(ratios, count, gap);
        expect(cols.flat().sort((a, b) => a - b)).toEqual(ratios.map((_, i) => i));
        const px = cols.map((c) => c.reduce((n, i) => n + ratios[i] + gap, 0) * colWidth);
        expect(Math.max(...px) - Math.min(...px)).toBeLessThan(80);
      });
    }
  }

  it("stays within 80px across 300 seeded random add/remove edits, top row untouched", () => {
    const shapes: [number, number][] = [[3024, 4032], [4032, 3024], [1080, 1080], [1080, 1350], [4000, 1200], [60, 90]];
    let seed = 42;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    let worst = 0;
    for (let k = 0; k < 100; k++) {
      let sizes = SEEDED.slice();
      for (let j = Math.floor(rnd() * 6); j > 0; j--) sizes.splice(Math.floor(rnd() * sizes.length), 1);
      for (let j = Math.floor(rnd() * 6); j > 0; j--) sizes = [...sizes, shapes[Math.floor(rnd() * shapes.length)]];
      const ratios = sizes.map(([w, h]) => h / w);
      for (const [count, colWidth] of [[4, 284], [3, 299], [2, 167]]) {
        const gap = 16 / colWidth;
        const cols = balanceColumns(ratios, count, gap);
        expect(cols.map((c) => c[0])).toEqual(Array.from({ length: count }, (_, i) => i));
        const px = cols.map((c) => c.reduce((n, i) => n + ratios[i] + gap, 0) * colWidth);
        worst = Math.max(worst, Math.max(...px) - Math.min(...px));
      }
    }
    expect(worst).toBeLessThan(80);
  });
});
