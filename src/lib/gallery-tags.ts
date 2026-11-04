/** Gallery categories: the /gallery filter pills (after "Everything") and the
 *  admin category picker. The key is what gallery_images.tag stores; labels
 *  can change freely. Home strip note: "catering" photos stay off the home page. */
export const GALLERY_TAGS = [
  { key: "bbq", label: "From the pit" },
  { key: "tacos", label: "Tacos" },
  { key: "breakfast", label: "Breakfast" },
  { key: "coffee", label: "Coffee" },
  { key: "drinks", label: "Drinks" },
  { key: "prep", label: "Behind the scenes" },
  { key: "people", label: "Pitmaster" },
  { key: "catering", label: "Catering" },
] as const;

export type GalleryTag = (typeof GALLERY_TAGS)[number]["key"];

export const GALLERY_TAG_KEYS = GALLERY_TAGS.map((t) => t.key) as [GalleryTag, ...GalleryTag[]];

export function galleryTagLabel(key: string): string {
  return GALLERY_TAGS.find((t) => t.key === key)?.label ?? key;
}
