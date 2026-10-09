import ProviderPage from "@/components/business/provider-page";
export default async function Page({params}:{params:Promise<{id:string}>}){return <ProviderPage id={(await params).id}/>;}
