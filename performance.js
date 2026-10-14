/* trakks – Meta Performance: daily, weekly (Mon–Sun) and monthly views */
let PD=null,PB={},PERRS={},PLOADING=false,PERR='',PCH={},pcid=0;
const P={preset:'30',from:'',to:'',brand:'',funnel:'TOTAL',mode:ls('trakks_pmode','daily'),tab:'perf',cmp:'',cf:'',ct:''};
const PSUM=['Spent','Impressions','Reach','Clicks','Orders','New Customer','App Install','In-app Order','Web Order','Conv. Value','LPV','Existing CX','Add to Cart','Checkout'];
const PCOL=['#2f6fe0','#e8a317','#1aa57a','#e0533d','#8b5cf6','#0ea5e9'];
const GUIDE={TOF:[.4,.5],MOF:[.3,.4],BOF:[.02,.04],TOTAL:[.15,.25]};
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
/* ---- dates (UTC) ---- */
const pdt=s=>new Date(s+'T00:00:00Z'),isoD=d=>d.toISOString().slice(0,10);
const addDays=(s,n)=>{const d=pdt(s);d.setUTCDate(d.getUTCDate()+n);return isoD(d)};
const wkStart=s=>addDays(s,-((pdt(s).getUTCDay()+6)%7));
const keyOf=(s,m)=>m==='daily'?s:m==='weekly'?wkStart(s):s.slice(0,7);
const nextKey=(k,m)=>{if(m==='daily')return addDays(k,1);if(m==='weekly')return addDays(k,7);let[y,mo]=k.split('-').map(Number);mo++;if(mo>12){mo=1;y++}return y+'-'+String(mo).padStart(2,'0')};
const prevKey=(k,m)=>{if(m==='daily'){const d=pdt(k);d.setUTCFullYear(d.getUTCFullYear()-1);return isoD(d)}return m==='weekly'?addDays(k,-364):(parseInt(k)-1)+k.slice(4)};
function plabel(k,m,full,yr){const d=pdt(m==='monthly'?k+'-01':k),y=d.getUTCFullYear();
  if(m==='monthly')return MON[d.getUTCMonth()]+' '+y;
  const a=MON[d.getUTCMonth()]+' '+d.getUTCDate(),ys=(full||yr)?(full?', ':' ’')+(full?y:String(y).slice(2)):'';
  if(m==='daily')return a+ys;const e=pdt(addDays(k,6));return a+'–'+(e.getUTCMonth()===d.getUTCMonth()?'':MON[e.getUTCMonth()]+' ')+e.getUTCDate()+ys}
/* ---- math ---- */
function der(t){const d=(a,b)=>b?a/b:null;t.CPM=d(t.Spent*1000,t.Impressions);t.CTR=d(t.Clicks,t.Impressions);t.Freq=d(t.Impressions,t.Reach);t.AOV=d(t['Conv. Value'],t.Orders);t.CIR=d(t.Spent,t['Conv. Value']);t.ROAS=d(t['Conv. Value'],t.Spent);t.CPO=d(t.Spent,t.Orders);t.CAC=d(t.Spent,t['New Customer']);return t}
function tot(rows){const t={};PSUM.forEach(k=>t[k]=0);rows.forEach(r=>PSUM.forEach(k=>t[k]+=+r[k]||0));return der(t)}
function groupBy(rows,m){const g={};rows.forEach(r=>(g[keyOf(r.Date,m)]=g[keyOf(r.Date,m)]||[]).push(r));return g}
const totMap=(rows,m)=>{const g=groupBy(rows,m),o={};for(const k in g)o[k]=tot(g[k]);return o};
function compact(v){const a=Math.abs(v),f=(x,u)=>{let s=Math.abs(x)<10?x.toFixed(2):x.toFixed(1);if(s.includes('.'))s=s.replace(/\.?0+$/,'');return s+u};
  return a>=1e9?f(v/1e9,'B'):a>=1e6?f(v/1e6,'M'):a>=1e4?f(v/1e3,'K'):Math.round(v).toLocaleString()}
function fv(t,v,axis){if(v==null||isNaN(v))return'–';
  switch(t){case'money':return(v<0?'-':'')+'$'+(Math.abs(v)>=1000?compact(Math.abs(v)):Math.abs(v).toFixed(axis?0:2));case'int':return compact(v);case'pct':return(v*100).toFixed(axis?0:1)+'%';case'x':return v.toFixed(axis?1:2)+'x';default:return v.toFixed(2)}}
