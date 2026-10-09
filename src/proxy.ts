import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request:NextRequest) {
  let response=NextResponse.next({request});
  response.headers.set("Cache-Control","no-store");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key||process.env.DATA_MODE!=="supabase")return response;
  const client=createServerClient(url,key,{cookies:{getAll(){return request.cookies.getAll();},setAll(values){
    values.forEach(({name,value})=>request.cookies.set(name,value));
    response=NextResponse.next({request});
    values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    response.headers.set("Cache-Control","no-store");
  }}});
  try{await client.auth.getClaims();}catch{/* Authenticated routes verify identity separately and fail closed. */}
  return response;
}
export const config={matcher:["/api/:path*","/login","/business"]};
