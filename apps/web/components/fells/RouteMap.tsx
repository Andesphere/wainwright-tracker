// The ascent on a small map: the route line over the OpenStreetMap paths,
// roads and water around it, with the car park, the bus stop and the summit.
// Plain SVG rendered on the server, like the summit map: no tiles, no script.

import { WAINWRIGHTS } from "@wainwrights/catalog/wainwrights";

import type { Coord, FellRoute } from "@/lib/fellRoutes";
import { EARTH_RADIUS } from "@/lib/fells";

const WIDTH = 1000;

function frame(route: FellRoute) {
  const lons = route.line.map(([lon]) => lon);
  const lats = route.line.map(([, lat]) => lat);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const k = Math.cos((midLat * Math.PI) / 180);
  const toX = (lon: number) => (lon * Math.PI * EARTH_RADIUS * k) / 180;
  const toY = (lat: number) => (lat * Math.PI * EARTH_RADIUS) / 180;
  let [minX, maxX] = [toX(Math.min(...lons)), toX(Math.max(...lons))];
  let [minY, maxY] = [toY(Math.min(...lats)), toY(Math.max(...lats))];
  const pad = Math.max(250, 0.15 * Math.max(maxX - minX, maxY - minY));
  [minX, maxX, minY, maxY] = [minX - pad, maxX + pad, minY - pad, maxY + pad];
  // Keep the frame between landscape 16:9 and square.
  const grow = (low: number, high: number, span: number) => {
    const extra = (span - (high - low)) / 2;
    return [low - extra, high + extra];
  };
  if ((maxY - minY) / (maxX - minX) < 0.5625)
    [minY, maxY] = grow(minY, maxY, (maxX - minX) * 0.5625);
  if ((maxY - minY) / (maxX - minX) > 1)
    [minX, maxX] = grow(minX, maxX, maxY - minY);
  const scale = WIDTH / (maxX - minX);
  const height = Math.round((maxY - minY) * scale);
  const project = ([lon, lat]: Coord) =>
    [(toX(lon) - minX) * scale, (maxY - toY(lat)) * scale] as const;
  return { project, height, metresPerUnit: 1 / scale };
}

export function RouteMap({
  route,
  label,
}: {
  route: FellRoute;
  label: string;
}) {
  const { project, height, metresPerUnit } = frame(route);
  const d = (line: Coord[], close = false) =>
    line
      .map((coord, i) => {
        const [x, y] = project(coord);
        return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join("") + (close ? "Z" : "");
  const inside = ([x, y]: readonly [number, number]) =>
    x >= 0 && x <= WIDTH && y >= 0 && y <= height;

  const line = d(route.line);
  const start = project(route.start.point);
  const summit = project(route.line[route.line.length - 1]);
  const bus = route.bus ? project(route.bus.point) : null;
  const neighbours = WAINWRIGHTS.map((fell) => ({
    fell,
    at: project([fell.longitude, fell.latitude]),
  })).filter(
    ({ at }) =>
      inside(at) && Math.hypot(at[0] - summit[0], at[1] - summit[1]) > 30,
  );
  const scaleMetres = [250, 500, 1000, 2000].findLast(
    (m) => m / metresPerUnit <= WIDTH * 0.3,
  )!;
  const scaleWidth = scaleMetres / metresPerUnit;

  return (
    <svg
      className="fl-route-svg"
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label={label}
    >
      <g className="fl-rm-water">
        {route.context.water.map((ring, i) => (
          <path key={i} d={d(ring, true)} />
        ))}
      </g>
      <g className="fl-rm-roads">
        {route.context.roads.map((line, i) => (
          <path key={i} d={d(line)} />
        ))}
      </g>
      <g className="fl-rm-paths">
        {route.context.paths.map((line, i) => (
          <path key={i} d={d(line)} />
        ))}
      </g>
      <path className="fl-rm-casing" d={line} />
      <path className="fl-rm-route" d={line} />

      {neighbours.map(({ fell, at }) => (
        <g key={fell.id}>
          <circle className="fl-rm-fell" cx={at[0]} cy={at[1]} r={6} />
          <text
            className="fl-rm-name"
            x={at[0]}
            y={at[1] - 14}
            textAnchor="middle"
          >
            {fell.name}
          </text>
        </g>
      ))}

      {bus && inside(bus) ? (
        <g className="fl-rm-marker fl-rm-marker--bus">
          <rect x={bus[0] - 15} y={bus[1] - 15} width={30} height={30} rx={8} />
          <text x={bus[0]} y={bus[1] + 7} textAnchor="middle">
            B
          </text>
        </g>
      ) : null}
      <g className="fl-rm-marker">
        <rect
          x={start[0] - 15}
          y={start[1] - 15}
          width={30}
          height={30}
          rx={8}
        />
        <text x={start[0]} y={start[1] + 7} textAnchor="middle">
          P
        </text>
      </g>
      <path
        className="fl-rm-summit"
        d={`M${summit[0]} ${summit[1] - 17}L${summit[0] + 15} ${summit[1] + 10}L${summit[0] - 15} ${summit[1] + 10}Z`}
      />

      <g className="fl-rm-scale" transform={`translate(24 ${height - 28})`}>
        <path d={`M0 0H${scaleWidth.toFixed(1)}`} />
        <text x={scaleWidth + 10} y={6}>
          {scaleMetres >= 1000
            ? `${scaleMetres / 1000} km`
            : `${scaleMetres} m`}
        </text>
      </g>
    </svg>
  );
}
