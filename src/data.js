/* ================= SolaBase data layer: RPC, analysis, live feed, paper engine ================= */
const SB={cfg:{rpc:'https://solana-rpc.publicnode.com',sigLimit:400,swapTarget:150,helius:''},solUsd:80,listeners:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function fetchJ(url,ms=9000){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal});return await r.json()}finally{clearTimeout(t)}}
const B58RE=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const WSOL='So11111111111111111111111111111111111111112';
const STABLES=new Set(['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v','Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB']);
SB.on=f=>SB.listeners.push(f);
SB.emit=(type,d)=>{for(const f of SB.listeners)try{f(type,d)}catch(e){console.error(e)}};
SB.short=a=>a?a.slice(0,4)+'..'+a.slice(-4):'';
SB.fmtK=usd=>usd>=1e6?'$'+(usd/1e6).toFixed(2)+'M':usd>=1e3?'$'+(usd>=1e5?Math.round(usd/1e3):(usd/1e3).toFixed(1).replace(/\.0$/,''))+'k':'$'+Math.round(usd);
SB.fmtSol=(s,sign)=>(sign&&s>=0?'+':'')+s.toFixed(Math.abs(s)<1?3:2);
SB.ago=t=>{const s=Math.max(0,Date.now()/1000-t);return s<90?Math.round(s)+'s ago':s<5400?Math.round(s/60)+'m ago':s<172800?Math.round(s/3600)+'h ago':Math.round(s/86400)+'d ago'};
SB.dur=m=>m<1?Math.round(m*60)+'s':m<90?Math.round(m)+'m':(m/60).toFixed(1)+'h';
function median(a){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2}
function pct(a,p){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(p*s.length))]}
SB.median=median;SB.pct=pct;

