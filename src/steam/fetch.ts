import axios from 'axios';
import { CC, LANG } from './types.js';

/** Fetch Steam results_html for a tag. Returns HTML string or null. */
export async function fetchResultsHtml(tagId: number, start = 0, count = 50): Promise<string | null> {
  const url = "https://store.steampowered.com/search/results/";

  const { data, status } = await axios.get(url, {
    params: {
      query: "",
      start,
      count,
      specials: 1,
      tags: tagId,
      category1: 998, // games only
      l: LANG,
      cc: CC,
      infinite: 1,
      ajax: 1,
    },
    headers: {
      Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://store.steampowered.com/search/?specials=1",
      "Accept-Language": `${LANG};q=0.9,en;q=0.8`,
    },
    timeout: 15000,
    validateStatus: (s) => s >= 200 && s < 500,
  });

  if (!data || typeof data !== "object" || typeof (data as any).results_html !== "string") {
    console.warn(`Unexpected Steam response (no results_html) status=${status}`);
    return null;
  }
  return (data as any).results_html as string;
}
