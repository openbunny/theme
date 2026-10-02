export type Rgb = readonly [number, number, number];

export const thresholds = { body: 4.5, large: 3 } as const;

export class ColorError extends Error {}

export const parseHex = (hex: string): Rgb => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    throw new ColorError(`${hex} is not a six-digit hex color`);
  }
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const linear = (channel: number): number => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const luminance = (hex: string): number => {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

export const contrastRatio = (
  foreground: string,
  background: string,
): number => {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