/* ---------- rate limited JSON-RPC ---------- */
let rlTimes=[];
async function rlWait(){const lim=/publicnode|mainnet-beta/.test(SB.cfg.rpc)?6:/helius/.test(SB.cfg.rpc)?9:12;for(;;){const now=Date.now();rlTimes=rlTimes.filter(t=>now-t<1000);if(rlTimes.length<lim){rlTimes.push(now);return}await sleep(60)}}
async function rpc(method,params,tries=5){
  let last;
  for(let i=0;i<tries;i++){
    await rlWait();
    try{
      const r=await fetch(SB.cfg.rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
      if(r.status==429||r.status==503){last=new Error('RPC busy ('+r.status+')');await sleep(1200*(i+1));continue}
      if(r.status==403){throw new Error('This RPC blocked the request (403). Add your own RPC URL in RPC settings.')}
      const j=await r.json();
      if(j.error){if(/rate|too many|429/i.test(j.error.message||'')){last=new Error(j.error.message);await sleep(1200*(i+1));continue}throw new Error(j.error.message||'RPC error')}
      return j.result;
    }catch(e){last=e;if(/403/.test(e.message))throw e;await sleep(700*(i+1))}
  }
  throw last||new Error('RPC failed');
}
SB.rpc=rpc;
let TXV=1;
async function getTx(sig){for(let i=0;i<3;i++){try{return await rpc('getTransaction',[sig,{encoding:'jsonParsed',maxSupportedTransactionVersion:TXV,commitment:'confirmed'}])}catch(e){const m=/version \((\d+)\)/.exec(e.message);if(m&&+m[1]>TXV){TXV=+m[1];continue}throw e}}return null}

/* ---------- prices + token info ---------- */
SB.fetchSolPrice=async()=>{
  const tries=[async()=>(await (await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')).json()).solana.usd,
    async()=>+(await (await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT')).json()).price,
    async()=>+((await (await fetch('https://api.dexscreener.com/latest/dex/tokens/'+WSOL)).json()).pairs||[]).find(p=>p.quoteToken&&/USD/.test(p.quoteToken.symbol))?.priceUsd];
  for(const f of tries){try{const v=await f();if(v>1&&v<10000){SB.solUsd=v;return v}}catch(e){}}
  return SB.solUsd;
};
SB.tokenInfo={};
SB.fetchTokenInfo=async mints=>{
  const need=[...new Set(mints)].filter(m=>!SB.tokenInfo[m]);
  for(let i=0;i<need.length;i+=30){
    const chunk=need.slice(i,i+30);
    try{
      const j=await fetchJ('https://api.dexscreener.com/latest/dex/tokens/'+chunk.join(','));
      SB.absorbPairs(j.pairs||[],chunk);
    }catch(e){}
    await sleep(250);
  }
  for(const m of need)if(!SB.tokenInfo[m])SB.tokenInfo[m]={sym:m.slice(0,4),mc:0,priceUsd:0,liq:0,missing:true};
};
SB.absorbPairs=(pairs,chunk)=>{const seen={};
  for(const p of pairs){const m=p.baseToken&&p.baseToken.address;if(!m||(chunk&&!chunk.includes(m))||p.chainId&&p.chainId!=='solana')continue;
    const liq=(p.liquidity&&p.liquidity.usd)||0,cr=p.pairCreatedAt||0;
    if(!seen[m]){seen[m]=1;const old=SB.tokenInfo[m];SB.tokenInfo[m]={sym:(p.baseToken.symbol||'').slice(0,12),name:p.baseToken.name,created:cr||Infinity,migratedAt:0,liq:-1,at:Date.now()};if(old&&old.created&&old.created<SB.tokenInfo[m].created)SB.tokenInfo[m].created=old.created}
    const T=SB.tokenInfo[m];if(cr&&cr<T.created)T.created=cr;if(p.dexId==='pumpswap'&&cr&&(!T.migratedAt||cr<T.migratedAt))T.migratedAt=cr;
    if(liq>T.liq||T.liq<0&&!liq){Object.assign(T,{priceUsd:+p.priceUsd||0,mc:p.marketCap||p.fdv||0,liq,dex:p.dexId,pair:p.pairAddress,m5:p.txns&&p.txns.m5||{buys:0,sells:0},h1:p.txns&&p.txns.h1||{buys:0,sells:0},vol5:p.volume&&p.volume.m5||0,vol1h:p.volume&&p.volume.h1||0,ch5:p.priceChange&&p.priceChange.m5||0,ch1h:p.priceChange&&p.priceChange.h1||0})}}
  for(const m in seen){const T=SB.tokenInfo[m];if(T.created===Infinity)T.created=0}};
SB.sym=m=>(SB.tokenInfo[m]&&SB.tokenInfo[m].sym)||m.slice(0,4);
const supplyCache={};
async function tokenSupply(mint){
  if(/pump$/.test(mint))return 1e9;
  if(supplyCache[mint])return supplyCache[mint];
  try{const r=await rpc('getTokenSupply',[mint]);supplyCache[mint]=+r.value.uiAmountString||r.value.uiAmount||1e9}catch(e){supplyCache[mint]=1e9}
  return supplyCache[mint];
}

/* ---------- parse one transaction into a swap ---------- */
function parseSwap(tx,owner){
  if(!tx||!tx.meta||tx.meta.err)return null;
  const keys=tx.transaction.message.accountKeys.map(k=>typeof k=='string'?k:k.pubkey);
  const idx=keys.indexOf(owner);if(idx<0)return null;
  let sol=(tx.meta.postBalances[idx]-tx.meta.preBalances[idx])/1e9;
  const d={};
  const add=(arr,sgn)=>{for(const b of arr||[]){if(b.owner!==owner)continue;const v=parseFloat(b.uiTokenAmount.uiAmountString||b.uiTokenAmount.uiAmount||0)||0;d[b.mint]=(d[b.mint]||0)+sgn*v}};
  add(tx.meta.postTokenBalances,1);add(tx.meta.preTokenBalances,-1);
  if(d[WSOL]){sol+=d[WSOL];delete d[WSOL]}
  const mints=Object.keys(d).filter(m=>Math.abs(d[m])>1e-9&&!STABLES.has(m));
  if(mints.length!==1)return null;
  const mint=mints[0],tok=d[mint];
  const postB=(tx.meta.postTokenBalances||[]).filter(b=>b.owner===owner&&b.mint===mint).reduce((a,b)=>a+(parseFloat(b.uiTokenAmount.uiAmountString)||0),0);
  if(tok>0&&sol<-0.0005)return{side:'buy',mint,tokens:tok,sol:-sol,left:postB,t:tx.blockTime,sig:tx.transaction.signatures[0]};
  if(tok<0&&sol>0.0005)return{side:'sell',mint,tokens:-tok,sol,left:postB,t:tx.blockTime,sig:tx.transaction.signatures[0]};
  return null;
}

/* ---------- Helius enhanced API: only his swaps, fast ---------- */
async function heliusSwaps(addr,onP){
  const key=SB.cfg.helius;let before=null,swaps=[],sigs=[],pages=0;
  while(swaps.length<SB.cfg.swapTarget&&pages<12){
    const url=`https://api.helius.xyz/v0/addresses/${addr}/transactions?api-key=${encodeURIComponent(key)}&type=SWAP&limit=100`+(before?`&before=${before}`:'');
    let j;for(let i=0;i<4;i++){const r=await fetch(url);if(r.status==429){await sleep(1500*(i+1));continue}if(r.status==401||r.status==403)throw new Error('Helius rejected the API key.');j=await r.json();break}
    if(!Array.isArray(j)||!j.length)break;pages++;
    for(const tx of j){sigs.push({blockTime:tx.timestamp,signature:tx.signature});if(tx.transactionError)continue;
      let sol=0;const d={};
      for(const ad of tx.accountData||[]){if(ad.account===addr)sol+=(ad.nativeBalanceChange||0)/1e9;for(const tb of ad.tokenBalanceChanges||[]){if(tb.userAccount!==addr)continue;const v=(+tb.rawTokenAmount.tokenAmount)/10**tb.rawTokenAmount.decimals;d[tb.mint]=(d[tb.mint]||0)+v}}
      if(d[WSOL]){sol+=d[WSOL];delete d[WSOL]}
      const mints=Object.keys(d).filter(m=>Math.abs(d[m])>1e-9&&!STABLES.has(m));if(mints.length!==1)continue;
      const m=mints[0],tok=d[m];
      if(tok>0&&sol<-0.0005)swaps.push({side:'buy',mint:m,tokens:tok,sol:-sol,t:tx.timestamp});else if(tok<0&&sol>0.0005)swaps.push({side:'sell',mint:m,tokens:-tok,sol,t:tx.timestamp})}
    before=j[j.length-1].signature;
    onP({msg:'Reading his swaps from Helius',p:.08+.72*Math.min(1,swaps.length/SB.cfg.swapTarget),count:swaps.length,total:SB.cfg.swapTarget,swaps:swaps.length});
  }
  return{sigs,swaps};
}

/* ---------- full wallet analysis ---------- */
SB.analyze=async(addr,minMcK,onP)=>{
  onP({msg:'Checking the SOL price...',p:.02});
  await SB.fetchSolPrice();
  onP({msg:'Reading his trail of transactions...',p:.05});
  let sigs=[],swaps=[];
  if(SB.cfg.helius){({sigs,swaps}=await heliusSwaps(addr,onP))}
  else{
    const limit=SB.cfg.sigLimit;let before;
    while(sigs.length<limit){
      const b=await rpc('getSignaturesForAddress',[addr,Object.assign({limit:Math.min(1000,limit-sigs.length)},before?{before}:{})]);
      if(!b||!b.length)break;sigs.push(...b);before=b[b.length-1].signature;if(b.length<Math.min(1000,limit))break;
    }
    sigs=sigs.filter(s=>!s.err);
    if(!sigs.length)throw new Error('No transactions found for this address.');
    let done=0;const q=[...sigs];const t0=Date.now();
    const worker=async()=>{while(q.length&&swaps.length<SB.cfg.swapTarget){const s=q.shift();try{const tx=await getTx(s.signature);const sw=parseSwap(tx,addr);if(sw)swaps.push(sw)}catch(e){if(/403/.test(e.message))throw e}
      done++;const eta=Math.round((Date.now()-t0)/done*(sigs.length-done)/1000);onP({msg:`Riding through his last ${sigs.length} transactions`+(eta>8?` (about ${eta}s left)`:''),p:.08+.72*done/sigs.length,count:done,total:sigs.length,swaps:swaps.length})}};
    await Promise.all([worker(),worker(),worker(),worker()]);
    sigs=sigs.slice(0,done);
  }
  if(!swaps.length)throw new Error(`No token swaps found in his last ${sigs.length} transactions. Busy wallets get a lot of spam and fee transfers: raise "Transactions to analyze" or add a free Helius key in RPC settings.`);
  swaps.sort((a,b)=>a.t-b.t);
  const byMint={};for(const s of swaps)(byMint[s.mint]=byMint[s.mint]||[]).push(s);
  const mints=Object.keys(byMint);
  onP({msg:'Looking up '+mints.length+' tokens...',p:.84});
  await SB.fetchTokenInfo(mints);
  const trades=[];
  for(const m of mints){
    const ev=byMint[m];const buys=ev.filter(e=>e.side=='buy');if(!buys.length)continue;
    const firstBuy=buys[0].t;const after=ev.filter(e=>e.t>=firstBuy);
    let bTok=0,bSol=0,sTok=0,sSol=0,lastSell=0;
    for(const e of after){if(e.side=='buy'){bTok+=e.tokens;bSol+=e.sol}else{sTok+=e.tokens;sSol+=e.sol;lastSell=e.t}}
    const supply=await tokenSupply(m);
    const entryPrice=buys[0].sol/buys[0].tokens;
    const entryMc=entryPrice*supply*SB.solUsd;
    const closed=sTok>=bTok*0.9;
    const info=SB.tokenInfo[m]||{};
    let roi,pnl,status;
    if(closed){pnl=sSol-bSol;roi=sSol/bSol-1;status='closed'}
    else{const left=bTok-sTok;const val=info.priceUsd?left*info.priceUsd/SB.solUsd:0;pnl=sSol+val-bSol;roi=(sSol+val)/bSol-1;status='open'}
    const exitMc=closed&&sTok?(sSol/sTok)*supply*SB.solUsd:0;
    const ageMin=info.created?Math.max(0,(firstBuy*1000-info.created)/60000):null;const migrated=info.migratedAt?firstBuy*1000>=info.migratedAt:(info.dex&&info.dex!=='pumpfun');
    trades.push({ageMin,migrated,mint:m,sym:SB.sym(m),entryT:firstBuy,exitT:closed?lastSell:0,buySol:bSol,sellSol:sSol,entryMc,exitMc,roi,pnl,closed,status,holdMin:closed?(lastSell-firstBuy)/60:0,nBuys:buys.length,nSells:after.filter(e=>e.side=='sell').length});
  }
  onP({msg:'Writing the wanted poster...',p:.97});
  const rep=SB.report(addr,trades,sigs,minMcK);
  onP({msg:'Done',p:1});
  return rep;
};

/* ---------- scoring + tips ---------- */
SB.report=(addr,trades,sigs,minMcK)=>{
  const minMc=minMcK*1000;
  const closed=trades.filter(t=>t.closed);
  const copy=closed.filter(t=>t.entryMc>=minMc);
  const st=list=>{const w=list.filter(t=>t.roi>0),l=list.filter(t=>t.roi<=0);const inS=list.reduce((a,t)=>a+t.buySol,0),outS=list.reduce((a,t)=>a+t.sellSol,0);
    const gw=w.reduce((a,t)=>a+t.pnl,0),gl=-l.reduce((a,t)=>a+t.pnl,0);
    return{n:list.length,wins:w.length,wr:list.length?w.length/list.length:0,pnl:outS-inS,roi:inS?outS/inS-1:0,pf:gl>0?gw/gl:(gw>0?9:0),medWin:median(w.map(t=>t.roi)),medLoss:median(l.map(t=>t.roi)),holdW:median(w.map(t=>t.holdMin)),holdL:median(l.map(t=>t.holdMin))}};
  const all=st(closed),cp=st(copy);
  const entries=trades.map(t=>t.entryMc).filter(v=>v>0);
  const fit=entries.length?entries.filter(v=>v>=minMc).length/entries.length:0;
  const times=sigs.map(s=>s.blockTime).filter(Boolean);
  const span=times.length?(Math.max(...times)-Math.min(...times))/86400:0;
  const lastT=times.length?Math.max(...times):0;
  const base=cp.n>=5?cp:all;
  const lin=(v,a,b)=>Math.max(0,Math.min(1,(v-a)/(b-a)));
  let score=35*lin(base.roi,-.5,1)+25*lin(base.wr,.2,.6)+15*lin(base.pf,.5,2.5)+15*fit+10*lin(base.n,3,25);
  if(cp.n<5)score*=.85;
  score=Math.round(Math.max(1,Math.min(99,score)));
  const grade=score>=80?'Sheriff':score>=60?'Deputy':score>=40?'Drifter':'Outlaw';
  const verdict={Sheriff:'Fast hands and a clean record. Worth riding with.',Deputy:'Solid gun. Copy him with the stop loss on.',Drifter:'Hit and miss. Copy small or wait for a better record.',Outlaw:'Losing record or wrong style for SolaBase. Ride alone.'}[grade];
  const p25=pct(entries,.25),p75=pct(entries,.75),med=median(entries);
  const tips=[];
  if(entries.length)tips.push({t:`He usually enters between ${SB.fmtK(p25)} and ${SB.fmtK(p75)} market cap (median ${SB.fmtK(med)}).`});
  if(med<minMc)tips.push({w:1,t:`Most of his entries are under ${SB.fmtK(minMc)}: that's sniping. SolaBase only copies his entries above ${SB.fmtK(minMc)}, about ${Math.round(fit*100)}% of his trades.`});
  else tips.push({t:`${Math.round(fit*100)}% of his entries are above ${SB.fmtK(minMc)}, so most of his trades can be copied.`});
  if(cp.n>=3)tips.push({w:cp.roi<0?1:0,t:`On the trades SolaBase would copy (${cp.n}), he won ${Math.round(cp.wr*100)}% with a ${cp.roi>=0?'+':''}${Math.round(cp.roi*100)}% return.`});
  if(all.holdW&&all.holdL){if(all.holdL>all.holdW*1.3)tips.push({w:1,t:`He holds losers (${SB.dur(all.holdL)}) longer than winners (${SB.dur(all.holdW)}). Keep the stop loss on.`});else tips.push({t:`He cuts losers in ${SB.dur(all.holdL)} and holds winners about ${SB.dur(all.holdW)}.`})}
  const sl=Math.round(Math.min(40,Math.max(15,-(all.medLoss||-.25)*100*1.2)));
  const tp=Math.round(Math.min(300,Math.max(30,(all.medWin||.5)*100)));
  tips.push({t:`Suggested stop loss -${sl}% and take profit +${tp}%, based on his median loss and win.`});
  const medBuy=median(trades.map(t=>t.buySol));
  if(medBuy)tips.push({t:`He buys about ${medBuy.toFixed(2)} SOL per trade. Your copies scale to your own balance.`});
  if(span>0)tips.push({t:`About ${Math.round(trades.length/Math.max(span,1/24))} trades per day. Last move ${SB.ago(lastT)}.`});
  if(lastT&&Date.now()/1000-lastT>86400)tips.push({w:1,t:'He has been quiet for over a day. Live copy may wait a long time, try Backtest first.'});
  const best=[...closed].sort((a,b)=>b.roi-a.roi)[0],worst=[...closed].sort((a,b)=>a.roi-b.roi)[0];
  const minSug=minMcK;const maxSug=Math.round(Math.min(Math.max(p75*3,1e6),2e7)/1000);
  const prof=SB.styleProfile(trades,all,minMc);
  if(prof.ok)tips.push({t:`His style: ${SB.fmtK(prof.mcLo)} to ${SB.fmtK(prof.mcHi)} mcap, coins ${prof.ageLo==null?'of any age':SB.dur(prof.ageLo)+' to '+SB.dur(prof.ageHi)+' old'}, ${Math.round(prof.migShare*100)}% after migration. The Scout hunts for coins like these.`});
  return{addr,trades,closed,copy,all,cp,fit,score,grade,verdict,tips,best,worst,lastT,span,nSigs:sigs.length,suggest:{sl,tp,min:minSug,max:maxSug},solUsd:SB.solUsd,prof};
};

/* ---------- his style profile (what the Scout looks for) ---------- */
SB.styleProfile=(trades,all,minMc)=>{
  const use=trades.filter(t=>t.entryMc>=minMc*0.8);const src=use.length>=4?use:trades;
  const mcs=src.map(t=>t.entryMc).filter(v=>v>0);const ages=src.map(t=>t.ageMin).filter(v=>v!=null&&isFinite(v));
  if(mcs.length<2)return{ok:false};
  const winners=src.filter(t=>t.closed&&t.roi>0);const wm=winners.map(t=>t.entryMc);
  return{ok:true,n:src.length,mcLo:Math.max(minMc,pct(mcs,.15)),mcHi:Math.max(minMc*1.5,pct(mcs,.85)),mcMed:Math.max(minMc,median(wm.length>=3?wm:mcs)),
    ageLo:ages.length>=3?pct(ages,.15):null,ageHi:ages.length>=3?Math.max(10,pct(ages,.85)):null,ageMed:ages.length?median(ages):null,
    migShare:src.filter(t=>t.migrated).length/src.length,hold:all.holdW||all.holdL||30,holdL:all.holdL||20};
};

/* ---------- holder / bundle check ---------- */
SB.holderCache={};
SB.holderCheck=async mint=>{
  const c=SB.holderCache[mint];if(c&&Date.now()-c.at<120000)return c;
  try{
    const r=await fetch('https://api.rugcheck.xyz/v1/tokens/'+mint+'/report');
    if(!r.ok)throw new Error('no holder report yet ('+r.status+')');
    const j=await r.json();const ka=j.knownAccounts||{};
    const hs=(j.topHolders||[]).filter(h=>!(ka[h.owner]||ka[h.address]));
    const top=hs.slice(0,10);
    const res={ok:true,at:Date.now(),top10:top.reduce((a,h)=>a+(h.pct||0),0)/100,maxOne:top.length?(top[0].pct||0)/100:0,insiders:top.filter(h=>h.insider).length,
      danger:(j.risks||[]).filter(x=>x.level=='danger').map(x=>x.name),rugged:!!j.rugged,holders:j.totalHolders||0};
    SB.holderCache[mint]=res;return res;
  }catch(e){return{ok:false,err:e.message}}
};
SB.isBundled=(hc,limitPct)=>{if(!hc||!hc.ok)return null;
  if(hc.rugged)return'rugged';
  if(hc.top10*100>=limitPct)return`top 10 hold ${Math.round(hc.top10*100)}%`;
  if(hc.insiders>=3)return`${hc.insiders} insider wallets in the top 10`;
  if(hc.danger.length)return hc.danger[0].toLowerCase();
  return null};

/* ---------- live: poll his wallet on-chain ---------- */
SB.live={on:false,last:null,timer:null,ok:false};
SB.startLive=async trader=>{
  const L=SB.live;L.on=true;L.trader=trader;
  const first=await rpc('getSignaturesForAddress',[trader,{limit:1}]);L.last=first&&first[0]?first[0].signature:null;L.ok=true;
  const loop=async()=>{if(!L.on)return;
    try{const sigs=await rpc('getSignaturesForAddress',[trader,Object.assign({limit:25},L.last?{until:L.last}:{})]);
      if(sigs&&sigs.length){L.last=sigs[0].signature;
        for(const s of sigs.reverse()){if(!L.on)return;if(s.err)continue;try{const tx=await getTx(s.signature);const sw=parseSwap(tx,trader);
          if(sw){const supply=await tokenSupply(sw.mint);sw.priceSol=sw.sol/sw.tokens;sw.mc=sw.priceSol*supply*SB.solUsd;sw.supply=supply;SB.emit('trader',sw)}}catch(e){}}}
      if(!L.ok){L.ok=true;SB.emit('feed',{down:false})}
    }catch(e){if(L.ok){L.ok=false;SB.emit('feed',{down:true,err:e.message})}}
    L.timer=setTimeout(loop,/publicnode|mainnet-beta/.test(SB.cfg.rpc)?7000:4000)};
  L.timer=setTimeout(loop,2000);
};
SB.stopLive=()=>{const L=SB.live;L.on=false;clearTimeout(L.timer)};
SB.supplyOf=tokenSupply;

/* ---------- paper trading engine ---------- */
const FEE=0.01,SLIP=0.02;
SB.MIN_TRADE=0.01;
SB.paper=null;
SB.newPaper=(startSol,set,mode)=>{SB.paper={mode,startSol,cash:startSol,set,pos:{},closed:[],skipped:[],log:[],t0:Date.now()};return SB.paper};
SB.equity=()=>{const P=SB.paper;if(!P)return 0;let v=P.cash;for(const m in P.pos){const p=P.pos[m];v+=p.tokens*p.price*(1-FEE)}return v};
SB.log=(msg,cls='')=>{const P=SB.paper;if(!P)return;P.log.push({t:Date.now(),msg,cls});if(P.log.length>500)P.log.shift();SB.emit('log',{msg,cls})};
SB.paperBuy=(mint,sym,priceSol,mcUsd,extra={})=>{
  const P=SB.paper,s=P.set;
  if(P.pos[mint])return null;
  if(Object.keys(P.pos).length>=s.maxOpen){SB.skip(mint,sym,'max open trades reached',mcUsd,'full');return null}
  let size=Math.min(P.cash,SB.equity()*s.size/100);
  if(size<SB.MIN_TRADE)size=Math.min(P.cash,SB.MIN_TRADE);
  if(size<SB.MIN_TRADE-1e-9){SB.skip(mint,sym,`not enough cash for a ${SB.MIN_TRADE} SOL trade`,mcUsd,'full');return null}
  const fill=priceSol*(1+SLIP);const tokens=size*(1-FEE)/fill;
  P.cash-=size;
  const p=P.pos[mint]={mint,sym,tokens,cost:size,firstCost:size,entryPrice:fill,price:priceSol,entryMc:mcUsd,mc:mcUsd,peak:priceSol,t:Date.now(),tpDone:false,realized:0,...extra};
  SB.log(`${P.mode=='style'?'BUY':'COPY BUY'}  $${sym}  ${size.toFixed(3)} SOL at ${SB.fmtK(mcUsd)} mcap`,'y');
  SB.emit('buy',p);return p;
};
SB.paperSell=(mint,frac,reason,priceSol,mcUsd)=>{
  const P=SB.paper,p=P.pos[mint];if(!p)return;
  if(priceSol)p.price=priceSol;if(mcUsd)p.mc=mcUsd;
  frac=Math.max(0,Math.min(1,frac));if(frac<=0)return;
  const tok=p.tokens*frac;const out=tok*p.price*(1-SLIP)*(1-FEE);
  const costPart=p.cost*(tok/p.tokens);
  p.tokens-=tok;p.cost-=costPart;p.realized+=out-costPart;P.cash+=out;
  const pnlPart=out-costPart;
  SB.log(`${reason.toUpperCase()}  $${p.sym}  sold ${Math.round(frac*100)}%  ${pnlPart>=0?'+':''}${pnlPart.toFixed(3)} SOL`,pnlPart>=0?'g':'r');
  if(p.tokens*p.price<1e-6||frac>=0.999){
    delete P.pos[mint];
    const tot=p.realized;
    const rec={...p,exitMc:p.mc,pnl:tot,roi:tot/p.firstCost,reason,closedAt:Date.now()};
    P.closed.push(rec);SB.emit('close',rec);
  }else SB.emit('partial',{...p,reason,pnl:pnlPart});
};
SB.skip=(mint,sym,why,mcUsd,kind)=>{const P=SB.paper;const r={mint,sym,why,mc:mcUsd,kind,t:Date.now()};P.skipped.push(r);SB.log(`SKIP  $${sym}  ${why}`,'r');SB.emit('skip',r)};
SB.markPrice=(mint,priceSol,mcUsd)=>{
  const P=SB.paper,p=P&&P.pos[mint];if(!p)return;
  p.price=priceSol;p.mc=mcUsd;if(priceSol>p.peak)p.peak=priceSol;
  const ch=priceSol/p.entryPrice-1,s=P.set;
  if(s.sl>0&&ch<=-s.sl/100){SB.paperSell(mint,1,'stop loss');return}
  if(s.tp>0&&!p.tpDone&&ch>=s.tp/100){p.tpDone=true;SB.paperSell(mint,.5,'take profit');if(!P.pos[mint])return}
  if(P.mode=='style'){
    if(p.tpDone&&priceSol<p.peak*(1-(s.trail||30)/100)){SB.paperSell(mint,1,'trailing stop');return}
    const held=(Date.now()-p.t)/60000;if(s.timeStop&&held>s.timeStop&&ch<0.1){SB.paperSell(mint,1,'time stop');return}
  }
  SB.emit('mark',p);
};
SB.stats=()=>{const P=SB.paper;if(!P)return{};const eq=SB.equity();const w=P.closed.filter(c=>c.pnl>0).length;return{eq,pnl:eq-P.startSol,pct:(eq/P.startSol-1)*100,n:P.closed.length,wr:P.closed.length?w/P.closed.length:null,open:Object.keys(P.pos).length}};
