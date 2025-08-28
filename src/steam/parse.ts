import * as cheerio from 'cheerio';
import type { SaleItem } from './types.js';
import { parseMoney, computePctFromPrices, isFreeish } from './money.js';
import { parseReviewCount } from './reviews.js';

function pctNumber(text?: string): number | undefined {
  if (!text) return;
  const m = text.match(/-?\s*(\d{1,3})\s*%/);
  return m ? Number(m[1]) : undefined;
}

/** Parse Steam search results HTML into SaleItem[] */
export function parseResultsHtml(html: string): SaleItem[] {
  const $ = cheerio.load(html);
  const items: SaleItem[] = [];

  $("a.search_result_row").each((_i, el) => {
    const a = $(el);

    const appidAttr = a.attr("data-ds-appid") || a.attr("data-ds-bundleid");
    if (!appidAttr) return;
    const appid = Number(Array.isArray(appidAttr) ? appidAttr[0] : appidAttr);
    if (!Number.isFinite(appid)) return;

    const title = a.find(".title").text().trim();
    const gameUrl = (a.attr("href") || "").split("?")[0];

    // Discount
    const discountText = a.find(".search_discount span").text().trim() || "";
    let discountPct = pctNumber(discountText);

    // Prices
    const rawPriceText = a.find(".search_price").text().replace(/\s+/g, " ").trim();
    const finalText =
      a.find(".discount_final_price").text().trim() ||
      a
        .find(".search_price")
        .clone()
        .find("strike")
        .remove()
        .end()
        .text()
        .replace(/\s+/g, " ")
        .trim();
    const strikeText =
      a.find(".discount_original_price").text().trim() ||
      a.find(".search_price strike").text().trim();

    const oldMoney = parseMoney(strikeText);
    const newMoney = parseMoney(finalText);

    const priceOld = oldMoney.value;
    const priceNew = newMoney.value ?? (isFreeish(finalText) ? 0 : undefined);
    const currency = newMoney.currency || oldMoney.currency;

    if (discountPct == null) {
      discountPct = computePctFromPrices(priceOld, priceNew);
    }

    // Image
    const img = a.find("img").attr("src") || a.find("img").attr("data-src");

    // Release year
    let releaseYear: number | undefined;
    const relText = a.find(".search_released").text().trim();
    if (relText) {
      const yearMatch = relText.match(/(\d{4})/);
      if (yearMatch) releaseYear = Number(yearMatch[1]);
    }

    // Reviews (from tooltip: "…<br>123,456 reviews")
    const reviewTooltip = a.find(".search_review_summary").attr("data-tooltip-html") ?? undefined;
    const reviewCount = parseReviewCount(
      typeof reviewTooltip === "string" ? reviewTooltip : Array.isArray(reviewTooltip) ? reviewTooltip[0] : undefined
    );

    // Build item without assigning `undefined` to optional keys
    const item: SaleItem = {
      appid,
      title,
      url: gameUrl || "",
      discount: discountText,
      price: rawPriceText,
      ...(discountPct !== undefined ? { discountPct } : {}),
      ...(priceOld !== undefined ? { priceOld } : {}),
      ...(priceNew !== undefined ? { priceNew } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(releaseYear !== undefined ? { releaseYear } : {}),
      ...(img ? { image: img } : {}),
      ...(reviewCount !== undefined ? { reviewCount } : {}),
    };

    items.push(item);
  });

  return items;
}
