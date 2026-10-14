/* trakks: ad performance visualizer, grouped by channel (Meta, TikTok, Google) */
const NUM=['Spent','Purchases','Conv. Value','CPO','CIR','CPM','Frequency','CTR (%)','LPVr (%)','ATC+IC','Warm','Cost/Warm','Days Active','ThumbS (2s)','HoldR (6s)'];
const PCTF=new Set(['CIR','CTR (%)','LPVr (%)','ThumbS (2s)','HoldR (6s)']); // stored as fractions, shown as %
const MONEY=new Set(['Spent','Conv. Value','CPO','CPM','Cost/Warm']);
const FILT=[['Format','Format'],['Performance','Performance'],['Event','Event'],['Ad Set/Audience','Audience'],['Confidence Score','Confidence'],['Action','Action'],['Variable for Testing','Variable']];
const FUNNELS=['ALL','TOF','MOF','BOF'];
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- icons (same drawing style as the inspo workspace: 24px grid, 1.6 stroke, round caps) ---------- */
const SV='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const IC={
  home:'<path d="M3.5 10.6L12 3.5l8.5 7.1"/><path d="M5.5 9.2V19a2 2 0 002 2h9a2 2 0 002-2V9.2"/><path d="M10 21v-5a1 1 0 011-1h2a1 1 0 011 1v5"/>',
  upload:'<path d="M12 16V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 16v2.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V16"/>',
  assistant:'<path d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v8a2.5 2.5 0 01-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 014 13.5z"/><circle cx="9" cy="9.5" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="9.5" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="9.5" r=".9" fill="currentColor" stroke="none"/>',
  chart:'<rect x="3.5" y="12" width="4.5" height="8.5" rx=".8"/><rect x="9.75" y="7" width="4.5" height="13.5" rx=".8"/><rect x="16" y="3.5" width="4.5" height="17" rx=".8"/>',
  flower:'<ellipse cx="12" cy="6.4" rx="2.5" ry="3.4"/><ellipse cx="12" cy="6.4" rx="2.5" ry="3.4" transform="rotate(72 12 11)"/><ellipse cx="12" cy="6.4" rx="2.5" ry="3.4" transform="rotate(144 12 11)"/><ellipse cx="12" cy="6.4" rx="2.5" ry="3.4" transform="rotate(216 12 11)"/><ellipse cx="12" cy="6.4" rx="2.5" ry="3.4" transform="rotate(288 12 11)"/><circle cx="12" cy="11" r="1.7"/><path d="M12 20.5V16"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1.2"/><path d="M5 12v7.5A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5V12M12 8v13"/><path d="M12 8C9.8 8 7.5 7 7.5 5.3 7.5 4 8.5 3 9.8 3 11.3 3 12 5.2 12 8zM12 8c2.2 0 4.5-1 4.5-2.7C16.5 4 15.5 3 14.2 3 12.7 3 12 5.2 12 8z"/>',
  copy:'<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6A2.5 2.5 0 0013 3.5H6A2.5 2.5 0 003.5 6v7A2.5 2.5 0 006 15.5h2.5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  bag:'<path d="M5.2 8h13.6l-1 12.5H6.2z"/><path d="M9 8V6.5a3 3 0 016 0V8"/>',
  headphones:'<path d="M3.5 14v-2a8.5 8.5 0 0117 0v2"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.6"/>',
  megaphone:'<path d="M3.5 10v4a1 1 0 001 1H7l8 4.5v-15L7 9H4.5a1 1 0 00-1 1z"/><path d="M18.5 9a4.5 4.5 0 010 6"/><path d="M7 15l1.3 4.5h2.4"/>',
  doc:'<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  sheet:'<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h7M12 13v5"/>',
  google:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  tiktok:'<path d="M14.5 3v11a3.5 3.5 0 11-3.5-3.5"/><path d="M14.5 3c.3 2.5 2 4.3 5 4.6"/>',
  server:'<rect x="3" y="3.5" width="18" height="7" rx="2"/><rect x="3" y="13.5" width="18" height="7" rx="2"/><circle cx="7" cy="7" r=".9" fill="currentColor" stroke="none"/><circle cx="7" cy="17" r=".9" fill="currentColor" stroke="none"/><path d="M11 7h6M11 17h6"/>',
  db:'<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  wrench:'<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94z"/>',
  ext:'<path d="M7 17L17 7M8 7h9v9"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.8"/><path d="M21 16l-5-5-9 10"/>',
  video:'<rect x="2" y="5" width="14" height="14" rx="3"/><path d="M16 10l6-3v10l-6-3"/>',
  link:'<path d="M10 13.5a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1"/><path d="M14 10.5a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1"/>',
  refresh:'<path d="M20 11a8 8 0 00-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0014.5 4.5L20 16M20 20v-4h-4"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  logout:'<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>'
};
const ic=(n,c)=>`<svg ${SV}${c?` class="${c}"`:''}>${IC[n]||''}</svg>`;

/* ---------- storage + cache ---------- */
const ls=(k,d)=>{try{return localStorage.getItem(k)||d}catch(e){return d}};
const lset=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const CK='trakks:v2:';
function cget(k){try{const s=localStorage.getItem(CK+k);return s?JSON.parse(s):null}catch(e){return null}}
function cset(k,v){const s=JSON.stringify(v);try{localStorage.setItem(CK+k,s);return true}catch(e){
  try{Object.keys(localStorage).filter(x=>x.startsWith(CK)&&x!==CK+k).forEach(x=>localStorage.removeItem(x));localStorage.setItem(CK+k,s);return true}catch(e2){return false}}}
function rel(ts){const s=Math.round((Date.now()-ts)/1000);if(s<60)return'just now';const m=Math.round(s/60);if(m<60)return m+' min ago';const h=Math.round(m/60);return h<24?h+' h ago':Math.round(h/24)+' d ago'}
const fmtUpd=u=>u&&(u.date||u.time)?[u.date,u.time].filter(Boolean).join(' at '):'';

/* ---------- state ---------- */
let TOKEN=ls('trakks_token','');
let D={ads:[],meta:{},points:{}},UPD={},TS={},ERR={},LOAD={};
let view=ls('trakks_view','home'),openKey=null,metric='Spent',selPt=null,navq='',PICK=null;
let F={q:'',status:'Active',funnel:'ALL',sort:'Launch Date',dir:'desc'};
let layout=ls('trakks_layout','cards'),showNotes=ls('trakks_notes','1')!=='0',pvMode=ls('trakks_pv','inline');
let _mc={};
const brandOf=id=>BRANDS.find(b=>b.id===id);
const isBrandView=v=>/^(meta|tt):/.test(v);
function viewInfo(v){const[ch,id]=String(v).split(':'),b=brandOf(id);return b&&(ch==='meta'||(ch==='tt'&&b.tiktok))?{ch,b}:null}
const viewAds=v=>{const i=viewInfo(v);return i?D.ads.filter(a=>a.__brand===i.b.id&&a.__ch===i.ch):[]};
const titleOf=v=>v==='home'?'Home':v==='perf'?'Account Performance':(viewInfo(v)?viewInfo(v).b.name+' · '+(viewInfo(v).ch==='tt'?'TikTok Ads':'Meta Ads'):'Home');
const funnelOf=a=>String(a.__tab||'').slice(0,3).toUpperCase();
function metricsFor(a){const key=a.__brand+'|'+a.__ch+'|'+a.__tab;return _mc[key]||(_mc[key]=NUM.filter(k=>D.ads.some(x=>x.__brand===a.__brand&&x.__tab===a.__tab&&typeof x[k]==='number')))}

