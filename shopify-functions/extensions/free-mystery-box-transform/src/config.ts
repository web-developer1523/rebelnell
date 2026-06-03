/**
 * Runtime configuration for free-gift functions.
 * Set via app-owned metafield on the Cart Transform (see README).
 */

export type FreeGiftConfig = {
  /** GID, e.g. gid://shopify/ProductVariant/41046138093662 */
  giftVariantGid?: string;
  /** Product handle for gift detection fallback */
  giftProductHandle?: string;
  /** Numeric variant ID (converted to GID when giftVariantGid is omitted) */
  giftVariantId?: string | number;
  /** Merchandise subtotal threshold in shop/presentment currency units (dollars) */
  thresholdAmount?: number | string;
  /** Line item property written by theme fallback sync (optional) */
  giftLineAttributeKey?: string;
  giftLineAttributeValue?: string;
  /** Display title override on free gift lines (Shopify Plus lineUpdate only) */
  giftTitle?: string;
};

/** Defaults for Rebel Nell Mystery Box promo */
export const DEFAULT_CONFIG: Required<
  Pick<
    FreeGiftConfig,
    | "giftVariantGid"
    | "giftProductHandle"
    | "thresholdAmount"
    | "giftLineAttributeKey"
    | "giftLineAttributeValue"
    | "giftTitle"
  >
> = {
  giftVariantGid: "gid://shopify/ProductVariant/41046138093662",
  giftProductHandle: "mystery-box",
  thresholdAmount: 150,
  giftLineAttributeKey: "_free_gift_promo",
  giftLineAttributeValue: "mystery-box",
  giftTitle: "FREE Mystery Box Gift",
};

export function parseConfig(jsonValue: unknown): FreeGiftConfig & typeof DEFAULT_CONFIG {
  const base = { ...DEFAULT_CONFIG };
  if (!jsonValue || typeof jsonValue !== "object") {
    return base;
  }
  const raw = jsonValue as FreeGiftConfig;
  const giftVariantGid =
    raw.giftVariantGid ??
    (raw.giftVariantId != null
      ? `gid://shopify/ProductVariant/${String(raw.giftVariantId).replace(/\D/g, "")}`
      : base.giftVariantGid);

  const thresholdAmount =
    raw.thresholdAmount != null ? Number(raw.thresholdAmount) : base.thresholdAmount;

  return {
    ...base,
    ...raw,
    giftVariantGid,
    thresholdAmount: Number.isFinite(thresholdAmount) ? thresholdAmount : base.thresholdAmount,
  };
}

export function moneyToNumber(amount: string): number {
  const value = parseFloat(amount);
  return Number.isFinite(value) ? value : 0;
}
