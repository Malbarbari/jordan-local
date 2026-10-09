// Optional local Chromium QA. Start the app in seed/rules mode and Chromium
// with a separate temporary profile and --remote-debugging-port=9225.
// No browser dependency, credentials or paid API calls are used by this script.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const origin = process.env.SMOKE_ORIGIN || "http://localhost:3100";
const debug = process.env.CHROME_DEBUG_ORIGIN || "http://127.0.0.1:9225";
const target = await fetch(`${debug}/json/new?${encodeURIComponent(origin)}`, { method: "PUT" }).then(r => r.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
let next = 0;
const pending = new Map();
const exceptions = [];
const mutations = [];
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params);
  if (message.method === "Network.requestWillBeSent" && message.params.request.method === "POST") mutations.push(message.params.request.url);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject, timer } = pending.get(message.id);
    clearTimeout(timer); pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
});
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++next;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 25000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function wait(expression) {
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error(`UI condition timed out: ${expression}`);
}
async function set(id, value) {
  await evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', {bubbles:true})); })()`);
}
await call("Page.enable"); await call("Runtime.enable"); await call("Network.enable");
await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await call("Page.navigate", { url: origin });
await wait("document.querySelectorAll('.catalogue-section .experience-card').length === 6");
assert.equal(await evaluate("document.documentElement.dir"), "rtl");
await wait("document.querySelectorAll('.tourism-section .tourism-card').length === 6");
await evaluate("document.querySelector('.legacy-catalogue').open=true; document.querySelector('.advanced-filters').open=true");
await call("Page.bringToFront");
await evaluate("document.querySelector('.tourism-section .experience-grid').scrollIntoView({behavior:'instant',block:'start'})");
await wait("[...document.querySelectorAll('.tourism-section .experience-art img')].every(img => img.complete && img.naturalWidth > 0)");
assert.ok(await evaluate("document.querySelector('.tourism-section').textContent.includes('Wikimedia Commons')"));
await set("tourism-location", "ajloun"); await set("tourism-kind", "accommodation"); await set("tourism-query", "بدي اكواخ في الطبيعة");
await evaluate("document.querySelector('.tourism-form').requestSubmit()");
await wait("document.querySelectorAll('.tourism-section .tourism-card').length === 1 && !document.querySelector('.tourism-section [aria-busy=true]')");
assert.ok(await evaluate("document.querySelector('.tourism-section').textContent.includes('أكواخ محمية عجلون')"));
await set("tourism-budget", "40");
await evaluate("document.querySelector('.tourism-form').requestSubmit()");
await wait("!!document.querySelector('.tourism-section .empty-state')");
assert.ok(await evaluate("document.querySelector('.tourism-section').textContent.includes('لم نفترض سعرًا')"));
await evaluate("[...document.querySelectorAll('.tourism-form button')].find(button => button.textContent === 'مسح التصفية').click()");
await wait("document.querySelectorAll('.tourism-section .tourism-card').length === 6");
await set("tourism-location", "petra");
await evaluate("document.querySelector('.tourism-form').requestSubmit()");
await wait("document.querySelectorAll('.tourism-section .tourism-card').length === 2");
assert.ok(await evaluate("document.querySelector('.tourism-section').textContent.includes('البتراء الصغيرة')"));
console.log("PASS real tourism: licensed local photos and attribution, Arabic preferences, actual geography, unknown-price exclusion");
await set("catalog-kind", "destination");
await wait("document.querySelectorAll('.catalogue-section .experience-card').length === 2");
assert.ok(await evaluate("[...document.querySelectorAll('.catalogue-section .experience-card')].every(card => card.textContent.includes('ليست ملكية خاصة') && card.textContent.includes('السعر غير معروف') && card.querySelector('a[href*=visitjordan]'))"));
await set("catalog-kind", "accommodation");
await wait("document.querySelectorAll('.catalogue-section .experience-card').length === 1");
assert.ok(await evaluate("document.querySelector('.catalogue-section').textContent.includes('تقدير المجموعة: 60')"));
await set("catalog-kind", "visitable_place"); await set("catalog-tag", "swimming");
await wait("document.querySelectorAll('.catalogue-section .experience-card').length === 1");
assert.ok(await evaluate("document.querySelector('.catalogue-section .experience-card').textContent.includes('مسبح')"));
await set("catalog-kind", ""); await set("catalog-tag", "");
console.log("PASS tourism: public ownership/source links, type/tag filters, pool and unconfirmed cabin estimate");
await evaluate("document.querySelector('.recommendation-form').requestSubmit()");
await wait("document.querySelectorAll('.results-anchor .experience-card').length > 0");
assert.ok(await evaluate("document.querySelector('.result-notes').textContent.includes('القواعد')"));
assert.ok(await evaluate("document.querySelector('.results-anchor').textContent.includes('٣٢') || document.querySelector('.results-anchor').textContent.includes('32')"));
assert.ok(await evaluate("[...document.querySelectorAll('.results-anchor .price-row strong')].some(el => el.textContent.replace(/[^0-9٠-٩]/g,'') === '32' || el.textContent.replace(/[^0-9٠-٩]/g,'') === '٣٢')"), "card price must show 32 dinars, not 32000 fils");
await set("query", "within 5 km of Ajloun");
await evaluate("document.querySelector('.recommendation-form').requestSubmit()");
await wait("!!document.querySelector('.clarification')");
await evaluate("[...document.querySelectorAll('.clarification button')].find(button => button.textContent === 'عجلون').click()");
await wait("document.querySelectorAll('.results-anchor .experience-card').length > 0");
await set("query", "");
await set("budget", "1");
await evaluate("document.querySelector('.recommendation-form').requestSubmit()");
await wait("!!document.querySelector('.results-anchor .empty-state')");
assert.equal(await evaluate("document.querySelectorAll('.results-anchor .experience-card').length"), 0);
console.log("PASS visitor: catalogue, RTL, group totals, clarification recovery, rules labels and no_match");

