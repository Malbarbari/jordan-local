// Local UI verification. No real Auth, DB writes or paid AI requests.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.SMOKE_ORIGIN||'http://localhost:3100';
const debug=process.env.CHROME_DEBUG_ORIGIN||'http://127.0.0.1:9225';
const target=await fetch(`${debug}/json/new?${encodeURIComponent(origin)}`,{method:'PUT'}).then(r=>r.json());
const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
let next=0;const requests=new Map(),exceptions=[];
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params);if(m.id&&requests.has(m.id)){const {resolve,reject,timer}=requests.get(m.id);clearTimeout(timer);requests.delete(m.id);if(m.error)reject(new Error(m.error.message));else resolve(m.result);}});
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>reject(new Error(`CDP timeout ${method}`)),20000);requests.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});}
async function ev(expression){const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value;}
async function wait(expression){const end=Date.now()+25000;while(Date.now()<end){if(await ev(`Boolean(${expression})`))return;await new Promise(r=>setTimeout(r,120));}throw new Error(`UI timeout ${expression}`);}
async function set(id,value){await ev(`(()=>{const el=document.getElementById(${JSON.stringify(id)});if(!el)throw new Error('Missing field ${id}');const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);}
async function nav(path){await call('Page.navigate',{url:origin+path});await wait('document.readyState==="complete"');}
async function shot(name){await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>writeFile(`.qa-artifacts/final/${name}.png`,Buffer.from(r.data,'base64')));}
await call('Page.enable');await call('Runtime.enable');await call('Network.enable');await mkdir('.qa-artifacts/final',{recursive:true});await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});


await nav('/explore');await wait("document.querySelector('.legacy-catalogue .activity-card') && document.getElementById('query') && [...document.querySelectorAll('button')].some(b=>b.textContent.includes('حلّل وصفي'))");
await set('query','بدي طشّة طبيعة قريبة من عمّان بميزانية ٢٠ دينار');
await wait("[...document.querySelectorAll('button')].some(b=>b.textContent.includes('حلّل وصفي') && !b.disabled)");
await ev("document.querySelector('.recommendation-form').requestSubmit()");
await wait("document.querySelector('.results-anchor .activity-card')");
assert.ok(await ev("document.querySelector('.results-anchor').textContent.includes('اقتراحات بالقواعد')"));
await shot('backend-natural-request');
for(const path of ['/account/preferences','/business/settings']){await nav(path);await wait("document.body.textContent.includes('الحفظ مرتبط بحساب Supabase حقيقي')");assert.ok(await ev("!document.querySelector('form button[type=submit]')"));await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth'),path);}
await nav('/businesses/70000000-0000-4000-8000-000000000001');await wait("document.body.textContent.includes('لا توجد بيانات ترخيص مصرح بها')");assert.ok(await ev("!document.body.textContent.includes('PRIVATE-123')"));
assert.equal(exceptions.length,0,JSON.stringify(exceptions));
console.log('Backend demo UI passed: final Arabic nature request → rules results; honest account/licensing gates; public unknown-license status; mobile layouts; zero runtime exceptions.');
socket.close();await fetch(debug+'/json/close/'+target.id);