/* ---- data: saved copy first, then refresh in the background ---- */
function pdRebuild(){
  const rows=[];
  BRANDS.forEach(b=>{const c=PB[b.id];if(!c)return;c.rows.forEach(r=>{const o={};c.fields.forEach((k,i)=>o[k]=r[i]);o.Brand=b.name;rows.push(o)})});
  PD=rows.length?rows:null;
}
function pHydrate(){BRANDS.forEach(b=>{const c=cget('perf:'+b.id);if(c&&c.rows)PB[b.id]=c});pdRebuild()}
function pStatus(){
  const bad=BRANDS.filter(b=>PERRS[b.id]),have=BRANDS.filter(b=>PB[b.id]);
  if(bad.length)return{t:bad.length+' of '+BRANDS.length+' accounts could not refresh · showing saved data',bad:true};
  return{t:'',bad:false};
}
async function loadPerf(){
  PLOADING=true;if(view==='perf')perfPage();if(typeof renderStatus==='function')renderStatus();
  await Promise.all(BRANDS.map(async b=>{
    try{
      const j=await fetchJson(b.perf+'?action=getPerformance&token='+encodeURIComponent(TOKEN));
      PB[b.id]={fields:j.fields,rows:j.rows,updated:j.updated||null,ts:Date.now()};
      cset('perf:'+b.id,PB[b.id]);delete PERRS[b.id];
    }catch(e){if(e.auth)return authLost();PERRS[b.id]=e.message}
  }));
  PLOADING=false;pdRebuild();
  if(view==='perf')perfPage();if(typeof renderStatus==='function')renderStatus();
}
function prange(maxD,minD){let f,t=maxD;const p=P.preset;
  if(p==='7')f=addDays(maxD,-6);else if(p==='30')f=addDays(maxD,-29);else if(p==='90')f=addDays(maxD,-89);
  else if(p==='mtd')f=maxD.slice(0,8)+'01';else if(p==='ytd')f=maxD.slice(0,4)+'-01-01';else if(p==='all')f=minD;
  else if(p==='lm'){const first=maxD.slice(0,8)+'01';t=addDays(first,-1);f=t.slice(0,8)+'01'}
  else{f=P.from||minD;t=P.to||maxD}
  return{from:f,to:t}}
/* ---- compare range: WoW, MoM, YoY or custom ---- */
const dim=(y,m)=>new Date(Date.UTC(y,m+1,0)).getUTCDate();
function shiftM(s,n){const d=pdt(s),y=d.getUTCFullYear(),m=d.getUTCMonth()+n,ny=y+Math.floor(m/12),nm=((m%12)+12)%12;return isoD(new Date(Date.UTC(ny,nm,Math.min(d.getUTCDate(),dim(ny,nm)))))}
const isFullMonth=(f,t)=>f.slice(8)==='01'&&f.slice(0,7)===t.slice(0,7)&&+t.slice(8)===dim(+t.slice(0,4),+t.slice(5,7)-1);
function crange(from,to){const c=P.cmp;if(!c)return null;
  if(c==='wow')return{from:addDays(from,-7),to:addDays(to,-7)};
  if(c==='mom'){if(isFullMonth(from,to)){const f=shiftM(from,-1);return{from:f,to:f.slice(0,8)+String(dim(+f.slice(0,4),+f.slice(5,7)-1)).padStart(2,'0')}}return{from:shiftM(from,-1),to:shiftM(to,-1)}}
  if(c==='yoy'){if(isFullMonth(from,to)){const f=shiftM(from,-12);return{from:f,to:f.slice(0,8)+String(dim(+f.slice(0,4),+f.slice(5,7)-1)).padStart(2,'0')}}return{from:shiftM(from,-12),to:shiftM(to,-12)}}
  if(P.cf&&P.ct&&P.cf<=P.ct)return{from:P.cf,to:P.ct};return null}
