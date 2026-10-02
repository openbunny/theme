export type Rgb = readonly [number, number, number];
export declare const thresholds: {
    readonly body: 4.5;
    readonly large: 3;
};
export declare class ColorError extends Error {
}
export declare const parseHex: (hex: string) => Rgb;
export declare const luminance: (hex: string) => number;
export declare const contrastRatio: (foreground: string, background: string) => number;
