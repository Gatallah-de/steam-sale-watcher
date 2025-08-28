/**
 * Extract review count from Steam tooltip HTML.
 * Examples:
 *   "Very Positive<br>123,456 reviews"
 *   "Sehr positiv<br> (9.876 Nutzerrezensionen)"
 * Strategy:
 *   1) Look for a number followed by a localized "reviews" word.
 *   2) Fallback: take the LAST number-like token in the tooltip.
 */
export function parseReviewCount(tooltip?: string): number | undefined {
  if (!tooltip) return;

  const localizedWords =
    "reviews|review|recensioni|reseñas|avis|bewertungen|recenzí|recenze|recenzii|recensies|recensões|оценок|обзоров|r\u00E9censions";
  const rx = new RegExp(`([\\d.,\\s]+)\\s+(?:${localizedWords})`, "i");
  const m = tooltip.match(rx);
  let numText: string | undefined;

  if (m?.[1]) {
    numText = m[1];
  } else {
    // fallback: last number-like token
    const tokens = [...tooltip.matchAll(/\d[\d.,\s]*/g)];
    if (tokens.length) numText = tokens[tokens.length - 1][0];
  }

  if (!numText) return;
  const digitsOnly = numText.replace(/[^\d]/g, "");
  if (!digitsOnly) return;

  const n = parseInt(digitsOnly, 10);
  return Number.isFinite(n) ? n : undefined;
}
