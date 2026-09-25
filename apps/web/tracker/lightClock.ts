/** Mapbox Standard light presets. */
export type LightPreset = "dawn" | "day" | "dusk" | "night";

const LATITUDE = 54.5;
const LONGITUDE = -3.1;
const PRESETS: LightPreset[] = ["dawn", "day", "dusk", "night"];

/**
 * The light preset for the sun over the Lake District at `date`, as in the iPhone app.
 *
 * Sun above 6 degrees is day, between -6 and 6 is dawn (morning) or dusk (evening),
 * below -6 (civil twilight ends) is night. NOAA low-precision solar position formulas.
 */
export function lightPreset(date = new Date()): LightPreset {
  const { elevation, isMorning } = sun(date);
  if (elevation < -6) return "night";
  if (elevation < 6) return isMorning ? "dawn" : "dusk";
  return "day";
}

/** `?light=dusk` forces a preset, like the iPhone app's `-lightPreset` launch argument. */
export function forcedLightPreset(search: string): LightPreset | null {
  const value = new URLSearchParams(search).get("light");
  return PRESETS.find((preset) => preset === value) ?? null;
}

export const isDarkPreset = (preset: LightPreset) =>
  preset === "night" || preset === "dusk";

function sun(date: Date) {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86_400_000) + 1;
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60;

  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hours - 12) / 24);
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const solarMinutes = hours * 60 + equationOfTime + 4 * LONGITUDE;
  const hourAngle = ((solarMinutes / 4 - 180) * Math.PI) / 180;

  const phi = (LATITUDE * Math.PI) / 180;
  const cosZenith =
    Math.sin(phi) * Math.sin(declination) +
    Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle);
  const elevation =
    90 - (Math.acos(Math.max(-1, Math.min(1, cosZenith))) * 180) / Math.PI;
  return { elevation, isMorning: hourAngle < 0 };
}
