import type { Quote } from "@/contracts/listing-details";
export function declaredCost(activity:{price_fils:number|null;price_unit:string},people:number):number|null{
 if(!Number.isInteger(people)||people<1||people>30||activity.price_fils===null||activity.price_unit==="unknown")return null;
 return activity.price_fils*(activity.price_unit==="per_person"?people:1);
}
export function quoteCost(quote:Quote,people:number,nights:number,rooms:number):number|null {
 if(![people,nights,rooms].every(v=>Number.isInteger(v)&&v>=1&&v<=30) || quote.unit==="unspecified") return null;
 const value=quote.amount_fils*(quote.unit==="per_night"?nights*rooms:quote.unit==="per_person"||quote.unit==="per_ticket"?people:1);
 return Number.isSafeInteger(value)?value:null;
}
export function costSummary(quotes:Quote[],people:number,nights:number,rooms:number){
 const items=quotes.map(q=>({quote:q,total:quoteCost(q,people,nights,rooms)}));
 return {items,total_fils:items.length && items.every(i=>i.total!==null)?items.reduce((s,i)=>s+i.total!,0):null,estimated:quotes.some(q=>q.status==="demo_estimate"),unconfirmed:items.some(i=>i.total===null)};
}
