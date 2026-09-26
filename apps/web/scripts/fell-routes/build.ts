// Builds the route data for the released fell pages from open data, and
// desk-checks each route. Run from the repo root:
//
//   bun apps/web/scripts/fell-routes/build.ts
//
// Downloads are cached in $FELL_ROUTES_CACHE (default: <tmp>/fell-routes-cache);
// delete the cache to rebuild from today's data. Writes three files to
// apps/web/content/fell-routes/, one per licence, never mixed:
//
//   osm.json        OpenStreetMap (ODbL): car park, route line, map context
//   transport.json  NaPTAN + Bus Open Data Service (OGL): nearest bus stop
//   checks.json     the desk check and the ascent: the OSM line measured
//                   against OS Terrain 50, LDNPA rights of way and Natural
//                   England CRoW access land (OGL)

import { execFileSync } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

import {
  WAINWRIGHTS,
  type Wainwright,
} from "../../../../packages/catalog/src/wainwrights";
import { fromGrid, toGrid } from "./osgb";
import { ROUTE_STARTS } from "./starts";

const WEB = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(WEB, "content", "fell-routes");
const CACHE =
  process.env.FELL_ROUTES_CACHE ?? path.join(os.tmpdir(), "fell-routes-cache");
const USER_AGENT =
  "WainwrightsBaggers-fell-routes/1.0 (+https://wainwrightsbaggers.com)";
const TODAY = new Date().toISOString().slice(0, 10);
// Pin the OpenStreetMap snapshot (an Overpass attic query) to rebuild the
// committed data: FELL_ROUTES_OSM_DATE=<osmBase from osm.json>. NaPTAN and BODS
// are live feeds; bus services change with the seasons, so they are not pinned.
const OSM_DATE = process.env.FELL_ROUTES_OSM_DATE;

const SOURCES = {
  overpass: "https://overpass-api.de/api/interpreter",
  terrain50:
    "https://api.os.uk/downloads/v1/products/Terrain50/downloads?area=GB&format=ASCII+Grid+and+GML+%28Grid%29&redirect",
  prow: "https://volunteering.lake-district.gov.uk/PublishedGIS/LDNPA_PROW.shz",
  crow: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/CRoW_Act_2000_Access_Layer/FeatureServer/0/query",
  naptan:
    "https://naptan.api.dft.gov.uk/v1/access-nodes?atcoAreaCodes=090&dataFormat=csv",
  bods: "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/north_west/",
};

type LatLon = { lat: number; lon: number };
type Tags = Record<string, string>;

// ---------------------------------------------------------------- downloads

mkdirSync(CACHE, { recursive: true });

async function cached(
  name: string,
  fetcher: () => Promise<Buffer>,
): Promise<string> {
  const file = path.join(CACHE, name);
  if (!existsSync(file)) {
    console.log(`fetch ${name}`);
    writeFileSync(file, await fetcher());
  }
  return file;
}

async function download(url: string, init?: RequestInit): Promise<Buffer> {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, {
      ...init,
      headers: { "User-Agent": USER_AGENT, ...init?.headers },
    });
    const body = Buffer.from(await response.arrayBuffer());
    if (
      response.ok &&
      !body.subarray(0, 200).toString().includes("runtime error")
    )
      return body;
    if (attempt === 8) throw new Error(`${url}: ${response.status}`);
    console.log(`  ${response.status}, retrying`);
    await new Promise((resolve) => setTimeout(resolve, attempt * 15_000));
  }
}

async function overpass(name: string, query: string) {
  const pinned = OSM_DATE
    ? query.replace("[out:json]", `[out:json][date:"${OSM_DATE}"]`)
    : query;
  const file = await cached(OSM_DATE ? `${OSM_DATE}-${name}` : name, () =>
    download(SOURCES.overpass, {
      method: "POST",
      body: new URLSearchParams({ data: pinned }),
    }),
  );
  return JSON.parse(readFileSync(file, "utf8")) as {
    osm3s: { timestamp_osm_base: string };
    elements: OsmElement[];
  };
}

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: LatLon;
  nodes?: number[];
  tags?: Tags;
  geometry?: LatLon[];
  members?: { type: string; role: string; geometry?: LatLon[] }[];
};

// ---------------------------------------------------------------- geometry

const EARTH = 6371008.8;

function metres(a: LatLon, b: LatLon): number {
  const rad = Math.PI / 180;
  const x = (b.lon - a.lon) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  const y = (b.lat - a.lat) * rad;
  return Math.hypot(x, y) * EARTH;
}

function lineLength(line: LatLon[]): number {
  let total = 0;
  for (let i = 1; i < line.length; i += 1)
    total += metres(line[i - 1], line[i]);
  return total;
}

/** Points every `step` metres along a line, each with the index of the segment it lies on. */
function samples(line: LatLon[], step: number) {
  const out: { point: LatLon; segment: number }[] = [
    { point: line[0], segment: 0 },
  ];
  let carry = 0;
  for (let i = 1; i < line.length; i += 1) {
    const [a, b] = [line[i - 1], line[i]];
    const length = metres(a, b);
    let at = step - carry;
    while (at <= length) {
      const t = at / length;
      out.push({
        point: {
          lat: a.lat + (b.lat - a.lat) * t,
          lon: a.lon + (b.lon - a.lon) * t,
        },
        segment: i - 1,
      });
      at += step;
    }
    carry = length - (at - step);
  }
  out.push({ point: line[line.length - 1], segment: line.length - 2 });
  return out;
}

