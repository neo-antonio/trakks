/* trakks – ad performance visualizer */
const NUM=['Spent','Purchases','Conv. Value','CPO','CIR','CPM','Frequency','CTR (%)','LPVr (%)','Warm','Cost/Warm','Days Active','ThumbS (2s)','HoldR (6s)'];
const metricsFor=a=>a.__tab==='TOF TikTok'?NUM:NUM.slice(0,11);
const NAV=[{id:'home',label:'Home'},{group:'Potico.sg',items:[
  {id:'meta',label:'Meta Ads',tabs:['TOF Meta','MOF Meta','BOF Meta'],kids:[{id:'TOF Meta',label:'Meta TOF'},{id:'MOF Meta',label:'Meta MOF'},{id:'BOF Meta',label:'Meta BOF'}]},
  {id:'tiktok',label:'TikTok Ads',tabs:['TOF TikTok'],kids:[{id:'TOF TikTok',label:'TikTok TOF'}]}]},{id:'perf',label:'Meta Performance'}];
const FILT=[['Format','Format'],['Event','Event'],['Ad Set/Audience','Audience'],['Confidence Score','Confidence'],['Action','Action'],['Variable for Testing','Variable']];
const sv=p=>`<svg viewBox="0 0 24 24">${p}</svg>`;
const ICON={edit:sv('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>'),eye:sv('<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'),
 image:sv('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.8"/><path d="M21 16l-5-5-9 10"/>'),
 video:sv('<rect x="2" y="5" width="14" height="14" rx="3"/><path d="M16 10l6-3v10l-6-3"/>'),
 home:sv('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'),
 gear:sv('<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>')};
const MONEY=new Set(['Spent','Conv. Value','CPO','CPM','Cost/Warm']);
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cfg=JSON.parse(localStorage.getItem('trakks_cfg')||'{}');
let D={ads:[],meta:{},points:{}},view='home',F={q:'',status:'Active',sort:'Launch Date',dir:'desc'},openKey=null,metric='Spent',selPt=null,loaded=false,navq='',layout=localStorage.getItem('trakks_layout')||'cards',showNotes=localStorage.getItem('trakks_notes')!=='0',pvMode=localStorage.getItem('trakks_pv')||'inline';

