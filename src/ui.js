const MIN_MC_K=15;
/* ================= UI: screens, HUD, panels, game events ================= */
const $=id=>document.getElementById(id);
const store={get:(k,d)=>{try{const v=localStorage.getItem('solabase.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem('solabase.'+k,JSON.stringify(v))}catch(e){}}};
let REPORT=null,MODE='live',RUNNING=false,BT=null;

/* ---------- icons ---------- */
const ICONS={
 map:`<svg viewBox="0 0 100 100"><path d="M10 22l25-8 26 8 27-8v62l-27 8-26-8-25 8z" fill="#e8d9b6" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M35 14v62M61 22v62" fill="none" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M18 60c8-8 14 2 22-6s14-6 18-14 10-6 16-2" fill="none" stroke="#9a2a1e" stroke-width="2.4" stroke-dasharray="4 4"/><path d="M70 32l8 8M78 32l-8 8" stroke="#9a2a1e" stroke-width="3"/><circle cx="78" cy="70" r="11" fill="#d9c49a" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M78 61v18M69 70h18" stroke="#24170e" stroke-width="1.5"/><path d="M78 63l3 7-3 7-3-7z" fill="#9a2a1e"/><text x="16" y="38" font-family="Rye,serif" font-size="11" fill="#24170e">TOWN</text></svg>`,
 binoc:`<svg viewBox="0 0 100 100"><g transform="rotate(-8 50 50)"><rect x="14" y="34" width="28" height="42" rx="10" fill="#4a3a2c" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><rect x="58" y="34" width="28" height="42" rx="10" fill="#4a3a2c" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><rect x="40" y="40" width="20" height="16" fill="#6b5844" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><rect x="18" y="20" width="20" height="16" rx="4" fill="#8a6a46" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><rect x="62" y="20" width="20" height="16" rx="4" fill="#8a6a46" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="28" cy="66" r="8" fill="#b9c9c4" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="72" cy="66" r="8" fill="#b9c9c4" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 46h12M66 46h12" stroke="#24170e" stroke-width="1.6"/></g></svg>`,
 book:`<svg viewBox="0 0 100 100"><g transform="rotate(6 50 50)"><rect x="20" y="14" width="56" height="72" rx="4" fill="#9a2a1e" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><rect x="26" y="20" width="44" height="60" fill="none" stroke="#5a140e" stroke-width="2"/><rect x="34" y="34" width="28" height="16" fill="#efe3c6" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M38 40h20M38 45h14" stroke="#24170e" stroke-width="1.5"/><path d="M76 20v62" stroke="#efe3c6" stroke-width="4"/></g><path d="M14 80L46 20l6 3-32 60-8 4z" fill="#3a2a1c" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M44 24l6 3" stroke="#c9a46a" stroke-width="3"/></svg>`,
 bars:`<svg viewBox="0 0 100 100"><path d="M14 18h72v66H14z" fill="#a39c8e" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M14 34h72M14 50h72M14 66h72M34 18v16M58 18v16M24 34v16M48 34v16M72 34v16M34 50v16M60 50v16M24 66v18M50 66v18M74 66v18" stroke="#6b665c" stroke-width="1.6"/><rect x="28" y="30" width="44" height="40" fill="#1e1610" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M37 30v40M46 30v40M55 30v40M64 30v40" stroke="#8a8478" stroke-width="3.5"/><path d="M28 44h44" stroke="#8a8478" stroke-width="3"/></svg>`,
 bag:`<svg viewBox="0 0 100 100"><g transform="rotate(-6 50 55)"><path d="M36 30c0-10 28-10 28 0" fill="none" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" stroke-width="4"/><rect x="12" y="30" width="76" height="52" rx="6" fill="#8a2a22" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 46h76" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><rect x="44" y="40" width="12" height="12" fill="#c9a46a" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M26 30v52M74 30v52" stroke="#5a1a14" stroke-width="5"/><path d="M18 74l6-8M78 74l6-8" stroke="#5a1a14" stroke-width="1.5"/></g></svg>`,
 safe:`<svg viewBox="0 0 100 100"><rect x="14" y="16" width="72" height="70" rx="5" fill="#5f6a70" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><rect x="22" y="24" width="56" height="54" rx="3" fill="#77838a" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="50" cy="51" r="14" fill="#c9a46a" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="50" cy="51" r="5" fill="#24170e"/><path d="M50 37v6M50 59v6M36 51h6M58 51h6" stroke="#24170e" stroke-width="2"/><rect x="66" y="40" width="6" height="22" rx="2" fill="#c9a46a" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 86v6M80 86v6" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" stroke-width="4"/></svg>`,
 gun:`<svg viewBox="0 0 100 100"><g transform="rotate(-14 50 50)"><path d="M10 36h56l4-5h14v10h-6v8H44l-6 6v20c0 4-3 6-7 6h-8c-3 0-5-3-4-6l6-22H10z" fill="#6b7076" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="50" cy="44" r="8" fill="#8a9096" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M28 54h12" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 58h12l-4 22h-12z" fill="#7a4a26" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M24 64h8M23 70h8" stroke="#24170e" stroke-width="1.4"/><path d="M14 40h50" stroke="#a9adb2" stroke-width="1.5"/></g></svg>`,
 stop:`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#9a2a1e" stroke="#24170e" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="50" cy="50" r="31" fill="none" stroke="#efe3c6" stroke-width="2" stroke-dasharray="3 3"/><text x="50" y="58" text-anchor="middle" font-family="Rye,serif" font-size="22" fill="#efe3c6">STOP</text></svg>`};
const GEAR=`<svg viewBox="0 0 100 100"><g fill="none" stroke="#f2e6c9" stroke-width="4"><circle cx="50" cy="50" r="30"/><circle cx="50" cy="50" r="9"/><circle cx="50" cy="28" r="7"/><circle cx="69" cy="39" r="7"/><circle cx="69" cy="61" r="7"/><circle cx="50" cy="72" r="7"/><circle cx="31" cy="61" r="7"/><circle cx="31" cy="39" r="7"/></g><g fill="#f2e6c9"><path d="M46 12h8l2 8h-12zM46 88h8l2-8h-12zM12 46v8l8 2v-12zM88 46v8l-8 2v-12z"/></g></svg>`;
function setIcons(){const map={bounty:'book',jail:'bars',posse:'bag',vault:'safe',scout:'binoc'};
  document.querySelectorAll('.item[data-open]').forEach(b=>b.querySelector('.em').outerHTML=ICONS[map[b.dataset.open]]);
  $('btnMap').querySelector('.em').outerHTML=ICONS.map;$('btnRide').querySelector('.em').outerHTML=ICONS.gun;$('gearBtn').innerHTML=GEAR;
  document.querySelectorAll('.poster,.tipcard,#portrait').forEach(e=>e.classList.add('torn'));
  document.querySelectorAll('.poster').forEach(p=>{const w=document.createElement('div');w.className='poster-wrap';p.parentNode.insertBefore(w,p);w.appendChild(p)})}
/* ---------- portraits ---------- */
function hashOf(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function drawFace(cv,seed,o={}){const g=cv.getContext('2d'),W=cv.width;g.clearRect(0,0,W,W);let h=seed;const r=()=>((h=Math.imul(h^h>>>15,2246822507)^Math.imul(h^h>>>13,3266489909))>>>0)/4294967296;
  const s=W/120;g.save();g.scale(s,s);
  const bg=g.createRadialGradient(60,50,10,60,60,80);bg.addColorStop(0,o.bg1||'#f2d9a6');bg.addColorStop(1,o.bg2||'#c48a4a');g.fillStyle=bg;g.fillRect(0,0,120,120);
  const skin=o.skin||['#f1c9a0','#e0ac80','#c98d62','#a86e48'][Math.floor(r()*4)];const hatC=o.hat||['#5a3417','#2b2b2b','#8a5530','#e3d3b0','#6b2a1a'][Math.floor(r()*5)];
  const shirt=o.shirt||['#b3261e','#2e6da4','#5b8c3a','#7a5230','#3a3a3a'][Math.floor(r()*5)];const hair=['#3a2414','#6b4423','#1a1a1a','#a8743f','#d9b06a'][Math.floor(r()*5)];
  g.fillStyle=shirt;g.beginPath();g.moveTo(14,120);g.quadraticCurveTo(20,88,60,86);g.quadraticCurveTo(100,88,106,120);g.fill();
  if(o.sheriff||r()<.4){g.fillStyle='#7a5230';g.beginPath();g.moveTo(22,120);g.quadraticCurveTo(28,94,46,90);g.lineTo(52,120);g.fill();g.beginPath();g.moveTo(98,120);g.quadraticCurveTo(92,94,74,90);g.lineTo(68,120);g.fill()}
  if(o.sheriff)drawStar(g,40,104,9);
  g.fillStyle=skin;g.fillRect(50,74,20,16);
  g.beginPath();g.ellipse(60,62,22,26,0,0,7);g.fill();
  g.fillStyle=hair;g.fillRect(37,46,6,18);g.fillRect(77,46,6,18);
  const beard=o.beard!=null?o.beard:Math.floor(r()*4);
  g.fillStyle='#fff';g.beginPath();g.ellipse(51,60,4.5,3.5,0,0,7);g.ellipse(69,60,4.5,3.5,0,0,7);g.fill();g.fillStyle='#2a1608';g.beginPath();g.arc(52,60.5,2.2,0,7);g.arc(68,60.5,2.2,0,7);g.fill();
  g.strokeStyle=hair;g.lineWidth=3.5;g.lineCap='round';const ang=o.mean?1:r()<.5?1:0;g.beginPath();g.moveTo(45,53-ang*2);g.lineTo(56,55+ang);g.moveTo(75,53-ang*2);g.lineTo(64,55+ang);g.stroke();
  g.fillStyle=shade2(skin,.85);g.beginPath();g.moveTo(60,60);g.lineTo(56,72);g.lineTo(62,72);g.fill();
  if(beard==1||beard==3){g.fillStyle=hair;g.beginPath();g.moveTo(40,64);g.quadraticCurveTo(42,92,60,92);g.quadraticCurveTo(78,92,80,64);g.quadraticCurveTo(72,80,60,80);g.quadraticCurveTo(48,80,40,64);g.fill()}
  if(beard>=2){g.fillStyle=hair;g.beginPath();g.moveTo(48,76);g.quadraticCurveTo(60,70,72,76);g.quadraticCurveTo(66,79,60,77);g.quadraticCurveTo(54,79,48,76);g.fill()}
  g.strokeStyle='#7a3a2a';g.lineWidth=2;g.beginPath();g.moveTo(54,81);g.quadraticCurveTo(60,83,66,81);g.stroke();
  if(o.bandana){g.fillStyle='#b3261e';g.beginPath();g.moveTo(37,66);g.lineTo(83,66);g.lineTo(78,84);g.lineTo(60,92);g.lineTo(42,84);g.fill()}
  g.fillStyle=hatC;g.beginPath();g.ellipse(60,42,44,9,-.05,0,7);g.fill();g.beginPath();g.moveTo(36,42);g.quadraticCurveTo(34,14,48,12);g.quadraticCurveTo(60,20,72,12);g.quadraticCurveTo(86,14,84,42);g.fill();
  g.fillStyle=shade2(hatC,.6);g.fillRect(37,34,46,6);if(o.sheriff)drawStar(g,60,26,6);
  g.restore()}
function drawStar(g,x,y,r){g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}g.closePath();g.fillStyle='#f4cf6a';g.fill();g.strokeStyle='#6b4a10';g.lineWidth=1;g.stroke()}
function shade2(hex,k){const n=parseInt(hex.slice(1),16);return`rgb(${(n>>16)*k|0},${((n>>8)&255)*k|0},${(n&255)*k|0})`}

/* ---------- small helpers ---------- */
function show(id){$(id).classList.remove('hidden','fadeout')}
function hide(id){$(id).classList.add('hidden')}
function fadeTo(fn){$('fade').classList.add('on');setTimeout(()=>{fn();setTimeout(()=>$('fade').classList.remove('on'),80)},700)}
function toast(msg,cls=''){const d=document.createElement('div');d.className='toast '+cls;d.textContent=msg;$('toasts').appendChild(d);setTimeout(()=>d.style.opacity=0,3200);setTimeout(()=>d.remove(),3800);while($('toasts').children.length>4)$('toasts').firstChild.remove()}
function badge(id,on=true){$(id).classList.toggle('on',on)}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- intro ---------- */
function initIntro(){
  $('rpcUrl').value=store.get('rpc',SB.cfg.rpc);$('addr').value=store.get('addr','');$('sigLimit').value=String(store.get('sigLimit',400));if(!$('sigLimit').value)$('sigLimit').value='400';$('heliusKey').value=store.get('helius','');if($('heliusKey').value)document.querySelector('.rpcbox').open=true;
  $('btnTrack').onclick=startAnalysis;$('addr').addEventListener('keydown',e=>{if(e.key=='Enter')startAnalysis()});
}
async function startAnalysis(){
  const a=$('addr').value.trim();
  if(!B58RE.test(a)){$('addrErr').textContent="That doesn't look like a Solana address.";return}
  $('addrErr').textContent='';
  SB.cfg.rpc=$('rpcUrl').value.trim()||SB.cfg.rpc;SB.cfg.sigLimit=+$('sigLimit').value||400;SB.cfg.helius=$('heliusKey').value.trim();
  if(SB.cfg.helius)SB.cfg.rpc='https://mainnet.helius-rpc.com/?api-key='+encodeURIComponent(SB.cfg.helius);
  store.set('rpc',$('rpcUrl').value.trim());store.set('addr',a);store.set('sigLimit',SB.cfg.sigLimit);store.set('helius',SB.cfg.helius);
  $('intro').classList.add('fadeout');setTimeout(()=>hide('intro'),600);
  show('analysis');$('aAddr').textContent=a;drawFace($('wantedFace'),hashOf(a),{mean:1});
  show('scanBox');hide('resultBox');hide('resultMore');hide('scanErr');$('scanBar').style.width='0%';
  try{
    const rep=await SB.analyze(a,MIN_MC_K,p=>{$('scanMsg').textContent=p.msg+(p.total?` (${p.count}/${p.total})`:'');$('scanBar').style.width=Math.round(p.p*100)+'%';if(p.total)$('scanStats').textContent=`${p.swaps} swaps found`});
    REPORT=rep;showReport(rep);
  }catch(e){
    $('scanErr').innerHTML=esc(e.message)+'<br><button class="wood ghost" id="btnErrBack">Back</button>';show('scanErr');hide('scanBox');
    $('btnErrBack').onclick=()=>{hide('analysis');show('intro')};
  }
}
function statHTML(label,val,cls=''){return`<div class="stat"><label>${label}</label><b class="${cls}">${val}</b></div>`}
function reportStats(rep){const a=rep.all,c=rep.cp;const pc=v=>(v>=0?'+':'')+Math.round(v*100)+'%';
  return statHTML('Tokens traded',rep.trades.length)+statHTML('Closed trades',a.n)+statHTML('Win rate',Math.round(a.wr*100)+'%',a.wr>=.45?'g':'r')+statHTML('Realized PnL',SB.fmtSol(a.pnl,1)+' SOL',a.pnl>=0?'g':'r')
  +statHTML('Return',pc(a.roi),a.roi>=0?'g':'r')+statHTML('Profit factor',a.pf>=9?'no losses':a.pf.toFixed(2),a.pf>=1?'g':'r')+statHTML('Median entry',SB.fmtK(SB.median(rep.trades.map(t=>t.entryMc))))+statHTML('Entries above $'+MIN_MC_K+'k',Math.round(rep.fit*100)+'%',rep.fit>=.5?'g':'r')
  +statHTML('Copyable trades',c.n)+statHTML('Copyable win rate',c.n?Math.round(c.wr*100)+'%':'-',c.wr>=.45?'g':'r')+statHTML('Copyable return',c.n?pc(c.roi):'-',c.roi>=0?'g':'r')+statHTML('Best trade',rep.best?'$'+esc(rep.best.sym)+' '+pc(rep.best.roi):'-',rep.best&&rep.best.roi>=0?'g':'r')}
function showReport(rep){
  hide('scanBox');show('resultBox');show('resultMore');
  let n=0;const tgt=rep.score;const iv=setInterval(()=>{n=Math.min(tgt,n+Math.ceil(tgt/30));$('aScore').textContent=n;if(n>=tgt)clearInterval(iv)},30);
  $('aGrade').textContent=rep.grade;$('aGrade').className='stamp '+(rep.score>=60?'g':rep.score>=40?'y':'');$('aVerdict').textContent=rep.verdict;
  $('aStats').innerHTML=reportStats(rep);
  $('aTips').innerHTML=rep.tips.map(t=>`<li class="${t.w?'warn':''}">${esc(t.t)}</li>`).join('');
  $('btnAgain').onclick=()=>{hide('analysis');show('intro')};
  $('btnRideWith').onclick=()=>fadeTo(()=>{hide('analysis');openSetup()});
}

/* ---------- setup ---------- */
function openSetup(){
  const r=REPORT,s=r.suggest;show('setup');
  $('setupSub').textContent=`Riding with ${SB.short(r.addr)}  -  ${r.grade}, score ${r.score}`;
  $('sSL').value=s.sl;$('sTP').value=s.tp;$('sMin').value=s.min;$('sMax').value=s.max;
  $('amount').value=store.get('amount',1);
  if(r.prof&&r.prof.ok){$('sAge').value=Math.round(Math.min(720,Math.max(60,(r.prof.ageHi||120)*1.5)));$('sTime').value=Math.round(Math.min(240,Math.max(15,r.prof.hold*2)))}
  setMode(r.prof&&r.prof.ok?'style':(r.lastT&&Date.now()/1000-r.lastT>86400?'backtest':'live'));
  $('btnBackAn').onclick=()=>{hide('setup');show('analysis')};
}
function setMode(m){if(m=='style'&&!(REPORT&&REPORT.prof&&REPORT.prof.ok)){toast('Not enough of his trades to learn a style. Use Live copy or Backtest.','r');m='live'}MODE=m;document.querySelectorAll('#modeToggle button').forEach(b=>b.classList.toggle('on',b.dataset.m==m));document.querySelector('.poster.setup').classList.toggle('style',m=='style');
  const cp=REPORT?REPORT.copy.length:0;
  if(m=='style'){const p=REPORT.prof;$('modeNote').textContent=`The Scout scans new pump.fun launches, migrations and trending Solana coins every 10 seconds and buys the ones that fit his style: ${SB.fmtK(p.mcLo)} to ${SB.fmtK(p.mcHi)} mcap, ${p.ageLo==null?'any age':SB.dur(p.ageLo)+' to '+SB.dur(p.ageHi)+' old'}, real buying pressure, not bundled. Works even when he is offline.`;return}
  $('modeNote').textContent=m=='live'?'Watches his wallet on-chain every few seconds and copies each buy that passes your filters (any DEX). Quiet if he is not trading.':`Replays his last ${REPORT?REPORT.closed.length:0} closed trades (${cp} above $${MIN_MC_K}k) in about 2 minutes, using his real entries and exits. The bundle check uses each coin's holders today.`}
document.querySelectorAll('#modeToggle button').forEach(b=>b.onclick=()=>setMode(b.dataset.m));
document.querySelectorAll('#amtChips button').forEach(b=>b.onclick=()=>{$('amount').value=b.textContent});
function readSet(){return{need:+$('sNeed').value||72,maxAge:+$('sAge').value||0,trail:+$('sTrail').value||30,timeStop:+$('sTime').value||0,minHolders:40,size:+$('sSize').value||10,min:(+$('sMin').value||MIN_MC_K)*1000,max:(+$('sMax').value||1e3)*1000,sl:+$('sSL').value||0,tp:+$('sTP').value||0,bundle:+$('sBundle').value||35,maxOpen:Math.max(1,+$('sMaxOpen').value||5)}}
$('btnStart').onclick=()=>{const amt=+$('amount').value;if(!(amt>=SB.MIN_TRADE)){toast(`Balance must be at least ${SB.MIN_TRADE} SOL`,'r');return}store.set('amount',amt);const set=readSet();fadeTo(()=>{hide('setup');startSession(amt,set)})};

/* ---------- session ---------- */
const QUESTS=[{id:'first',txt:'Take your first trade',goal:1},{id:'close3',txt:'Close 3 trades',goal:3},{id:'jail2',txt:'Lock up 2 bundled coins',goal:2},{id:'up10',txt:'Reach +10% on the day',goal:1}];
let qProg={},qDone={};
function quest(id,inc=1,abs){if(qDone[id])return;qProg[id]=abs!=null?abs:(qProg[id]||0)+inc;const q=QUESTS.find(q=>q.id==id);if(qProg[id]>=q.goal){qDone[id]=1;toast('Quest complete: '+q.txt,'g')}renderQuest()}
function renderQuest(){const q=QUESTS.find(q=>!qDone[q.id]);$('questText').innerHTML=q?`${esc(q.txt)} <b>(${Math.min(qProg[q.id]||0,q.goal)}/${q.goal})</b>`:'All quests done. Ride on.'}
function startSession(amt,set){
  show('hud');RUNNING=true;qProg={};qDone={};renderQuest();
  for(const a of Town.actors)if(a.kind=='posse'||(a.kind=='robber'))a.dead=true;for(const k in posse)delete posse[k];
  SB.newPaper(amt,set,MODE);
  drawFace($('avatar'),hashOf(REPORT.addr),{mean:1});$('hudScore').textContent=REPORT.score+' / 100';$('hudGrade').textContent=REPORT.grade.toUpperCase();
  setRide(true);Town.fit();
  $('modeTag').textContent=(MODE=='style'?'STYLE SCOUT':MODE=='live'?'LIVE COPY':'BACKTEST')+'  -  '+SB.short(REPORT.addr);
  SB.log(`Session started: ${amt} SOL paper, copy ${set.size}%, entries ${SB.fmtK(set.min)}-${SB.fmtK(set.max)}, SL -${set.sl}%, TP +${set.tp}%`,'y');
  if(MODE=='style'){Scout.start();toast('The Scout rides out. Hunting coins in his style.');Town.bubble('station','Scout riding out');SB.log('Scout started: looking for '+SB.fmtK(REPORT.prof.mcLo)+'-'+SB.fmtK(REPORT.prof.mcHi)+' coins in his style','y')}
  else if(MODE=='live')startLive();else startBacktest();
  tipIdx=0;
}
function setRide(on){const b=$('btnRide');$('rideLabel').textContent=on?'Stop':'Ride!';b.querySelector('svg').outerHTML=on?ICONS.stop:ICONS.gun}
$('btnRide').onclick=()=>{if(RUNNING){stopSession('Stopped by you.')}else{hide('hud');openSetup()}};
function stopSession(why){RUNNING=false;SB.stopLive();Scout.stop();if(BT){BT.stop=true;BT=null}setRide(false);const s=SB.stats();toast(`${why} ${s.pnl>=0?'+':''}${s.pnl.toFixed(3)} SOL (${s.pct>=0?'+':''}${s.pct.toFixed(1)}%)`,s.pnl>=0?'g':'r');SB.log('Session ended. '+why,'y')}
$('btnMap').onclick=()=>Town.fit();

/* ---------- live mode ---------- */
let priceTimer=null;
async function startLive(){
  try{await SB.startLive(REPORT.addr);toast('Telegraph line open. Watching his wallet.');Town.bubble('tele','Line open');SB.log('Watching '+SB.short(REPORT.addr)+' on-chain','y')}
  catch(e){toast(e.message,'r');SB.log(e.message,'r');stopSession('Live feed failed.');return}
  clearInterval(priceTimer);priceTimer=setInterval(refreshPrices,9000);
}
let solT=0;
async function refreshPrices(){if(!RUNNING||!SB.paper)return;const P=SB.paper;if(Date.now()-solT>60000){solT=Date.now();SB.fetchSolPrice()}const ms=Object.keys(P.pos);if(!ms.length)return;
  for(const m of ms)delete SB.tokenInfo[m];await SB.fetchTokenInfo(ms);
  for(const m of ms){const i=SB.tokenInfo[m],p=P.pos[m];if(!p||!i||!i.priceUsd)continue;const pr=i.priceUsd/SB.solUsd;SB.markPrice(m,pr,i.mc||pr*p.supply*SB.solUsd)}}
SB.on(async(type,m)=>{
  if(type=='feed'){toast(m.down?'Telegraph line down, retrying...':'Telegraph back online',m.down?'r':'g');return}
  if(!RUNNING||MODE!='live'||!SB.paper||type!='trader')return;
  const P=SB.paper,s=P.set,mint=m.mint,mc=m.mc;
  await SB.fetchTokenInfo([mint]);const sym=SB.sym(mint);
  Town.bubble('tele',`He ${m.side=='buy'?'bought':'sold'} $${sym}`,m.side=='buy'?'#2f7a22':'#b3261e');badge('bTele');
  SB.log(`HIS ${m.side.toUpperCase()}  $${sym}  ${m.sol.toFixed(3)} SOL at ${SB.fmtK(mc)}`);
  if(m.side=='buy'){
    if(P.pos[mint]){SB.log(`He added to $${sym}, holding our size`);return}
    if(mc<s.min){SB.skip(mint,sym,`too early: ${SB.fmtK(mc)} mcap`,mc,'mcap');return}
    if(mc>s.max){SB.skip(mint,sym,`too late: ${SB.fmtK(mc)} mcap`,mc,'mcap');return}
    const hc=await SB.holderCheck(mint);const bad=SB.isBundled(hc,s.bundle);
    if(bad){SB.skip(mint,sym,'bundled: '+bad,mc,'bundle');return}
    if(!hc.ok)SB.log(`No holder report for $${sym} yet (${hc.err}), copying anyway`,'r');
    SB.paperBuy(mint,sym,m.priceSol,mc,{top10:hc.ok?hc.top10:null,supply:m.supply});
  }else if(P.pos[mint]){
    const frac=m.left<=1e-6?1:m.tokens/(m.tokens+m.left);
    SB.paperSell(mint,frac,'followed his sell',m.priceSol,mc);
  }
});

/* ---------- backtest mode ---------- */
async function startBacktest(){
  const P=SB.paper,s=P.set;const list=REPORT.closed.filter(t=>t.entryMc>0).sort((a,b)=>a.entryT-b.entryT);
  if(!list.length){toast('No closed trades to replay.','r');stopSession('Nothing to replay.');return}
  const toCheck=list.filter(t=>t.entryMc>=s.min&&t.entryMc<=s.max);
  if(toCheck.length){toast(`Sheriff is checking holders of ${toCheck.length} coins...`);await Promise.all(toCheck.map((t,i)=>sleep(i*120).then(()=>SB.holderCheck(t.mint))));if(!RUNNING)return}
  const t0=list[0].entryT,t1=Math.max(...list.map(t=>t.exitT||t.entryT));const span=Math.max(60,t1-t0);
  const D=Math.min(150,Math.max(45,list.length*5));const map=ts=>(ts-t0)/span*D;
  const ev=[];for(const tr of list){const e=map(tr.entryT),x=Math.max(e+3.5,map(tr.exitT)+.5);ev.push({at:e,k:'in',tr},{at:x,k:'out',tr})}
  ev.sort((a,b)=>a.at-b.at);
  BT={ev,i:0,start:performance.now()/1000,D,stop:false,open:{}};
  const step=()=>{if(!BT||BT.stop)return;const now=performance.now()/1000-BT.start;
    while(BT.i<BT.ev.length&&BT.ev[BT.i].at<=now){btEvent(BT.ev[BT.i]);BT.i++}
    for(const id in BT.open){const o=BT.open[id];const p=P.pos[o.tr.mint];if(!p){delete BT.open[id];continue}const k=Math.min(1,(now-o.a)/(o.b-o.a));const wig=Math.sin(now*5+o.ph)*.06*(1-k)*k*4;const mult=1+(o.m-1)*(k*k*(3-2*k))+wig;const pr=o.p0*Math.max(.02,mult);SB.markPrice(o.tr.mint,pr,pr*1e9*SB.solUsd)}
    $('modeTag').textContent=`BACKTEST  -  ${SB.short(REPORT.addr)}  -  ${Math.min(100,Math.round(now/BT.D*100))}%`;
    if(BT.i>=BT.ev.length&&!Object.keys(P.pos).length){const s2=SB.stats();stopSession(`Backtest done: ${s2.n} copies.`);return}
    if(BT.i>=BT.ev.length&&now>BT.D+6){for(const m in P.pos)SB.paperSell(m,1,'backtest end');}
    setTimeout(step,100)};
  step();
}
function btEvent(e){const P=SB.paper,s=P.set,tr=e.tr;
  if(e.k=='in'){
    if(tr.entryMc<s.min){SB.skip(tr.mint,tr.sym,`too early: ${SB.fmtK(tr.entryMc)} mcap`,tr.entryMc,'mcap');return}
    if(tr.entryMc>s.max){SB.skip(tr.mint,tr.sym,`too late: ${SB.fmtK(tr.entryMc)} mcap`,tr.entryMc,'mcap');return}
    Town.bubble('tele',`He bought $${tr.sym}`,'#2f7a22');
    const bad=SB.isBundled(SB.holderCache[tr.mint],s.bundle);if(bad){SB.skip(tr.mint,tr.sym,'bundled: '+bad,tr.entryMc,'bundle');return}
    const p0=tr.entryMc/1e9/SB.solUsd;
    const hc0=SB.holderCache[tr.mint];const p=SB.paperBuy(tr.mint,tr.sym,p0,tr.entryMc,{top10:hc0&&hc0.ok?hc0.top10:null});if(p){const m=tr.sellSol/tr.buySol;BT.open[tr.mint]={tr,p0,m,a:e.at,b:BT.ev.find(x=>x.tr===tr&&x.k=='out').at,ph:Math.random()*6}}
  }else{const p=P.pos[tr.mint];if(!p)return;const m=tr.sellSol/tr.buySol;const pr=BT.open[tr.mint]?BT.open[tr.mint].p0*m:p.price;Town.bubble('tele',`He sold $${tr.sym}`,'#b3261e');SB.paperSell(tr.mint,1,'followed his sell',pr,pr*1e9*SB.solUsd);delete BT.open[tr.mint]}
}

/* ---------- game reactions ---------- */
const posse={};
SB.on((type,d)=>{
  if(type=='buy'){quest('first');badge('bPosse');Town.bubble('saloon',`Bought $${d.sym} @ ${SB.fmtK(d.mc)}`,'#2f7a22');toast(d.match?`Scout bought $${d.sym} (${d.match}% his style) at ${SB.fmtK(d.mc)}`:`Copied $${d.sym} at ${SB.fmtK(d.mc)}`,'g');
    Town.callTrain(()=>{const[sx,sy]=Town.station();const a=Town.spawn('posse',sx,sy,{label:{txt:'$'+d.sym,sub:'+0%'},speed:1.7});posse[d.mint]=a;Town.goTo(a,23,18,()=>{a.autoWander=true;a.idle=.5})})}
  if(type=='mark'){const a=posse[d.mint];if(a){const ch=(d.price/d.entryPrice-1)*100;a.label.sub=(ch>=0?'+':'')+ch.toFixed(0)+'%';a.label.subCol=ch>=0?'#2f7a22':'#b3261e'}}
  if(type=='partial'){Town.bubble('bank',`$${d.sym} half sold ${d.pnl>=0?'+':''}${d.pnl.toFixed(3)}`,'#2f7a22');const a=posse[d.mint];if(a){a.bag=true;setTimeout(()=>a.bag=false,2500)}}
  if(type=='close'){quest('close3');badge('bBounty');const a=posse[d.mint];delete posse[d.mint];
    const good=d.pnl>0;toast(`$${d.sym} closed ${good?'+':''}${d.pnl.toFixed(3)} SOL (${d.reason})`,good?'g':'r');
    if(!a)return;a.autoWander=false;a.label.sub=(d.roi>=0?'+':'')+Math.round(d.roi*100)+'%';
    if(good){a.bag=true;Town.goTo(a,22,26,()=>{Town.bubble('bank',`+${d.pnl.toFixed(3)} SOL $${d.sym}`,'#2f7a22');a.fadeOut=true})}
    else{const rob=Town.spawn('robber',38.5,Math.min(30,Math.max(9,a.y)),{speed:3.2,label:{txt:'RUG',bg:'#f2c3b8'}});
      const chase=()=>{if(!Town.actors.includes(a)){rob.fadeOut=true;return}Town.goTo(rob,Math.floor(a.x),Math.floor(a.y),()=>{a.bag=false;rob.bag=true;rob.label={txt:'-'+Math.abs(d.pnl).toFixed(3)+' SOL',bg:'#f2c3b8'};Town.goTo(rob,35,18,()=>rob.fadeOut=true);Town.bubble('sheriff',`${d.reason=='stop loss'?'Stop':'Loss'} $${d.sym} ${Math.round(d.roi*100)}%`,'#b3261e');Town.goTo(a,13,27,()=>a.fadeOut=true)})};
      a.path=[];chase();}
  }
  if(type=='skip'){
    if(d.kind=='bundle'){quest('jail2');badge('bJail');const[sx,sy]=Town.station();const rob=Town.spawn('robber',sx,sy,{speed:1.4,label:{txt:'BUNDLED $'+d.sym,bg:'#f2c3b8'}});
      const sh=Town.actors.find(a=>a.kind=='sheriff'&&!a.busy);
      const toJail=s=>{rob.follow=s;Town.goTo(s,17,21,()=>{rob.fadeOut=true;rob.follow=null;Town.bubble('jail',`Locked $${d.sym}`,'#b3261e');s.busy=false;s.autoWander=true})};
      if(sh){sh.busy=true;sh.autoWander=false;Town.goTo(sh,6,26,s=>toJail(s))}else Town.goTo(rob,17,21,()=>{rob.fadeOut=true;Town.bubble('jail',`Locked $${d.sym}`,'#b3261e')})}
    else if(d.kind=='mcap')Town.bubble('tele',`$${d.sym} ${d.why.split(':')[0]}`,'#a86a1c');
    else Town.bubble('hotel','Full house','#a86a1c');
  }
});

SB.on((type,d)=>{
  if(type=='scout'){Town.setTag('station',`Scanning ${d.n}`);if(d.best&&d.best.r&&Math.random()<.35)Town.bubble('station',`$${d.best.r.sym} ${d.best.score}% his style`,d.best.score>=SB.paper.set.need?'#2f7a22':'#a86a1c');
    if(!$('panel').classList.contains('hidden')&&$('panelTitle').textContent.startsWith('Scout'))openPanel('scout');badge('bScout')}
  if(type=='scout-migration'&&RUNNING&&MODE=='style'){Town.callTrain(()=>Town.bubble('station','A coin migrated','#2f7a22'))}
});
/* ---------- HUD refresh ---------- */
let tipIdx=0,tipT=0;
setInterval(()=>{
  if(!SB.paper)return;const s=SB.stats(),P=SB.paper;
  $('rBal').textContent=s.eq.toFixed(3);$('rPnl').textContent=(s.pnl>=0?'+':'')+s.pnl.toFixed(3);$('rPnlPct').textContent=(s.pct>=0?'+':'')+s.pct.toFixed(1)+'%';
  $('rPnl').style.color=s.pnl>=0?'#a5f07a':'#ff9a86';$('rWin').textContent=s.wr==null?'-':Math.round(s.wr*100)+'%';$('rTrades').textContent=s.n+' closed';
  if(s.pct>=10)quest('up10');
  const secs=Math.floor((Date.now()-P.t0)/1000);$('logDay').textContent=`Day 1, ${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
  $('logLines').innerHTML=P.log.slice(-3).map(l=>'<div>'+esc(l.msg.replace(/\s{2,}/g,' ').replace(/^COPY BUY/,'Copied').replace(/^BUY/,'Bought').replace(/^SCOUT/,'Scout:').replace(/^SKIP/,'Skipped').replace(/^HIS /,'He: '))
    .replace(/(\$[A-Za-z][A-Za-z0-9_.]*)/g,'<b>$1</b>').replace(/(\+\d[\d.]* SOL)/g,'<b class="g">$1</b>')+'</div>').join('');
  Town.setTag('bank',`Vault ${s.eq.toFixed(2)} SOL`);Town.setTag('hotel',`Open ${s.open}/${P.set.maxOpen}`);Town.setTag('jail',`Locked ${P.skipped.filter(x=>x.kind=='bundle').length}`);
  Town.setTag('saloon',`Copies ${P.closed.length+s.open}`);Town.setTag('sheriff',`Score ${REPORT.score}`);Town.setTag('tele',MODE=='live'?(SB.live.on&&SB.live.ok?'Live':'Offline'):MODE=='style'?'Scout':'Backtest');
  Town.setTag('bounty','History');Town.setTag('store','Settings');
  if(++tipT%16==0&&REPORT){tipIdx=(tipIdx+1)%REPORT.tips.length;const el=$('tipText');el.style.opacity=0;setTimeout(()=>{el.textContent=REPORT.tips[tipIdx].t;el.style.opacity=1},400)}
},500);

/* ---------- panels ---------- */
function openPanel(kind){
  if(!REPORT&&kind!='store'){toast('Track a trader first');return}
  const T=$('panelTitle'),Bd=$('panelBody');const P=SB.paper;let h='';
  const pc=v=>(v>=0?'+':'')+Math.round(v*100)+'%';
  if(kind=='wanted'){T.textContent='Wanted: '+SB.short(REPORT.addr);h=`<div class="reward">REWARD <b>${REPORT.score}</b><small>/100</small> &nbsp; <span class="stamp ${REPORT.score>=60?'g':REPORT.score>=40?'y':''}" style="position:static;display:inline-block">${REPORT.grade}</span></div><div class="verdict">${esc(REPORT.verdict)}</div><div class="statgrid">${reportStats(REPORT)}</div><div class="tiphead">Sheriff's notes</div><ul class="tiplist">${REPORT.tips.map(t=>`<li class="${t.w?'warn':''}">${esc(t.t)}</li>`).join('')}</ul><div class="fine">Based on his last ${REPORT.nSigs} transactions. <a href="https://solscan.io/account/${REPORT.addr}" target="_blank" rel="noopener">Open on Solscan</a></div><button class="wood ghost" id="pNew">Track someone else</button>`}
  else if(kind=='bounty'){badge('bBounty',false);T.textContent='Bounty Hall';const cl=P?P.closed.slice().reverse():[];
    h=`<div class="tiphead">Your copies</div>`+(cl.length?`<table class="t"><tr><th>Token</th><th>Entry</th><th>Exit</th><th>PnL</th><th>ROI</th><th>Exit reason</th></tr>${cl.map(c=>`<tr><td>$${esc(c.sym)}</td><td>${SB.fmtK(c.entryMc)}</td><td>${SB.fmtK(c.exitMc||c.mc)}</td><td class="${c.pnl>=0?'g':'r'}">${SB.fmtSol(c.pnl,1)}</td><td class="${c.pnl>=0?'g':'r'}">${pc(c.roi)}</td><td>${esc(c.reason)}</td></tr>`).join('')}</table>`:'<div class="empty">No closed copies yet.</div>')
    +`<div class="tiphead">His record (${REPORT.closed.length} closed)</div><table class="t"><tr><th>Token</th><th>Entry mcap</th><th>Bought</th><th>Sold</th><th>ROI</th><th>Held</th></tr>${REPORT.closed.slice().reverse().slice(0,40).map(c=>`<tr><td>$${esc(c.sym)}</td><td>${SB.fmtK(c.entryMc)}</td><td>${c.buySol.toFixed(2)}</td><td>${c.sellSol.toFixed(2)}</td><td class="${c.roi>=0?'g':'r'}">${pc(c.roi)}</td><td>${SB.dur(c.holdMin)}</td></tr>`).join('')}</table>`}
  else if(kind=='scout'){badge('bScout',false);T.textContent='Scout: coins in his style';const L=Scout.list().slice(0,30);const p=REPORT.prof;const st=P?P.set:readSet();
    h=`<div class="scoutbar"><span>Looking for <b>${p&&p.ok?SB.fmtK(Math.max(st.min,p.mcLo))+' to '+SB.fmtK(Math.min(st.max,p.mcHi)):'-'}</b> mcap</span><span>Age <b>${p&&p.ok&&p.ageLo!=null?SB.dur(p.ageLo)+' to '+SB.dur(p.ageHi):'any'}</b></span><span>Buys at <b>${st.need}%</b> match</span><span>Tracking <b>${Scout.stats.scanned}</b> coins</span></div>`+
    (L.length?`<table class="t"><tr><th>Token</th><th>Mcap</th><th>Age</th><th>5m</th><th>Buys/Sells 5m</th><th>Liq</th><th>Match</th><th>Status</th></tr>${L.map(c=>{const r=c.r;const col=c.score>=st.need?'#2f7a22':c.score>=st.need-15?'#a86a1c':'#8a7a6a';return`<tr><td>$${esc(r.sym)}</td><td>${SB.fmtK(r.mc)}</td><td>${r.age==null?'-':SB.dur(r.age)}</td><td class="${r.ch5>=0?'g':'r'}">${r.ch5>0?'+':''}${Math.round(r.ch5||0)}%</td><td>${SB.tokenInfo[c.mint].m5.buys}/${SB.tokenInfo[c.mint].m5.sells}</td><td>${r.liq?SB.fmtK(r.liq):'curve'}</td><td><span class="pillm" style="background:${col}">${c.score}%</span></td><td>${esc(c.status)}</td></tr>`}).join('')}</table>`:'<div class="empty">'+(MODE=='style'&&RUNNING?'The Scout is riding out, first coins show up in a few seconds.':'Start a session in "Ride his style" mode to scout coins.')+'</div>')}
  else if(kind=='telegraph'){badge('bTele',false);T.textContent='Telegraph';h=`<div class="log">${P?P.log.slice().reverse().map(l=>`<div class="${l.cls}">${new Date(l.t).toLocaleTimeString()}  ${esc(l.msg)}</div>`).join(''):''}</div>`}
  else if(kind=='jail'){badge('bJail',false);T.textContent='Jail: coins we skipped';const sk=P?P.skipped.slice().reverse():[];h=sk.length?`<table class="t"><tr><th>Token</th><th>Why</th><th>Mcap</th><th>When</th></tr>${sk.map(k=>`<tr><td>$${esc(k.sym)}</td><td>${esc(k.why)}</td><td>${SB.fmtK(k.mc||0)}</td><td>${new Date(k.t).toLocaleTimeString()}</td></tr>`).join('')}</table>`:'<div class="empty">Nobody locked up yet. Bundled coins and entries outside your mcap range end up here.</div>'}
  else if(kind=='posse'){badge('bPosse',false);T.textContent='Posse: open trades';const ps=P?Object.values(P.pos):[];h=ps.length?`<table class="t"><tr><th>Token</th><th>Entry mcap</th><th>Now</th><th>Change</th><th>Value</th><th>Top 10</th></tr>${ps.map(p=>{const ch=p.price/p.entryPrice-1;return`<tr title="${esc(p.why||'')}"><td>$${esc(p.sym)}${p.match?` <small>${p.match}%</small>`:''}</td><td>${SB.fmtK(p.entryMc)}</td><td>${SB.fmtK(p.mc)}</td><td class="${ch>=0?'g':'r'}">${pc(ch)}</td><td>${(p.tokens*p.price).toFixed(3)} SOL</td><td>${p.top10==null?'-':Math.round(p.top10*100)+'%'}</td></tr>`}).join('')}</table>`:'<div class="empty">No open trades. The posse is in the saloon.</div>'}
  else if(kind=='vault'){T.textContent='Vault';const s=SB.stats();h=P?`<div class="statgrid">${statHTML('Started with',P.startSol.toFixed(3)+' SOL')+statHTML('Cash',P.cash.toFixed(3)+' SOL')+statHTML('In trades',(s.eq-P.cash).toFixed(3)+' SOL')+statHTML('Equity',s.eq.toFixed(3)+' SOL')+statHTML('PnL',SB.fmtSol(s.pnl,1)+' SOL',s.pnl>=0?'g':'r')+statHTML('Return',(s.pct>=0?'+':'')+s.pct.toFixed(1)+'%',s.pct>=0?'g':'r')+statHTML('In USD','$'+(s.eq*SB.solUsd).toFixed(0))+statHTML('SOL price','$'+SB.solUsd.toFixed(2))}</div><div class="fine">Paper money only. Fees (1%) and slippage (2%) are applied to every fill.</div>`:'<div class="empty">Start a session first.</div>'}
  else if(kind=='store'){T.textContent='General Store: settings';const s=P?P.set:readSet();h=`<div class="setgrid"><div class="col">${[['size','Copy size','%',s.size],['min','Min entry mcap','$k',s.min/1000],['max','Max entry mcap','$k',s.max/1000],['sl','Stop loss','%',s.sl],['tp','Take profit (half)','%',s.tp],['bundle','Skip if top 10 hold','%',s.bundle],['maxOpen','Max open trades','',s.maxOpen]].map(r=>`<div class="setrow"><label>${r[1]}</label><input data-k="${r[0]}" type="number" value="${r[3]}"><span>${r[2]}</span></div>`).join('')}</div><div class="col"><label class="fl">RPC URL</label><input id="pRpc" value="${esc(SB.cfg.rpc)}"><div class="fine">Changes apply to the next trades right away.</div></div></div><button class="wood" id="pSave">Save</button>`}
  Bd.innerHTML=h;show('panel');
  if($('pNew'))$('pNew').onclick=()=>{hide('panel');if(RUNNING)stopSession('New trader.');hide('hud');hide('setup');show('intro')};
  if($('pSave'))$('pSave').onclick=()=>{const t={};Bd.querySelectorAll('input[data-k]').forEach(i=>t[i.dataset.k]=+i.value);const ns={size:t.size,min:t.min*1000,max:t.max*1000,sl:t.sl,tp:t.tp,bundle:t.bundle,maxOpen:t.maxOpen};if(P)P.set=ns;SB.cfg.rpc=$('pRpc').value.trim()||SB.cfg.rpc;store.set('rpc',SB.cfg.rpc);toast('Settings saved','g');hide('panel')};
}
$('panelX').onclick=()=>hide('panel');$('panel').addEventListener('click',e=>{if(e.target.id=='panel')hide('panel')});
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openPanel(b.dataset.open));
$('logbox').onclick=()=>openPanel('telegraph');
$('portrait').onclick=()=>openPanel('wanted');
Town.onBuildingClick=b=>{if(b.panel)openPanel(b.panel)};
addEventListener('keydown',e=>{if(e.key=='Escape')hide('panel')});
SB.on(t=>{if(t=='log'&&!$('panel').classList.contains('hidden')&&$('panelTitle').textContent=='Telegraph')openPanel('telegraph')});

/* ---------- boot ---------- */
setIcons();drawFace($('sheriffFace'),7,{sheriff:1,beard:2,hat:'#e3d3b0',shirt:'#7a5230'});initIntro();
['sheriff','saloon','bank','jail','hotel','tele','bounty','store','station'].forEach(id=>Town.setTag(id,Town.BL[id].tag));

/* ---------- music ---------- */
(function(){
  const au=$('music'),vol=$('vol'),btn=$('muteBtn');
  const ON='<svg viewBox="0 0 64 56"><g fill="none" stroke="#f2e6c9" stroke-width="3.5" stroke-linejoin="round"><path d="M6 20h10l20-12v40L16 36H6z"/><path d="M44 20c3 2 4 5 4 8s-1 6-4 8M50 13c5 4 8 9 8 15s-3 11-8 15"/></g></svg>';
  const OFF='<svg viewBox="0 0 64 56"><g fill="none" stroke="#f2e6c9" stroke-width="3.5" stroke-linejoin="round"><path d="M6 20h10l20-12v40L16 36H6z"/></g><path d="M44 20l14 16M58 20L44 36" stroke="#e0533f" stroke-width="4" stroke-linecap="round"/></svg>';
  let v=store.get('vol',40),muted=store.get('muted',false),started=false;
  const paint=()=>{vol.value=v;vol.style.setProperty('--v',v+'%');btn.innerHTML=(muted||v==0)?OFF:ON;btn.setAttribute('aria-label',muted?'Unmute music':'Mute music');au.volume=v/100;au.muted=muted||v==0};
  const start=()=>{if(started)return;started=true;paint();au.play().catch(()=>{started=false})};
  ['pointerdown','keydown'].forEach(ev=>addEventListener(ev,start,{capture:true}));
  btn.onclick=e=>{e.stopPropagation();muted=!(muted||v==0)?true:false;if(!muted&&v==0)v=40;store.set('muted',muted);store.set('vol',v);paint();if(!muted)start()};
  vol.oninput=()=>{v=+vol.value;if(v>0&&muted){muted=false;store.set('muted',false)}store.set('vol',v);paint();start()};
  vol.addEventListener('pointerdown',e=>e.stopPropagation());
  paint();
})();
