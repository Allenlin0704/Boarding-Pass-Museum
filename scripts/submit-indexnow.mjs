import { readFile } from "node:fs/promises";

const host = "bpmuseum.org.cn";
const key = (await readFile(new URL("../public/indexnow-key.txt", import.meta.url), "utf8")).trim();
if (!/^[a-f0-9]{32}$/i.test(key)) {
  throw new Error("public/indexnow-key.txt must contain a 32-character hexadecimal key.");
}

const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const urls = [...sitemap.matchAll(/<loc>\s*(https:\/\/[^<]+)\s*<\/loc>/gi)].map((match) => match[1]);
if (urls.length === 0 || urls.some((url) => new URL(url).hostname !== host)) {
  throw new Error("sitemap.xml must contain HTTPS URLs for bpmuseum.org.cn.");
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key,
    keyLocation: `https://${host}/indexnow-key.txt`,
    urlList: urls,
  }),
});

if (!response.ok) {
  throw new Error(`IndexNow returned HTTP ${response.status}.`);
}

console.log(`IndexNow accepted ${urls.length} sitemap URLs (HTTP ${response.status}).`);
