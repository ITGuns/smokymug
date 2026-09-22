// Downloads the restaurant's existing photography + logo from the source CDN
// into /public/images so the site never depends on fragile hotlinks.
import { mkdir, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "images");
const CDN = "https://images.squarespace-cdn.com/content/v1/626014401c69f919495f4b3f";

// Keys match `gallery_images.file` values in the seed and the image refs on menu items.
export const ASSETS = [
  ["logo.png", `${CDN}/e6d42480-c195-4333-937a-85a6db2a7e0b/Asset+3logo.png?format=1500w`],
  ["og-square-logo.png", "http://static1.squarespace.com/static/626014401c69f919495f4b3f/t/6271e40e96b6454376bdb107/1651631118355/square+logo.png?format=1500w"],
  // Homepage gallery
  ["bbq-platter-mac.jpg", `${CDN}/510b9df1-b0d7-4d48-91d5-36510bb9e375/IMG_3569.jpg?format=2500w`],
  ["sausage-hatch-fontina.jpg", `${CDN}/402c4295-d2c5-4118-b8d0-ba85195aa90f/IMG_3564.jpg?format=2500w`],
  ["breakfast-sandwich-chorizo.jpg", `${CDN}/f8886feb-bc23-495a-af88-e201ff9e187f/IMG_3555.jpg?format=2500w`],
  ["latte-art-1.jpg", `${CDN}/ded3b315-803e-42a7-84c9-4e32e7281da8/IMG_3573.jpg?format=2500w`],
  ["brisket-taco.jpg", `${CDN}/4bea0d44-437d-4fe8-9da1-dbc8a5ea0380/IMG_3579.jpg?format=2500w`],
  ["spare-ribs-rack.jpg", `${CDN}/8fa291ca-0c1e-463e-8aea-a9f1cdc5fb09/IMG_3567.jpg?format=2500w`],
  ["vegan-cauliflower.jpg", `${CDN}/ccd95620-13fd-477c-9161-264b22b16ab5/IMG_3558.jpg?format=2500w`],
  ["topo-chico-drink.jpg", `${CDN}/21b305e0-d70f-4076-b162-38d7b2864b1e/IMG_3554.jpg?format=2500w`],
  ["sausage-prep.jpg", `${CDN}/b7716c39-593d-4178-a988-a48721a55ce3/IMG_3563.jpg?format=2500w`],
  ["brisket-sliced.jpg", `${CDN}/6cd49fba-3325-43ed-8580-8f93171f3bfa/IMG_3574.jpg?format=2500w`],
  ["bbq-platter-full.jpg", `${CDN}/e0653321-9f25-4502-80d2-7dec99ad07b9/IMG_3557.jpg?format=2500w`],
  ["beef-ribs.jpg", `${CDN}/b6a6a2bf-2f6c-4fe1-ba03-86c512a83488/IMG_3572.jpg?format=2500w`],
  ["salsa-verde-prep.jpg", `${CDN}/e0c1a6c6-c4ed-4f58-81c2-c6980ba9979d/IMG_3561.jpg?format=2500w`],
  ["chorizo-sausage.jpg", `${CDN}/86fef451-2d95-4dcc-9125-300f9dc71eea/IMG_3562.jpg?format=2500w`],
  ["sweet-cream-cold-brew.jpg", `${CDN}/117a8718-518e-4b8b-b05d-539eeb7b6e4b/IMG_3578.jpg?format=2500w`],
  ["brisket-smoker.jpg", `${CDN}/5cc4cc07-6bcd-443a-883b-54960e45b5be/IMG_3576.jpg?format=2500w`],
  ["pitmaster-ryan.jpg", `${CDN}/27c6b68f-d1bb-4a95-a401-06c6a40e3433/IMG_3571.jpg?format=2500w`],
  ["avocado-toast.jpg", `${CDN}/2fcd67e8-62bd-491c-b27d-3ad299db7b35/IMG_3570.jpg?format=2500w`],
  ["latte-art-2.jpg", `${CDN}/09eb97a9-398f-4352-b026-8c660167a93a/IMG_3568.jpg?format=2500w`],
  ["spare-ribs-sliced.jpg", `${CDN}/3f9bf798-6ac3-4619-813e-2270c20bce08/IMG_3566.jpg?format=2500w`],
  // Catering page
  ["catering-taco-platter.png", `${CDN}/1a75afc4-f31e-4aa2-81c3-8252577e34ac/Screenshot+2025-07-18+at+13-45-00+Instagram.png?format=2500w`],
  ["catering-brisket-taco-guac.png", `${CDN}/7d191f65-cf3e-4062-9572-9dfc310d5ced/Screenshot+2025-07-18+at+13-43-47+Instagram.png?format=2500w`],
  ["catering-pork-butt.png", `${CDN}/dec6c365-7bb0-495b-ad59-a2a95cfa1814/image+42.png?format=2500w`],
  ["catering-full-service.png", `${CDN}/93e906a3-9058-40bd-8802-d1940762833d/Screenshot+2025-07-18+at+13-37-33+Instagram.png?format=2500w`],
];

async function exists(p) {
  try { const s = await stat(p); return s.size > 0; } catch { return false; }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let ok = 0, skipped = 0, failed = 0;
  for (const [file, url] of ASSETS) {
    const dest = join(OUT, file);
    if (await exists(dest)) { skipped++; continue; }
    try {
      const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (asset fetch)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      ok++;
      console.log(`✓ ${file} (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      failed++;
      console.error(`✗ ${file}: ${err.message}`);
    }
  }
  console.log(`\nDone. downloaded=${ok} skipped=${skipped} failed=${failed}`);
  if (failed) process.exitCode = 1;
}

main();