/* ---------- api ---------- */
async function api(action,body){
  if(!cfg.url)throw new Error('Add your Web App URL in Settings');
  const r=body?await fetch(cfg.url,{method:'POST',body:JSON.stringify({token:cfg.token,action,...body})}):await fetch(cfg.url+'?action='+action+'&token='+encodeURIComponent(cfg.token||''));
  const j=await r.json();if(j.error)throw new Error(j.error);return j;
}
function toast(m){const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}
async function load(){
  if(!cfg.url){settings();return}
  $('#main').innerHTML='<div class="loading">Loading your ads…</div>';
  try{D=await api('getAds');loaded=true}catch(e){toast(e.message)}
  render();
}
/* ---------- helpers ---------- */
const ad=k=>D.ads.find(a=>a.__key===k);
const nameOf=a=>(D.meta[a.__key]||{}).name||a['Ad Name & Preview']||'(unnamed)';
const embedOf=a=>(D.meta[a.__key]||{}).embed||'';
const ptsOf=k=>(D.points[k]||[]).slice().sort((x,y)=>x.date.localeCompare(y.date)||x.ts-y.ts);
const tabsFor=v=>{for(const g of NAV.slice(1))for(const i of (g.items||[])){if(i.id===v)return i.tabs;const k=i.kids.find(k=>k.id===v);if(k)return[k.id]}return[]};
const titleOf=v=>{if(v==='home')return'Home';if(v==='perf')return'Meta Performance';for(const g of NAV.slice(1))for(const i of (g.items||[])){if(i.id===v)return i.label;const k=i.kids.find(k=>k.id===v);if(k)return k.label}return v};
function fmt(k,v){if(v==null||v==='')return'–';if(typeof v!=='number')return esc(v);if(k==='CIR')return(v*100).toFixed(1)+'%';if(MONEY.has(k))return'$'+v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});if(['Purchases','Warm','Days Active'].includes(k))return Math.round(v).toLocaleString();return v.toLocaleString(undefined,{maximumFractionDigits:2})}
const dshort=s=>{if(!s)return'';const d=new Date(s+'T00:00:00');return isNaN(d)?s:d.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})};
function ask(title,val,okLabel){return new Promise(res=>{const m=document.createElement('div');m.className='modal';m.style.zIndex=50;m.innerHTML=`<div class="sheet small"><h2>${esc(title)}</h2><div class="fld"><input value="${esc(val)}"></div><div class="row" style="margin-top:12px"><button class="ghost" style="flex:1">Cancel</button><button class="go" style="flex:1">${okLabel||'Save'}</button></div></div>`;document.body.appendChild(m);const i=m.querySelector('input');i.focus();i.select();const done=v=>{m.remove();res(v)};m.querySelector('.ghost').onclick=()=>done(null);m.querySelector('.go').onclick=()=>done(i.value.trim());i.onkeydown=e=>{if(e.key==='Enter')done(i.value.trim());if(e.key==='Escape')done(null)};m.onclick=e=>{if(e.target===m)done(null)}})}
/* ---------- sidebar ---------- */
function renderNav(){
  const q=navq.toLowerCase(),btn=(id,l,n)=>`<button class="navbtn ${view===id?'on':''}" data-v="${esc(id)}"><span class="ni">${id==='home'?ICON.home:''}<span>${esc(l)}</span></span>${n!=null?`<span class="n">${n}</span>`:''}</button>`;
  const cnt=t=>D.ads.filter(a=>t.includes(a.__tab)&&a.Status==='Active').length;
  let h=btn('home','Home');
  for(const g of NAV.slice(1)){
    if(g.id){h+=`<div class="gap-top">${btn(g.id,g.label)}</div>`;continue}
    h+=`<div class="glabel">${esc(g.group)}</div>`;
    for(const i of g.items){
      const open=view===i.id||i.kids.some(k=>k.id===view)||q;
      const kids=i.kids.filter(k=>!q||(k.label+i.label).toLowerCase().includes(q));
      if(q&&!kids.length&&!i.label.toLowerCase().includes(q))continue;
      h+=btn(i.id,i.label,loaded?cnt(i.tabs):null);
      if(open)h+=`<div class="sub">${kids.map(k=>btn(k.id,k.label,loaded?cnt([k.id]):null)).join('')}</div>`;
    }
  }
  $('#nav').innerHTML=h;
}
/* ---------- pages ---------- */
function render(){
  renderNav();$('#title').textContent=titleOf(view);
  if(view==='perf'){perfPage();return}
  $('#main').classList.toggle('wide',view!=='home'&&layout==='cols');
  if(!loaded){return}
  view==='home'?home():list();
  if(openKey&&ad(openKey))sheet();
}
function agg(rows){const sp=rows.reduce((s,a)=>s+(+a.Spent||0),0),pu=rows.reduce((s,a)=>s+(+a.Purchases||0),0);return{sp,pu,cpo:pu?sp/pu:null,n:rows.length,act:rows.filter(a=>a.Status==='Active').length}}
function lastAuto(){let d='',n=0;Object.values(D.points).flat().forEach(p=>{if(p.source==='auto'){if(p.date>d){d=p.date;n=0}if(p.date===d)n++}});return{d,n}}
function home(){
  const la=lastAuto(),tiles=NAV[1].items.flatMap(i=>i.kids).map((k,i)=>{const a=agg(D.ads.filter(x=>x.__tab===k.id));return`<button class="tile" data-v="${esc(k.id)}" style="animation-delay:${i*50}ms"><h3>${esc(k.label)}</h3><div class="big">${fmt('Spent',a.sp)}</div><small>spent · ${a.act} of ${a.n} ads active</small><small>${fmt('Purchases',a.pu)} purchases · CPO ${fmt('CPO',a.cpo)}</small></button>`}).join('');
  $('#main').innerHTML=`<div class="hero"><div><h2>Save today's points</h2><p>${la.d?`Last saved ${dshort(la.d)} for ${la.n} ads.`:'No points saved yet.'} Saves the current numbers of every ad as a point on its graph. Saving twice on the same day replaces the earlier point.</p><label><input type="checkbox" id="actOnly" checked> Active ads only</label></div><button class="go" id="snap">Save points for all ads</button></div><div class="tiles">${tiles}</div>`;
}
function rowsFor(){
  const tabs=tabsFor(view);
  return D.ads.filter(a=>tabs.includes(a.__tab)).filter(a=>{
    if(F.status&&a.Status!==F.status)return false;
    if(F.from||F.to){const ls=a['Launch Date']||'',sp=a['Stop Date']||'';if(!ls)return false;
      if(F.dmode==='run'){if(F.to&&ls>F.to)return false;if(F.from&&sp&&sp<F.from)return false}else{if(F.from&&ls<F.from)return false;if(F.to&&ls>F.to)return false}}
    if(F.minSpend&&!((+a.Spent||0)>=+F.minSpend))return false;
    const hasN=!!(a.Hypothesis||a['Conclusion / Notes']);if(F.notes==='has'&&!hasN)return false;if(F.notes==='none'&&hasN)return false;
    if(F.q&&![nameOf(a),a['Ad Name & Preview'],a['Ad ID'],a.Hypothesis,a['Conclusion / Notes']].join(' ').toLowerCase().includes(F.q.toLowerCase()))return false;
    return FILT.every(([k])=>!F[k]||String(a[k]??'None')===F[k])
  }).sort((a,b)=>{const k=F.sort,va=k==='Name'?nameOf(a):a[k],vb=k==='Name'?nameOf(b):b[k];
    if(va==null&&vb==null)return 0;if(va==null)return 1;if(vb==null)return-1;
    const r=typeof va==='number'&&typeof vb==='number'?va-vb:String(va).localeCompare(String(vb));return F.dir==='asc'?r:-r});
}
const SORTS=[['Launch Date:desc','Newest'],['Launch Date:asc','Oldest'],['Spent:desc','Highest spend'],['Spent:asc','Lowest spend'],['Purchases:desc','Most purchases'],['Purchases:asc','Fewest purchases'],['CPO:asc','Lowest CPO'],['CPO:desc','Highest CPO'],['CIR:asc','Lowest CIR'],['CIR:desc','Highest CIR'],['Name:asc','Name A–Z'],['Name:desc','Name Z–A']];
const defDir=k=>['Name','CPO','CIR','CPM','Cost/Warm','Ad Set/Audience','Event','Status','Format','Hypothesis','Conclusion / Notes'].includes(k)?'asc':'desc';
const ar=k=>F.sort===k?(F.dir==='asc'?' ↑':' ↓'):'';
const tag=a=>(a.Status?`<span class="st ${esc(a.Status)}">${esc(a.Status)}</span>`:'')+(a.Format?`<span class="st ${esc(a.Format)}">${esc(a.Format)}</span>`:'');
function noteBlock(a){if(!showNotes||!(a.Hypothesis||a['Conclusion / Notes']))return'';return`<div class="nt">${a.Hypothesis?`<p><b>Hypothesis:</b> ${esc(a.Hypothesis)}</p>`:''}${a['Conclusion / Notes']?`<p><b>Notes:</b> ${esc(a['Conclusion / Notes'])}</p>`:''}</div>`}
function cardHtml(a,i){const n=(D.points[a.__key]||[]).length,e=embedOf(a),img=/\.(png|jpe?g|gif|webp)(\?|$)/i.test(e);
  return`<div class="card" data-k="${esc(a.__key)}" style="animation-delay:${Math.min(i,10)*25}ms"><div class="crow"><div class="thumb ${esc(a.Format)}">${img?`<img src="${esc(e)}" alt="">`:(a.Format==='Video'?ICON.video:ICON.image)}</div><div class="cmain"><b title="${esc(nameOf(a))}">${esc(nameOf(a))}</b><small>Launched ${dshort(a['Launch Date'])||'–'}</small><span class="days">${a['Days Active']!=null?fmt('Days Active',a['Days Active'])+' days':''}${n?' · '+n+' pts':''}</span></div><div class="cside"><div class="tags">${tag(a)}</div><b>${fmt('Spent',a.Spent)}</b></div></div>${noteBlock(a)}
  <div class="cm">${['Purchases','CPO','CIR','CPM'].map(k=>`<div><span>${k}</span><b>${fmt(k,a[k])}</b></div>`).join('')}</div>
  <div class="acts"><button class="ib" data-rn="${esc(a.__key)}" title="Rename" aria-label="Rename ad">${ICON.edit}</button><button class="ib" data-k="${esc(a.__key)}" title="Open" aria-label="Open ad">${ICON.eye}</button></div></div>`}
