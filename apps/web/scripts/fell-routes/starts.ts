// The one hand-picked input to the route build: for each released fell, the
// OpenStreetMap car park the ascent starts from, and optional waypoints that
// hold the line to the usual path where the shortest one would go another way.
// Everything else (the line, distance, ascent, bus stop, checks) is computed
// by build.ts from the open data.

export type RouteStart = {
  /** OSM car park, "way/<id>" or "node/<id>", tagged amenity=parking. */
  parking: string;
  /** Latitude, longitude points the line must pass, in order. */
  via?: [number, number][];
};

export const ROUTE_STARTS: Record<string, RouteStart> = {
  // Brown Tongue, Hollow Stones and Lingmell Col, the usual line from Wasdale,
  // rather than the Corridor Route the shortest walk would join.
  "scafell-pike": {
    parking: "way/462708990",
    via: [[54.455756, -3.2172245]],
  },
  helvellyn: { parking: "way/167903466" },
  catbells: { parking: "way/902969054" },
  skiddaw: { parking: "way/29500402" },
  "loughrigg-fell": { parking: "way/223569865" },
  latrigg: { parking: "way/29500402" },
  "walla-crag": { parking: "way/23440253" },
  "great-gable": { parking: "way/1267863246" },
  "helm-crag": { parking: "way/170515795" },
  "hallin-fell": { parking: "way/886145345" },
  "castle-crag": { parking: "way/305393691" },
  "rannerdale-knotts": { parking: "way/149709226" },
  scafell: { parking: "way/462708990" },
  "green-gable": { parking: "way/1267863246" },
  "gowbarrow-fell-wainwright-summit": { parking: "way/23485869" },
  "red-screes": { parking: "way/90617116" },
  binsey: { parking: "way/741275685" },
  "fleetwith-pike": { parking: "way/330938897" },
  "grisedale-pike": { parking: "way/36858153" },
  bowfell: { parking: "way/449263639" },
};
