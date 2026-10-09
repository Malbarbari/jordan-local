// Reviewed source-backed introductions, not live quotes or availability.
// Regenerates only the additive real dataset and its optional SQL seed.
import { readFileSync, writeFileSync } from "node:fs";
const images = JSON.parse(readFileSync("data/tourism.images.json","utf8"));
const stamp = "2026-10-09T00:00:00Z";
const base = JSON.parse(readFileSync("data/activities.seed.json","utf8"))[0];
const jtb = page => `https://international.visitjordan.com/wheretogo/${page}/`;
const provider = (n,name,website,source_url,location_id) => ({ id:`50000000-0000-4000-8000-${String(n).padStart(12,"0")}`, name, website, source_url, location_id });
const rscn = provider(1,"Royal Society for the Conservation of Nature / Wild Jordan", "https://www.rscn.org.jo/", "https://www.rscn.org.jo/uploaded_files/reservation/63e4ed7188aab1675947377.pdf", "amman");
const ecopark = provider(2,"Jordan EcoPark", "https://jordanecopark.com/?lang=2", "https://jordanecopark.com/?lang=2", "irbid");
const ecohotels = provider(3,"EcoHotels / Feynan Ecolodge", "https://ecohotels.me/", "https://ecohotels.me/", "dana");
const summaga = provider(4,"Al Kifah Society / Summaga Café", null, jtb("ajloun"), "ajloun");
const carob = provider(5,"Carob Farms", null, jtb("madaba"), "madaba");
// slug, Arabic/English name, region, type, category, rich tags, short original
// Arabic/English summaries, source, photograph key, provider, specific locality.
const definitions = [
 ["petra","البتراء","Petra","petra","destination","heritage",["historical","scenic","cultural"],"مدينة أثرية منحوتة في الصخر قرب وادي موسى.","Rock-cut archaeological destination near Wadi Musa.",jtb("petra"),"petra"],
 ["umm-qais","أم قيس / جدارا","Umm Qais / Gadara","umm-qais","destination","heritage",["historical","scenic","cultural"],"آثار جدارا مع إطلالات على وادي الأردن.","Gadara's ruins overlooking the Jordan Valley.",jtb("umm-qais"),"umm-qais"],
 ["ajloun-castle","قلعة عجلون","Ajloun Castle","ajloun","destination","heritage",["historical","scenic"],"قلعة تاريخية فوق تلال عجلون الخضراء.","Historic castle above Ajloun's green hills.",jtb("ajloun"),"ajloun-castle"],
 ["jerash","مدينة جرش الأثرية","Jerash Archaeological City","jerash","destination","heritage",["historical","cultural"],"وجهة أثرية تضم شوارع وأعمدة ومعالم رومانية.","Archaeological destination with Roman streets, columns and monuments.",jtb("jerash"),"jerash"],
 ["wadi-rum","وادي رم","Wadi Rum","wadi-rum","destination","nature",["nature","scenic","adventure"],"مناظر صحراوية وجبال صخرية في جنوب الأردن.","Desert landscapes and rocky mountains in southern Jordan.",jtb("wadi-rum"),"wadi-rum"],
 ["dead-sea","البحر الميت — الجانب الأردني","Dead Sea — Jordanian Shore","dead-sea","destination","nature",["nature","wellness","scenic"],"وجهة للاستمتاع بمناظر البحر الميت وتجربة الطفو.","Jordanian destination for Dead Sea views and floating.",jtb("the-dead-sea"),"dead-sea"],
 ["dana-reserve","محمية ضانا للمحيط الحيوي","Dana Biosphere Reserve","dana","destination","nature",["nature","hiking","scenic"],"محمية طبيعية تجمع الجبال والوديان ومسارات المشي.","Nature reserve with mountains, valleys and hiking routes.",jtb("dana-feynan"),"dana"],
 ["ajloun-forest","محمية غابات عجلون","Ajloun Forest Reserve","ajloun","destination","nature",["nature","hiking","scenic"],"غابات وتلال طبيعية في مرتفعات عجلون.","Woodland and rolling hills in the Ajloun Highlands.",jtb("ajloun"),"ajloun-forest"],
 ["pella","طبقة فحل / بيلا","Tabaqat Fahl / Pella","pella","destination","heritage",["historical","cultural"],"موقع أثري في شمال الأردن من عصور متعددة.","Northern Jordan archaeological site spanning multiple historical periods.",jtb("pella"),"pella"],
 ["saraya","متحف دار السرايا — إربد","Dar As-Saraya Museum — Irbid","irbid","visitable_place","heritage",["historical","cultural"],"متحف آثار في مبنى تاريخي على تل إربد.","Archaeological museum in a historic building at Tall Irbid.","https://museums.visitjordan.com/en/Museum/14",null],
 ["cable-car","تلفريك عجلون","Ajloun Cable Car","ajloun","activity","adventure",["scenic","adventure"],"تجربة تلفريك مع إطلالات على جبال عجلون.","Cable-car experience overlooking the mountains of Ajloun.","https://hcd.gov.jo/EBV4.0/Root_Storage/EN/Tourism_Booklet_2.pdf","cable-car"],
 ["roe-deer","مسار الأيل — محمية عجلون","Roe Deer Trail — Ajloun Reserve","ajloun","activity","adventure",["nature","hiking","scenic"],"مسار دائري يبدأ من منطقة التخييم بالمحمية.","Circular reserve trail starting at the campsite.",jtb("ajloun"),null],
 ["ajloun-cabins","أكواخ محمية عجلون","Ajloun Forest Reserve Cabins","ajloun","accommodation","nature",["cabins","nature","wellness"],"إقامة في أكواخ المحمية؛ يلزم تأكيد السعر والتوافر.","Reserve cabin accommodation; confirm current prices and availability.",rscn.source_url,null,rscn],
 ["ecopark","أكواخ جوردان إيكوبارك","Jordan EcoPark Cabins","jordan-valley","accommodation","nature",["cabins","nature","scenic"],"إقامة وأماكن للاستكشاف في متنزه بيئي بالأغوار الشمالية.","Cabins and nature exploration at a northern Jordan Valley ecopark.",jtb("irbid"),null,ecopark],
 ["summaga","سماقة — نكهات من مزارع عجلون","Summaga Café — Ajloun Farm Flavours","ajloun","visitable_place","food",["food","cultural"],"مقهى تديره جمعية الكفاح بمكونات من مزارع المنطقة.","Al Kifah Society café using ingredients from local farms.",jtb("ajloun"),null,summaga],
 ["mujib","محمية الموجب","Mujib Biosphere Reserve","wadi-mujib","destination","nature",["nature","adventure","scenic"],"محمية طبيعية بوادي الموجب قرب البحر الميت.","Nature reserve in Wadi Mujib near the Dead Sea.",jtb("wadi-mujib"),"wadi-mujib"],
 ["siq-trail","مسار السيق — وادي الموجب","Siq Trail — Wadi Mujib","wadi-mujib","activity","adventure",["hiking","swimming","adventure"],"مسار مائي بالمحمية؛ تحقق من شروط الدخول والتشغيل.","Reserve water trail; check access requirements and operation.",jtb("wadi-mujib"),null],
 ["main","حمامات ماعين","Ma'in Hot Springs","main","visitable_place","nature",["wellness","nature","swimming"],"ينابيع وشلالات مياه حارة في منطقة ماعين.","Hot springs and waterfalls in the Ma'in area.",jtb("madaba"),"main"],
 ["salt","السلط — المدينة التاريخية","As-Salt — Historic City","as-salt","destination","heritage",["historical","cultural","local_tours"],"شوارع ومبانٍ تراثية لاستكشاف تاريخ السلط.","Historic streets and buildings for discovering As-Salt.",jtb("as-salt"),"salt"],
 ["st-george","كنيسة القديس جورج وخريطة مادبا","St. George Church and Madaba Map","madaba","visitable_place","heritage",["historical","cultural"],"كنيسة في مادبا تضم خريطة فسيفسائية تاريخية.","Madaba church housing a historic mosaic map.",jtb("madaba"),"madaba-map"],
 ["madaba-park","متنزه مادبا الأثري والقصر المحترق","Madaba Archaeological Park and Burnt Palace","madaba","visitable_place","heritage",["historical","cultural"],"معالم أثرية وفسيفساء وبقايا طريق روماني في مادبا.","Archaeology, mosaics and Roman-road remains in Madaba.",jtb("madaba"),null],
 ["nebo","جبل نيبو","Mount Nebo","mount-nebo","destination","heritage",["scenic","historical","cultural"],"وجهة تاريخية بإطلالات على وادي الأردن.","Historic destination with views across the Jordan Valley.",jtb("madaba"),"mount-nebo"],
 ["citadel","جبل القلعة — عمّان","Amman Citadel","amman","destination","heritage",["historical","scenic","cultural"],"موقع أثري على مرتفع يطل على عمّان.","Hilltop archaeological site overlooking Amman.",jtb("amman"),"amman-citadel"],
 ["theatre","المدرج الروماني — عمّان","Roman Theatre — Amman","amman","visitable_place","heritage",["historical","cultural"],"مدرج أثري في وسط العاصمة عمّان.","Ancient theatre in downtown Amman.",jtb("amman"),"roman-theatre"],
 ["iraq-amir","عراق الأمير","Iraq Al-Amir","amman","destination","heritage",["historical","scenic","cultural"],"وجهة أثرية في منطقة عراق الأمير قرب عمّان.","Archaeological destination in the Iraq Al-Amir area near Amman.",jtb("amman"),null],
 ["carob","مزارع الخروب — مزارع ليوم","Carob Farms — Farmer for a Day","madaba","business_offer","nature",["farms","nature","cultural"],"تجربة زراعة عملية للتعرف على الزراعة المستدامة.","Hands-on farming experience introducing sustainable agriculture.",jtb("madaba"),null,carob],
 ["little-petra","البتراء الصغيرة","Little Petra","petra","destination","heritage",["historical","cultural","scenic"],"موقع أثري منفصل لاستكشاف المنحوتات قرب البتراء.","Separate archaeological destination with rock carvings near Petra.",jtb("petra"),"little-petra"],
 ["aqaba-water","الغوص والسنوركل — العقبة","Diving and Snorkelling — Aqaba","aqaba","activity","adventure",["sea","swimming","adventure"],"تجارب بحرية في البحر الأحمر؛ اختر مزودًا مؤهلًا.","Red Sea experiences; select a qualified local provider.",jtb("aqaba"),"aqaba"],
 ["aqaba-castle","قلعة العقبة","Aqaba Castle","aqaba","destination","heritage",["historical","cultural"],"قلعة تاريخية قرب ساحل البحر الأحمر بالعقبة.","Historic castle near Aqaba's Red Sea coast.",jtb("aqaba"),"aqaba-castle"],
 ["dana-village","قرية ضانا","Dana Village","dana","destination","heritage",["scenic","cultural","historical"],"قرية تراثية على حافة وادي ضانا.","Heritage village on the edge of Wadi Dana.",jtb("dana-feynan"),"dana-village"],
 ["rummana","مخيم الرمانة","Rummana Campsite","dana","accommodation","nature",["camps","nature","hiking"],"تخييم في منطقة ضانا عبر الجمعية الملكية لحماية الطبيعة.","Camping in Dana through the Royal Society for Conservation of Nature.","https://www.rscn.org.jo/activities-view/1",null,rscn],
 ["feynan","نزل فينان البيئي","Feynan Ecolodge","dana","accommodation","nature",["nature","wellness","local_tours"],"نزل بيئي تديره إيكوهوتيلز في منطقة فينان.","EcoHotels-operated ecolodge in the Feynan area.","https://ecohotels.me/",null,ecohotels],
];
// Exact site pins linked by JTB; never infer a site from photograph GPS or map viewport centre.
const pins = {
 "umm-qais": [32.6556875,35.6780625,"https://www.google.com/maps/place/MM4H%2B76/@32.6556875,35.6758738,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d32.6556875!4d35.6780625"],
 "ajloun-castle": [32.3253125,35.7274375,"https://www.google.com/maps/place/8PGG%2B4X/@32.3253125,35.7252488,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d32.3253125!4d35.7274375"],
 "ajloun-forest": [32.3835625,35.7604375,"https://www.google.com/maps/place/9QM6%2BC5/@32.3835625,35.7582488,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d32.3835625!4d35.7604375"],
 "main": [31.6094375,35.6104375,"https://www.google.com/maps/place/JJ56%2BQ5/@31.6094375,35.6082488,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d31.6094375!4d35.6104375"],
 "nebo": [31.7683125,35.7253125,"https://www.google.com/maps/place/QP9G%2B84/@31.7683125,35.7231238,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d31.7683125!4d35.7253125"],
 "madaba-park": [31.7160625,35.7954375,"https://www.google.com/maps/place/PQ8W%2BC5/@31.7160625,35.7932488,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d31.7160625!4d35.7954375"],
};
const rows = definitions.map((d,i) => {
 const [slug,title_ar,title_en,location_id,kind,category,discovery_tags,description_ar,description_en,source_url,imageKey,owner] = d;
 const image = images[imageKey] ?? null;
 const a = { ...base, id:`60000000-0000-4000-8000-${String(i+1).padStart(12,"0")}`, business_id:owner?.id ?? null, record_kind:owner ? "offer" : "place", title_ar,title_en,description_ar,description_en,location_id,category,tags:[category],environment:[],group_types:[],family_friendly:null,price_fils:null,price_unit:"unknown",price_status:"unknown",price_checked_at:null,price_valid_until:null,price_notes:"السعر غير متحقق. قد تختلف الرسوم حسب الدخول أو الخدمة أو الإقامة؛ تحقق من المصدر. لا يوجد تأكيد للتوافر أو ملاءمة المجموعة.",duration_minutes:null,capacity_people:null,available_months:null,image_path:image?.path ?? null,source_url,location_source_url:source_url,data_kind:"public_source",verification_status:"source_checked",source_checked_at:stamp,status:"published",created_at:stamp,updated_at:stamp };
 const pin = pins[slug];
 return { activity:a, metadata:{ listing_kind:kind, discovery_tags, estimated_price_fils:null,estimated_price_unit:null }, provider:owner ? { id:owner.id,name:owner.name,website:owner.website,source_url:owner.source_url,verification_status:"source_checked" } : null, image, coordinates:pin ? { latitude:pin[0],longitude:pin[1],source_url:pin[2] } : null, currency:"JOD",location_label_ar:title_ar,location_label_en:title_en };
});
writeFileSync("data/tourism.real.json",JSON.stringify(rows,null,2)+"\n");
const providers=[rscn,ecopark,ecohotels,summaga,carob].map(p=>({id:p.id,name:p.name,location_id:p.location_id,contact_url:p.website,is_demo:false,verification_status:"unverified"}));
const sql=`-- Reviewed public introductions; no verified quotes or booking availability.\n-- Run manually after migration 003. Provider owners are intentionally unassigned.\nbegin;\ninsert into public.businesses(id,name,location_id,contact_url,is_demo,verification_status)\nselect id,name,location_id,contact_url,is_demo,verification_status from jsonb_to_recordset($providers$${JSON.stringify(providers)}$providers$::jsonb) as p(id uuid,name text,location_id text,contact_url text,is_demo boolean,verification_status text) on conflict(id) do nothing;\ninsert into public.tourism_listings(id,business_id,status,payload)\nselect (x->'activity'->>'id')::uuid,(x->'activity'->>'business_id')::uuid,'published',x from jsonb_array_elements($tourism$${JSON.stringify(rows)}$tourism$::jsonb) x on conflict(id) do nothing;\ncommit;\n`;
writeFileSync("supabase/seed_tourism.sql",sql);
console.log(`Prepared ${rows.length} real source-backed introductions, ${rows.filter(r=>r.image).length} licensed photos, ${rows.filter(r=>r.coordinates).length} source-linked site pins. All prices unknown.`);