const CMPN={wow:'week over week',mom:'month over month',yoy:'year over year',custom:'custom period'};
const LOWGOOD=new Set(['CPO','CIR','CAC','CPM']);
function pctChg(c,p){return c==null||p==null||!p?null:(c-p)/Math.abs(p)}
function chgTxt(x){return x==null?'–':(x>0?'+':x<0?'−':'')+Math.abs(x*100).toFixed(1)+'%'}
function chgCls(x,f){if(x==null||Math.abs(x)<.0005)return'';return(x>0)===!LOWGOOD.has(f)?'good':'badd'}
/* ---- charts ---- */
function nice(lo,hi){const x=(hi-lo)/4,p=Math.pow(10,Math.floor(Math.log10(x))),f=x/p,s=(f<=1?1:f<=2?2:f<=5?5:10)*p;return{lo:Math.floor(lo/s+1e-9)*s,hi:Math.ceil(hi/s-1e-9)*s,s}}
function pchart(title,keys,series,o={}){const id='pc'+(pcid++);PCH[id]={keys,series,o};
  return`<div class="pcard"><h3>${esc(title)}</h3><div class="leg">${series.map(s=>`<span><i style="background:${s.c}"></i>${esc(s.n)}</span>`).join('')}</div>${psvg(id)}</div>`}
