import ListingPage from "@/components/visitor/listing-page";
export default async function Page({params}:{params:Promise<{id:string}>}){const id=(await params).id;return <ListingPage key={id} id={id}/>;}
