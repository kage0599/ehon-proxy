import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: "title is required" });

  // 10秒で中断する AbortController
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // ← ここを10秒に延長

  try {
    const searchUrl = `https://www.e-hon.ne.jp/search/book?keyw=${encodeURIComponent(title)}`;
    const response = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timeout); // 正常取得ならタイマー解除

    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const first = $("div.dataRow").first();
    const relative = first.find("a").attr("href");
    const image = first.find("img").attr("src");
    const author = first.find(".auth").text().trim();
    const publisher = first.find(".pub").text().trim();
    const price = first.find(".price").text().replace(/[^\d]/g, "");

    if (!relative || !image) {
      return res.status(404).json({ error: "No matching item found." });
    }

    return res.status(200).json({
      title,
      link: `https://www.e-hon.ne.jp${relative}`,
      image,
      author,
      publisher,
      price
    });
  } catch (err) {
    console.error("e-hon fetch error:", err.message);
    return res.status(500).json({
      error: "timeout or fetch error",
      detail: err.message
    });
  }
}
