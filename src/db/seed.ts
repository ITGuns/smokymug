/* eslint-disable no-console */
import { config as loadEnv } from "dotenv";
import { sql } from "drizzle-orm";
import { MENU } from "./seed-data/menu";
import { MODIFIER_GROUPS } from "./seed-data/modifiers";
import { BOOKING_SETTINGS, BOOKING_WINDOWS, GALLERY, HOURS, RESTAURANT, REVIEWS } from "./seed-data/restaurant";
import { hashPassword } from "../lib/password";
import { slugify } from "../lib/slug";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  // Imported after env is loaded so DATABASE_URL is available to the client.
  const { db, schema } = await import("./index");
  const { adminUsers, bookingSettings, bookingWindows, galleryImages, hours, menuCategories, menuItemModifierGroups, menuItems, menuSections, modifierGroups, modifiers, restaurantInfo, reviews } = schema;

  const force = process.argv.includes("--force");
  const existing = await db.select({ id: menuCategories.id }).from(menuCategories).limit(1);
  if (existing.length && !force) {
    console.log("Database already seeded. Run `npm run db:reseed` to wipe menu/content tables and re-seed (reservations are kept).");
    await seedAdmin(db, adminUsers);
    process.exit(0);
  }

  await db.transaction(async (tx) => {
    if (force) {
      for (const t of ["menu_item_modifier_groups", "menu_items", "menu_sections", "menu_categories", "modifiers", "modifier_groups", "hours", "booking_windows", "gallery_images", "reviews", "restaurant_info", "booking_settings"]) {
        await tx.execute(sql.raw(`DELETE FROM ${t}`));
      }
    }

    /* ---- restaurant + hours + booking ---- */
    await tx.insert(restaurantInfo).values(RESTAURANT);
    await tx.insert(hours).values(HOURS.map((h) => ({ ...h, isClosed: h.isClosed ?? false })));
    await tx.insert(bookingSettings).values(BOOKING_SETTINGS);
    await tx.insert(bookingWindows).values(BOOKING_WINDOWS);

    /* ---- modifier groups ---- */
    const groupIdByKey = new Map<string, number>();
    for (const [gi, g] of MODIFIER_GROUPS.entries()) {
      const [row] = await tx
        .insert(modifierGroups)
        .values({ key: g.key, name: g.name, description: g.description, required: g.required ?? false, minSelections: g.min ?? 0, maxSelections: g.max ?? 1, displayOrder: gi })
        .returning({ id: modifierGroups.id });
      groupIdByKey.set(g.key, row.id);
      await tx.insert(modifiers).values(
        g.modifiers.map((m, mi) => ({
          groupId: row.id,
          name: m.name,
          description: m.description,
          priceAdjustment: m.price ?? 0,
          dietaryTags: m.dietary ?? [],
          availabilityNote: m.note,
          availableDays: m.days,
          displayOrder: mi,
        })),
      );
    }

    /* ---- menu ---- */
    const usedSlugs = new Set<string>();
    let items = 0;
    for (const [ci, cat] of MENU.entries()) {
      const [catRow] = await tx
        .insert(menuCategories)
        .values({ name: cat.name, slug: cat.slug, description: cat.description, hoursNote: cat.hoursNote, hoursCategory: cat.hoursCategory, availableDays: cat.days, startTime: cat.start, endTime: cat.end, displayOrder: ci })
        .returning({ id: menuCategories.id });

      for (const [si, sec] of cat.sections.entries()) {
        const linkedId = sec.linkedGroup ? groupIdByKey.get(sec.linkedGroup) : undefined;
        if (sec.linkedGroup && !linkedId) throw new Error(`Unknown linked group ${sec.linkedGroup}`);
        const [secRow] = await tx
          .insert(menuSections)
          .values({ categoryId: catRow.id, name: sec.name, slug: sec.slug ?? slugify(sec.name), description: sec.description, sectionType: sec.type ?? "items", linkedModifierGroupId: linkedId, displayOrder: si })
          .returning({ id: menuSections.id });

        for (const [ii, it] of (sec.items ?? []).entries()) {
          let slug = it.slug ?? slugify(it.name);
          if (usedSlugs.has(slug)) slug = `${slug}-${cat.slug}`;
          if (usedSlugs.has(slug)) throw new Error(`Duplicate slug ${slug}`);
          usedSlugs.add(slug);

          const [itemRow] = await tx
            .insert(menuItems)
            .values({
              sectionId: secRow.id,
              name: it.name,
              slug,
              description: it.description,
              price: it.price ?? null,
              largePrice: it.large ?? null,
              bottlePrice: it.bottle ?? null,
              priceNote: it.priceNote,
              image: it.image,
              imageAlt: it.imageAlt,
              dietaryTags: it.dietary ?? [],
              availabilityType: it.availability?.type ?? "always",
              availableDays: it.availability?.days,
              availableStartTime: it.availability?.start,
              availableEndTime: it.availability?.end,
              availabilityNote: it.availability?.note,
              happyHourEligible: Boolean(it.happyHour),
              happyHourNote: it.happyHour,
              notes: it.notes,
              featured: it.featured ?? false,
              displayOrder: ii,
            })
            .returning({ id: menuItems.id });
          items++;

          const links = (it.modifierGroups ?? []).map((key, gi) => {
            const groupId = groupIdByKey.get(key);
            if (!groupId) throw new Error(`Unknown modifier group ${key} on ${it.name}`);
            return { itemId: itemRow.id, groupId, displayOrder: gi };
          });
          if (links.length) await tx.insert(menuItemModifierGroups).values(links);
        }
      }
    }

    /* ---- content ---- */
    await tx.insert(galleryImages).values(GALLERY.map((g, i) => ({ ...g, file: `/images/${g.file}`, displayOrder: i })));
    await tx.insert(reviews).values(REVIEWS.map((r, i) => ({ ...r, displayOrder: i })));

    console.log(
      `Seeded: ${MENU.length} categories, ${MENU.reduce((n, c) => n + c.sections.length, 0)} sections, ${items} items, ${MODIFIER_GROUPS.length} modifier groups, ${HOURS.length} hours rows, ${GALLERY.length} gallery images, ${REVIEWS.length} reviews.`,
    );
  });

  await seedAdmin(db, adminUsers);
  process.exit(0);
}

type SeedDb = Awaited<ReturnType<typeof importDb>>["db"];
type AdminTable = Awaited<ReturnType<typeof importDb>>["schema"]["adminUsers"];
const importDb = () => import("./index");

async function seedAdmin(db: SeedDb, adminUsers: AdminTable) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set. Skipping admin user. Set them in .env.local and re-run `npm run db:seed`.");
    return;
  }
  const found = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
  if (found.length) {
    console.log("Admin user already exists. Skipping.");
    return;
  }
  await db.insert(adminUsers).values({ email: email.toLowerCase(), name: process.env.ADMIN_NAME ?? "Owner", passwordHash: hashPassword(password) });
  console.log(`Admin user created: ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