/* ---------- network ---------- */
async function fetchJson(url,opts,ms){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||30000);
  try{
    const r=await fetch(url,{...(opts||{}),signal:c.signal}),j=await r.json();
    if(j&&j.error){const e=new Error(j.error==='Bad token'?'The access token was rejected.':j.error);e.auth=j.error==='Bad token';throw e}
    return j;
  }catch(e){
    if(e.name==='AbortError')throw new Error('The request timed out');
    if(e instanceof TypeError)throw new Error('No connection to the server');
    throw e;
  }finally{clearTimeout(t)}
}
function api(action,body,bid){
  const url=brandOf(bid).ads;
  return body?fetchJson(url,{method:'POST',body:JSON.stringify({token:TOKEN,action,...body})}):fetchJson(url+'?action='+action+'&token='+encodeURIComponent(TOKEN));
}
function toast(m){const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),2800)}
function authLost(){TOKEN='';try{localStorage.removeItem('trakks_token')}catch(e){}showLogin('The access token was rejected. Sign in again.')}

/* ---------- data: load, cache, merge ---------- */
function ingest(bid,j){
  D.ads=D.ads.filter(a=>a.__brand!==bid);
  const p=bid+'|';
  Object.keys(D.meta).forEach(k=>{if(k.startsWith(p))delete D.meta[k]});
  Object.keys(D.points).forEach(k=>{if(k.startsWith(p))delete D.points[k]});
  (j.ads||[]).forEach(a0=>{const a={...a0};a.__brand=bid;a.__orig=a.__key;a.__key=p+a.__key;a.__ch=/tiktok/i.test(a.__tab||'')?'tt':'meta';D.ads.push(a)});
  for(const k in j.meta||{})D.meta[p+k]=j.meta[k];
  for(const k in j.points||{})D.points[p+k]=j.points[k];
  UPD[bid]=j.updated||null;TS[bid]=j.ts||Date.now();_mc={};
}
function rawOf(bid){
  const p=bid+'|',meta={},points={};
  const ads=D.ads.filter(a=>a.__brand===bid).map(a=>{const o={...a};o.__key=a.__orig;delete o.__brand;delete o.__orig;delete o.__ch;return o});
  for(const k in D.meta)if(k.startsWith(p))meta[k.slice(p.length)]=D.meta[k];
  for(const k in D.points)if(k.startsWith(p))points[k.slice(p.length)]=D.points[k];
  return{ads,meta,points,updated:UPD[bid]||null,ts:TS[bid]||Date.now()};
}
const persist=bid=>cset('ads:'+bid,rawOf(bid));
function hydrate(){BRANDS.forEach(b=>{const c=cget('ads:'+b.id);if(c)ingest(b.id,c)})}
async function loadBrand(bid){
  LOAD[bid]=1;renderStatus();
  try{const j=await api('getAds',null,bid);j.ts=Date.now();ingest(bid,j);persist(bid);delete ERR[bid]}
  catch(e){
    if(e.auth){delete LOAD[bid];return authLost()}
    ERR[bid]=e.message;
    if(TS[bid])toast(brandOf(bid).name+': '+e.message+'. Showing saved data.');
  }
  delete LOAD[bid];render(true);
}
function refreshAll(){BRANDS.forEach(b=>loadBrand(b.id));if(typeof loadPerf==='function')loadPerf()}

/* ---------- helpers ---------- */
const ad=k=>D.ads.find(a=>a.__key===k);
const metaOf=a=>D.meta[a.__key]||{};
const nameOf=a=>metaOf(a).name||a['Ad Name & Preview']||'(unnamed)';
const embedOf=a=>metaOf(a).embed||'';
const productOf=a=>metaOf(a).product||'';
const imageOf=a=>metaOf(a).image||'';
const ptsOf=k=>(D.points[k]||[]).slice().sort((x,y)=>x.date.localeCompare(y.date)||x.ts-y.ts);
function fmt(k,v){if(v==null||v==='')return'–';if(typeof v!=='number')return esc(v);if(PCTF.has(k))return(v*100).toFixed(k==='CTR (%)'?2:1)+'%';if(MONEY.has(k))return'$'+v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});if(['Purchases','Warm','Days Active'].includes(k))return Math.round(v).toLocaleString();return v.toLocaleString(undefined,{maximumFractionDigits:2})}
const dshort=s=>{if(!s)return'';const d=new Date(s+'T00:00:00');return isNaN(d)?s:d.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})};
function agg(rows){const sp=rows.reduce((s,a)=>s+(+a.Spent||0),0),pu=rows.reduce((s,a)=>s+(+a.Purchases||0),0);return{sp,pu,cpo:pu?sp/pu:null,n:rows.length,act:rows.filter(a=>a.Status==='Active').length}}
function popup(inner){const m=document.createElement('div');m.className='modal pop';m.innerHTML=`<div class="sheet small">${inner}</div>`;document.body.appendChild(m);
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-close]'))m.remove()});return m}
function ask(title,val,okLabel){return new Promise(res=>{const m=popup(`<h3>${esc(title)}</h3><div class="field"><input value="${esc(val)}"></div><div class="row"><button class="ghost" style="flex:1" data-close>Cancel</button><button class="go" style="flex:1;width:auto">${okLabel||'Save'}</button></div>`);
  const i=m.querySelector('input');i.focus();i.select();let done=false;const fin=v=>{if(done)return;done=true;m.remove();res(v)};
  m.querySelector('.go').onclick=()=>fin(i.value.trim());m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-close]'))fin(null)});
  i.onkeydown=e=>{if(e.key==='Enter')fin(i.value.trim());if(e.key==='Escape')fin(null)}})}

/* ---------- sidebar ---------- */
const cnt=(bid,ch)=>TS[bid]?D.ads.filter(a=>a.__brand===bid&&a.__ch===ch&&a.Status==='Active').length:null;
function navGroups(){return[
  {l:'Workspace',items:[{id:'home',t:'Home',i:'home'},{href:LINKS.upload,t:'Ads for Upload',i:'upload'},{href:LINKS.brain,t:'Potico Brain',i:'assistant'}]},
  {l:'Meta Ads',items:[{id:'perf',t:'Account Performance',i:'chart'},...BRANDS.map(b=>({id:'meta:'+b.id,t:b.name,i:b.icon,n:cnt(b.id,'meta')}))]},
  {l:'TikTok Ads',items:BRANDS.filter(b=>b.tiktok).map(b=>({id:'tt:'+b.id,t:b.name,i:b.icon,n:cnt(b.id,'tt')}))},
  {l:'Google Ads',items:[{href:LINKS.google,t:'Google Ads Manager',i:'google'}]}]}
const navLink=x=>x.href
  ?`<a class="sb-link" href="${esc(x.href)}" target="_blank" rel="noopener noreferrer">${ic(x.i)}<span>${esc(x.t)}</span>${ic('ext','sb-go')}</a>`
  :`<button type="button" class="sb-link ${view===x.id?'on':''}" data-v="${esc(x.id)}">${ic(x.i)}<span>${esc(x.t)}</span>${x.n!=null?`<em class="sb-n">${x.n}</em>`:''}</button>`;
function renderNav(){
  const q=navq.trim().toLowerCase();
  $('#nav').innerHTML=navGroups().map(g=>{const its=g.items.filter(x=>!q||(x.t+' '+g.l).toLowerCase().includes(q));
    return its.length?`<div class="sb-group"><p class="sb-lbl">${g.l}</p>${its.map(navLink).join('')}</div>`:''}).join('')||'<p class="note" style="padding:10px">No menu items match.</p>';
}
function renderFoot(){
  $('#sbFoot').innerHTML=`<button type="button" class="sb-link" id="niktin">${ic('copy')}<span>Niktin</span></button><button type="button" class="sb-link" id="backend">${ic('server')}<span>Backend</span></button><button type="button" class="sb-link" id="settings">${ic('wrench')}<span>Settings</span></button>`;
}