function psvg(id){
  const{keys,series,o}=PCH[id],n=keys.length;if(!n)return'<p class="note">No data in this range.</p>';
  const W=640,H=250,T=12,B=30,two=series.some(s=>s.axis===1),L=54,R=two?54:14,pw=W-L-R,ph=H-T-B;PCH[id].geo={W,L,pw};
  const dom=ax=>{const ss=series.filter(s=>(s.axis||0)===ax);if(!ss.length)return null;let lo=0,hi=-Infinity;
    if(o.stack&&ax===0)for(let i=0;i<n;i++){let m=0;ss.forEach(s=>m+=s.d[i]||0);hi=Math.max(hi,m)}
    ss.forEach(s=>s.d.forEach(v=>{if(v!=null){hi=Math.max(hi,v);lo=Math.min(lo,v)}}));if(hi===-Infinity)hi=1;if(hi===lo)hi=lo+1;return nice(lo,hi)};
  const D=[dom(0),dom(1)],x=i=>L+(i+.5)*pw/n,y=(v,ax)=>{const d=D[ax||0];return T+ph*(1-(v-d.lo)/(d.hi-d.lo))};
  let g='';const gd=D[0]||D[1],gt=(D[0]?series.find(s=>(s.axis||0)===0):series.find(s=>s.axis===1)).t;
  for(let v=gd.lo;v<=gd.hi+1e-9;v+=gd.s){const yy=T+ph*(1-(v-gd.lo)/(gd.hi-gd.lo));g+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${L-6}" y="${yy+4}" text-anchor="end" font-size="10" fill="var(--mut)">${fv(gt,v,1)}</text>`}
  if(two){const d=D[1],t=series.find(s=>s.axis===1).t;for(let v=d.lo;v<=d.hi+1e-9;v+=d.s){const yy=T+ph*(1-(v-d.lo)/(d.hi-d.lo));g+=`<text x="${W-R+6}" y="${yy+4}" font-size="10" fill="var(--mut)">${fv(t,v,1)}</text>`}}
  const bars=series.filter(s=>s.kind==='bar'),bw=Math.max(1,pw/n*.74),acc=new Array(n).fill(0);
  bars.forEach((s,bi)=>s.d.forEach((v,i)=>{if(v==null)return;const ax=s.axis||0;let y0,y1,xx=x(i)-bw/2,w=bw;
    if(o.stack){y0=y(acc[i],ax);y1=y(acc[i]+v,ax);acc[i]+=v}else{y0=y(0,ax);y1=y(v,ax);w=bw/bars.length;xx+=bi*w}
    g+=`<rect x="${xx.toFixed(1)}" y="${Math.min(y0,y1).toFixed(1)}" width="${Math.max(w,.8).toFixed(1)}" height="${Math.max(Math.abs(y0-y1),.5).toFixed(1)}" fill="${s.c}" opacity=".85"/>`}));
  series.filter(s=>s.kind==='line').forEach(s=>{let p='',pen=false;s.d.forEach((v,i)=>{if(v==null){pen=false;return}p+=(pen?'L':'M')+x(i).toFixed(1)+' '+y(v,s.axis).toFixed(1);pen=true});
    g+=`<path d="${p}" fill="none" stroke="${s.c}" stroke-width="${n>120?1.5:2.2}" stroke-linejoin="round"${s.dash?' stroke-dasharray="5 4"':''}/>`;
    if(n<=40)s.d.forEach((v,i)=>{if(v!=null)g+=`<circle cx="${x(i).toFixed(1)}" cy="${y(v,s.axis).toFixed(1)}" r="2.6" fill="${s.c}"/>`})});
  const st=Math.ceil(n/6);for(let i=0;i<n;i+=st)g+=`<text x="${x(i)}" y="${H-10}" text-anchor="middle" font-size="10" fill="var(--mut)">${esc(PX.lab(keys[i],false))}</text>`;
  return`<svg class="pc" data-id="${id}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(PX.title)}">${g}<line class="gl" y1="${T}" y2="${T+ph}" stroke="var(--mut)" stroke-dasharray="3 3" visibility="hidden"/></svg>`}
function phbars(title,rows,legend){const mx=Math.max(1e-9,...rows.flatMap(r=>r.v.map(b=>b.v||0)));
  return`<div class="pcard"><h3>${esc(title)}</h3>${legend?`<div class="leg">${legend.map(l=>`<span><i style="background:${l.c}"></i>${esc(l.n)}</span>`).join('')}</div>`:''}${rows.map(r=>`<div class="hb"><b>${esc(r.l)}</b>${r.v.map(b=>`<div class="hbr"><div class="hbf" style="width:${Math.max(1,(b.v||0)/mx*100)}%;background:${b.c}"></div><span>${fv(b.t,b.v)}</span></div>`).join('')}</div>`).join('')||'<p class="note">No data in this range.</p>'}</div>`}
/* ---- page ---- */
let PX={};
function perfPage(){
  const el=$('#main');el.classList.add('wide');PCH={};pcid=0;
  if(PLOADING&&!PD){el.innerHTML='<div class="loading">Loading performance data…</div>';return}
  if(!PD){const er=Object.values(PERRS)[0]||'No performance data yet.';el.innerHTML=`<div class="empty">${esc(er)}<br><br><button class="ghost" id="retry">Try again</button></div>`;return}
  const dates=PD.map(r=>r.Date).sort(),maxD=dates[dates.length-1],minD=dates[0],{from,to}=prange(maxD,minD),m=P.mode;
  const brands=BRANDS.map(b=>b.name).filter(n=>PD.some(r=>r.Brand===n)),useB=P.brand?[P.brand]:brands;
  const bc=b=>PCOL[brands.indexOf(b)%PCOL.length];
  const base=PD.filter(r=>r.Funnel===P.funnel&&(!P.brand||r.Brand===P.brand)),cur=base.filter(r=>r.Date>=from&&r.Date<=to);
  const cr=crange(from,to),prevRows=cr?base.filter(r=>r.Date>=cr.from&&r.Date<=cr.to):[],PT=cr?tot(prevRows):null,hasPrev=!!(cr&&prevRows.length);
  const keys=[];for(let k=keyOf(from,m),e=keyOf(to,m);k<=e;k=nextKey(k,m))keys.push(k);
  const yr=pdt(to).getUTCFullYear()!==pdt(from).getUTCFullYear()||(pdt(to)-pdt(from))>3e10;
  PX={title:'Chart',lab:(k,full)=>plabel(k,m,full,yr)};
  const cm=totMap(cur,m),am=totMap(base,m),S=(f,map=cm,ks=keys)=>ks.map(k=>map[k]?f(map[k]):null),T=tot(cur),mn=m==='daily'?'Daily':m==='weekly'?'Weekly':'Monthly';
  const one=(f,t,n,c,extra={})=>({n,d:S(x=>x[f]),t,c,kind:'line',...extra});
  const byBrand=f=>useB.map(b=>{const mp=totMap(cur.filter(r=>r.Brand===b),m);return{n:b,d:S(x=>x[f],mp),t:f==='CIR'?'pct':'money',c:bc(b),kind:'line'}});
  const pyoy=(f,t,title)=>pchart(title+' vs Previous Year',keys,[one(f,t,'This year',PCOL[0]),{n:'Previous year',d:keys.map(k=>{const p=am[prevKey(k,m)];return p?p[f]:null}),t,c:'#a9adc4',kind:'line',dash:1}]);
  const pkeys=[];if(cr)for(let k=keyOf(cr.from,m),e=keyOf(cr.to,m);k<=e;k=nextKey(k,m))pkeys.push(k);
  const pm_=cr?totMap(prevRows,m):{};
  const pcmp=(f,t,title)=>pchart(title+' vs comparison period',keys,[one(f,t,'Selected',PCOL[0]),{n:'Comparison',d:keys.map((k,i)=>{const p=pm_[pkeys[i]];return p?p[f]:null}),t,c:'#a9adc4',kind:'line',dash:1}]);
  const guide=GUIDE[P.funnel],kpi=(l,f,t,cap)=>{
    let cmpH='';
    if(cr){const pv=hasPrev?PT[f]:null,ch=pctChg(T[f],pv);cmpH=pv==null&&!hasPrev?`<small class="cmpl">no data in comparison period</small>`:`<small class="cmpl">(vs ${fv(t,pv)} prev.)</small><span class="dlt ${chgCls(ch,f)}">${chgTxt(ch)}</span>`}
    return`<div class="kpi"><span>${l}</span><b>${fv(t,T[f])}</b>${cmpH}${cap?`<small class="${cap[1]}">${cap[0]}</small>`:''}</div>`};
  const cirCap=guide?[`Target ${guide[0]*100}–${guide[1]*100}%`,T.CIR==null?'':T.CIR>guide[1]?'warn':T.CIR<guide[0]?'low':'ok']:null;
  let body='';
  if(P.tab==='perf'){
    body=`<div class="kpis">${kpi('Amount Spent','Spent','money')}${kpi('Conversion Value','Conv. Value','money')}${kpi('Orders','Orders','int')}${kpi('Cost/Order','CPO','money')}${kpi('CIR','CIR','pct',cirCap)}${kpi('ROAS','ROAS','x')}${kpi('New Customer','New Customer','int')}${kpi('CAC','CAC','money')}</div><div class="pgrid">`+
    pchart(mn+' CIR trend by brand',keys,byBrand('CIR'))+
    phbars('CIR by Brand',useB.map(b=>({l:b,v:[{v:tot(cur.filter(r=>r.Brand===b)).CIR,t:'pct',c:bc(b)}]})))+
    pchart('Spend by Conversion Value',keys,[one('Spent','money','Spent',PCOL[0],{kind:'bar'}),one('Conv. Value','money','Conversion value','#1aa57a',{axis:1})])+
    pchart('Orders by Device',keys,[one('Web Order','int','Web order',PCOL[0],{kind:'bar'}),one('In-app Order','int','In-app order',PCOL[1],{kind:'bar'})],{stack:1})+
    pchart(mn+' AOV & ROAS',keys,[one('AOV','money','AOV',PCOL[0]),one('ROAS','x','ROAS',PCOL[3],{axis:1})])+
    (cr?pcmp('Spent','money','Spent')+pcmp('Orders','int','Orders')+pcmp('Conv. Value','money','Conversion Value')+pcmp('CIR','pct','CIR'):pyoy('Spent','money','Spent')+pyoy('Orders','int','Orders')+pyoy('Conv. Value','money','Conversion Value')+pyoy('CIR','pct','CIR'))+
    phbars('Funnel Conversion',useB.map(b=>{const t=tot(cur.filter(r=>r.Brand===b));return{l:b,v:[['LPV',PCOL[0]],['Add to Cart',PCOL[1]],['Checkout',PCOL[4]],['Orders',PCOL[2]]].map(([k,c])=>({v:t[k],t:'int',c}))}}),[['Landing page views',PCOL[0]],['Add to cart',PCOL[1]],['Checkout',PCOL[4]],['Orders',PCOL[2]]].map(([n,c])=>({n,c})))+
    pchart('Orders from New vs Existing Users',keys,[one('New Customer','int','New customer',PCOL[1],{kind:'bar'}),one('Existing CX','int','Existing customer',PCOL[0],{kind:'bar'})],{stack:1})+`</div>`;
  }else if(P.tab==='deliv'){
    body=`<div class="kpis">${kpi('Impressions','Impressions','int')}${kpi('Reach','Reach','int')}${kpi('CPM','CPM','money')}${kpi('Clicks','Clicks','int')}${kpi('Landing Page Views','LPV','int')}${kpi('CTR','CTR','pct')}${kpi('Freq.','Freq','num')}</div><div class="pgrid">`+
    pchart('Frequency & CTR (Ad Fatigue)',keys,[one('Freq','num','Frequency',PCOL[0],{kind:'bar'}),one('CTR','pct','CTR',PCOL[3],{axis:1})])+
    (cr?pcmp('CPM','money','CPM')+pcmp('CTR','pct','CTR'):'')+
    pchart('CPM per Brand',keys,useB.map(b=>{const mp=totMap(cur.filter(r=>r.Brand===b),m);return{n:b,d:S(x=>x.CPM,mp),t:'money',c:bc(b),kind:'line'}}))+`</div>`;
  }else{
    const cols=[['Spent','money'],['Conv. Value','money'],['Orders','int'],['CPO','money'],['CIR','pct'],['ROAS','x'],['AOV','money'],['New Customer','int'],['CAC','money'],['CPM','money'],['CTR','pct'],['Freq','num'],['LPV','int']];
    const rowH=(l,t,b)=>`<tr${b?' class="tot"':''}><td class="stick">${esc(l)}</td>${cols.map(([k,ty])=>`<td class="num">${fv(ty,t[k])}</td>`).join('')}</tr>`;
    const chgRow=()=>`<tr class="cmpr"><td class="stick">Change</td>${cols.map(([k])=>{const ch=hasPrev?pctChg(T[k],PT[k]):null,c=chgCls(ch,k);return`<td class="num ${c==='good'?'dgood':c==='badd'?'dbad':''}">${chgTxt(ch)}</td>`}).join('')}</tr>`;
    body=`<div class="tbl"><table><thead><tr><th class="stick">${m==='weekly'?'Week (Mon–Sun)':m==='monthly'?'Month':'Day'}</th>${cols.map(([k])=>`<th>${k==='Freq'?'Freq.':k}</th>`).join('')}</tr></thead><tbody>${rowH('Total',T,1)}${cr?rowH('Compared: '+plabel(cr.from,'daily',true)+' to '+plabel(cr.to,'daily',true),hasPrev?PT:tot([]),1).replace('class="tot"','class="tot cmpr"')+chgRow():''}${keys.slice().reverse().filter(k=>cm[k]).map(k=>rowH(plabel(k,m,true),cm[k])).join('')}</tbody></table></div>`;
  }
  const sel=(id,opts,v)=>`<select id="${id}">${opts.map(([a,b])=>`<option value="${a}" ${a===v?'selected':''}>${esc(b)}</option>`).join('')}</select>`;
  const upd=BRANDS.filter(b=>PB[b.id]&&fmtUpd(PB[b.id].updated)).map(b=>`${b.short} ${fmtUpd(PB[b.id].updated)}`).join(' · ');
  const stale=BRANDS.filter(b=>PERRS[b.id]);
  el.innerHTML=(stale.length?`<div class="banner">Could not refresh ${stale.map(b=>esc(b.name)).join(', ')} (${esc(PERRS[stale[0].id])}). Showing the data saved ${rel(Math.min(...stale.map(b=>PB[b.id]?PB[b.id].ts:Date.now())))}. <button class="ghost sm" id="retry" style="margin-left:6px">Try again</button></div>`:'')+`<div class="actions"><a class="ghost btn-ic" href="${esc(LINKS.legacy)}" target="_blank" rel="noopener noreferrer">${ic('chart')}<span>Legacy Dashboard</span></a></div><div class="pctl"><label class="dl"><span>Date range</span>${sel('pp',[['7','Last 7 days'],['30','Last 30 days'],['90','Last 90 days'],['mtd','This month'],['lm','Last month'],['ytd','Year to date'],['all','All time'],['custom','Custom']],P.preset)}</label>
  <label class="dl"><span>From</span><input type="date" id="pf" value="${from}"></label><label class="dl"><span>To</span><input type="date" id="pt" value="${to}"></label>
  <label class="dl"><span>Brand</span>${sel('pb',[['','All brands'],...brands.map(b=>[b,b])],P.brand)}</label>
  <label class="dl"><span>Funnel</span>${sel('pfn',[['TOTAL','All funnels (total)'],['TOF','TOF'],['MOF','MOF'],['BOF','BOF']],P.funnel)}</label>
  <label class="dl"><span>Compare</span>${sel('pcm',[['','Off'],['wow','Week over week (WoW)'],['mom','Month over month (MoM)'],['yoy','Year over year (YoY)'],['custom','Custom period']],P.cmp)}</label>
  ${P.cmp==='custom'?`<label class="dl"><span>Compare from</span><input type="date" id="pcf" value="${esc(P.cf)}"></label><label class="dl"><span>Compare to</span><input type="date" id="pct" value="${esc(P.ct)}"></label>`:''}</div>
  <div class="chips"><div class="seg">${[['daily','Daily'],['weekly','Weekly (Mon–Sun)'],['monthly','Monthly']].map(([v,l])=>`<button class="${m===v?'on':''}" data-pm="${v}">${l}</button>`).join('')}</div><span class="gap"></span><div class="seg">${[['perf','Performance'],['deliv','Delivery'],['table','Table']].map(([v,l])=>`<button class="${P.tab===v?'on':''}" data-ptab="${v}">${l}</button>`).join('')}</div></div>
  <p class="note" style="margin:0 0 14px">${cr?`Comparing with ${plabel(cr.from,'daily',true)} to ${plabel(cr.to,'daily',true)} (${CMPN[P.cmp]})${hasPrev?'':' · no data in that period'} · `:P.cmp==='custom'?'Pick the comparison dates above · ':''}${plabel(from,'daily',true)} to ${plabel(to,'daily',true)} · ${cur.length?new Set(cur.map(r=>r.Date)).size:0} days of data · latest data ${plabel(maxD,'daily',true)}${upd?` · Sheets updated: ${esc(upd)}`:''}</p>${body}
  <div class="guide"><b>CIR guide:</b> TOF 40–50% · MOF 30–40% · BOF 2–4% · Overall 15–25%. CIR is spend divided by conversion value.</div>`;
}
/* ---- events ---- */
document.addEventListener('click',e=>{const t=e.target,c=s=>t.closest(s);
  if(c('[data-pm]')){P.mode=c('[data-pm]').dataset.pm;localStorage.setItem('trakks_pmode',P.mode);perfPage()}
  if(c('[data-ptab]')){P.tab=c('[data-ptab]').dataset.ptab;perfPage()}
  });
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='pp'){P.preset=t.value;perfPage()}
  if(t.id==='pf'||t.id==='pt'){P.preset='custom';P.from=$('#pf').value;P.to=$('#pt').value;perfPage()}
  if(t.id==='pb'){P.brand=t.value;perfPage()}
  if(t.id==='pfn'){P.funnel=t.value;perfPage()}
  if(t.id==='pcm'){P.cmp=t.value;if(P.cmp==='custom'&&!P.cf){const mx=PD.map(r=>r.Date).sort().pop();P.ct=addDays(mx,-30);P.cf=addDays(mx,-59)}perfPage()}
  if(t.id==='pcf'||t.id==='pct'){P.cf=$('#pcf').value;P.ct=$('#pct').value;perfPage()}});