function tableHtml(rows){
  const cols=['Status','Format','Event','Ad Set/Audience','Spent','Purchases','CPO','CIR','CPM','Frequency','CTR (%)','LPVr (%)','Warm','Cost/Warm'];
  if(rows.some(a=>a.__tab==='TOF TikTok'))cols.push('ThumbS (2s)','HoldR (6s)');
  if(showNotes)cols.push('Hypothesis','Conclusion / Notes');
  const th=k=>`<th data-sort="${esc(k)}" class="${['Hypothesis','Conclusion / Notes'].includes(k)?'wt':''}">${esc(k)}${ar(k)}</th>`;
  return`<div class="tbl"><table><thead><tr><th data-sort="Name" class="stick">Ad${ar('Name')}</th>${cols.map(th).join('')}</tr></thead><tbody>${rows.map(a=>`<tr data-k="${esc(a.__key)}"><td class="stick"><div class="nm"><span title="${esc(nameOf(a))}">${esc(nameOf(a))}</span><button class="ib sm" data-rn="${esc(a.__key)}" aria-label="Rename ad">${ICON.edit}</button></div></td>${cols.map(k=>{const v=a[k];if(k==='Status')return`<td>${a.Status?`<span class="st ${esc(a.Status)}">${esc(a.Status)}</span>`:'–'}</td>`;if(k==='Format')return`<td>${a.Format?`<span class="st ${esc(a.Format)}">${esc(a.Format)}</span>`:'–'}</td>`;if(k==='Hypothesis'||k==='Conclusion / Notes')return`<td class="wt">${esc(v)}</td>`;return`<td class="${typeof v==='number'?'num':''}">${fmt(k,v)}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`}
function list(){
  const base=D.ads.filter(a=>tabsFor(view).includes(a.__tab)),rows=rowsFor(),s=agg(rows);
  const ae=document.activeElement,aid=ae&&ae.id,apos=ae&&ae.selectionStart;
  const sels=FILT.map(([k,l])=>{const vals=[...new Set(base.map(a=>String(a[k]??'None')))].sort();return vals.length<2?'':`<select class="f" data-f="${esc(k)}" aria-label="${l}"><option value="">${l}: all</option>${vals.map(v=>`<option ${F[k]===v?'selected':''}>${esc(v)}</option>`).join('')}</select>`}).join('');
  $('#main').classList.toggle('wide',layout==='cols');
  $('#main').innerHTML=`<div class="stats"><div><span>Spent</span><b>${fmt('Spent',s.sp)}</b></div><div><span>Purchases</span><b>${fmt('Purchases',s.pu)}</b></div><div><span>Avg CPO</span><b>${fmt('CPO',s.cpo)}</b></div><span class="badge" style="margin-left:auto">${s.n} ads</span></div>
  <input class="search f" id="q" placeholder="Search by ad name, ID, hypothesis or notes" value="${esc(F.q)}">
  <div class="chips">${['Active','Paused',''].map(v=>`<button class="chip ${F.status===v?'on':''}" data-s="${v}">${v||'All'}</button>`).join('')}<span class="gap"></span><div class="seg"><button class="${layout==='cards'?'on':''}" data-layout="cards">Cards</button><button class="${layout==='cols'?'on':''}" data-layout="cols">Columns</button></div></div>
  <div class="sels"><input class="f" id="minsp" type="text" inputmode="decimal" autocomplete="off" placeholder="Min spend $" aria-label="Minimum spend in dollars" value="${esc(F.minSpend??'')}"><label class="dl"><span>From</span><input class="f" type="date" id="dfrom" value="${esc(F.from||'')}"></label><label class="dl"><span>To</span><input class="f" type="date" id="dto" value="${esc(F.to||'')}"></label><select class="f" data-f="dmode" aria-label="Date mode"><option value="">Launched in range</option><option value="run" ${F.dmode==='run'?'selected':''}>Running in range</option></select>${sels}
  <select class="f" data-f="notes" aria-label="Notes filter"><option value="">Notes: all</option><option value="has" ${F.notes==='has'?'selected':''}>Has notes or hypothesis</option><option value="none" ${F.notes==='none'?'selected':''}>No notes</option></select>
  <select class="f" id="sort" aria-label="Sort">${SORTS.some(([v])=>v===F.sort+':'+F.dir)?'':`<option value="" selected>Sort: ${esc(F.sort)} ${F.dir==='asc'?'↑':'↓'}</option>`}${SORTS.map(([v,l])=>`<option value="${v}" ${v===F.sort+':'+F.dir?'selected':''}>Sort: ${l}</option>`).join('')}</select></div>
  <label class="chk"><input type="checkbox" id="shownotes" ${showNotes?'checked':''}> Show notes &amp; hypothesis</label>
  ${!rows.length?'<div class="empty">No ads match these filters.</div>':layout==='cols'?tableHtml(rows):`<div class="grid">${rows.map(cardHtml).join('')}</div>`}`;
  if(aid){const el=document.getElementById(aid);if(el){el.focus();try{if(apos!=null)el.setSelectionRange(apos,apos)}catch(e){}}}
}
/* ---------- embed + chart ---------- */
function embedHtml(raw){
  if(!raw)return'';raw=raw.trim();let m=raw.match(/<iframe[^>]+src=["']([^"']+)["']/i),u=m?m[1]:null;
  if(!u){m=raw.match(/cite=["']([^"']+)["']/i);const v=m&&m[1].match(/video\/(\d+)/);if(v)u='https://www.tiktok.com/embed/v2/'+v[1]}
  if(!u&&/^https?:\/\//i.test(raw))u=raw;
  if(!u||!/^https:\/\//i.test(u))return'<p class="note" style="padding:20px">Only https links or iframe embed codes work.</p>';
  u=u.replace(/&amp;/g,'&');
  if(/\.(mp4|webm|mov)(\?|$)/i.test(u))return`<video src="${esc(u)}" controls playsinline></video>`;
  if(/\.(png|jpe?g|gif|webp)(\?|$)/i.test(u))return`<img src="${esc(u)}" alt="Ad preview">`;
  const tt=u.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);if(tt)u='https://www.tiktok.com/embed/v2/'+tt[1];
  return`<iframe src="${esc(u)}" sandbox="allow-scripts allow-same-origin allow-popups" allow="autoplay; encrypted-media; fullscreen" loading="lazy" title="Ad preview"></iframe>`;
}
function chart(pts,k){
  if(!pts.length)return'<p class="note">No points yet. Save points from Home or log one below.</p>';
  const v=pts.map(p=>typeof p.v[k]==='number'?p.v[k]:null),ok=v.filter(x=>x!=null);if(!ok.length)return`<p class="note">No values for ${esc(k)} in these points.</p>`;
  const W=600,H=200,L=48,R=14,T=14,B=26;let lo=Math.min(...ok),hi=Math.max(...ok);if(lo===hi){lo-=1;hi+=1}const pad=(hi-lo)*.1;lo-=pad;hi+=pad;
  const X=i=>pts.length===1?(L+W-R)/2:L+i*(W-L-R)/(pts.length-1),Y=x=>T+(H-T-B)*(1-(x-lo)/(hi-lo));
  const line=v.map((x,i)=>x==null?null:X(i)+','+Y(x)).filter(Boolean).join(' ');
  const grid=[0,.5,1].map(f=>{const y=T+(H-T-B)*f;return`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${L-6}" y="${y+4}" text-anchor="end" font-size="10" fill="var(--mut)">${fmt(k,hi-(hi-lo)*f)}</text>`}).join('');
  return`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(k)} over time">${grid}<polyline fill="none" stroke="var(--ac)" stroke-width="2.5" stroke-linejoin="round" points="${line}"/>${v.map((x,i)=>x==null?'':`<circle data-p="${i}" cx="${X(i)}" cy="${Y(x)}" r="${selPt===i?7:5}" fill="${selPt===i?'#fff':'var(--ac)'}" stroke="var(--ac)" stroke-width="2.5" style="cursor:pointer"><title>${esc(pts[i].date)}: ${fmt(k,x)}</title></circle>`).join('')}<text x="${L}" y="${H-6}" font-size="10" fill="var(--mut)">${dshort(pts[0].date)}</text><text x="${W-R}" y="${H-6}" text-anchor="end" font-size="10" fill="var(--mut)">${dshort(pts[pts.length-1].date)}</text></svg>`;
}
function mediaUrl(raw){raw=(raw||'').trim();let m=raw.match(/<iframe[^>]+src=["']([^"']+)["']/i)||raw.match(/cite=["']([^"']+)["']/i);let u=m?m[1]:/^https?:\/\//i.test(raw)?raw:'';u=u.replace(/&amp;/g,'&');return/^https:\/\//i.test(u)?u:''}
function mediaBlock(a,emb){if(!emb)return'';if(pvMode==='inline')return`<div class="preview">${embedHtml(emb)}</div>`;
  const u=mediaUrl(emb);return u?`<a class="go linkbtn" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${a.Format==='Video'?ICON.video:ICON.image}<span>Open ${a.Format==='Video'?'video':'image'}</span></a>`:'<p class="note">Add an https link or embed code to open the media.</p>'}
/* ---------- ad sheet ---------- */
function sheet(){
  const a=ad(openKey),ms=metricsFor(a),pts=ptsOf(a.__key),emb=embedOf(a);
  const info=['Event','Format','Ad Set/Audience','Launch Date','Stop Date','Confidence Score','Action','Variable for Testing','Campaign','Ad ID'].filter(k=>a[k]!=null);
  $('#modal').innerHTML=`<div class="modal" id="ov"><div class="sheet" role="dialog" aria-modal="true"><button class="x" id="cl" aria-label="Close">×</button>
  <h2>${esc(nameOf(a))}</h2><div class="row">${tag(a)}<span class="badge">${esc(a.__tab)}</span><button class="ghost sm" id="rn" style="margin-left:auto">Rename</button></div>
  ${nameOf(a)!==a['Ad Name & Preview']?`<p class="note">Original name: ${esc(a['Ad Name & Preview'])}</p>`:''}
  <div class="sec"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h4 style="margin:0">Media</h4><div class="seg"><button class="${pvMode==='inline'?'on':''}" data-pv="inline">Preview</button><button class="${pvMode==='link'?'on':''}" data-pv="link">Click to view</button></div></div>${mediaBlock(a,emb)}<div class="row fld" style="margin-top:8px"><input id="emb" placeholder="Paste a preview link or embed code" value="${esc(emb)}"><button class="ghost" id="svEmb">${emb?'Update':'Add preview'}</button></div><p class="note">Accepts https iframe embed codes, TikTok video links, and direct image or video links. Some sites block embedding.</p></div>
  <div class="sec"><h4>Current numbers</h4><div class="kv">${ms.map(k=>`<div><span>${k}</span><b>${fmt(k,a[k])}</b></div>`).join('')}</div></div>
  <div class="sec"><h4>Details</h4><div class="kv">${info.map(k=>`<div><span>${k}</span><b>${esc(a[k])}</b></div>`).join('')}</div>${a.Hypothesis?`<p class="note"><b>Hypothesis:</b> ${esc(a.Hypothesis)}</p>`:''}${a['Conclusion / Notes']?`<p class="note"><b>Notes:</b> ${esc(a['Conclusion / Notes'])}</p>`:''}</div>
  <div class="sec"><h4>Performance over time</h4><div class="fld"><select id="mt">${ms.map(k=>`<option ${k===metric?'selected':''}>${k}</option>`).join('')}</select></div>${chart(pts,metric)}
  <div>${pts.map((p,i)=>`<div class="pt ${selPt===i?'sel':''}"><span>${dshort(p.date)}${p.source==='auto'?'':' (manual)'} · ${esc(metric)} <b>${fmt(metric,p.v[metric])}</b></span><button class="del" data-del="${esc(p.id)}">Delete</button></div>`).join('')}</div></div>
  <div class="sec"><h4>Add a point by hand</h4><div class="form"><div><label>Date</label><input type="date" id="fd" value="${new Date().toISOString().slice(0,10)}"></div>${ms.map(k=>`<div><label>${k}${MONEY.has(k)?' ($)':''}</label><input data-m="${esc(k)}" inputmode="decimal" value="${a[k]??''}"></div>`).join('')}</div><p class="note">CIR accepts 40% or 0.40.</p><button class="go full" id="log" style="margin-top:10px">Save point</button></div></div></div>`;
}
/* ---------- events ---------- */
async function doRename(k){const a=ad(k),n=await ask('Rename ad',nameOf(a));if(n==null||n===nameOf(a))return;(D.meta[k]=D.meta[k]||{}).name=n;render();try{await api('rename',{key:k,name:n});toast('Renamed')}catch(e){toast(e.message)}}
document.addEventListener('click',async e=>{
  const t=e.target,c=s=>t.closest(s);
  if(c('#burger')){$('#side').classList.add('open');$('#scrim').classList.add('show');return}
  if(c('#scrim')){$('#side').classList.remove('open');$('#scrim').classList.remove('show');return}
  if(c('[data-v]')){view=c('[data-v]').dataset.v;F={q:'',status:'Active',sort:F.sort,dir:F.dir};$('#side').classList.remove('open');$('#scrim').classList.remove('show');render();scrollTo(0,0);return}
  if(c('#settings'))return settings();
  if(c('#refresh'))return view==='perf'?loadPerf():load();
  if(c('[data-s]')){F.status=c('[data-s]').dataset.s;list();return}
  if(c('[data-rn]'))return doRename(c('[data-rn]').dataset.rn);
  if(c('[data-layout]')){layout=c('[data-layout]').dataset.layout;localStorage.setItem('trakks_layout',layout);list();return}
  if(c('th[data-sort]')){const k=c('th[data-sort]').dataset.sort;if(F.sort===k)F.dir=F.dir==='asc'?'desc':'asc';else{F.sort=k;F.dir=defDir(k)}list();return}
  if(c('[data-pv]')){pvMode=c('[data-pv]').dataset.pv;localStorage.setItem('trakks_pv',pvMode);sheet();return}
  if(c('tr[data-k]')){openKey=c('tr[data-k]').dataset.k;selPt=null;metric='Spent';sheet();return}
  if(c('#snap')){const b=$('#snap');b.disabled=true;b.textContent='Saving…';try{const r=await api('snapshotAll',{activeOnly:$('#actOnly').checked});toast('Saved points for '+r.count+' ads');D=await api('getAds');render()}catch(er){toast(er.message);b.disabled=false;b.textContent='Save points for all ads'}return}
  if(c('.card')&&!c('.ib')||c('.ib[data-k]')){openKey=c('.card,.ib').dataset.k;selPt=null;metric='Spent';sheet();return}
  if(t.id==='ov'||t.id==='cl'){openKey=null;$('#modal').innerHTML='';return}
  if(t.id==='rn')return doRename(openKey);
  if(t.id==='svEmb'){const v=$('#emb').value.trim();(D.meta[openKey]=D.meta[openKey]||{}).embed=v;sheet();render();try{await api('embed',{key:openKey,embed:v});toast('Preview saved')}catch(er){toast(er.message)}return}
  if(c('[data-p]')){selPt=+c('[data-p]').dataset.p;sheet();return}
  if(c('[data-del]')){const id=c('[data-del]').dataset.del;if(!confirm('Delete this point? This cannot be undone.'))return;D.points[openKey]=D.points[openKey].filter(p=>p.id!==id);selPt=null;sheet();try{await api('deletePoint',{id});toast('Point deleted')}catch(er){toast(er.message)}return}
  if(t.id==='log'){
    const v={};let bad=null;document.querySelectorAll('[data-m]').forEach(i=>{let s=i.value.trim().replace(/[,₱$\s]/g,'');if(!s)return;const pct=s.endsWith('%');let n=parseFloat(s.replace('%',''));if(isNaN(n)){bad=i.dataset.m;return}if(pct&&i.dataset.m==='CIR')n/=100;v[i.dataset.m]=n});
    if(bad)return toast(`"${bad}" is not a number`);if(!Object.keys(v).length)return toast('Enter at least one value');
    const date=$('#fd').value;t.disabled=true;try{const r=await api('addPoint',{key:openKey,date,values:v});(D.points[openKey]=D.points[openKey]||[]).push({id:r.id,date,ts:Date.now(),source:'manual',v});sheet();render();toast('Point saved')}catch(er){toast(er.message);t.disabled=false}
  }
});
document.addEventListener('input',e=>{if(e.target.id==='q'){F.q=e.target.value;list()}if(e.target.id==='minsp'){F.minSpend=e.target.value.replace(/[^\d.]/g,'');list()}if(e.target.id==='navq'){navq=e.target.value;renderNav()}});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.f!==undefined){F[t.dataset.f]=t.value;list()}if(t.id==='sort'&&t.value){[F.sort,F.dir]=t.value.split(':');list()}if(t.id==='dfrom'){F.from=t.value;list()}if(t.id==='dto'){F.to=t.value;list()}if(t.id==='shownotes'){showNotes=t.checked;localStorage.setItem('trakks_notes',showNotes?'1':'0');list()}if(t.id==='mt'){metric=t.value;selPt=null;sheet()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&openKey&&!document.querySelector('.modal[style]')){openKey=null;$('#modal').innerHTML=''}});
function settings(){
  const m=document.createElement('div');m.className='modal';m.style.zIndex=50;
  m.innerHTML=`<div class="sheet small"><h2>Settings</h2><div class="fld"><label class="note">Web App URL (ends in /exec)</label><input id="cu" value="${esc(cfg.url||'')}" placeholder="https://script.google.com/macros/s/…/exec"></div><div class="fld" style="margin-top:10px"><label class="note">Meta Performance URL (from the daily tracker script)</label><input id="cp" value="${esc(cfg.perfUrl||'')}" placeholder="https://script.google.com/macros/s/…/exec"></div><div class="fld" style="margin-top:10px"><label class="note">Token (same as TOKEN in Code.gs)</label><input id="ct" type="password" value="${esc(cfg.token||'')}"></div><button class="go full" style="margin-top:14px">Save and load</button></div>`;
  document.body.appendChild(m);m.onclick=e=>{if(e.target===m&&(cfg.url||cfg.perfUrl))m.remove()};
  m.querySelector('.go').onclick=()=>{cfg={url:m.querySelector('#cu').value.trim(),perfUrl:m.querySelector('#cp').value.trim(),token:m.querySelector('#ct').value.trim()};localStorage.setItem('trakks_cfg',JSON.stringify(cfg));m.remove();load()};
}
renderNav();load();
