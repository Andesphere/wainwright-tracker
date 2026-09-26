// WGS84 latitude/longitude to and from British National Grid (OSGB36), by the
// Ordnance Survey's published method: a seven-parameter Helmert shift between
// the two datums and the Transverse Mercator projection of the National Grid.
// Accurate to a few metres, which is the accuracy of the Helmert shift and
// well inside the 50 m grid of OS Terrain 50.

const WGS84 = { a: 6378137, b: 6356752.3142 };
const AIRY = { a: 6377563.396, b: 6356256.909 };

// WGS84 to OSGB36. The inverse uses the same numbers with the signs flipped.
const HELMERT = {
  tx: -446.448,
  ty: 125.157,
  tz: -542.06,
  s: 20.4894, // ppm
  rx: -0.1502, // arc seconds
  ry: -0.247,
  rz: -0.8421,
};

const F0 = 0.9996012717;
const LAT0 = (49 * Math.PI) / 180;
const LON0 = (-2 * Math.PI) / 180;
const N0 = -100000;
const E0 = 400000;

type Ellipsoid = { a: number; b: number };
type Cartesian = [number, number, number];

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (radians: number) => (radians * 180) / Math.PI;

function toCartesian(lat: number, lon: number, { a, b }: Ellipsoid): Cartesian {
  const e2 = 1 - (b * b) / (a * a);
  const nu = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
  return [
    nu * Math.cos(lat) * Math.cos(lon),
    nu * Math.cos(lat) * Math.sin(lon),
    (1 - e2) * nu * Math.sin(lat),
  ];
}

function fromCartesian([x, y, z]: Cartesian, { a, b }: Ellipsoid) {
  const e2 = 1 - (b * b) / (a * a);
  const p = Math.hypot(x, y);
  let lat = Math.atan2(z, p * (1 - e2));
  for (let i = 0; i < 10; i += 1) {
    const nu = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
    lat = Math.atan2(z + e2 * nu * Math.sin(lat), p);
  }
  return { lat, lon: Math.atan2(y, x) };
}

function helmert([x, y, z]: Cartesian, sign: 1 | -1): Cartesian {
  const s = (sign * HELMERT.s) / 1e6 + 1;
  const [rx, ry, rz] = [HELMERT.rx, HELMERT.ry, HELMERT.rz].map((r) =>
    rad((sign * r) / 3600),
  );
  return [
    sign * HELMERT.tx + s * x - rz * y + ry * z,
    sign * HELMERT.ty + rz * x + s * y - rx * z,
    sign * HELMERT.tz - ry * x + rx * y + s * z,
  ];
}

/** The meridional arc from the true origin to `lat`, on the Airy ellipsoid. */
function meridionalArc(lat: number) {
  const { a, b } = AIRY;
  const n = (a - b) / (a + b);
  const [n2, n3] = [n * n, n * n * n];
  const dLat = lat - LAT0;
  const sLat = lat + LAT0;
  return (
    b *
    F0 *
    ((1 + n + (5 / 4) * n2 + (5 / 4) * n3) * dLat -
      (3 * n + 3 * n2 + (21 / 8) * n3) * Math.sin(dLat) * Math.cos(sLat) +
      ((15 / 8) * n2 + (15 / 8) * n3) *
        Math.sin(2 * dLat) *
        Math.cos(2 * sLat) -
      (35 / 24) * n3 * Math.sin(3 * dLat) * Math.cos(3 * sLat))
  );
}

function radii(lat: number) {
  const { a, b } = AIRY;
  const e2 = 1 - (b * b) / (a * a);
  const sin2 = Math.sin(lat) ** 2;
  const nu = (a * F0) / Math.sqrt(1 - e2 * sin2);
  const rho = (a * F0 * (1 - e2)) / (1 - e2 * sin2) ** 1.5;
  return { nu, rho, eta2: nu / rho - 1 };
}

/** WGS84 degrees to National Grid easting and northing in metres. */
export function toGrid(latitude: number, longitude: number) {
  const { lat, lon } = fromCartesian(
    helmert(toCartesian(rad(latitude), rad(longitude), WGS84), 1),
    AIRY,
  );
  const { nu, rho, eta2 } = radii(lat);
  const [sin, cos, tan] = [Math.sin(lat), Math.cos(lat), Math.tan(lat)];
  const t2 = tan * tan;
  const I = meridionalArc(lat) + N0;
  const II = (nu / 2) * sin * cos;
  const III = (nu / 24) * sin * cos ** 3 * (5 - t2 + 9 * eta2);
  const IIIA = (nu / 720) * sin * cos ** 5 * (61 - 58 * t2 + t2 * t2);
  const IV = nu * cos;
  const V = (nu / 6) * cos ** 3 * (nu / rho - t2);
  const VI =
    (nu / 120) *
    cos ** 5 *
    (5 - 18 * t2 + t2 * t2 + 14 * eta2 - 58 * t2 * eta2);
  const d = lon - LON0;
  return {
    easting: E0 + IV * d + V * d ** 3 + VI * d ** 5,
    northing: I + II * d ** 2 + III * d ** 4 + IIIA * d ** 6,
  };
}

/** National Grid easting and northing in metres to WGS84 degrees. */
export function fromGrid(easting: number, northing: number) {
  const { a } = AIRY;
  let lat = LAT0;
  let M = 0;
  do {
    lat += (northing - N0 - M) / (a * F0);
    M = meridionalArc(lat);
  } while (Math.abs(northing - N0 - M) >= 0.00001);

  const { nu, rho, eta2 } = radii(lat);
  const tan = Math.tan(lat);
  const sec = 1 / Math.cos(lat);
  const t2 = tan * tan;
  const t4 = t2 * t2;
  const VII = tan / (2 * rho * nu);
  const VIII =
    (tan / (24 * rho * nu ** 3)) * (5 + 3 * t2 + eta2 - 9 * t2 * eta2);
  const IX = (tan / (720 * rho * nu ** 5)) * (61 + 90 * t2 + 45 * t4);
  const X = sec / nu;
  const XI = (sec / (6 * nu ** 3)) * (nu / rho + 2 * t2);
  const XII = (sec / (120 * nu ** 5)) * (5 + 28 * t2 + 24 * t4);
  const XIIA =
    (sec / (5040 * nu ** 7)) * (61 + 662 * t2 + 1320 * t4 + 720 * t4 * t2);
  const dE = easting - E0;
  const osgbLat = lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6;
  const osgbLon = LON0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7;

  const wgs = fromCartesian(
    helmert(toCartesian(osgbLat, osgbLon, AIRY), -1),
    WGS84,
  );
  return { latitude: deg(wgs.lat), longitude: deg(wgs.lon) };
}
