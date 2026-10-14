/* trakks demo mode: sample ads, points and account performance, so the app can be previewed without a token.
   Everything is generated in the browser. No request leaves the page while demo mode is on. */
(function(){
if(typeof DEMO==='undefined'||!DEMO)return;

const DAY=864e5,today=()=>new Date(new Date().toISOString().slice(0,10)+'T00:00:00Z');
const iso=d=>d.toISOString().slice(0,10),ago=n=>iso(new Date(today().getTime()-n*DAY));
const R2=x=>Math.round(x*100)/100,R3=x=>Math.round(x*1000)/1000,R4=x=>Math.round(x*10000)/10000;
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function rng(seed){let s=(seed>>>0)||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);return h>>>0}
const pick=(r,a)=>a[Math.floor(r()*a.length)];

/* ---------- brands ---------- */
/* aov = average order value, cpm = base CPM, spend = daily account spend, meta/tt = [ad name, format] */
const B={
  fsph:{aov:42,cpm:7.5,spend:900,short:'FSPH',
    meta:[['Mother’s Day Rose Bouquet','Video'],['Same-Day Delivery Promise','Image'],['Sunflower Surprise UGC','Video'],['Birthday Blooms Carousel','Image'],['Customer Reviews Montage','Video'],['Anniversary Peony Box','Image'],['Cart Reminder Offer','Image'],['Free Delivery Retarget','Video']]},
  poph:{aov:38,cpm:6.8,spend:700,short:'POPH',
    meta:[['Apple of My Eye Gift Set','Image'],['Personalized Mug UGC','Video'],['Gift Box Unboxing','Video'],['Teacher’s Day Bundle','Image'],['Best Sellers Roundup','Image'],['Founder Story Reel','Video'],['Abandoned Cart 10% Off','Image'],['Past Buyers Upsell','Image']]},
  posg:{aov:46,cpm:11,spend:600,short:'POSG',
    meta:[['Gifts Under $50 Hook','Video'],['Same-Day SG Delivery','Image'],['Anniversary Gift Idea','Video'],['Personalised Photo Frame','Image'],['Reviews Wall','Image'],['Behind The Packing Desk','Video'],['Cart Abandoner Nudge','Image'],['Repeat Buyer Thank You','Image']],
    tt:[['Unboxing Trend Sound','Video'],['Gift Reveal POV','Video'],['Creator Review Stitch','Video'],['Limited Drop Countdown','Video']]},
  bull:{aov:120,cpm:9,spend:1200,short:'BA',
    meta:[['Bass Test Demo','Video'],['Studio Monitor Launch','Image'],['Unboxing Walkthrough','Video'],['Producer Testimonial','Video'],['Headphones vs Competitors','Image'],['Bundle Deal Banner','Image'],['Cart Reminder 5% Off','Image'],['Warranty Reassurance','Image']]}
};
/* cir = cost-to-value target for that funnel step, daily = ad-level daily spend, ctr = base CTR, fr = starting frequency, cpmx = CPM multiplier */
const FN={
  TOF:{cir:.46,daily:70,ctr:.009,fr:1.2,cpmx:1,aud:['Broad 25-45','Lookalike 1% purchasers','Interest: gifting']},
  MOF:{cir:.33,daily:45,ctr:.012,fr:1.5,cpmx:1.2,aud:['Engaged 30d','Video viewers 50%','Site visitors 14d']},
  BOF:{cir:.06,daily:12,ctr:.02,fr:2.4,cpmx:2,aud:['Cart abandoners 14d','Past purchasers 180d']}
};
const HYP=['Leading with the delivery promise will lower CPO for gift buyers.','A creator voiceover will hold attention past 6 seconds better than music only.','Showing the price early will filter clicks and lift the landing page view rate.','Putting two products in the first frame will raise order value.','A softer offer will keep CIR under target.'];
const NOTE={'Really Good':'Winning. CIR has stayed under target, scale about 20% every 3 days.','Good':'Solid. Keep running and watch frequency.','Okay':'Mixed results. Needs a stronger first 2 seconds.','Below Average':'CPO is up week over week and frequency is passing 2. Prepare a refresh.',"Can't Say Yet":'Too early to judge. Let it gather more spend.','Not Good':'CPO is well above target. Replace with a new angle.'};
const ACTION={'Really Good':'Scale budget','Good':'Keep running','Okay':'Test new hook','Below Average':'Refresh creative',"Can't Say Yet":'Keep running','Not Good':'Pause'};

/* ---------- ads + points ---------- */
function genAd(bid,ch,i,name,format,tab,fn,paused){
  const b=B[bid],f=FN[fn],r=rng(hash(bid+ch+name)),key='demo-'+ch+'-'+i;
  const days=8+Math.floor(r()*52),stopAge=paused?3+Math.floor(r()*12):0;
  const launch=ago(days+stopAge),stop=paused?ago(stopAge):'';
  const q=r(),drift=q>.5?-.12*(q-.4):.55*(.5-q);                 // negative = getting cheaper over time
  const perf=days<12?"Can't Say Yet":q>.78?'Really Good':q>.5?'Good':q>.32?'Okay':q>.15?'Below Average':'Not Good';
  const aov=b.aov*(.92+.16*r()),cpo0=f.cir*aov*(.85+.3*r()),vid=format==='Video';
  const daily=f.daily*(b.spend/700)*(ch==='tt'?.6:1)*(.7+.6*r());
  const cpm0=b.cpm*f.cpmx*(.85+.3*r())*(ch==='tt'?.7:1),ctr0=f.ctr*(.8+.5*r()),lpvr=.62+.2*r();
  const frEnd=.9+.6*r(),thumb=.22+.2*r(),hold=.06+.12*r(),warmR=3+3*r(),atcR=3+2*r();
  const n=Math.min(10,Math.max(4,Math.floor(days/3))),t0=Date.parse(launch+'T00:00:00Z'),pts=[];let prevP=0,last=null;
  for(let k=1;k<=n;k++){
    const d=Math.max(1,Math.round(days*k/n)),t=d/days;
    const spent=R2(daily*d*(1+.04*Math.sin(d*1.3))),cpo=cpo0*(1+drift*t)*(1+.05*(r()-.5));
    const pu=Math.max(prevP,Math.round(spent/cpo));prevP=pu;
    const val=R2(pu*aov*(1+.02*Math.sin(d))),warm=Math.max(1,Math.round(pu*warmR));
    const v={Spent:spent,Purchases:pu};
    if(pu){v['Conv. Value']=val;v.CPO=R2(spent/pu);v.CIR=R4(spent/val)}
    v.CPM=R2(cpm0*(1+drift*t*.5));v.Frequency=R2(f.fr+t*frEnd);
    v['CTR (%)']=R4(ctr0*(1-drift*.5*t));v['LPVr (%)']=R3(lpvr);
    v['ATC+IC']=Math.round(pu*atcR);v.Warm=warm;v['Cost/Warm']=R2(spent/warm);v['Days Active']=d;
    if(vid){v['ThumbS (2s)']=R3(thumb*(1-.1*t));v['HoldR (6s)']=R3(hold)}
    pts.push({id:'dp-'+bid+ch+i+'-'+k,date:iso(new Date(t0+d*DAY)),ts:t0+d*DAY,source:'auto',v});last=v;
  }
  const row={__key:key,__tab:tab,'Ad Name & Preview':name,'Ad ID':'1202'+String(hash(name+bid)).padStart(10,'0'),Status:paused?'Paused':'Active',Format:format,Performance:paused&&perf==="Can't Say Yet"?'Okay':perf,
    Event:'Purchase','Ad Set/Audience':pick(r,f.aud),'Confidence Score':days>30?'High':days>14?'Medium':'Low',Action:paused?'Stopped':ACTION[perf],'Variable for Testing':pick(r,['Hook','Offer','Creative format','Copy','Audience']),
    'Launch Date':launch,Campaign:b.short+' | '+fn+' | '+(ch==='tt'?'TikTok':'Meta')+' Always-on','Campaign ID':'2385'+String(hash(bid+fn)).padStart(10,'0'),'Ad Set ID':'2385'+String(hash(name)).padStart(10,'0'),...last};
  if(stop)row['Stop Date']=stop;
  if(r()>.25)row.Hypothesis=pick(r,HYP);
  if(r()>.25)row['Conclusion / Notes']=NOTE[row.Performance];
  const m={};
  if(r()>.15)m.embed='https://picsum.photos/seed/'+slug(name+bid)+'/640/800.jpg';
  m.product='https://example.com/products/'+slug(name);
  return{row,meta:m,pts};
}
function build(bid){
  const b=B[bid],ads=[],meta={},points={};
  const add=(ch,list)=>list.forEach(([name,format],i)=>{
    const fn=ch==='tt'?(i<2?'TOF':'MOF'):(i<3?'TOF':i<6?'MOF':'BOF'),tab=ch==='tt'?fn+' TikTok':fn;
    const g=genAd(bid,ch,i,name,format,tab,fn,ch==='tt'?i===3:i%5===4);
    ads.push(g.row);meta[g.row.__key]=g.meta;points[g.row.__key]=g.pts});
  add('meta',b.meta);if(b.tt)add('tt',b.tt);
  return{ads,meta,points,updated:{date:today().toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}),time:'9:15 AM'}};
}

