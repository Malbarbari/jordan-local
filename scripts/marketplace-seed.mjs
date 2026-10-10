// Deterministic, non-destructive SQL generation. Does not connect to a database.
import fs from "node:fs";
const {providers,listings,details}=JSON.parse(fs.readFileSync("data/marketplace.json","utf8"));
const v1cities=new Set(["amman","irbid","ajloun","jerash","umm-qais","as-salt","madaba","dana","wadi-rum"]);
function sql(value){
  if(value===null)return "null";
  if(typeof value==="boolean"||typeof value==="number")return String(value);
  if(Array.isArray(value))return value.length?`array[${value.map(sql).join(",")}]`:("'{}'");
  return `'${String(value).replaceAll("'","''")}'`;
}
function insert(table,record,conflict){return `insert into public.${table}(${Object.keys(record).join(",")}) values (${Object.values(record).map(sql).join(",")}) on conflict(${conflict}) do nothing;`;}
for(const demo of [false,true]){
 const selected=providers.filter(p=>p.is_demo===demo),ids=new Set(selected.map(p=>p.id));
 const lines=selected.map(p=>insert("businesses",{id:p.id,owner_id:null,name:p.name,description:p.description,location_id:p.location_id,contact_url:p.website,is_demo:p.is_demo,verification_status:"unverified"},"id"));
 for(const row of listings.filter(r=>ids.has(r.activity.business_id))){
   const a=row.activity;
   if(v1cities.has(a.location_id)){
     lines.push(insert("activities",a,"id"));
     lines.push(insert("catalog_metadata",{activity_id:a.id,...row.metadata},"activity_id"));
   }
   lines.push(insert("tourism_listings",{id:a.id,business_id:a.business_id,status:"published",payload:JSON.stringify(row)},"id"));
   lines.push(insert("listing_details",{listing_id:a.id,payload:JSON.stringify(details[a.id])},"listing_id"));
 }
 fs.writeFileSync(demo?"supabase/seed_marketplace_demo.sql":"supabase/seed_marketplace.sql",
   `-- ${demo?"OPTIONAL FICTIONAL DEMO ONLY. Do not apply to production.":"Independent unclaimed directory and sourced offers."}\n-- Apply after migrations 001–005 and existing real seeds. No owner identities or overwrite.\nbegin;\n${lines.join("\n")}\ncommit;\n`);
}
