import Explorer from "@/components/visitor/explorer";
import TourismExplorer from "@/components/visitor/tourism-explorer";
export default function ExplorePage() { return <><div className="page-intro explore-intro"><span className="eyebrow">اكتشف / Jordan Local</span><h1>طلعتك الجاية، أقرب مما تتخيّل.</h1><p>اختَر المكان والمزاج، وخلّي باقي الحكاية للاكتشاف.</p><div className="sample-row"><a href="#tourism" className="text-link">استكشف الوجهات ↙</a><a href="#discover" className="text-link">خطّط بحسب الميزانية ↙</a></div></div><TourismExplorer /><Explorer /></>; }
