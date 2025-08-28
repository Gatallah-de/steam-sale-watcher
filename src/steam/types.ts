export const CC = process.env.STEAM_REGION || "DE";
export const LANG = process.env.STEAM_LANG || "en";

export type SaleItem = {
  appid: number;
  title: string;
  url: string;

  discount: string;   // raw text as shown by Steam
  price: string;      // raw combined price text

  // optional parsed fields
  image?: string;
  discountPct?: number;
  priceOld?: number;
  priceNew?: number;
  currency?: string;
  releaseYear?: number;

  // total Steam review count parsed from tooltip
  reviewCount?: number;
};