/* ---------- store (kept on this device, so demo edits survive a refresh) ---------- */
const SK='trakks:demo:s2:',MEM={};
function load(bid){if(MEM[bid])return MEM[bid];let d=null;try{const s=localStorage.getItem(SK+bid);if(s)d=JSON.parse(s)}catch(e){}return MEM[bid]=d||build(bid)}
function save(bid){try{localStorage.setItem(SK+bid,JSON.stringify(MEM[bid]))}catch(e){}}
const clone=o=>JSON.parse(JSON.stringify(o));

/* mirrors the Apps Script actions the app calls */
window.demoApi=async function(action,body,bid){
  await wait(180);body=body||{};const d=load(bid),find=k=>d.ads.find(a=>a.__key===k),mk=k=>(d.meta[k]=d.meta[k]||{});
  switch(action){
    case'getAds':return{...clone(d),ts:Date.now()};
    case'addAd':{const key='demo-new-'+Date.now(),row={__key:key,__tab:body.tab,...body.fields};
      d.ads.push(row);d.meta[key]={};d.points[key]=[];save(bid);return{ok:true,key}}
    case'updateAd':{const a=find(body.key);if(a)Object.entries(body.fields||{}).forEach(([k,v])=>{if(v==='')delete a[k];else a[k]=v});save(bid);return{ok:true}}
    case'rename':mk(body.key).name=body.name;save(bid);return{ok:true};
    case'embed':mk(body.key).embed=body.embed;save(bid);return{ok:true};
    case'product':{const m=mk(body.key);if(body.product!==undefined)m.product=body.product;if(body.image!==undefined)m.image=body.image;save(bid);return{ok:true}}
    case'scrape':{const s=slug(body.url||'page');return{title:'Sample product page',images:[1,2,3,4].map(n=>'https://picsum.photos/seed/'+s+n+'/600/600.jpg')}}
    case'addPoint':{const id='dp-'+Date.now();(d.points[body.key]=d.points[body.key]||[]).push({id,date:body.date,ts:Date.now(),source:'manual',v:body.values});save(bid);return{id}}
    case'deletePoint':Object.keys(d.points).forEach(k=>{d.points[k]=d.points[k].filter(p=>p.id!==body.id)});save(bid);return{ok:true};
    case'snapshotAll':{const day=ago(0);let c=0;
      d.ads.forEach(a=>{if(body.activeOnly&&a.Status!=='Active')return;const v={};
        Object.keys(a).forEach(k=>{if(typeof a[k]==='number'&&k[0]!=='_')v[k]=a[k]});if(!Object.keys(v).length)return;
        const arr=d.points[a.__key]=(d.points[a.__key]||[]).filter(p=>!(p.source==='auto'&&p.date===day));arr.push({id:'dp-'+a.__key+'-'+day,date:day,ts:Date.now(),source:'auto',v});c++});
      save(bid);return{count:c}}
    default:throw new Error('Unknown action')
  }
};
window.demoReset=()=>{Object.keys(MEM).forEach(k=>delete MEM[k]);Object.keys(PM).forEach(k=>delete PM[k])};

