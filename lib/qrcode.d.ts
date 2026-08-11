// Minimal ambient declaration for the `qrcode` package (no @types available).
// We only use toDataURL, which renders a QR to a PNG data URL.
declare module "qrcode" {
  interface ToDataURLOptions {
    margin?: number;
    width?: number;
    color?: { dark?: string; light?: string };
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  }
  export function toDataURL(
    text: string,
    options?: ToDataURLOptions,
  ): Promise<string>;
  const _default: { toDataURL: typeof toDataURL };
  export default _default;
}
