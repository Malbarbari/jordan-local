import fs from 'node:fs';
const id=n=>`60000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const path='data/listing-details.json';
if(process.argv.includes('--create')){
 const rows=JSON.parse(fs.readFileSync('data/tourism.real.json','utf8'));
 const data=Object.fromEntries(rows.map(r=>[r.activity.id,{highlights:[],practical:[],quotes:[],gallery:[],image_url:null,image_rights_confirmed:false}]));
 const quote=(key,label,amount,unit,audience,conditions,source,status='source_checked')=>({id:key,label_ar:label,currency:'JOD',amount_fils:amount*1000,unit,status,audience,conditions,source_url:source,checked_at:source?'2026-10-10T00:00:00+03:00':null,optional:false});
 data[id(1)].highlights=['الخزنة والواجهات المنحوتة في الصخر','تراث نبطي ومسارات مشي داخل الموقع'];
 data[id(1)].practical=['احمل الماء وارتدِ حذاءً مناسبًا للمشي.','السكن في وادي موسى، وليس داخل متنزه البترا.','التذكرة النهارية لا تشمل البترا ليلًا.'];
 const source='https://www.visitpetra.jo/en/Petrafees';
 data[id(1)].quotes=[
 quote('jordanian','دخول الأردنيين',1,'per_ticket','jordanian',['إثبات الهوية مطلوب؛ رسوم الدخول فقط.'],source),
 quote('resident','دخول المقيمين',10,'per_ticket','resident',['بطاقة إقامة سارية مضى على إصدارها سنة على الأقل.'],source),
 quote('arab','دخول الزوار العرب',30,'per_ticket','arab',['حسب فئة الزائر وإثبات الهوية لدى شباك التذاكر.'],source),
 quote('overnight','زائر دولي مع إقامة · يوم واحد',50,'per_ticket','international_overnight',['الإقامة ليلة واحدة على الأقل في الأردن؛ أحضر جواز السفر.'],source),
 quote('day','زائر دولي دون إقامة',90,'per_ticket','international_day',['للزائر غير المقيم لليلة في الأردن.'],source),
 quote('child','طفل دون 12 سنة',0,'per_ticket','child_under_12',['تذكرة الدخول النهارية فقط؛ اختر عدد الأطفال لهذه الحسبة.'],source),
 {...quote('transfer','نقل 4×4 · القرية الثقافية إلى مسار الدير',5,'per_person','everyone',['رحلة باتجاه واحد فقط؛ تحقق من التشغيل مع الموقع.'],source),optional:true}];
 const ticketSource='https://www.ticket.gov.jo/ar/prices';
 // The government portal explicitly distinguishes citizens and non-citizens.
 for(const [n,jordanian,foreign] of [[2,.25,5],[3,.25,3],[4,.5,10],[9,.25,2],[10,.25,2],[21,.25,3],[23,.25,3],[24,.25,2],[25,.25,1]])data[id(n)].quotes=[quote('jordanian','دخول الأردنيين',jordanian,'per_ticket','jordanian',['رسوم الدخول حسب فئة الزائر. لا تشمل النقل أو الطعام.'],ticketSource),quote('foreign','دخول غير الأردنيين',foreign,'per_ticket','non_jordanian',['راجع أهلية التخفيضات وإثبات الهوية قبل الشراء.'],ticketSource)];
 data[id(2)].highlights=['المسرح الأثري والواجهات البازلتية','موقع جدارا التاريخي في شمال الأردن'];
 const mujib='https://www.rscn.org.jo/uploaded_files/reservation/Mujib%2520Biosphere%2520Reserve%2520Trails%25202026.pdf';
 data[id(17)].quotes=[quote('jordanian','مسار السيق · أردني',17,'per_person','jordanian',['شامل الضريبة. مسار ذاتي الإرشاد؛ تأكد من التشغيل والطقس قبل الزيارة.'],mujib),quote('resident','مسار السيق · مقيم',21,'per_person','resident',['شامل الضريبة. راجع إثبات الإقامة المطلوب مع المحمية.'],mujib),quote('foreign','مسار السيق · غير أردني',23,'per_person','non_jordanian',['شامل الضريبة. السعر لهذا المسار، وليس دخول جميع مسارات المحمية.'],mujib)];
 data[id(17)].highlights=['مسار مائي بين جدران الوادي','المدة المنشورة للمسار 2–3 ساعات'];
 data[id(17)].practical=['تأكد من فتح المسار وملاءمة الطقس مع المحمية قبل الانطلاق.','مسار مائي؛ راجع متطلبات العمر واللياقة ومعدات السلامة مباشرة مع المشغّل.'];
 data[id(14)].quotes=[quote('double','كوخ مزدوج قياسي',45,'unspecified','everyone',['يشمل ضريبة 16%.','الفترة الزمنية غير محددة في المصدر؛ تأكد من المزود قبل حساب الليالي.'],'https://jordanecopark.com/accommodation')];
 data[id(14)].highlights=['أكواخ في متنزه بيئي بالأغوار الشمالية','خيارات إقامة مزدوجة وثلاثية وعائلية وفق وصف المزود'];
 const demos=[ [13,85,'per_night','كوخ · مثال إقامة تجريبي'],[15,12,'per_person','وجبة · مثال تجريبي'],[26,25,'per_person','تجربة مزرعة · مثال تجريبي'],[31,35,'per_person','تخييم · مثال تجريبي'],[32,140,'per_night','غرفة · مثال إقامة تجريبي'] ];
 for(const [n,amount,unit,label] of demos)data[id(n)].quotes=[quote('demo',label,amount,unit,'everyone',['تقدير افتراضي للتخطيط، وليس عرض سعر من المزود.','لا يشمل النقل أو الإضافات، ولا يضمن سعة الغرفة أو التوافر.'],null,'demo_estimate')];
 const images=JSON.parse(fs.readFileSync('data/tourism.images.json','utf8'));
 if(images['wadi-rum-camels'])data[id(5)].gallery=[images['wadi-rum-camels']];
 fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');
}
const data=JSON.parse(fs.readFileSync(path,'utf8'));
// Never publish demo estimates into production data.
const sql=Object.entries(data).map(([key,payload])=>{const live={...payload,quotes:payload.quotes.filter(q=>q.status!=='demo_estimate')};return `insert into public.listing_details(listing_id,payload) values ('${key}', '${JSON.stringify(live).replaceAll("'","''")}'::jsonb) on conflict(listing_id) do update set payload=excluded.payload;`;});
fs.writeFileSync('supabase/seed_details.sql','-- Curated source-backed presentation details. Apply after seed_tourism.sql and migration 004.\nbegin;\n'+sql.join('\n')+'\ncommit;\n');
