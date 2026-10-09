import { loadDetails } from "@/lib/data/details";
import { failure,json } from "@/lib/http";
export async function GET(){try{return json({data:await loadDetails()});}catch(e){return failure(e);}}