let ptip=null;
document.addEventListener('mousemove',e=>{const svg=e.target.closest&&e.target.closest('svg.pc');
  if(!ptip){ptip=document.createElement('div');ptip.className='tip';ptip.hidden=true;document.body.appendChild(ptip)}
  if(!svg){ptip.hidden=true;document.querySelectorAll('svg.pc .gl').forEach(l=>l.setAttribute('visibility','hidden'));return}
  const ch=PCH[svg.dataset.id];if(!ch)return;const r=svg.getBoundingClientRect(),g=ch.geo,n=ch.keys.length;
  const xr=(e.clientX-r.left)/r.width*g.W,i=Math.max(0,Math.min(n-1,Math.floor((xr-g.L)/g.pw*n))),gx=g.L+(i+.5)*g.pw/n,gl=svg.querySelector('.gl');
  gl.setAttribute('x1',gx);gl.setAttribute('x2',gx);gl.setAttribute('visibility','visible');
  ptip.innerHTML=`<b>${esc(PX.lab(ch.keys[i],true))}</b>`+ch.series.map(s=>`<div><i style="background:${s.c}"></i>${esc(s.n)} <b>${fv(s.t,s.d[i])}</b></div>`).join('');
  ptip.hidden=false;const w=ptip.offsetWidth;ptip.style.left=Math.min(e.clientX+14,innerWidth-w-8)+'px';ptip.style.top=(e.clientY+14)+'px'});
