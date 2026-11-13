/* ================= Scout: real-time finder that hunts coins in his style ================= */
const Scout=(()=>{
  const F={on:false,pool:new Map(),ws:null,timer:null,discT:0,cycle:0,stats:{scanned:0,matches:0}};
  const add=(mint,src)=>{if(!mint||F.pool.has(mint))return;F.pool.set(mint,{mint,src,added:Date.now(),miss:0,score:0,status:'new',last:0})};
  async function discover(){
    const eps=['https://api.dexscreener.com/token-profiles/latest/v1','https://api.dexscreener.com/token-boosts/latest/v1','https://api.dexscreener.com/community-takeovers/latest/v1'];
    for(const u of eps){try{const j=await fetchJ(u);for(const t of (Array.isArray(j)?j:[]))if(t.chainId==='solana')add(t.tokenAddress,u.includes('boost')?'boosted':u.includes('takeover')?'takeover':'profile')}catch(e){}}
    try{const j=await fetchJ('https://api.dexscreener.com/latest/dex/search?q=pumpswap');for(const p of j.pairs||[])if(p.chainId==='solana')add(p.baseToken.address,'pumpswap')}catch(e){}
  }
  function openWs(){
    try{F.ws=new WebSocket('wss://pumpportal.fun/api/data')}catch(e){return}
    F.ws.onopen=()=>{F.ws.send(JSON.stringify({method:'subscribeNewToken'}));F.ws.send(JSON.stringify({method:'subscribeMigration'}))};
    F.ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}if(!m||!m.mint)return;if(m.txType==='create')add(m.mint,'new launch');else{add(m.mint,'migrated');const c=F.pool.get(m.mint);if(c){c.src='migrated';c.migratedNow=Date.now()}SB.emit('scout-migration',{mint:m.mint})}};
    F.ws.onclose=()=>{if(F.on)setTimeout(openWs,5000)};
  }
  async function refresh(mints){
    for(let i=0;i<mints.length;i+=30){const chunk=mints.slice(i,i+30);
      try{const j=await fetchJ('https://api.dexscreener.com/latest/dex/tokens/'+chunk.join(','));SB.absorbPairs(j.pairs||[],chunk);const got=new Set((j.pairs||[]).map(p=>p.baseToken&&p.baseToken.address));
        for(const m of chunk){const c=F.pool.get(m);if(!c)continue;if(got.has(m)){c.miss=0;c.last=Date.now()}else c.miss++}}catch(e){}
      await sleep(220)}
  }
  function fitBand(v,lo,hi){if(v==null||!isFinite(v))return .5;if(v>=lo&&v<=hi)return 1;const d=v<lo?Math.log(lo/Math.max(v,1)):Math.log(v/hi);return Math.max(0,1-d/1.1)}
  function score(c,prof,set){
    const T=SB.tokenInfo[c.mint];if(!T||!T.mc)return null;
    const mc=T.mc,age=T.created?(Date.now()-T.created)/60000:null,mig=!!T.migratedAt||(T.dex&&T.dex!=='pumpfun');
    const lo=Math.max(set.min,prof.mcLo),hi=Math.min(set.max,Math.max(prof.mcHi,lo*1.5));
    const fMc=fitBand(mc,lo,hi);
    const fAge=prof.ageLo==null?.7:fitBand(Math.max(age||0,.5),Math.max(.5,prof.ageLo),prof.ageHi);
    const fVen=mig?prof.migShare:1-prof.migShare;
    const b=T.m5.buys||0,s=T.m5.sells||0,tx=b+s;const bias=tx?b/tx:0;
    const fMom=Math.min(1,(tx>=8?.35:tx/8*.35)+(bias>=.55?.25:bias/.55*.25)+(T.ch5>0?Math.min(.25,T.ch5/40):0)+(T.vol5>=1500?.15:T.vol5/1500*.15));
    const liqOk=!mig||T.liq>=4000;
    const botted=tx>600||(tx>80&&bias>.95);
    let sc=100*(.32*fMc+.25*fAge+.13*fVen+.30*fMom);if(!liqOk)sc*=.6;if(botted)sc=Math.min(sc,35);if(mc<set.min||mc>set.max)sc=Math.min(sc,45);
    if(set.maxAge&&age!=null&&age>set.maxAge)sc=Math.min(sc,40);
    return{sc:Math.round(sc),mc,age,mig,fMc,fAge,fMom,bias,tx,ch5:T.ch5,liq:T.liq,vol5:T.vol5,sym:T.sym,botted};
  }
  function why(r,prof){const p=[];p.push(SB.fmtK(r.mc)+' mcap');if(r.age!=null)p.push(SB.dur(r.age)+' old');p.push(`${r.tx} trades in 5m, ${Math.round(r.bias*100)}% buys`);if(r.ch5)p.push((r.ch5>0?'+':'')+Math.round(r.ch5)+'% 5m');return p.join(', ')}
  async function cycle(){
    if(!F.on)return;F.cycle++;
    try{
      if(Date.now()-F.discT>60000){F.discT=Date.now();discover()}
      const P=SB.paper,set=P.set,prof=REPORT.prof;
      // prune
      for(const[m,c]of F.pool){const T=SB.tokenInfo[m];const age=Date.now()-c.added;
        if(P.pos[m])continue;
        if(c.miss>=4&&age>4*60000||T&&T.mc&&T.mc<set.min*.15&&age>8*60000||T&&T.created&&set.maxAge&&(Date.now()-T.created)/60000>set.maxAge*2||c.status=='done'&&age>30*60000)F.pool.delete(m)}
      if(F.pool.size>260){const arr=[...F.pool.values()].filter(c=>!P.pos[c.mint]).sort((a,b)=>a.score-b.score);for(const c of arr.slice(0,F.pool.size-260))F.pool.delete(c.mint)}
      // pick who to refresh: open positions first, then best + newest
      const all=[...F.pool.values()];const open=Object.keys(P.pos);
      const rest=all.filter(c=>!P.pos[c.mint]).sort((a,b)=>(b.score+(Date.now()-b.last>40000?30:0))-(a.score+(Date.now()-a.last>40000?30:0)));
      const pick=[...new Set([...open,...rest.slice(0,120-open.length).map(c=>c.mint)])];
      await refresh(pick);F.stats.scanned=F.pool.size;
      // mark open positions
      for(const m of open){const T=SB.tokenInfo[m];if(T&&T.priceUsd&&P.pos[m]){const pr=T.priceUsd/SB.solUsd;SB.markPrice(m,pr,T.mc||pr*1e9*SB.solUsd)}}
      // score candidates
      let best=null;
      for(const m of pick){const c=F.pool.get(m);if(!c||P.pos[m])continue;const r=score(c,prof,set);if(!r)continue;c.score=r.sc;c.r=r;if(['new','watching','match','botted volume'].includes(c.status))c.status=r.botted?'botted volume':(r.sc>=set.need&&r.fMc>=.55&&r.fAge>=.5)?'match':'watching';if(!best||r.sc>best.r.sc)best=c}
      SB.emit('scout',{n:F.pool.size,best});
      const room=set.maxOpen-Object.keys(P.pos).length;
      const matches=room>0?[...F.pool.values()].filter(c=>c.status=='match'&&!P.pos[c.mint]).sort((a,b)=>b.score-a.score).slice(0,Math.min(2,room)):[];
      for(const c of matches){if(!F.on)break;c.status='checking';
        const hc=await SB.holderCheck(c.mint);const bad=SB.isBundled(hc,set.bundle);
        if(bad){c.status='jailed';SB.skip(c.mint,c.r.sym,'bundled: '+bad,c.r.mc,'bundle');continue}
        if(hc.ok&&hc.holders&&hc.holders<(set.minHolders||0)){c.status='done';SB.skip(c.mint,c.r.sym,`only ${hc.holders} holders`,c.r.mc,'mcap');continue}
        F.stats.matches++;SB.log(`SCOUT  $${c.r.sym} fits his style ${c.score}%: ${why(c.r,prof)}`,'y');
        const T=SB.tokenInfo[c.mint];const pr=T.priceUsd/SB.solUsd;
        const p=SB.paperBuy(c.mint,c.r.sym,pr,T.mc,{top10:hc.ok?hc.top10:null,match:c.score,why:why(c.r,prof)});c.status=p?'bought':'done';
      }
    }catch(e){console.error(e)}
    F.timer=setTimeout(cycle,10000);
  }
  return{
    start(){F.on=true;F.pool.clear();F.discT=Date.now();F.stats={scanned:0,matches:0};openWs();discover().finally(()=>{F.timer=setTimeout(cycle,1000)})},
    stop(){F.on=false;clearTimeout(F.timer);if(F.ws){try{F.ws.close()}catch(e){}}F.ws=null},
    list(){return[...F.pool.values()].filter(c=>c.r).sort((a,b)=>b.score-a.score)},
    get stats(){return F.stats},get on(){return F.on},_F:F};
})();