/** Douglas-Peucker in local metres; keeps the ends. */
function simplify(line: LatLon[], tolerance: number): LatLon[] {
  if (line.length < 3) return line;
  const origin = line[0];
  const xy = line.map((p) => {
    const rad = Math.PI / 180;
    return [
      (p.lon - origin.lon) * rad * Math.cos(origin.lat * rad) * EARTH,
      (p.lat - origin.lat) * rad * EARTH,
    ];
  });
  const keep = new Uint8Array(line.length);
  keep[0] = keep[line.length - 1] = 1;
  const stack: [number, number][] = [[0, line.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    const [ax, ay] = xy[first];
    const [bx, by] = xy[last];
    const length = Math.hypot(bx - ax, by - ay) || 1;
    let worst = 0;
    let index = -1;
    for (let i = first + 1; i < last; i += 1) {
      const [px, py] = xy[i];
      const d =
        Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length;
      if (d > worst) [worst, index] = [d, i];
    }
    if (worst > tolerance) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return line.filter((_, i) => keep[i]);
}

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;
const coord = (p: LatLon): [number, number] => [round5(p.lon), round5(p.lat)];

type Box = { south: number; west: number; north: number; east: number };

function boxAround(points: LatLon[], padMetres: number): Box {
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const dLat = padMetres / 111_200;
  const dLon = padMetres / (111_200 * Math.cos((lats[0] * Math.PI) / 180));
  return {
    south: Math.min(...lats) - dLat,
    north: Math.max(...lats) + dLat,
    west: Math.min(...lons) - dLon,
    east: Math.max(...lons) + dLon,
  };
}

const inBox = (p: LatLon, b: Box) =>
  p.lat >= b.south && p.lat <= b.north && p.lon >= b.west && p.lon <= b.east;

function pointInRing(p: LatLon, ring: LatLon[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [a, b] = [ring[i], ring[j]];
    if (a.lat > p.lat !== b.lat > p.lat) {
      const x = ((b.lon - a.lon) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lon;
      if (p.lon < x) inside = !inside;
    }
  }
  return inside;
}

function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax;
  const dy = by - ay;
  const t =
    dx || dy
      ? Math.max(
          0,
          Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)),
        )
      : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// ---------------------------------------------------------------- inputs

const fells = Object.keys(ROUTE_STARTS).map((id) => {
  const fell = WAINWRIGHTS.find((entry) => entry.id === id);
  if (!fell) throw new Error(`Unknown fell ${id}`);
  return fell;
});
const summitOf = (fell: Wainwright): LatLon => ({
  lat: fell.latitude,
  lon: fell.longitude,
});
const area = boxAround(fells.map(summitOf), 6000);
const bbox = `${area.south.toFixed(3)},${area.west.toFixed(3)},${area.north.toFixed(3)},${area.east.toFixed(3)}`;

const ROADS = new Set([
  "trunk",
  "primary",
  "secondary",
  "tertiary",
  "unclassified",
  "residential",
  "living_street",
  "road",
]);
const WALKWAYS = new Set([
  "path",
  "footway",
  "track",
  "bridleway",
  "steps",
  "pedestrian",
  "cycleway",
  "service",
]);
const SAC_ORDER = [
  "hiking",
  "mountain_hiking",
  "demanding_mountain_hiking",
  "alpine_hiking",
  "demanding_alpine_hiking",
  "difficult_alpine_hiking",
];

// ---------------------------------------------------------------- OSM

async function loadOsm() {
  const highways = [...ROADS, ...WALKWAYS].join("|");
  const ways = await overpass(
    "osm-ways.json",
    `[out:json][timeout:300][maxsize:1073741824];way["highway"~"^(${highways})$"](${bbox});(._;>;);out body qt;`,
  );
  const parking = await overpass(
    "osm-parking.json",
    `[out:json][timeout:120];nwr["amenity"="parking"](${bbox});out center tags;`,
  );
  const water = await overpass(
    "osm-water.json",
    `[out:json][timeout:300];(way["natural"="water"](${bbox});relation["natural"="water"](${bbox}););out geom qt;`,
  );
  const summits = await overpass(
    "osm-summit-features.json",
    `[out:json][timeout:120];(node["man_made"~"^(survey_point|cairn)$"](${bbox});node["amenity"="shelter"](${bbox}););out qt;`,
  );
  const named = await overpass(
    "osm-named-features-v2.json",
    `[out:json][timeout:180];(node["natural"~"^(peak|saddle)$"]["name"](${bbox});node["place"~"^(town|village|hamlet|locality|isolated_dwelling|farm)$"]["name"](${bbox});way["waterway"~"^(river|stream)$"]["name"](${bbox}););out geom qt;`,
  );
  return { ways, parking, water, summits, named };
}

/** Where a line first crosses another, as metres along the line, or null. */
function crossing(line: LatLon[], other: LatLon[]): number | null {
  let along = 0;
  for (let i = 1; i < line.length; i += 1) {
    const [a, b] = [line[i - 1], line[i]];
    for (let j = 1; j < other.length; j += 1) {
      const [c, d] = [other[j - 1], other[j]];
      const den =
        (b.lon - a.lon) * (d.lat - c.lat) - (b.lat - a.lat) * (d.lon - c.lon);
      if (den === 0) continue;
      const t =
        ((c.lon - a.lon) * (d.lat - c.lat) -
          (c.lat - a.lat) * (d.lon - c.lon)) /
        den;
      const u =
        ((c.lon - a.lon) * (b.lat - a.lat) -
          (c.lat - a.lat) * (b.lon - a.lon)) /
        den;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return along + metres(a, b) * t;
    }
    along += metres(a, b);
  }
  return null;
}

/** The closest approach of a point to a line: distance off it and metres along it. */
function closestApproach(line: LatLon[], p: LatLon) {
  let best = { off: Infinity, along: 0 };
  let along = 0;
  for (let i = 0; i < line.length; i += 1) {
    const off = metres(line[i], p);
    if (off < best.off) best = { off, along };
    if (i + 1 < line.length) along += metres(line[i], line[i + 1]);
  }
  return best;
}

type Edge = { to: number; length: number; cost: number; way: number };
type WayInfo = {
  highway: string;
  sac?: string;
  visibility?: string;
  access?: string;
  name?: string;
  surface?: string;
};

/** Walkers may use it: not private, not foot=no, no motorways. */
function walkable(tags: Tags): boolean {
  const foot = tags.foot;
  if (["no", "private", "customers"].includes(foot ?? "")) return false;
  if (["yes", "designated", "permissive"].includes(foot ?? "")) return true;
  // Mountain bike trails only where walkers are named as allowed.
  if (tags.highway === "cycleway") return false;
  return !["private", "no", "customers"].includes(tags.access ?? "");
}

function edgeCost(tags: Tags): number {
  let factor = 1;
  if (["trunk", "primary", "secondary"].includes(tags.highway)) factor = 4;
  else if (ROADS.has(tags.highway) || tags.highway === "service") factor = 1.5;
  const sac = SAC_ORDER.indexOf(tags.sac_scale ?? "");
  if (sac === 2) factor *= 5;
  if (sac >= 3) factor *= 50;
  if (["bad", "horrible", "no"].includes(tags.trail_visibility ?? ""))
    factor *= 3;
  return factor;
}

function buildGraph(elements: OsmElement[]) {
  const coords = new Map<number, LatLon>();
  for (const el of elements)
    if (el.type === "node") coords.set(el.id, { lat: el.lat!, lon: el.lon! });
  const adjacency = new Map<number, Edge[]>();
  const wayInfo = new Map<number, WayInfo>();
  for (const el of elements) {
    if (el.type !== "way" || !el.tags || !walkable(el.tags)) continue;
    const t = el.tags;
    wayInfo.set(el.id, {
      highway: t.highway,
      sac: t.sac_scale,
      visibility: t.trail_visibility,
      access: t.foot ?? t.access,
      name: t.name,
      surface: t.surface,
    });
    const factor = edgeCost(t);
    const nodes = el.nodes!;
    for (let i = 1; i < nodes.length; i += 1) {
      const [a, b] = [nodes[i - 1], nodes[i]];
      const length = metres(coords.get(a)!, coords.get(b)!);
      const cost = length * factor;
      if (!adjacency.has(a)) adjacency.set(a, []);
      if (!adjacency.has(b)) adjacency.set(b, []);
      adjacency.get(a)!.push({ to: b, length, cost, way: el.id });
      adjacency.get(b)!.push({ to: a, length, cost, way: el.id });
    }
  }
  return { coords, adjacency, wayInfo };
}

type Graph = ReturnType<typeof buildGraph>;

/** Every node reachable from `start`. */
function component(graph: Graph, start: number): Set<number> {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    for (const edge of graph.adjacency.get(queue.pop()!) ?? []) {
      if (!seen.has(edge.to)) {
        seen.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return seen;
}

function nearestNode(
  graph: Graph,
  p: LatLon,
  among: Iterable<number> = graph.adjacency.keys(),
) {
  let best = -1;
  let gap = Infinity;
  for (const id of among) {
    const d = metres(p, graph.coords.get(id)!);
    if (d < gap) [best, gap] = [id, d];
  }
  return { node: best, gap };
}

/** Dijkstra on walking cost. Returns the nodes and the way each step uses. */
function shortestPath(graph: Graph, from: number, to: number) {
  const cost = new Map<number, number>([[from, 0]]);
  const previous = new Map<number, { node: number; way: number }>();
  const heap: [number, number][] = [[0, from]];
  const push = (item: [number, number]) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const [l, r] = [2 * i + 1, 2 * i + 2];
        let smallest = i;
        if (l < heap.length && heap[l][0] < heap[smallest][0]) smallest = l;
        if (r < heap.length && heap[r][0] < heap[smallest][0]) smallest = r;
        if (smallest === i) break;
        [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
        i = smallest;
      }
    }
    return top;
  };
  while (heap.length) {
    const [c, node] = pop();
    if (node === to) break;
    if (c > (cost.get(node) ?? Infinity)) continue;
    for (const edge of graph.adjacency.get(node) ?? []) {
      const next = c + edge.cost;
      if (next < (cost.get(edge.to) ?? Infinity)) {
        cost.set(edge.to, next);
        previous.set(edge.to, { node, way: edge.way });
        push([next, edge.to]);
      }
    }
  }
  if (!previous.has(to)) throw new Error(`No path from ${from} to ${to}`);
  const nodes = [to];
  const ways: number[] = [];
  for (let at = to; at !== from; ) {
    const step = previous.get(at)!;
    nodes.push(step.node);
    ways.push(step.way);
    at = step.node;
  }
  return { nodes: nodes.reverse(), ways: ways.reverse() };
}

// ---------------------------------------------------------------- OS Terrain 50

async function loadTerrain() {
  const zip = await cached("terr50_gagg_gb.zip", () =>
    download(SOURCES.terrain50),
  );
  const tiles = new Map<
    string,
    { x0: number; y0: number; rows: number[][] } | null
  >();
  const dir = path.join(CACHE, "terr50");
  const tile = (easting: number, northing: number) => {
    const letters = northing >= 500000 ? "ny" : "sd";
    const key = `${letters}${Math.floor((easting % 100000) / 10000)}${Math.floor((northing % 100000) / 10000)}`;
    if (!tiles.has(key)) {
      mkdirSync(dir, { recursive: true });
      execFileSync("unzip", [
        "-o",
        "-q",
        "-j",
        zip,
        `data/${letters}/${key}_*.zip`,
        "-d",
        dir,
      ]);
      const inner = execFileSync("sh", ["-c", `ls ${dir}/${key}_*.zip`])
        .toString()
        .trim();
      const text = execFileSync(
        "unzip",
        ["-p", inner, `${key.toUpperCase()}.asc`],
        {
          maxBuffer: 1 << 26,
        },
      ).toString();
      const lines = text.trim().split("\n");
      const header = Object.fromEntries(
        lines.slice(0, 5).map((line) => {
          const [k, v] = line.trim().split(/\s+/);
          return [k, Number(v)];
        }),
      );
      tiles.set(key, {
        x0: header.xllcorner,
        y0: header.yllcorner,
        rows: lines
          .slice(5)
          .map((line) => line.trim().split(/\s+/).map(Number)),
      });
    }
    return tiles.get(key)!;
  };
  /** Height at a point, bilinear between the 50 m grid posts (post values sit at cell centres). */
  const heightAt = (easting: number, northing: number): number => {
    const post = (e: number, n: number) => {
      const t = tile(e, n)!;
      const col = Math.floor((e - t.x0) / 50);
      const row = t.rows.length - 1 - Math.floor((n - t.y0) / 50);
      return t.rows[row][col];
    };
    const fx = (easting - 25) / 50;
    const fy = (northing - 25) / 50;
    const [x0, y0] = [Math.floor(fx), Math.floor(fy)];
    const [tx, ty] = [fx - x0, fy - y0];
    const e = x0 * 50 + 25;
    const n = y0 * 50 + 25;
    const h00 = post(e, n);
    const h10 = post(e + 50, n);
    const h01 = post(e, n + 50);
    const h11 = post(e + 50, n + 50);
    return (
      h00 * (1 - tx) * (1 - ty) +
      h10 * tx * (1 - ty) +
      h01 * (1 - tx) * ty +
      h11 * tx * ty
    );
  };
  return heightAt;
}

// ---------------------------------------------------------------- LDNPA rights of way

function readShapefileLines(shp: Buffer): number[][][] {
  const shapes: number[][][] = [];
  let offset = 100;
  while (offset < shp.length) {
    const contentBytes = shp.readInt32BE(offset + 4) * 2;
    const start = offset + 8;
    const type = shp.readInt32LE(start);
    const parts: number[][] = [];
    if (type === 3 || type === 13 || type === 23) {
      const numParts = shp.readInt32LE(start + 36);
      const numPoints = shp.readInt32LE(start + 40);
      const partStarts = Array.from({ length: numParts }, (_, i) =>
        shp.readInt32LE(start + 44 + i * 4),
      );
      const pointsAt = start + 44 + numParts * 4;
      for (let p = 0; p < numParts; p += 1) {
        const end = p + 1 < numParts ? partStarts[p + 1] : numPoints;
        const part: number[] = [];
        for (let i = partStarts[p]; i < end; i += 1) {
          part.push(
            shp.readDoubleLE(pointsAt + i * 16),
            shp.readDoubleLE(pointsAt + i * 16 + 8),
          );
        }
        parts.push(part);
      }
    }
    shapes.push(parts);
    offset = start + contentBytes;
  }
  return shapes;
}

function readDbf(dbf: Buffer): Record<string, string>[] {
  const count = dbf.readUInt32LE(4);
  const headerLength = dbf.readUInt16LE(8);
  const recordLength = dbf.readUInt16LE(10);
  const fields: { name: string; length: number }[] = [];
  for (let at = 32; dbf[at] !== 0x0d; at += 32) {
    fields.push({
      name: dbf.toString("latin1", at, at + 11).replace(/\0.*$/, ""),
      length: dbf[at + 16],
    });
  }
  const records: Record<string, string>[] = [];
  for (let r = 0; r < count; r += 1) {
    let at = headerLength + r * recordLength + 1;
    const record: Record<string, string> = {};
    for (const field of fields) {
      record[field.name] = dbf.toString("latin1", at, at + field.length).trim();
      at += field.length;
    }
    records.push(record);
  }
  return records;
}

async function loadRightsOfWay() {
  const shz = await cached("LDNPA_PROW.shz", () => download(SOURCES.prow));
  const shp = execFileSync("unzip", ["-p", shz, "LDNPA_PROW.shp"], {
    maxBuffer: 1 << 26,
  });
  const dbf = execFileSync("unzip", ["-p", shz, "LDNPA_PROW.dbf"], {
    maxBuffer: 1 << 26,
  });
  const shapes = readShapefileLines(shp);
  const records = readDbf(dbf);
  // A 250 m grid of segments, in National Grid metres.
  const CELL = 250;
  const grid = new Map<string, { seg: number[]; type: string }[]>();
  shapes.forEach((parts, index) => {
    const type = records[index]?.Type_Text ?? "";
    for (const part of parts) {
      for (let i = 2; i < part.length; i += 2) {
        const seg = [part[i - 2], part[i - 1], part[i], part[i + 1]];
        const [minX, maxX] = [
          Math.min(seg[0], seg[2]),
          Math.max(seg[0], seg[2]),
        ];
        const [minY, maxY] = [
          Math.min(seg[1], seg[3]),
          Math.max(seg[1], seg[3]),
        ];
        for (
          let cx = Math.floor(minX / CELL);
          cx <= Math.floor(maxX / CELL);
          cx += 1
        ) {
          for (
            let cy = Math.floor(minY / CELL);
            cy <= Math.floor(maxY / CELL);
            cy += 1
          ) {
            const key = `${cx}:${cy}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key)!.push({ seg, type });
          }
        }
      }
    }
  });
  /** The right of way type within `tolerance` metres of a point, if any. */
  return (
    easting: number,
    northing: number,
    tolerance: number,
  ): string | null => {
    let best: string | null = null;
    let bestDistance = tolerance;
    const cx = Math.floor(easting / CELL);
    const cy = Math.floor(northing / CELL);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (const { seg, type } of grid.get(`${cx + dx}:${cy + dy}`) ?? []) {
          const d = distanceToSegment(
            easting,
            northing,
            seg[0],
            seg[1],
            seg[2],
            seg[3],
          );
          if (d <= bestDistance) [best, bestDistance] = [type, d];
        }
      }
    }
    return best;
  };
}

// ---------------------------------------------------------------- Natural England CRoW access land

async function loadAccessLand(id: string, box: Box) {
  const params = new URLSearchParams({
    where: "1=1",
    geometry: `${box.west},${box.south},${box.east},${box.north}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "Descrip",
    outSR: "4326",
    f: "geojson",
  });
  const file = await cached(
    `crow-${id}-${[box.south, box.west, box.north, box.east].map((n) => n.toFixed(4)).join("_")}.json`,
    () => download(`${SOURCES.crow}?${params}`),
  );
  const geojson = JSON.parse(readFileSync(file, "utf8")) as {
    features: {
      geometry: { type: string; coordinates: number[][][] | number[][][][] };
    }[];
  };
  const polygons: LatLon[][][] = [];
  for (const feature of geojson.features) {
    const rings =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates as number[][][]]
        : (feature.geometry.coordinates as number[][][][]);
    for (const polygon of rings) {
      polygons.push(
        polygon.map((ring) => ring.map(([lon, lat]) => ({ lat, lon }))),
      );
    }
  }
  return (p: LatLon) =>
    polygons.some(
      ([outer, ...holes]) =>
        pointInRing(p, outer) && !holes.some((hole) => pointInRing(p, hole)),
    );
}

// ---------------------------------------------------------------- NaPTAN and BODS

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(field);
      field = "";
    } else field += ch;
  }
  out.push(field);
  return out;
}

function readCsv(text: string): Record<string, string>[] {
  const [header, ...rows] = text.split(/\r?\n/).filter(Boolean);
  const keys = parseCsvLine(header);
  return rows.map((row) => {
    const values = parseCsvLine(row);
    return Object.fromEntries(keys.map((key, i) => [key, values[i] ?? ""]));
  });
}

type Stop = {
  atco: string;
  name: string;
  indicator: string;
  locality: string;
  point: LatLon;
};

async function loadBusStops(): Promise<Stop[]> {
  const file = await cached("naptan-090.csv", () => download(SOURCES.naptan));
  return readCsv(readFileSync(file, "utf8"))
    .filter(
      (row) =>
        row.Status === "active" && ["BCT", "BCS", "BCQ"].includes(row.StopType),
    )
    .map((row) => {
      const { latitude, longitude } = fromGrid(
        Number(row.Easting),
        Number(row.Northing),
      );
      return {
        atco: row.ATCOCode,
        name: row.CommonName,
        indicator: row.Indicator,
        locality: row.LocalityName,
        point: { lat: latitude, lon: longitude },
      };
    });
}

/** The bus lines (and their operators) that call at each stop on or after today, from the BODS GTFS feed. */
async function loadServices(atcos: Set<string>) {
  const zip = await cached("bods-north-west-gtfs.zip", () =>
    download(SOURCES.bods),
  );
  const read = (name: string) =>
    readCsv(
      execFileSync("unzip", ["-p", zip, name], {
        maxBuffer: 1 << 28,
      }).toString(),
    );
  const feed = read("feed_info.txt")[0];
  const today = TODAY.replaceAll("-", "");
  const running = new Set<string>();
  for (const row of read("calendar.txt")) {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    if (row.end_date >= today && days.some((day) => row[day] === "1"))
      running.add(row.service_id);
  }
  for (const row of read("calendar_dates.txt")) {
    if (row.exception_type === "1" && row.date >= today)
      running.add(row.service_id);
  }
  const agencies = new Map(
    read("agency.txt").map((row) => [row.agency_id, row.agency_name]),
  );
  const routes = new Map(
    read("routes.txt").map((row) => [
      row.route_id,
      {
        line: row.route_short_name,
        operator: agencies.get(row.agency_id) ?? "",
      },
    ]),
  );
  const tripRoute = new Map<string, string>();
  for (const row of read("trips.txt")) {
    if (running.has(row.service_id)) tripRoute.set(row.trip_id, row.route_id);
  }
  const byStop = new Map<
    string,
    Map<string, { line: string; operator: string }>
  >();
  execFileSync("sh", [
    "-c",
    `unzip -p "${zip}" stop_times.txt > "${CACHE}/stop_times.txt"`,
  ]);
  const lines = readline.createInterface({
    input: createReadStream(path.join(CACHE, "stop_times.txt")),
  });
  let header: string[] | null = null;
  for await (const line of lines) {
    if (!header) {
      header = line.split(",");
      continue;
    }
    const cells = line.split(",");
    const stop = cells[header.indexOf("stop_id")];
    if (!atcos.has(stop)) continue;
    const routeId = tripRoute.get(cells[header.indexOf("trip_id")]);
    if (!routeId) continue;
    if (!byStop.has(stop)) byStop.set(stop, new Map());
    byStop.get(stop)!.set(routeId, routes.get(routeId)!);
  }
  return { byStop, feedVersion: feed.feed_version };
}

// ---------------------------------------------------------------- build

async function main() {
  const osm = await loadOsm();
  const graph = buildGraph(osm.ways.elements);
  const heightAt = await loadTerrain();
  const rightOfWayAt = await loadRightsOfWay();
  const stops = await loadBusStops();

  const parkingById = new Map(
    osm.parking.elements.map((el) => [`${el.type}/${el.id}`, el]),
  );
  const roadWays = osm.ways.elements.filter(
    (el) => el.type === "way" && el.tags && graph.wayInfo.has(el.id),
  );
  const waterWays = osm.water.elements;

  const osmOut: Record<string, unknown> = {};
  const transportOut: Record<string, unknown> = {};
  const checksOut: Record<string, unknown> = {};
  const startsByFell = new Map<string, LatLon>();

  for (const fell of fells) {
    const config = ROUTE_STARTS[fell.id];
    const parking = parkingById.get(config.parking);
    if (!parking)
      throw new Error(`${fell.id}: car park ${config.parking} not in OSM`);
    const parkingPoint = parking.center ?? {
      lat: parking.lat!,
      lon: parking.lon!,
    };
    startsByFell.set(fell.id, parkingPoint);
    const summit = summitOf(fell);

    const stops_ = [
      parkingPoint,
      ...(config.via ?? []).map(([lat, lon]) => ({ lat, lon })),
      summit,
    ];
    // Snap to the path network the summit is on, so no leg starts on an island.
    const top = nearestNode(graph, summit);
    const network = component(graph, top.node);
    const snapped = [
      ...stops_.slice(0, -1).map((p) => nearestNode(graph, p, network)),
      top,
    ];
    const nodes: number[] = [];
    const ways: number[] = [];
    for (let i = 1; i < snapped.length; i += 1) {
      const leg = shortestPath(graph, snapped[i - 1].node, snapped[i].node);
      nodes.push(...(i === 1 ? leg.nodes : leg.nodes.slice(1)));
      ways.push(...leg.ways);
    }
    const line = nodes.map((id) => graph.coords.get(id)!);
    // From the middle of the car park to the path, and off the path to the summit point.
    if (snapped[0].gap > 3) {
      line.unshift(parkingPoint);
      ways.unshift(-2);
    }
    const summitGap = snapped[snapped.length - 1].gap;
    if (summitGap > 3) {
      line.push(summit);
      ways.push(-1); // off the mapped paths, to the summit point
    }

    // What the line uses, way by way.
    const used = new Map<number, number>();
    for (let i = 1; i < line.length; i += 1) {
      used.set(
        ways[i - 1],
        (used.get(ways[i - 1]) ?? 0) + metres(line[i - 1], line[i]),
      );
    }
    const sacOnRoute = [...used.keys()]
      .map((way) => graph.wayInfo.get(way)?.sac)
      .filter(Boolean) as string[];
    const hardest =
      sacOnRoute.sort(
        (a, b) => SAC_ORDER.indexOf(b) - SAC_ORDER.indexOf(a),
      )[0] ?? null;
    const permissive = [...used.entries()]
      .filter(([way]) => graph.wayInfo.get(way)?.access === "permissive")
      .reduce((sum, [, length]) => sum + length, 0);

    // Check every 10 m against the OGL layers and the terrain.
    const box = boxAround(line, 300);
    const onAccessLand = await loadAccessLand(fell.id, box);
    const points = samples(line, 10);
    let [onProw, onAccess, onRoad, onPermissive, uncovered, ascent] = [
      0, 0, 0, 0, 0, 0,
    ];
    const gaps: { from: number; to: number }[] = [];
    let previousHeight: number | null = null;
    let distanceSoFar = 0;
    const prowTypes = new Map<string, number>();
    points.forEach(({ point, segment }, index) => {
      const step = index === 0 ? 0 : metres(points[index - 1].point, point);
      distanceSoFar += step;
      const { easting, northing } = toGrid(point.lat, point.lon);
      const height = heightAt(easting, northing);
      if (previousHeight !== null && height > previousHeight)
        ascent += height - previousHeight;
      previousHeight = height;
      if (index === 0) return;
      const prow = rightOfWayAt(easting, northing, 20);
      const way = graph.wayInfo.get(ways[segment]);
      // The walk across the car park counts with the public roads.
      const road = way ? ROADS.has(way.highway) : ways[segment] === -2;
      const access = onAccessLand(point);
      if (prow) {
        onProw += step;
        prowTypes.set(prow, (prowTypes.get(prow) ?? 0) + step);
      }
      if (access) onAccess += step;
      if (road) onRoad += step;
      // Tagged permissive in OSM: open by the landowner's leave, not by law.
      const permissiveWay = way?.access === "permissive";
      if (!prow && !access && !road && permissiveWay) onPermissive += step;
      if (!prow && !access && !road && !permissiveWay) {
        uncovered += step;
        const last = gaps[gaps.length - 1];
        if (last && distanceSoFar - last.to <= 30) last.to = distanceSoFar;
        else gaps.push({ from: distanceSoFar - step, to: distanceSoFar });
      }
    });
    const distance = lineLength(line);

    // Named places the line passes: tops and cols within 80 m, water within 150 m, becks it crosses.
    const landmarks: { name: string; kind: string; alongMetres: number }[] = [];
    for (const el of osm.named.elements) {
      const name = el.tags?.name;
      if (!name) continue;
      if (el.type === "node" && el.tags?.place) continue;
      if (el.type === "node") {
        const { off, along } = closestApproach(line, {
          lat: el.lat!,
          lon: el.lon!,
        });
        if (off <= 80)
          landmarks.push({
            name,
            kind: el.tags!.natural,
            alongMetres: Math.round(along),
          });
      } else if (el.geometry) {
        const along = crossing(line, el.geometry);
        if (along !== null)
          landmarks.push({
            name,
            kind: `crosses ${el.tags!.waterway}`,
            alongMetres: Math.round(along),
          });
      }
    }
    for (const el of osm.water.elements) {
      const name = el.tags?.name;
      const ring =
        el.type === "way"
          ? el.geometry
          : el.members?.find((m) => m.role === "outer")?.geometry;
      if (!name || !ring) continue;
      const nearest = ring.reduce(
        (best, p) => {
          const c = closestApproach(line, p);
          return c.off < best.off ? c : best;
        },
        { off: Infinity, along: 0 },
      );
      if (nearest.off <= 150)
        landmarks.push({
          name,
          kind: "water",
          alongMetres: Math.round(nearest.along),
        });
    }
    landmarks.sort((a, b) => a.alongMetres - b.alongMetres);

    // Summit furniture mapped within 40 m of the summit.
    const near = osm.summits.elements.filter(
      (el) => metres(summit, { lat: el.lat!, lon: el.lon! }) <= 40,
    );
    const summitFeatures = {
      trigPillar: near.some(
        (el) =>
          el.tags?.man_made === "survey_point" &&
          [el.tags["survey_point:structure"], el.tags.support].includes(
            "pillar",
          ),
      ),
      cairn: near.some((el) => el.tags?.man_made === "cairn"),
      shelter: near.some((el) => el.tags?.amenity === "shelter"),
    };

    // Map context: paths, roads and water around the line.
    const mapBox = boxAround(line, 700);
    const context = {
      paths: [] as number[][][],
      roads: [] as number[][][],
      water: [] as number[][][],
    };
    for (const el of roadWays) {
      const geometry = el.nodes!.map((id) => graph.coords.get(id)!);
      if (!geometry.some((p) => inBox(p, mapBox))) continue;
      const bucket = ROADS.has(el.tags!.highway)
        ? context.roads
        : context.paths;
      bucket.push(simplify(geometry, 8).map(coord));
    }
    for (const el of waterWays) {
      const rings =
        el.type === "way"
          ? [el.geometry ?? []]
          : (el.members ?? [])
              .filter((m) => m.role === "outer")
              .map((m) => m.geometry ?? []);
      for (const ring of rings) {
        if (ring.length < 4 || !ring.some((p) => inBox(p, mapBox))) continue;
        const simplified = simplify(ring, 10);
        if (simplified.length >= 4) context.water.push(simplified.map(coord));
      }
    }

    // The nearest named place to the car park, to say where the walk starts.
    const place = osm.named.elements
      .filter((el) =>
        ["town", "village", "hamlet"].includes(el.tags?.place ?? ""),
      )
      .map((el) => ({
        name: el.tags!.name,
        kind: el.tags!.place,
        metres: Math.round(
          metres(parkingPoint, { lat: el.lat!, lon: el.lon! }),
        ),
      }))
      .sort((a, b) => a.metres - b.metres)[0];

    const tags = parking.tags ?? {};
    osmOut[fell.id] = {
      start: {
        osm: config.parking,
        name: tags.name ?? null,
        operator: tags.operator ?? null,
        fee: tags.fee ?? null,
        access: tags.access ?? null,
        parking: tags.parking ?? null,
        capacity: tags.capacity ?? null,
        point: coord(parkingPoint),
        nearestPlace: place,
      },
      line: simplify(line, 2).map(coord),
      distanceMetres: Math.round(distance),
      hardestSacScale: hardest,
      permissiveMetres: Math.round(permissive),
      // The OSM ways the line follows, in order: what a walker checks and corrects upstream.
      ways: [...used.entries()].map(([way, length]) => {
        const info = graph.wayInfo.get(way);
        return {
          way: way < 0 ? null : way,
          highway: info?.highway ?? (way === -2 ? "car park" : "off-path"),
          name: info?.name ?? null,
          sacScale: info?.sac ?? null,
          access: info?.access ?? null,
          surface: info?.surface ?? null,
          metres: Math.round(length),
        };
      }),
      summit: summitFeatures,
      landmarks: landmarks.filter(
        (mark, i) =>
          landmarks.findIndex(
            (other) => other.name === mark.name && other.kind === mark.kind,
          ) === i,
      ),
      context,
    };

    checksOut[fell.id] = {
      checkedOn: TODAY,
      ascentMetres: Math.round(ascent / 10) * 10,
      startHeightMetres: Math.round(
        heightAt(
          ...(Object.values(toGrid(parkingPoint.lat, parkingPoint.lon)) as [
            number,
            number,
          ]),
        ),
      ),
      summitGapMetres: Math.round(summitGap),
      startGapMetres: Math.round(snapped[0].gap),
      rightOfWayMetres: Math.round(onProw),
      rightOfWayTypes: Object.fromEntries(
        [...prowTypes].map(([type, m]) => [type, Math.round(m)]),
      ),
      accessLandMetres: Math.round(onAccess),
      roadMetres: Math.round(onRoad),
      permissiveOnlyMetres: Math.round(onPermissive),
      uncoveredMetres: Math.round(uncovered),
      uncoveredStretches: gaps
        .filter((gap) => gap.to - gap.from >= 20)
        .map((gap) => [Math.round(gap.from), Math.round(gap.to)]),
      /** OS Terrain 50 height every 100 m along the line, start to summit. */
      profile: points
        .filter((_, i) => i % 10 === 0)
        .map(({ point }) => {
          const { easting, northing } = toGrid(point.lat, point.lon);
          return Math.round(heightAt(easting, northing));
        }),
    };
  }

  // Bus: the nearest active NaPTAN stop to each car park with a current BODS service.
  const candidates = new Map<string, { stop: Stop; distance: number }[]>();
  for (const [id, start] of startsByFell) {
    candidates.set(
      id,
      stops
        .map((stop) => ({ stop, distance: metres(start, stop.point) }))
        .filter(({ distance }) => distance <= 6000)
        .sort((a, b) => a.distance - b.distance),
    );
  }
  const atcos = new Set(
    [...candidates.values()].flat().map(({ stop }) => stop.atco),
  );
  const { byStop, feedVersion } = await loadServices(atcos);
  for (const [id, list] of candidates) {
    const served = list.find(({ stop }) => byStop.has(stop.atco));
    transportOut[id] = served
      ? {
          atco: served.stop.atco,
          name: served.stop.name,
          indicator: served.stop.indicator,
          locality: served.stop.locality,
          point: coord(served.stop.point),
          distanceFromStartMetres: Math.round(served.distance),
          services: [...byStop.get(served.stop.atco)!.values()]
            .filter(
              (s, i, all) => all.findIndex((o) => o.line === s.line) === i,
            )
            .sort((a, b) =>
              a.line.localeCompare(b.line, "en", { numeric: true }),
            ),
        }
      : null;
  }

  mkdirSync(OUT, { recursive: true });
  const write = (
    name: string,
    meta: Record<string, unknown>,
    data: Record<string, unknown>,
  ) =>
    writeFileSync(
      path.join(OUT, name),
      `${JSON.stringify({ ...meta, routes: data }, null, 1)}\n`,
    );
  write(
    "osm.json",
    {
      licence: "ODbL-1.0",
      notice:
        "Route lines, car parks and map context extracted from OpenStreetMap. © OpenStreetMap contributors, available under the Open Database Licence: https://opendatacommons.org/licenses/odbl/1-0/",
      osmBase: osm.ways.osm3s.timestamp_osm_base,
      builtOn: TODAY,
    },
    osmOut,
  );
  write(
    "transport.json",
    {
      licence: "OGL-UK-3.0",
      notice:
        "Bus stops from NaPTAN (Department for Transport) and services from the Bus Open Data Service. Contains public sector information licensed under the Open Government Licence v3.0.",
      naptanDownloaded: TODAY,
      bodsFeedVersion: feedVersion,
    },
    transportOut,
  );
  write(
    "checks.json",
    {
      notice:
        "Measurements along the OpenStreetMap route lines (© OpenStreetMap contributors, ODbL: https://opendatacommons.org/licenses/odbl/1-0/; road and permissive stretches come from OSM tags) against OS Terrain 50 (Contains OS data © Crown copyright and database right 2026), LDNPA Public Rights of Way and Natural England CRoW Access Land (© Natural England copyright. Contains Ordnance Survey data © Crown copyright and database right 2026), the last three under the Open Government Licence v3.0. No OGL geometry is stored here, only distances and heights along the OSM line; the file is released under the ODbL.",
      method:
        "Every 10 m along the line: height from OS Terrain 50 (bilinear), a right of way within 20 m, inside access land, or on a public road in OSM. Ascent is the sum of rises between samples.",
      builtOn: TODAY,
    },
    checksOut,
  );
  console.log(
    `wrote ${fells.length} routes to ${path.relative(process.cwd(), OUT)}`,
  );
}

await main();