/* ---------- status line + refresh button ---------- */
function renderStatus(){
  const el=$('#status'),busy=Object.keys(LOAD).length||(typeof PLOADING!=='undefined'&&PLOADING);
  let t='',bad=false;
  if(isBrandView(view)){
    const i=viewInfo(view);if(i){const id=i.b.id,u=fmtUpd(UPD[id]);
      if(ERR[id]&&TS[id]){t='Offline · saved data from '+rel(TS[id]);bad=true}else if(ERR[id]){t=ERR[id];bad=true}else if(u)t='Sheet updated '+u}
  }else if(view==='perf'&&typeof pStatus==='function'){const p=pStatus();t=p.t;bad=p.bad
  }else if(view==='home'){
    const err=BRANDS.filter(b=>ERR[b.id]).length;if(err){t=err+' of '+BRANDS.length+' accounts could not refresh · showing saved data';bad=true}
  }
  el.textContent=t;el.classList.toggle('bad',bad);
  const b=$('#refresh');b.disabled=!!busy;b.innerHTML=ic('refresh')+'<span>'+(busy?'Refreshing…':'Refresh')+'</span>';
}

/* ---------- pages ---------- */
function render(keepSheet){
  renderNav();renderStatus();$('#title').textContent=titleOf(view);
  const main=$('#main');main.classList.toggle('wide',view==='perf'||(isBrandView(view)&&layout==='cols'));
  if(view==='perf')perfPage();else if(view==='home')home();else list();
  if(!keepSheet&&openKey&&ad(openKey))sheet();
}
function lastAuto(){let d='',n=0;Object.values(D.points).flat().forEach(p=>{if(p.source==='auto'){if(p.date>d){d=p.date;n=0}if(p.date===d)n++}});return{d,n}}
function brandCard(b,ch){
  const loaded=!!TS[b.id],a=agg(D.ads.filter(x=>x.__brand===b.id&&x.__ch===ch));
  const links=ch==='meta'?[[b.meta.manager,'megaphone','Ads Manager'],[b.meta.reports,'doc','Reports']]:[[b.tiktok.manager,'megaphone','Ads Manager']];
  const sub=loaded?`${a.act} of ${a.n} ads active`:(ERR[b.id]?'Could not load':'Loading…');
  const v=(k,x)=>loaded?fmt(k,x):'–';
  return`<div class="hs-card click" data-v="${ch}:${b.id}"><div class="hc-head"><span class="tile-ic">${ic(b.icon)}</span><div class="hc-t"><b>${esc(b.name)}</b><small>${esc(sub)}</small></div>${ic('ext','tile-go')}</div>
  <div class="hc-stats"><div><span>Spent</span><b>${v('Spent',a.sp)}</b></div><div><span>Purchases</span><b>${v('Purchases',a.pu)}</b></div><div><span>CPO</span><b>${v('CPO',a.cpo)}</b></div></div>
  <div class="hc-btns">${links.map(([h,i,t])=>`<a class="ghost sm btn-ic" href="${esc(h)}" target="_blank" rel="noopener noreferrer">${ic(i)}<span>${t}</span></a>`).join('')}</div></div>`;
}
const tile=(href,i,t,sm,d)=>`<a class="tile" href="${esc(href)}" target="_blank" rel="noopener noreferrer"><span class="tile-ic">${ic(i)}</span><div class="tile-t"><b>${esc(t)}</b><small>${esc(sm)}</small></div>${ic('ext','tile-go')}<p class="tile-d">${esc(d)}</p></a>`;
function home(){
  const la=lastAuto(),today=new Date().toLocaleDateString('en',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const snap=BRANDS.some(b=>TS[b.id]);
  $('#main').innerHTML=`<div class="hero"><div><h2>Save today's points</h2><p>${la.d?`Last saved ${dshort(la.d)} for ${la.n} ads. `:'No points saved yet. '}Saves the current numbers of every ad, in every channel, as a point on its graph. Saving twice on the same day replaces the earlier point.</p><label class="chk"><input type="checkbox" id="actOnly" checked> Active ads only</label></div><button class="go" id="snap" ${snap?'':'disabled'}>Save points for all ads</button></div>
  <div class="sec-head">Meta Ads<span>${esc(today)}</span></div><div class="cards">${BRANDS.map(b=>brandCard(b,'meta')).join('')}</div>
  <div class="sec-head">TikTok Ads<span></span></div><div class="cards">${BRANDS.filter(b=>b.tiktok).map(b=>brandCard(b,'tt')).join('')}</div>
  <div class="sec-head">Google Ads<span></span></div><div class="cards">${tile(LINKS.google,'google','Google Ads Manager','Google Ads','Opens in a new tab')}</div>
  <div class="sec-head">Workspace<span></span></div><div class="cards">${tile(LINKS.upload,'upload','Ads for Upload','Google Sheet','Opens the upload sheet in a new tab')}${tile(LINKS.brain,'assistant','Potico Brain','App','Opens Potico Brain in a new tab')}</div>`;
}
function rowsFor(){
  return viewAds(view).filter(a=>{
    if(F.status&&a.Status!==F.status)return false;
    if(F.funnel&&F.funnel!=='ALL'&&funnelOf(a)!==F.funnel)return false;
    if(F.from||F.to){const ls_=a['Launch Date']||'',sp=a['Stop Date']||'';if(!ls_)return false;
      if(F.dmode==='run'){if(F.to&&ls_>F.to)return false;if(F.from&&sp&&sp<F.from)return false}else{if(F.from&&ls_<F.from)return false;if(F.to&&ls_>F.to)return false}}
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
const perfCls=p=>/^(really good|good)$/i.test(p)?'g':/^(declining|not good)$/i.test(p)?'b':/^okay$/i.test(p)?'o':'';
const tag=a=>(a.Status?`<span class="st ${esc(a.Status)}">${esc(a.Status)}</span>`:'')+(a.Format?`<span class="st ${esc(a.Format)}">${esc(a.Format)}</span>`:'');
function noteBlock(a){if(!showNotes||!(a.Hypothesis||a['Conclusion / Notes']))return'';return`<div class="nt">${a.Hypothesis?`<p><b>Hypothesis:</b> ${esc(a.Hypothesis)}</p>`:''}${a['Conclusion / Notes']?`<p><b>Notes:</b> ${esc(a['Conclusion / Notes'])}</p>`:''}</div>`}
const thumbFor=a=>thumbSrc(embedOf(a))||imageOf(a);
function cardHtml(a){
  const n=(D.points[a.__key]||[]).length,img=thumbFor(a),prod=productOf(a);
  return`<div class="card" data-k="${esc(a.__key)}"><div class="crow"><div class="thumb">${img?`<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:(a.Format==='Video'?ic('video'):ic('image'))}</div><div class="cmain"><b title="${esc(nameOf(a))}">${esc(nameOf(a))}</b><small>Launched ${dshort(a['Launch Date'])||'–'}</small><span class="days">${a['Days Active']!=null?fmt('Days Active',a['Days Active'])+' days':''}${n?' · '+n+' pts':''}</span>${a.Performance?`<span class="pf ${perfCls(a.Performance)}">${esc(a.Performance)}</span>`:''}</div><div class="cside"><div class="tags">${tag(a)}</div><b>${fmt('Spent',a.Spent)}</b></div></div>${noteBlock(a)}
  <div class="cm">${['Purchases','CPO','CIR','Conv. Value'].map(k=>`<div><span>${k}</span><b>${fmt(k,a[k])}</b></div>`).join('')}</div>
  <div class="acts"><button class="ib" data-rn="${esc(a.__key)}" title="Rename" aria-label="Rename ad">${ic('edit')}</button>${prod?`<a class="ib" href="${esc(prod)}" target="_blank" rel="noopener noreferrer" title="Open product page" aria-label="Open product page">${ic('bag')}</a>`:''}<button class="ib" data-k="${esc(a.__key)}" title="Open" aria-label="Open ad">${ic('eye')}</button></div></div>`;
}
function tableHtml(rows){
  const cols=['Status','Format','Performance','Event','Ad Set/Audience','Spent','Purchases','CPO','CIR','CPM','Frequency','CTR (%)','LPVr (%)','ATC+IC','Warm','Cost/Warm','ThumbS (2s)','HoldR (6s)'].filter(k=>['Status','Format'].includes(k)||rows.some(a=>a[k]!=null));
  if(showNotes)['Hypothesis','Conclusion / Notes'].forEach(k=>{if(rows.some(a=>a[k]))cols.push(k)});
  const th=k=>`<th data-sort="${esc(k)}" class="${['Hypothesis','Conclusion / Notes'].includes(k)?'wt':''}">${esc(k)}${ar(k)}</th>`;
  return`<div class="tbl"><table><thead><tr><th data-sort="Name" class="stick">Ad${ar('Name')}</th>${cols.map(th).join('')}</tr></thead><tbody>${rows.map(a=>`<tr data-k="${esc(a.__key)}"><td class="stick"><div class="nm"><span title="${esc(nameOf(a))}">${esc(nameOf(a))}</span><button class="ib sm" data-rn="${esc(a.__key)}" aria-label="Rename ad">${ic('edit')}</button></div></td>${cols.map(k=>{const v=a[k];
    if(k==='Status')return`<td>${a.Status?`<span class="st ${esc(a.Status)}">${esc(a.Status)}</span>`:'–'}</td>`;
    if(k==='Format')return`<td>${a.Format?`<span class="st ${esc(a.Format)}">${esc(a.Format)}</span>`:'–'}</td>`;
    if(k==='Performance')return`<td>${v?`<span class="pf ${perfCls(v)}">${esc(v)}</span>`:'–'}</td>`;
    if(k==='Hypothesis'||k==='Conclusion / Notes')return`<td class="wt">${esc(v)}</td>`;
    return`<td class="${typeof v==='number'?'num':''}">${fmt(k,v)}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function list(){
  const i=viewInfo(view),main=$('#main');
  if(!i){view='home';lset('trakks_view',view);return render()}
  const b=i.b;
  if(!TS[b.id]){main.innerHTML=ERR[b.id]?`<div class="empty">${esc(ERR[b.id])}<br><br><button class="ghost" id="retry">Try again</button></div>`:'<div class="loading">Loading your ads…</div>';return}
  const base=viewAds(view),rows=rowsFor(),s=agg(rows);
  const ae=document.activeElement,aid=ae&&ae.id,apos=ae&&ae.selectionStart;
  const sels=FILT.map(([k,l])=>{const vals=[...new Set(base.map(a=>String(a[k]??'None')))].sort();return vals.length<2?'':`<select data-f="${esc(k)}" aria-label="${l}"><option value="">${l}: all</option>${vals.map(v=>`<option ${F[k]===v?'selected':''}>${esc(v)}</option>`).join('')}</select>`}).join('');
  const btns=i.ch==='tt'?`<a class="ghost btn-ic" href="${esc(b.tiktok.manager)}" target="_blank" rel="noopener noreferrer">${ic('megaphone')}<span>TikTok Ads Manager</span></a>`
    :`<a class="ghost btn-ic" href="${esc(b.meta.manager)}" target="_blank" rel="noopener noreferrer">${ic('megaphone')}<span>Meta Ads Manager</span></a><a class="ghost btn-ic" href="${esc(b.meta.reports)}" target="_blank" rel="noopener noreferrer">${ic('doc')}<span>Meta Reports</span></a>`;
  main.innerHTML=`${ERR[b.id]?`<div class="banner">Could not refresh (${esc(ERR[b.id])}). Showing data saved ${rel(TS[b.id])}. <button class="ghost sm" id="retry" style="margin-left:6px">Try again</button></div>`:''}
  <div class="actions"><button class="ghost btn-ic" id="addAd" type="button">${ic('plus')}<span>Add ad</span></button>${btns}</div>
  <div class="tabs" role="tablist">${FUNNELS.map(f=>`<button class="tab ${F.funnel===f?'on':''}" role="tab" aria-selected="${F.funnel===f}" data-ft="${f}">${f}</button>`).join('')}</div>
  <div class="stats"><div class="stat"><span>Spent</span><b>${fmt('Spent',s.sp)}</b></div><div class="stat"><span>Purchases</span><b>${fmt('Purchases',s.pu)}</b></div><div class="stat"><span>Avg CPO</span><b>${fmt('CPO',s.cpo)}</b></div><span class="badge">${s.n} ads</span></div>
  <input class="search" id="q" placeholder="Search by ad name, ID, hypothesis or notes" value="${esc(F.q)}">
  <div class="chips">${['Active','Paused',''].map(v=>`<button class="chip ${F.status===v?'on':''}" data-s="${v}">${v||'All'}</button>`).join('')}<span class="gap"></span><div class="seg"><button class="${layout==='cards'?'on':''}" data-layout="cards">Cards</button><button class="${layout==='cols'?'on':''}" data-layout="cols">Columns</button></div></div>
  <div class="sels"><input id="minsp" type="text" inputmode="decimal" autocomplete="off" placeholder="Min spend $" aria-label="Minimum spend in dollars" value="${esc(F.minSpend??'')}"><label class="dl"><span>From</span><input type="date" id="dfrom" value="${esc(F.from||'')}"></label><label class="dl"><span>To</span><input type="date" id="dto" value="${esc(F.to||'')}"></label><select data-f="dmode" aria-label="Date mode"><option value="">Launched in range</option><option value="run" ${F.dmode==='run'?'selected':''}>Running in range</option></select>${sels}
  <select data-f="notes" aria-label="Notes filter"><option value="">Notes: all</option><option value="has" ${F.notes==='has'?'selected':''}>Has notes or hypothesis</option><option value="none" ${F.notes==='none'?'selected':''}>No notes</option></select>
  <select id="sort" aria-label="Sort">${SORTS.some(([v])=>v===F.sort+':'+F.dir)?'':`<option value="" selected>Sort: ${esc(F.sort)} ${F.dir==='asc'?'↑':'↓'}</option>`}${SORTS.map(([v,l])=>`<option value="${v}" ${v===F.sort+':'+F.dir?'selected':''}>Sort: ${l}</option>`).join('')}</select></div>
  <label class="chk"><input type="checkbox" id="shownotes" ${showNotes?'checked':''}> Show notes &amp; hypothesis</label>
  ${!rows.length?'<div class="empty">No ads match these filters.</div>':layout==='cols'?tableHtml(rows):`<div class="grid">${rows.map(cardHtml).join('')}</div>`}`;
  if(aid){const el=document.getElementById(aid);if(el){el.focus();try{if(apos!=null)el.setSelectionRange(apos,apos)}catch(e){}}}
}

/* ---------- embed + chart ---------- */
const driveId=r=>{const m=String(r||'').match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^\s"']*?id=)([\w-]{15,})/);return m?m[1]:''};
const thumbSrc=e=>{const d=driveId(e);return d?'https://drive.google.com/thumbnail?id='+d+'&sz=w240':/\.(png|jpe?g|gif|webp)(\?|$)/i.test(e)?e:''};
function embedHtml(raw){
  if(!raw)return'';raw=raw.trim();
  const di=driveId(raw);if(di)return`<iframe src="https://drive.google.com/file/d/${di}/preview" sandbox="allow-scripts allow-same-origin allow-popups" allow="autoplay; encrypted-media; fullscreen" loading="lazy" title="Ad preview"></iframe>`;let m=raw.match(/<iframe[^>]+src=["']([^"']+)["']/i),u=m?m[1]:null;
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
  return`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(k)} over time">${grid}<polyline fill="none" stroke="var(--ac)" stroke-width="2.5" stroke-linejoin="round" points="${line}"/>${v.map((x,i)=>x==null?'':`<circle data-p="${i}" cx="${X(i)}" cy="${Y(x)}" r="${selPt===i?7:5}" fill="${selPt===i?'var(--panel)':'var(--ac)'}" stroke="var(--ac)" stroke-width="2.5" style="cursor:pointer"><title>${esc(pts[i].date)}: ${fmt(k,x)}</title></circle>`).join('')}<text x="${L}" y="${H-6}" font-size="10" fill="var(--mut)">${dshort(pts[0].date)}</text><text x="${W-R}" y="${H-6}" text-anchor="end" font-size="10" fill="var(--mut)">${dshort(pts[pts.length-1].date)}</text></svg>`;
}
function mediaUrl(raw){raw=(raw||'').trim();const di=driveId(raw);if(di)return'https://drive.google.com/file/d/'+di+'/view';let m=raw.match(/<iframe[^>]+src=["']([^"']+)["']/i)||raw.match(/cite=["']([^"']+)["']/i);let u=m?m[1]:/^https?:\/\//i.test(raw)?raw:'';u=u.replace(/&amp;/g,'&');return/^https:\/\//i.test(u)?u:''}
function mediaBlock(a,emb){
  const pimg=imageOf(a);
  if(!emb){
    if(!pimg)return'';
    return pvMode==='inline'?`<div class="preview"><img src="${esc(pimg)}" alt="Product picture" referrerpolicy="no-referrer"></div><p class="note">Showing the product picture because no preview is set.</p>`
      :`<a class="ghost btn-ic" style="width:100%" href="${esc(pimg)}" target="_blank" rel="noopener noreferrer">${ic('image')}<span>Open product picture</span></a>`;
  }
  if(pvMode==='inline')return`<div class="preview">${embedHtml(emb)}</div>`;
  const u=mediaUrl(emb);return u?`<a class="ghost btn-ic" style="width:100%" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${a.Format==='Video'?ic('video'):ic('image')}<span>Open ${a.Format==='Video'?'video':'image'}</span></a>`:'<p class="note">Add an https link or embed code to open the media.</p>';
}
function pickHtml(pk,cur){
  if(pk.loading)return'<p class="note">Looking for product images…</p>';
  if(pk.err)return`<p class="note bad">${esc(pk.err)}</p>`;
  if(!pk.images.length)return'<p class="note">No images found on that page. Paste an image link below instead.</p>';
  return`<p class="note">${pk.title?esc(pk.title)+'. ':''}Pick the picture to use as this ad's default.</p><div class="img-grid">${pk.images.map((u,n)=>`<button type="button" class="img-tile ${u===cur?'on':''}" data-pick="${n}" aria-label="Use image ${n+1}"><img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer"></button>`).join('')}</div>`;
}

/* ---------- edit details + add ad ---------- */
let editOpen=false;
/* [sheet column, label, type, fixed options] */
const EDIT=[['Status','Status','sel',['Active','Paused']],['Performance','Performance'],['Event','Event'],['Ad Set/Audience','Audience / ad set'],['Confidence Score','Confidence score'],['Action','Action'],['Variable for Testing','Variable for testing'],['Format','Format'],['Launch Date','Launch date','date'],['Stop Date','Stop date','date'],['Campaign','Campaign'],['Campaign ID','Campaign ID'],['Ad Set ID','Ad Set ID'],['Hypothesis','Hypothesis','area'],['Conclusion / Notes','Notes','area']];
function fieldHtml(def,i,v,pool,attr){
  const[k,l,ty,fixed]=def;v=v==null?'':String(v);
  if(ty==='area')return`<div class="w2"><label>${l}</label><textarea ${attr}="${esc(k)}" rows="2">${esc(v)}</textarea></div>`;
  if(ty==='date')return`<div><label>${l}</label><input type="date" ${attr}="${esc(k)}" value="${esc(v.slice(0,10))}"></div>`;
  if(ty==='sel')return`<div><label>${l}</label><select ${attr}="${esc(k)}">${[...new Set([...fixed,v].filter(Boolean))].map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
  const vals=[...new Set(pool.map(x=>x[k]).filter(x=>x!=null&&x!==''&&typeof x!=='number').map(String))].sort().slice(0,60);
  return`<div><label>${l}</label><input ${attr}="${esc(k)}" list="dl${attr}${i}" value="${esc(v)}" autocomplete="off"><datalist id="dl${attr}${i}">${vals.map(o=>`<option value="${esc(o)}">`).join('')}</datalist></div>`;
}
function editForm(a){
  const pool=D.ads.filter(x=>x.__brand===a.__brand&&x.__ch===a.__ch);
  return`<div class="form ef">${EDIT.map((d,i)=>fieldHtml(d,i,a[d[0]],pool,'data-e')).join('')}</div>`;
}
async function saveEdit(){
  const a=ad(openKey);if(!a)return;const fields={};
  document.querySelectorAll('[data-e]').forEach(i=>{const k=i.dataset.e,nv=i.value.trim(),ov=a[k]==null?'':String(a[k]);if(nv!==ov.slice(0,i.type==='date'?10:undefined))fields[k]=nv});
  if(!Object.keys(fields).length)return toast('Nothing changed');
  const old={};Object.keys(fields).forEach(k=>old[k]=a[k]);
  Object.keys(fields).forEach(k=>{if(fields[k]==='')delete a[k];else a[k]=fields[k]});persist(a.__brand);sheet();render(true);
  const b=$('#svEdit');if(b){b.disabled=true;b.textContent='Saving…'}
  try{await api('updateAd',{key:a.__orig,fields},a.__brand);toast('Saved to the sheet')}
  catch(e){Object.keys(old).forEach(k=>{if(old[k]==null)delete a[k];else a[k]=old[k]});persist(a.__brand);if(openKey===a.__key)sheet();render(true);
    toast(/Unknown action/.test(e.message)?'This brand\'s Apps Script is an older version. Paste the updated script and redeploy it.':e.message)}
  const b2=$('#svEdit');if(b2){b2.disabled=false;b2.textContent='Save changes'}
}
const ADD=[['Ad Name & Preview','Ad name'],['Ad ID','Ad ID'],['Status','Status','sel',['Active','Paused']],['Launch Date','Launch date','date'],['Format','Format'],['Event','Event'],['Ad Set/Audience','Audience / ad set'],['Performance','Performance'],['Campaign','Campaign'],['Campaign ID','Campaign ID'],['Ad Set ID','Ad Set ID'],['Variable for Testing','Variable for testing'],['Hypothesis','Hypothesis','area'],['Conclusion / Notes','Notes','area']];
function addAdPopup(){
  const i=viewInfo(view);if(!i)return;
  const pool=viewAds(view);let tabs=[...new Set(pool.map(a=>a.__tab))];
  if(!tabs.length)tabs=i.ch==='tt'?['TikTok']:['TOF','MOF','BOF'];
  const def=tabs.find(t=>t.slice(0,3).toUpperCase()===F.funnel)||tabs[0],today=new Date().toISOString().slice(0,10);
  const m=popup(`<h3>Add an ad</h3><p class="note" style="margin:-6px 0 12px;text-align:center">${esc(i.b.name)} · ${i.ch==='tt'?'TikTok':'Meta'}. It is added as a new row in the sheet.</p>
  <div class="form ef"><div class="w2"><label>Tab (funnel)</label><select id="adTab">${tabs.map(t=>`<option ${t===def?'selected':''}>${esc(t)}</option>`).join('')}</select></div>${ADD.map((d,n)=>fieldHtml(d,n,d[0]==='Status'?'Active':d[0]==='Launch Date'?today:'',pool,'data-n')).join('')}</div>
  <p class="note">Spend, purchases and the other numbers fill in from the sheet's own formulas once the ad has an Ad ID.</p>
  <div class="row" style="margin-top:12px"><button class="ghost" style="flex:1" data-close>Cancel</button><button class="go" id="adGo" style="flex:1;width:auto">Add ad</button></div>`);
  m.firstElementChild.classList.remove('small');m.firstElementChild.style.maxWidth='560px';
  setTimeout(()=>{const f=m.querySelector('[data-n="Ad Name & Preview"]');if(f)f.focus()},30);
}
async function submitAd(){
  const i=viewInfo(view);if(!i)return;const fields={};
  document.querySelectorAll('[data-n]').forEach(x=>{const v=x.value.trim();if(v)fields[x.dataset.n]=v});
  if(!fields['Ad Name & Preview'])return toast('Enter the ad name');
  const b=$('#adGo');b.disabled=true;b.textContent='Adding…';
  try{await api('addAd',{tab:$('#adTab').value,fields},i.b.id);document.querySelectorAll('.modal.pop').forEach(m=>m.remove());toast('Ad added to the sheet');loadBrand(i.b.id)}
  catch(e){b.disabled=false;b.textContent='Add ad';toast(/Unknown action/.test(e.message)?'This brand\'s Apps Script is an older version. Paste the updated script and redeploy it.':e.message)}
}

/* ---------- ad sheet ---------- */
function sheet(){
  const a=ad(openKey);if(!a)return;
  const ms=metricsFor(a),pts=ptsOf(a.__key),emb=embedOf(a),prod=productOf(a),pimg=imageOf(a),pk=PICK&&PICK.key===a.__key?PICK:null;
  const info=['Event','Format','Performance','Ad Set/Audience','Launch Date','Stop Date','Confidence Score','Action','Variable for Testing','Campaign','Campaign ID','Ad Set ID','Ad ID'].filter(k=>a[k]!=null);
  const old=$('#ov'),sc=old?old.scrollTop:0;
  $('#modal').innerHTML=`<div class="modal" id="ov"><div class="sheet" role="dialog" aria-modal="true"><button class="x" id="cl" aria-label="Close">${ic('x')}</button>
  <h2>${esc(nameOf(a))}</h2><div class="row" style="flex-wrap:wrap">${tag(a)}<span class="badge">${esc(a.__tab)}</span><button class="ghost sm btn-ic" id="rn" style="margin-left:auto">${ic('edit')}<span>Rename</span></button></div>
  ${nameOf(a)!==a['Ad Name & Preview']?`<p class="note">Original name: ${esc(a['Ad Name & Preview'])}</p>`:''}
  <div class="sec"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h4 style="margin:0">Media</h4><div class="seg"><button class="${pvMode==='inline'?'on':''}" data-pv="inline">Preview</button><button class="${pvMode==='link'?'on':''}" data-pv="link">Click to view</button></div></div>${mediaBlock(a,emb)}<div class="row" style="margin-top:8px"><input id="emb" placeholder="Paste a preview link or embed code" value="${esc(emb)}"><button class="ghost" id="svEmb">${emb?'Update':'Add preview'}</button></div><div class="row" style="margin-top:8px"><label class="ghost btn-ic" style="cursor:pointer">${ic('upload')}<span>Upload image or video</span><input type="file" id="upl" accept="image/*,video/*" hidden></label><span class="note" id="uplst" style="margin:0"></span></div><p class="note">Uploads are saved to your <a href="https://drive.google.com/drive/folders/1Z91Rs7r1KoP_01mm8mo03RTzVn9sWjEl" target="_blank" rel="noopener noreferrer">Drive folder</a> (up to 30 MB). You can also paste a Drive link, iframe embed code, TikTok link, or direct image or video link.</p></div>
  <div class="sec"><h4>Product link</h4><div class="row"><input id="plink" type="url" placeholder="https://potico.ph/product/apple-of-my-eye" value="${esc(prod)}" aria-label="Product link"><button class="ghost" id="svProd">${prod?'Update':'Save link'}</button></div>
  <div class="row" style="margin-top:8px;flex-wrap:wrap"><button class="ghost btn-ic" id="findImg" ${pk&&pk.loading?'disabled':''}>${ic('image')}<span>Find product images</span></button>${prod?`<a class="ghost btn-ic" href="${esc(prod)}" target="_blank" rel="noopener noreferrer">${ic('ext')}<span>Open page</span></a>`:''}${pimg?`<button class="ghost danger" id="rmImg">Remove picture</button>`:''}</div>
  ${pk?pickHtml(pk,pimg):''}${pimg&&!pk?`<div class="prod-cur"><img src="${esc(pimg)}" alt="" referrerpolicy="no-referrer"><span>Default picture. It is used when this ad has no preview.</span></div>`:''}
  <div class="row" style="margin-top:8px"><input id="pimg" placeholder="Or paste an image link" aria-label="Product image link"><button class="ghost" id="svImg">Use image</button></div>
  <p class="note">Find product images reads the page and lets you choose a picture. The chosen picture becomes the ad's default when no preview is set.</p></div>
  <div class="sec"><h4>Current numbers</h4><div class="kv">${ms.map(k=>`<div><span>${k}</span><b>${fmt(k,a[k])}</b></div>`).join('')}</div></div>
  <div class="sec"><h4>Details</h4><div class="kv">${info.map(k=>`<div><span>${k}</span><b>${esc(a[k])}</b></div>`).join('')}</div>${a.Hypothesis?`<p class="note"><b>Hypothesis:</b> ${esc(a.Hypothesis)}</p>`:''}${a['Conclusion / Notes']?`<p class="note"><b>Notes:</b> ${esc(a['Conclusion / Notes'])}</p>`:''}</div>
  <details class="sec" id="editDet" ${editOpen?'open':''}><summary>Edit details</summary>${editForm(a)}<p class="note">Changes are written to this ad's row in the Google Sheet.</p><button class="go" id="svEdit" style="margin-top:10px">Save changes</button></details>
  <div class="sec"><h4>Performance over time</h4><div class="field"><select id="mt">${ms.map(k=>`<option ${k===metric?'selected':''}>${k}</option>`).join('')}</select></div>${chart(pts,metric)}
  <div>${pts.map((p,i)=>`<div class="pt ${selPt===i?'sel':''}"><span>${dshort(p.date)}${p.source==='auto'?'':' (manual)'} · ${esc(metric)} <b>${fmt(metric,p.v[metric])}</b></span><button class="ghost danger sm" data-del="${esc(p.id)}">Delete</button></div>`).join('')}</div></div>
  <div class="sec"><h4>Add a point by hand</h4><div class="form"><div><label>Date</label><input type="date" id="fd" value="${new Date().toISOString().slice(0,10)}"></div>${ms.map(k=>`<div><label>${k}${MONEY.has(k)?' ($)':PCTF.has(k)&&!/%/.test(k)?' (%)':''}</label><input data-m="${esc(k)}" inputmode="decimal" value="${PCTF.has(k)&&a[k]!=null?+(a[k]*100).toFixed(3):a[k]??''}"></div>`).join('')}</div><p class="note">Percent fields (CIR, CTR, LPVr…) are entered as percentages, for example 0.34 for 0.34%.</p><button class="go" id="log" style="margin-top:10px">Save point</button></div></div></div>`;
  const ov=$('#ov');if(ov&&sc)ov.scrollTop=sc;
}
async function uploadFile(f){
  if(!f)return;if(f.size>30*1024*1024)return toast('File is over 30 MB. Add it to the Drive folder and paste its link instead.');
  const k=openKey,a0=ad(k),st=$('#uplst');st.textContent='Uploading '+f.name+'…';
  try{
    const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=()=>rej(new Error('Could not read the file'));r.readAsDataURL(f)});
    const up=await fetchJson(UPLOAD_URL,{method:'POST',body:JSON.stringify({token:TOKEN,action:'uploadMedia',name:f.name,mime:f.type||'application/octet-stream',data})},120000);
    await api('embed',{key:a0.__orig,embed:up.url},a0.__brand);
    (D.meta[k]=D.meta[k]||{}).embed=up.url;persist(a0.__brand);if(openKey===k)sheet();render(true);toast('Uploaded to Drive');
  }catch(er){if($('#uplst'))$('#uplst').textContent='';toast(er.message)}
}

/* ---------- product link + picture ---------- */
async function saveProduct(a,fields){
  const m=(D.meta[a.__key]=D.meta[a.__key]||{});
  if(fields.product!==undefined)m.product=fields.product;
  if(fields.image!==undefined)m.image=fields.image;
  persist(a.__brand);if(openKey===a.__key)sheet();render(true);
  try{await api('product',{key:a.__orig,...fields},a.__brand);return true}catch(e){toast(e.message);return false}
}
const okUrl=v=>/^https?:\/\/\S+$/i.test(v);

/* ---------- popups: backend, Niktin, settings, login ---------- */
function backendPopup(){
  const grp=(t,items)=>`<p class="pp-lbl">${t}</p>`+items.map(([n,u])=>`<a class="bk" href="${esc(u)}" target="_blank" rel="noopener noreferrer" data-close>${ic('sheet')}<span>${esc(n)}</span>${ic('ext')}</a>`).join('');
  popup(`<h3>Open which backend?</h3>${grp('Ad level',AD_SHEETS)}${grp('Daily performance',DAILY_SHEETS)}<button class="ghost" data-close style="width:100%;margin-top:12px">Cancel</button>`);
}
function niktinPopup(){
  popup(`<h3>Niktin</h3><p class="pp-text">Niktin is a simple webpage that records and updates your ad database inside Niktin. You can input multiple ad IDs, and it pulls out the data for each ad ID and tells you if any ads are missing from its database.</p><p class="pp-text">It is 100% free and open-source (FOSS) for everyone, and it supports both .csv and .xlsx files.</p><div class="pp-btns"><a class="go" href="${esc(LINKS.niktin)}" target="_blank" rel="noopener noreferrer" data-close>Open Niktin</a><button class="ghost" data-close>Cancel</button></div>`);
}
function settingsPopup(){
  const t=ls('trakks_theme','light'),stamps=BRANDS.filter(b=>TS[b.id]).map(b=>TS[b.id]);
  popup(`<h3>Settings</h3><div class="field"><label class="dl"><span>Appearance</span><select id="thm"><option value="light" ${t==='light'?'selected':''}>Light</option><option value="dark" ${t==='dark'?'selected':''}>Dark</option><option value="system" ${t==='system'?'selected':''}>Match my device</option></select></label></div>
  <p class="note" style="margin:0 0 12px">Ads and performance are saved on this device so pages open instantly${stamps.length?`. Last refreshed ${rel(Math.max(...stamps))}`:''}.</p>
  <div class="pp-btns"><button class="ghost btn-ic" id="clr">${ic('refresh')}<span>Clear saved data</span></button><button class="ghost btn-ic" id="out">${ic('logout')}<span>Sign out</span></button><button class="ghost" data-close>Close</button></div>`);
}
function applyTheme(){const t=ls('trakks_theme','light'),dark=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';const m=document.querySelector('meta[name=theme-color]');if(m)m.content=dark?'#0e0e0f':'#ffffff'}
function showLogin(msg){$('#login').hidden=false;$('#lgErr').textContent=msg||'';setTimeout(()=>{const i=$('#lgTok');if(i){i.value='';i.focus()}},50)}
async function signIn(tok){
  let j;
  try{const r=await fetch(BRANDS[0].perf+'?action=ping&token='+encodeURIComponent(tok));j=await r.json()}catch(e){throw new Error('Could not reach the server. Check your connection.')}
  if(j&&j.error==='Bad token')throw new Error('That token is not correct.');
}

/* ---------- events ---------- */
async function doRename(k){const a=ad(k),n=await ask('Rename ad',nameOf(a));if(n==null||n===nameOf(a))return;(D.meta[k]=D.meta[k]||{}).name=n;persist(a.__brand);render(true);if(openKey===k)sheet();try{await api('rename',{key:a.__orig,name:n},a.__brand);toast('Renamed')}catch(e){toast(e.message)}}
const closeNav=()=>document.documentElement.classList.remove('sb-open');
function go(v){view=v;lset('trakks_view',v);F={q:'',status:'Active',funnel:F.funnel,sort:F.sort,dir:F.dir};closeNav();render();scrollTo(0,0)}
document.addEventListener('click',async e=>{
  const t=e.target,c=s=>t.closest(s);
  if(c('#burger')){document.documentElement.classList.add('sb-open');return}
  if(c('#scrim')){closeNav();return}
  if(c('a[href]:not([href="#"])'))return;                       // real links (Ads Manager, Reports, sheets) behave normally
  if(c('[data-v]')){e.preventDefault();return go(c('[data-v]').dataset.v)}
  if(c('a[href="#"]'))e.preventDefault();
  if(c('#addAd'))return addAdPopup();
  if(c('#adGo'))return submitAd();
  if(c('#svEdit'))return saveEdit();
  if(c('#settings')){closeNav();return settingsPopup()}
  if(c('#backend')){closeNav();return backendPopup()}
  if(c('#niktin')){closeNav();return niktinPopup()}
  if(c('#thm'))return;
  if(c('#clr')){Object.keys(localStorage).filter(x=>x.startsWith(CK)).forEach(x=>localStorage.removeItem(x));D={ads:[],meta:{},points:{}};UPD={};TS={};document.querySelectorAll('.modal.pop').forEach(m=>m.remove());toast('Saved data cleared');render();refreshAll();return}
  if(c('#out')){try{localStorage.removeItem('trakks_token')}catch(x){}location.reload();return}
  if(c('#refresh'))return refreshAll();
  if(c('#retry'))return refreshAll();
  if(c('[data-ft]')){F.funnel=c('[data-ft]').dataset.ft;list();return}
  if(c('[data-s]')){F.status=c('[data-s]').dataset.s;list();return}
  if(c('[data-rn]'))return doRename(c('[data-rn]').dataset.rn);
  if(c('[data-layout]')){layout=c('[data-layout]').dataset.layout;lset('trakks_layout',layout);render(true);return}
  if(c('th[data-sort]')){const k=c('th[data-sort]').dataset.sort;if(F.sort===k)F.dir=F.dir==='asc'?'desc':'asc';else{F.sort=k;F.dir=defDir(k)}list();return}
  if(c('[data-pv]')){pvMode=c('[data-pv]').dataset.pv;lset('trakks_pv',pvMode);sheet();return}
  if(c('tr[data-k]')){openKey=c('tr[data-k]').dataset.k;selPt=null;metric='Spent';PICK=null;sheet();return}
  if(c('#snap')){const b=$('#snap'),ao=$('#actOnly').checked;b.disabled=true;b.textContent='Saving…';let n=0;const errs=[];
    for(const br of BRANDS){try{n+=(await api('snapshotAll',{activeOnly:ao},br.id)).count}catch(er){errs.push(br.name+': '+er.message)}}
    toast(errs.length?errs.join(' · '):'Saved points for '+n+' ads');BRANDS.forEach(x=>loadBrand(x.id));return}
  if(c('.card')&&!c('.ib')||c('.ib[data-k]')){openKey=c('.card,.ib').dataset.k;selPt=null;metric='Spent';PICK=null;sheet();return}
  if(t.id==='ov'||c('#cl')){openKey=null;PICK=null;$('#modal').innerHTML='';return}
  if(c('#rn'))return doRename(openKey);
  if(c('#svEmb')){const v=$('#emb').value.trim(),a0=ad(openKey);(D.meta[openKey]=D.meta[openKey]||{}).embed=v;persist(a0.__brand);sheet();render(true);try{await api('embed',{key:a0.__orig,embed:v},a0.__brand);toast('Preview saved')}catch(er){toast(er.message)}return}
  if(c('#svProd')){const v=$('#plink').value.trim();if(v&&!okUrl(v))return toast('Product links start with https://');if(await saveProduct(ad(openKey),{product:v}))toast(v?'Product link saved':'Product link removed');return}
  if(c('#findImg')){
    const a0=ad(openKey),v=$('#plink').value.trim();if(!okUrl(v))return toast('Paste a product link that starts with https://');
    const key=openKey,changed=v!==productOf(a0);PICK={key,loading:true,images:[]};
    if(changed){(D.meta[key]=D.meta[key]||{}).product=v;persist(a0.__brand);render(true)}   // the link is saved along the way
    sheet();
    try{
      const [r]=await Promise.all([api('scrape',{url:v},a0.__brand),changed?api('product',{key:a0.__orig,product:v},a0.__brand).catch(()=>{}):null]);
      PICK={key,images:r.images||[],title:r.title||''};
    }catch(er){PICK={key,images:[],err:/Unknown action/.test(er.message)?'This brand\'s Apps Script is an older version. Paste the updated script and redeploy it.':/UrlFetchApp|external_request|pahintulot|authoriz/i.test(er.message)?'The ad script is not allowed to read web pages yet. In the Apps Script editor run the "authorize" function once, approve, then Deploy > Manage deployments > Edit > New version > Deploy.':er.message}}
    if(openKey===key)sheet();return}
  if(c('[data-pick]')){const u=PICK&&PICK.images[+c('[data-pick]').dataset.pick];if(!u)return;const a0=ad(openKey),v=$('#plink').value.trim();
    if(await saveProduct(a0,{product:okUrl(v)?v:productOf(a0),image:u}))toast('Picture saved');return}
  if(c('#svImg')){const v=$('#pimg').value.trim(),a0=ad(openKey);if(!okUrl(v))return toast('Image links start with https://');if(await saveProduct(a0,{product:productOf(a0),image:v}))toast('Picture saved');return}
  if(c('#rmImg')){const a0=ad(openKey);if(await saveProduct(a0,{product:productOf(a0),image:''}))toast('Picture removed');return}
  if(c('[data-p]')){selPt=+c('[data-p]').dataset.p;sheet();return}
  if(c('[data-del]')){const id=c('[data-del]').dataset.del;if(!confirm('Delete this point? This cannot be undone.'))return;const a0=ad(openKey);D.points[openKey]=D.points[openKey].filter(p=>p.id!==id);persist(a0.__brand);selPt=null;sheet();try{await api('deletePoint',{id},a0.__brand);toast('Point deleted')}catch(er){toast(er.message)}return}
  if(t.id==='log'){
    const v={};let bad=null;document.querySelectorAll('[data-m]').forEach(i=>{let s=i.value.trim().replace(/[,₱$\s]/g,'');if(!s)return;let n=parseFloat(s.replace('%',''));if(isNaN(n)){bad=i.dataset.m;return}if(PCTF.has(i.dataset.m))n/=100;v[i.dataset.m]=n});
    if(bad)return toast(`"${bad}" is not a number`);if(!Object.keys(v).length)return toast('Enter at least one value');
    const date=$('#fd').value,a0=ad(openKey);t.disabled=true;try{const r=await api('addPoint',{key:a0.__orig,date,values:v},a0.__brand);(D.points[openKey]=D.points[openKey]||[]).push({id:r.id,date,ts:Date.now(),source:'manual',v});persist(a0.__brand);sheet();render(true);toast('Point saved')}catch(er){toast(er.message);t.disabled=false}
  }
});
document.addEventListener('toggle',e=>{if(e.target.id==='editDet')editOpen=e.target.open},true);
document.addEventListener('input',e=>{const t=e.target;if(t.id==='q'){F.q=t.value;list()}if(t.id==='minsp'){F.minSpend=t.value.replace(/[^\d.]/g,'');list()}if(t.id==='navq'){navq=t.value;renderNav()}});
document.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.f!==undefined){F[t.dataset.f]=t.value;list()}
  if(t.id==='upl'){uploadFile(t.files[0]);t.value='';return}
  if(t.id==='sort'&&t.value){[F.sort,F.dir]=t.value.split(':');list()}
  if(t.id==='dfrom'){F.from=t.value;list()}if(t.id==='dto'){F.to=t.value;list()}
  if(t.id==='shownotes'){showNotes=t.checked;lset('trakks_notes',showNotes?'1':'0');list()}
  if(t.id==='mt'){metric=t.value;selPt=null;sheet()}
  if(t.id==='thm'){lset('trakks_theme',t.value);applyTheme()}});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const pops=document.querySelectorAll('.modal.pop');
  if(pops.length){pops[pops.length-1].remove();return}if(openKey){openKey=null;PICK=null;$('#modal').innerHTML=''}else closeNav()});
$('#lgForm').addEventListener('submit',async e=>{
  e.preventDefault();const tok=$('#lgTok').value.trim(),b=$('#lgGo');if(!tok)return;b.disabled=true;b.textContent='Checking…';$('#lgErr').textContent='';
  try{await signIn(tok);TOKEN=tok;lset('trakks_token',tok);$('#login').hidden=true;start()}
  catch(er){$('#lgErr').textContent=er.message}
  b.disabled=false;b.textContent='Sign in';
});

/* ---------- start ---------- */
function start(){
  hydrate();if(typeof pHydrate==='function')pHydrate();
  if(view!=='home'&&view!=='perf'&&!viewInfo(view))view='home';
  renderFoot();render();                       // instant paint from the saved copy
  refreshAll();                                // then update in the background
}
document.addEventListener('DOMContentLoaded',()=>{
  applyTheme();
  if(window.matchMedia)matchMedia('(prefers-color-scheme: dark)').addEventListener&&matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
  renderFoot();renderNav();
  if(!TOKEN){showLogin();return}
  start();
});
