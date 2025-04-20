import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { title } = req.query;
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const searchUrl = `https://www.e-hon.ne.jp/search/book?keyw=${encodeURIComponent(title)}`;

  try {
    const response = await fetch(searchUrl);
    const body = await response.text();
    const $ = cheerio.load(body);

    const firstItem = $("div#main div.listTitle:has(a)").first().closest("div.dataRow");

    if (!firstItem.length) {
      return res.status(404).json({ error: "no result" });
    }

    const relativeLink = firstItem.find("a").attr("href");
    const link = `https://www.e-hon.ne.jp${relativeLink}`;
    const image = firstItem.find("img").attr("src");
    const author = firstItem.find(".auth").text().trim();
    const publisher = firstItem.find(".pub").text().trim();
    const price = firstItem.find(".price").text().replace(/[^\d]/g, "");

    return res.status(200).json({
      title,
      link,
      image,
      author,
      publisher,
      price
    });
  } catch (error) {
    console.error("e-hon fetch error:", error);
    res.status(500).json({ error: "server error", detail: error.message });
  }
}