/* ---------- account performance (daily, per funnel + total) ---------- */
const PF=['Spent','Impressions','Reach','Clicks','Orders','New Customer','App Install','In-app Order','Web Order','Conv. Value','LPV','Existing CX','Add to Cart','Checkout'];
const PM={};
window.demoPerf=async function(bid){
  await wait(250);if(PM[bid])return PM[bid];
  const b=B[bid],r=rng(hash('perf'+bid)),N=400,rows=[],bo=.78+.2*r();
  /* [funnel, share of spend, target cost/value, cpm multiplier, LPVs per order, frequency] */
  const FS=[['TOF',.5,.46,1,11,1.25],['MOF',.42,.33,1.2,9,1.7],['BOF',.08,.06,2,3.4,2.6]];
  for(let i=N;i>=1;i--){
    const date=ago(i),dow=new Date(date+'T00:00:00Z').getUTCDay();
    const dayF=(1+.1*Math.sin((dow-1)/7*2*Math.PI))*(.75+.35*(N-i)/N)*(i%47<3?1.35:1)*(.9+.2*r()),total=b.spend*dayF,tot=new Array(PF.length).fill(0),fr=[];
    FS.forEach(([fn,share,cirT,cpmx,lpvM,freq])=>{
      const sp=R2(total*share*(.93+.14*r())),cir=cirT*bo*(.86+.28*r())*(1+.1*Math.sin(i/30));
      const orders=Math.max(0,Math.round(sp/cir/(b.aov*(.9+.2*r())))),value=R2(orders*b.aov*(.95+.1*r()));
      const checkout=Math.round(orders*(1.35+.25*r())),atc=Math.round(checkout*(1.6+.4*r())),lpv=Math.max(atc+1,Math.round(orders*lpvM*(.9+.2*r())));
      const clicks=Math.round(lpv/(.72+.08*r())),imps=Math.round(sp/(b.cpm*cpmx*(.9+.2*r()))*1000),reach=Math.round(imps/(freq*(.9+.2*r())));
      const newCX=Math.round(orders*(.5+.15*r())),inapp=Math.round(orders*(.2+.1*r()));
      const m={Spent:sp,Impressions:imps,Reach:reach,Clicks:clicks,Orders:orders,'New Customer':newCX,'App Install':Math.round(clicks*.015),'In-app Order':inapp,'Web Order':orders-inapp,'Conv. Value':value,LPV:lpv,'Existing CX':orders-newCX,'Add to Cart':atc,Checkout:checkout};
      const arr=PF.map(k=>m[k]);arr.forEach((x,n)=>tot[n]+=x);fr.push([date,fn,...arr]);
    });
    rows.push([date,'TOTAL',...tot.map((x,n)=>PF[n]==='Spent'||PF[n]==='Conv. Value'?R2(x):x)],...fr);
  }
  return PM[bid]={fields:['Date','Funnel',...PF],rows,updated:{date:today().toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}),time:'9:00 AM'}};
};
})();
