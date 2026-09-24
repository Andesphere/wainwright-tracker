// Writes the fell catalogue the iOS app bundles.
// Run from the repo root: bun apps/ios/scripts/generate-catalog.ts
import { WAINWRIGHTS } from "../../../packages/catalog/src/wainwrights";

const fells = [...WAINWRIGHTS]
  .sort((a, b) => a.bookNumber - b.bookNumber)
  .map((fell) => ({
    id: fell.id,
    name: fell.name,
    bookNumber: fell.bookNumber,
    heightMetres: fell.heightMetres,
    heightFt: fell.heightFt,
    latitude: fell.latitude,
    longitude: fell.longitude,
    area: fell.area,
  }));

const target = new URL(
  "../WainwrightsBaggers/Resources/wainwrights.json",
  import.meta.url,
);
await Bun.write(target, JSON.stringify(fells, null, 2) + "\n");
console.log(`Wrote ${fells.length} fells to ${target.pathname}`);
