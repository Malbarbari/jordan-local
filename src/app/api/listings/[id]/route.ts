import { z } from "zod";
import { loadTourism } from "@/lib/data/tourism";
import { loadDetails } from "@/lib/data/details";
import { emptyDetails } from "@/contracts/listing-details";
import { failure,HttpError,json } from "@/lib/http";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const parsed=z.uuid().safeParse((await params).id);if(!parsed.success)throw new HttpError(404,"NOT_FOUND","المكان غير موجود.");const rows=await loadTourism(),row=rows.find(r=>r.activity.id===parsed.data);if(!row)throw new HttpError(404,"NOT_FOUND","القائمة غير متاحة.");const details=await loadDetails();const related=rows.filter(r=>r.activity.id!==row.activity.id&&r.activity.location_id===row.activity.location_id).slice(0,3);return json({data:{listing:row,details:details[row.activity.id]??emptyDetails,related}});}catch(e){return failure(e);}}
