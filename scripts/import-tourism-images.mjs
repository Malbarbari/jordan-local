// Explicit offline preparation only. Never run during build or at request time.
// File titles were manually reviewed against Commons descriptions; no automatic
// search-result selection, copyrighted tourism-site photos or API keys.
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
const selections = [
 ["petra", "File:Petra , Al-Khazneh 2.jpg", "الخزنة في البتراء"],
 ["umm-qais", "File:Umm Qais 25.JPG", "آثار أم قيس"],
 ["ajloun-castle", "File:Ajloun Castle (Entrance).jpg", "مدخل حجري داخل قلعة عجلون"],
 ["ajloun-forest", "File:Ajloun Forest Reserve in Jordan kz01.jpg", "مبنى في محمية غابات عجلون"],
 ["pella", "File:Archaeological Ruins of Tabaqat Fahl (Pella) 26.jpg", "آثار طبقة فحل"],
 ["dead-sea", "File:Dead Sea from Jordan.JPG", "البحر الميت من الجانب الأردني"],
 ["wadi-mujib", "File:Wadi Mujib BW 1.JPG", "منظر وادي الموجب"],
 ["main", "File:Ma'in Hot Springs 01.jpg", "حمامات ماعين"],
 ["jerash", "File:Jerash, Corinthian Column. Jordan0928.jpg", "عمود أثري في جرش"],
 ["amman-citadel", "File:Amman Citadel.jpg", "جبل القلعة في عمّان"],
 ["roman-theatre", "File:Roman Theatre in Amman 0151.jpg", "المدرج الروماني في عمّان"],
 ["wadi-rum", "File:Wadi Rum 03.jpg", "تشكيلات صخرية في وادي رم"],
 ["wadi-rum-camels", "File:Wadi Rum 01.jpg", "ركوب الجمال بين تشكيلات وادي رم"],
 ["dana-village", "File:Dana village, Jordan 02.jpg", "شارع في قرية ضانا"],
 ["aqaba-castle", "File:Aqaba castle - panoramio.jpg", "قلعة العقبة"],
 ["mount-nebo", "File:Mount Nebo-4.JPG", "جبل نيبو في محافظة مادبا"],
 ["cable-car", "File:عربات تلفريك عجلون.jpg", "عربات تلفريك عجلون"],
 ["little-petra", "File:Little Petra, Jordan - 49785442382.jpg", "البتراء الصغيرة / سيق البارد"],
];
const plain = s => String(s ?? "").replace(/<[^>]*>/g, "").replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();
const query = new URL("https://commons.wikimedia.org/w/api.php");
const existing = existsSync("data/tourism.images.json") ? JSON.parse(readFileSync("data/tourism.images.json","utf8")) : {};
const missing = selections.filter(([slug]) => !existing[slug] || !existsSync(`public/images/tourism/${slug}.jpg`));
if (!missing.length) { console.log("All reviewed photos already exist; no network or file changes."); process.exit(0); }
query.search = new URLSearchParams({ action:"query", format:"json", titles:missing.map(s => s[1]).join("|"), prop:"imageinfo", iiprop:"url|extmetadata", iiurlwidth:"900" });
const response = await fetch(query, { headers:{ "User-Agent":"JordanLocal/1.0 (educational photo attribution)" }, signal:AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Commons metadata HTTP ${response.status}; no files changed.`);
const pages = Object.values((await response.json()).query?.pages ?? {});
await mkdir("public/images/tourism", {recursive:true});
const manifest = { ...existing };
for (const [slug,title,alt_ar] of missing) {
 const info = pages.find(p => p.title === title)?.imageinfo?.[0];
 if (!info) throw new Error(`Missing reviewed file: ${title}`);
 const m = info.extmetadata, license = plain(m.LicenseShortName?.value), author = plain(m.Artist?.value), license_url = plain(m.LicenseUrl?.value);
 if (!/^CC (BY|BY-SA) (2\.0|2\.5|3\.0|4\.0)$/.test(license) || !author || !/^https?:\/\/creativecommons.org\//.test(license_url) || plain(m.Restrictions?.value)) throw new Error(`License needs manual review: ${title}`);
 const downloaded_from = info.thumburl ?? info.url;
 const photo = await fetch(downloaded_from, {signal:AbortSignal.timeout(25000)});
 if (!photo.ok || !photo.headers.get("content-type")?.startsWith("image/jpeg")) throw new Error(`Photo unavailable: ${title} (${photo.status})`);
 const bytes = new Uint8Array(await photo.arrayBuffer());
 if (bytes.length > 4000000 || bytes.length < 1000 || bytes[0] !== 255 || bytes[1] !== 216) throw new Error(`Unexpected JPEG: ${title}`);
 await writeFile(`public/images/tourism/${slug}.jpg`, bytes);
 manifest[slug] = { path:`/images/tourism/${slug}.jpg`, title:plain(m.ObjectName?.value) || title, alt_ar, author, license, license_url:license_url.replace(/^http:/,"https:"), source_url:info.descriptionurl, original_url:info.url, downloaded_from, changes:"Wikimedia-generated thumbnail; responsive display crop. No other edits. Image remains under its stated license.", checked_at:new Date().toISOString() };
 console.log(`${slug}: ${license}, ${author}, ${bytes.length} bytes`);
 await new Promise(resolve => setTimeout(resolve, 450));
}
await writeFile("data/tourism.images.json", JSON.stringify(manifest,null,2)+"\n");
console.log("Saved the reviewed local photo manifest. Preserve attribution links when reusing these photos.");
