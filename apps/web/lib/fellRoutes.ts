// The desk-checked ascent routes, read from the three files that
// scripts/fell-routes/build.ts writes. Each file is one licence and stays
// separate: OpenStreetMap (ODbL), bus data (OGL), and the checks against the
// OGL layers. This module only joins them for a page.

import checksFile from "@/content/fell-routes/checks.json";
import osmFile from "@/content/fell-routes/osm.json";
import transportFile from "@/content/fell-routes/transport.json";

type Coord = [number, number];

export type RouteStart = {
  osm: string;
  name: string | null;
  operator: string | null;
  fee: string | null;
  access: string | null;
  parking: string | null;
  capacity: string | null;
  point: Coord;
  /** The nearest town, village or hamlet in OpenStreetMap. */
  nearestPlace: { name: string; kind: string; metres: number } | undefined;
};

export type RouteWay = {
  way: number | null;
  highway: string;
  name: string | null;
  sacScale: string | null;
  access: string | null;
  surface: string | null;
  metres: number;
};

export type OsmRoute = {
  start: RouteStart;
  /** Longitude, latitude from the car park to the summit. */
  line: Coord[];
  distanceMetres: number;
  hardestSacScale: string | null;
  permissiveMetres: number;
  ways: RouteWay[];
  summit: { trigPillar: boolean; cairn: boolean; shelter: boolean };
  landmarks: { name: string; kind: string; alongMetres: number }[];
  context: { paths: Coord[][]; roads: Coord[][]; water: Coord[][] };
};

export type BusStop = {
  atco: string;
  name: string;
  indicator: string;
  locality: string;
  point: Coord;
  distanceFromStartMetres: number;
  services: { line: string; operator: string }[];
};

export type RouteChecks = {
  checkedOn: string;
  ascentMetres: number;
  startHeightMetres: number;
  summitGapMetres: number;
  startGapMetres: number;
  rightOfWayMetres: number;
  rightOfWayTypes: Record<string, number>;
  accessLandMetres: number;
  roadMetres: number;
  permissiveOnlyMetres: number;
  uncoveredMetres: number;
  uncoveredStretches: [number, number][];
  profile: number[];
};

export type FellRoute = OsmRoute & {
  bus: BusStop | null;
  checks: RouteChecks;
};

const osm = osmFile.routes as unknown as Record<string, OsmRoute>;
const transport = transportFile.routes as unknown as Record<
  string,
  BusStop | null
>;
const checks = checksFile.routes as unknown as Record<string, RouteChecks>;

/** When the OpenStreetMap extract was taken, for the GPX and the page credit. */
export const OSM_BASE = osmFile.osmBase;
export const ROUTE_IDS = Object.keys(osm);

export function getFellRoute(id: string): FellRoute | undefined {
  const route = osm[id];
  if (!route) return undefined;
  return { ...route, bus: transport[id] ?? null, checks: checks[id] };
}

/** "4.1 km" */
export function formatKm(metres: number): string {
  return `${(metres / 1000).toFixed(1)} km`;
}

/** "85 m" under a kilometre, "1.5 km" from there. */
export function formatDistance(metres: number): string {
  return metres < 1000 ? `${Math.round(metres / 10) * 10} m` : formatKm(metres);
}

/** "Lake Head Car Park" or, for an unnamed one, "the National Trust car park". */
export function startName(start: RouteStart): string {
  if (start.name) return start.name;
  const kind = start.parking === "lane" ? "roadside parking" : "car park";
  return start.operator ? `the ${start.operator} ${kind}` : `the ${kind}`;
}

/** What parking costs, as far as OpenStreetMap records it. */
export function feeText(start: RouteStart): string {
  if (start.fee === "no") return "Free";
  if (start.fee === "donation") return "Donation";
  return start.fee ? "Pay to park" : "Fee not recorded";
}
