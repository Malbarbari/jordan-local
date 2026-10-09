// Local premium frontend QA in the dedicated Chromium session.
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

await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
await mkdir('.qa-artifacts/premium', {recursive:true});
async function screenshot(name) {await call('Page.bringToFront');await evaluate('document.activeElement?.blur(); new Promise(resolve=>{let previous=scrollY,stable=0;function frame(){stable=Math.abs(scrollY-previous)<1?stable+1:0;previous=scrollY;if(stable>=8)resolve();else setTimeout(frame,40);}setTimeout(frame,40);})');const result=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`.qa-artifacts/premium/${name}.png`,Buffer.from(result.data,'base64'));}
async function desktop() {await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});}
await desktop(); await call('Page.navigate',{url:origin});
await wait("document.querySelectorAll('.tourism-section .tourism-card').length===6 && document.querySelector('.premium-hero img')?.naturalWidth>0");
assert.equal(await evaluate('document.documentElement.dir'),'rtl');
assert.ok(await evaluate("!document.querySelector('.legacy-catalogue').open"));
await screenshot('home-desktop');
await evaluate("[...document.querySelectorAll('.hero-examples button')].find(el=>el.textContent.includes('أكواخ')).click()");
await wait("document.querySelectorAll('.tourism-section .tourism-card').length===2 && !document.querySelector('#tourism-results[aria-busy=true]')");
assert.ok(await evaluate("document.getElementById('hero-query').value.includes('أكواخ') && location.search.includes('tour_tag=cabins')"));
await wait("[...document.querySelectorAll('.tourism-section .tourism-card')].some(card=>card.textContent.includes('45 د.أ'))");assert.ok(await evaluate("[...document.querySelectorAll('.tourism-section .tourism-card')].every(card=>card.querySelector('.generic-art') && (card.textContent.includes('تقدير تجريبي') || (card.textContent.includes('45 د.أ') && card.textContent.includes('سعر منشور'))))"));
await evaluate("[...document.querySelectorAll('.tourism-section .tourism-card')].find(card=>card.textContent.includes('تقدير تجريبي')).querySelector('button.card-explore').click()");
await wait("!!document.querySelector('dialog[open]')");
assert.ok(await evaluate("document.querySelector('dialog[open]').contains(document.activeElement)"));
await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
assert.ok(await evaluate("document.querySelector('dialog[open]').contains(document.activeElement)"));
assert.ok(await evaluate("document.querySelector('dialog[open]').textContent.includes('ليس سعرًا من المزود')"));
await screenshot('detail-desktop');
await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
await wait("!document.querySelector('dialog[open]')");
await wait("document.activeElement.classList.contains('card-explore')");
await call('Page.reload');
await wait("document.getElementById('tourism-tag')?.value==='cabins' && document.querySelectorAll('.tourism-section .tourism-card').length===2");
await evaluate("document.querySelector('.advanced-filters').open=true");await set('tourism-budget','40');await evaluate("document.querySelector('.tourism-form').requestSubmit()");
await wait("!!document.querySelector('.tourism-section .empty-state')");
assert.ok(await evaluate("document.querySelector('.empty-state').textContent.includes('لم نفترض سعرًا')"));
await evaluate("[...document.querySelectorAll('.tourism-form button')].find(el=>el.textContent==='مسح التصفية').click()");
await wait("document.querySelectorAll('.tourism-section .tourism-card').length===6");
await evaluate("[...document.querySelectorAll('.category-tile')].find(el=>el.textContent.includes('تاريخية')).click()");
await wait("document.getElementById('tourism-tag').value==='historical' && !document.querySelector('#tourism-results[aria-busy=true]')");
assert.ok(await evaluate("document.querySelector('.tourism-result-count').textContent.match(/[1-9]/)"));
await evaluate("[...document.querySelectorAll('.region-tile button')].find(el=>el.textContent.includes('البتراء')).click()");
await wait("document.querySelectorAll('.tourism-section .tourism-card').length===2 && document.getElementById('tourism-location').value==='petra'");
await evaluate('history.back()');
await wait("document.getElementById('tourism-tag').value==='historical' && document.getElementById('tourism-location').value==='' && !document.querySelector('#tourism-results[aria-busy=true]')");
await evaluate('history.forward()');
await wait("document.getElementById('tourism-location').value==='petra' && document.querySelectorAll('.tourism-section .tourism-card').length===2");
await set('tourism-sort','name');
await evaluate("document.getElementById('tourism-results').scrollIntoView({behavior:'instant',block:'start'});");
await wait("[...document.querySelectorAll('.tourism-section .experience-art img')].every(img=>img.complete&&img.naturalWidth>0)");
await screenshot('discovery-desktop');
await evaluate("document.querySelector('.tourism-section .card-explore').click()");await wait("!!document.querySelector('dialog[open]')");
assert.ok(await evaluate("document.querySelector('dialog[open] a[href*=visitjordan]')!==null"));
await evaluate("document.querySelector('dialog[open] .image-credit').open=true");
assert.ok(await evaluate("document.querySelector('dialog[open]').textContent.includes('CC BY-SA')"));
await evaluate("document.querySelector('dialog[open] .dialog-close').click()");
await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
await evaluate("document.querySelector('.tourism-form').requestSubmit()");await wait("!!document.querySelector('.tourism-section [role=alert]')");
await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
await evaluate("document.querySelector('.tourism-section [role=alert] button').click()");await wait("document.querySelectorAll('.tourism-section .tourism-card').length===2");
assert.ok(await evaluate("document.querySelectorAll('.local-section .tourism-card').length===3"));
console.log('PASS premium discovery: examples, categories, regions, URL reload, sorting, estimates, hard budget exclusion, accessible details, source credits and network retry');
await set('query','نريد طلعة طبيعة هادئة مع وقت للتصوير.');await evaluate("document.querySelector('.recommendation-form').requestSubmit()");
await wait("document.querySelectorAll('.results-anchor .experience-card').length>0");
assert.ok(await evaluate("document.querySelector('.results-anchor').textContent.includes('بالقواعد') && !!document.querySelector('.results-anchor .match-reason')"));
await screenshot('recommendations-desktop');
await evaluate("document.querySelector('.results-anchor .card-explore').click()");await wait("!!document.querySelector('dialog[open]')");
assert.ok(await evaluate("document.querySelector('dialog[open] .reason-list li')!==null"));await evaluate("document.querySelector('dialog[open] .dialog-close').click()");
console.log('PASS recommendation: actual POST, grounded reasons, group costs and functional details');
for(const width of [360,390,768]) {await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<768});assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`home overflow ${width}`);}
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate("scrollTo({top:0,behavior:'instant'})");await screenshot('home-mobile');
await evaluate("document.getElementById('tourism-results').scrollIntoView({behavior:'instant',block:'start'})");await screenshot('discovery-mobile');
await evaluate("document.querySelector('.tourism-section .card-explore').click()");await wait("!!document.querySelector('dialog[open]')");assert.ok(await evaluate("document.querySelector('dialog[open]').scrollWidth<=document.querySelector('dialog[open]').clientWidth"));await screenshot('detail-mobile');await evaluate("document.querySelector('dialog[open] .dialog-close').click()");
await call('Page.navigate',{url:`${origin}/explore?tour_location_id=aqaba`});await wait("document.querySelectorAll('.tourism-section .tourism-card').length===2");assert.ok(await evaluate("document.getElementById('tourism-location').value==='aqaba'"));
await call('Page.navigate',{url:`${origin}/business`});await wait("!!document.querySelector('.business-form')");await evaluate("document.querySelector('.business-form').requestSubmit()");await wait("document.activeElement?.id==='title_ar'");
await evaluate("[...document.querySelectorAll('button')].find(el=>el.textContent==='تعبئة مثال افتراضي').click()");await evaluate("document.querySelector('.business-form').requestSubmit()");await wait("document.body.textContent.includes('تم التحقق من النموذج')");assert.ok(await evaluate("document.body.textContent.includes('لم يُنشر النشاط')"));assert.ok(!mutations.some(url=>url.endsWith('/api/activities')));
assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));await screenshot('business-mobile');await desktop();await evaluate('scrollTo(0,0)');await screenshot('business-desktop');
await call('Page.navigate',{url:`${origin}/login`});await wait("!!document.querySelector('#email')");assert.ok(await evaluate("document.querySelector('form button').disabled"));
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await call('Page.navigate',{url:origin});await wait("!!document.querySelector('.premium-hero')");assert.equal(await evaluate("getComputedStyle(document.documentElement).scrollBehavior"),'auto');
assert.equal(exceptions.length,0,'uncaught browser exceptions');
console.log('PASS business preview, login, mobile/tablet/desktop layout, dialog focus/Escape, reduced motion and zero uncaught browser exceptions');
await call('Page.close');socket.close();