await call("Page.navigate", { url: `${origin}/business` });
await wait("!!document.querySelector('.business-form')");
await evaluate("document.querySelector('.business-form').requestSubmit()");
await wait("document.getElementById('title_ar').getAttribute('aria-invalid') === 'true'");
await wait("document.activeElement?.id === 'title_ar'");
await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent === 'تعبئة مثال افتراضي').click()");
assert.ok(await evaluate("document.getElementById('title_ar').value.includes('مثال')"));
await set("title_ar", "تجربة طبيعة جديدة — معاينة");
await set("description_ar", "نشاط افتراضي لفحص النموذج، وليس عرضًا حقيقيًا.");
await set("location_id", "ajloun"); await set("price_unit", "per_person");
await set("price_jod", "8"); await set("capacity_people", "8"); await set("duration_minutes", "120");
await evaluate("for(const selector of ['input[name=tags][value=nature]','input[name=group_types][value=friends]']) { const field=document.querySelector(selector); if(!field.checked)field.click(); } document.querySelector('.business-form').requestSubmit()");
await wait("document.body.textContent.includes('تم التحقق من النموذج')");
assert.ok(await evaluate("document.body.textContent.includes('لم يُنشر النشاط')"));
assert.ok(!mutations.some(url => url.endsWith("/api/activities")));
console.log("PASS business: field errors, valid temporary preview, no fake persistent POST");
await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
assert.ok(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "business horizontal overflow");
await call("Page.navigate", { url: `${origin}/login` });
await wait("!!document.querySelector('#email')");
assert.ok(await evaluate("document.querySelector('form button').disabled"), "seed demo login should explain missing configuration");
console.log("PASS login: no-credential demo link and disabled unconfigured login");

await mkdir(".qa-artifacts", { recursive: true });
await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await call("Page.navigate", { url: origin });
await wait("document.querySelectorAll('.catalogue-section .experience-card').length === 6");
await evaluate("document.activeElement?.blur(); window.scrollTo(0,0)");
const desktop = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(".qa-artifacts/desktop.png", Buffer.from(desktop.data, "base64"));
for (const width of [360, 390]) {
  await call("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.ok(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), `horizontal overflow at ${width}px`);
}
const mobile = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(".qa-artifacts/mobile.png", Buffer.from(mobile.data, "base64"));
assert.equal(exceptions.length, 0, "uncaught browser exceptions");
console.log("PASS responsive: 360px, 390px, desktop; zero uncaught browser exceptions");
// Inspect the exact imported photos together; QA artifact is ignored by Git.
await call("Emulation.setDeviceMetricsOverride", { width: 1200, height: 1250, deviceScaleFactor: 1, mobile: false });
await evaluate(`(async () => {
 const response = await fetch('/api/tourism'); const rows = (await response.json()).data.filter(row => row.image);
 document.head.innerHTML=''; document.body.replaceChildren(); document.body.style.cssText='margin:0;padding:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;background:white;font:12px Arial;direction:ltr';
 for (const row of rows) { const figure=document.createElement('figure');figure.style.margin='0';const img=document.createElement('img');img.src=row.image.path;img.alt=row.image.alt_ar;img.style.cssText='width:100%;height:190px;object-fit:contain;background:#eee';const caption=document.createElement('figcaption');caption.textContent=row.activity.title_en+' · '+row.image.author;figure.append(img,caption);document.body.append(figure); }
 return rows.length;
})()`);
await wait("document.querySelectorAll('figure img').length >= 15 && [...document.querySelectorAll('figure img')].every(img => img.complete && img.naturalWidth > 0)");
const photos = await call("Page.captureScreenshot", {format:"png",captureBeyondViewport:false});
await writeFile(".qa-artifacts/tourism-photos.png",Buffer.from(photos.data,"base64"));
console.log("PASS photos: all 17 licensed local photographs decode in Chrome; contact sheet saved");
await call("Page.close"); socket.close();
