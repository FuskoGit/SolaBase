/* ================= Town renderer: isometric wild west town ================= */
const Town=(()=>{
const cv=document.getElementById('town'),g=cv.getContext('2d');
const TWh=32,THh=16,N=40;
let DPR=1,VW=0,VH=0;
const cam={x:0,y:560,z:1,tz:1};
const rnd=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(1234567);
const iso=(x,y,z=0)=>[(x-y)*TWh,(x+y)*THh-z];
function shade(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16,gg=(n>>8)&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(k>1?v+(255-v)*(k-1):v*k)));return`rgb(${f(r)},${f(gg)},${f(b)})`}

/* ---------- map ---------- */
const road=[...Array(N)].map(()=>Array(N).fill(0));
const R=(x0,x1,y0,y1)=>{for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)road[x][y]=1};
R(4,35,18,19);R(18,19,4,35);R(9,29,27,28);R(9,10,9,28);R(9,29,9,10);R(28,29,9,28);R(5,9,21,22);
const walk=road.map(c=>c.slice());
const B=[];
function bld(o){o.cx=o.x+o.w/2;o.cy=o.y+o.d/2;B.push(o);for(let x=o.x;x<o.x+o.w;x++)for(let y=o.y;y<o.y+o.d;y++)if(walk[x])walk[x][y]=0;if(o.door)walk[o.door[0]][o.door[1]]=1;return o}
const BL={
 sheriff:bld({id:'sheriff',name:"SHERIFF",x:12,y:13,w:5,d:4,h:52,wall:'#e8dcc4',roof:'#46598f',ridge:'x',front:'y',facade:72,door:[14,17],panel:'wanted',tag:'Sheriff'}),
 saloon:bld({id:'saloon',name:'SALOON',x:21,y:12,w:6,d:5,h:66,wall:'#c98b52',roof:'#8d3b2c',ridge:'x',front:'y',facade:96,door:[23,17],panel:'bounty',tag:'Saloon',balcony:1}),
 bounty:bld({id:'bounty',name:'BOUNTY HALL',x:13,y:3,w:7,d:5,h:78,wall:'#efe6d2',roof:'#3e4f86',ridge:'x',front:'y',door:[16,8],panel:'bounty',tag:'Bounty Hall',tower:1}),
 hotel:bld({id:'hotel',name:'HOTEL',x:11,y:24,w:5,d:3,h:60,wall:'#a9c4d8',roof:'#a85c32',ridge:'x',front:'y',facade:80,door:[13,27],panel:'posse',tag:'Hotel'}),
 jail:bld({id:'jail',name:'JAIL',x:13,y:20,w:4,d:3,h:44,wall:'#9b968c',roof:'#5b5650',ridge:'y',front:'x',stone:1,door:[17,21],panel:'jail',tag:'Jail'}),
 bank:bld({id:'bank',name:'BANK',x:21,y:21,w:4,d:4,h:58,wall:'#e3c79a',roof:'#3f7a5a',ridge:'x',front:'y',facade:84,door:[22,25],panel:'vault',tag:'Bank'}),
 tele:bld({id:'tele',name:'TELEGRAPH',x:25,y:22,w:3,d:3,h:44,wall:'#d9c6a4',roof:'#7a5a3a',ridge:'x',front:'y',facade:62,door:[26,25],panel:'telegraph',tag:'Telegraph'}),
 store:bld({id:'store',name:'STORE',x:4,y:12,w:4,d:4,h:48,wall:'#d8a874',roof:'#6b8f3a',ridge:'y',front:'x',facade:66,door:[8,14],panel:'store',tag:'General Store'}),
 station:bld({id:'station',name:'STATION',x:4,y:24,w:4,d:3,h:42,wall:'#c4a07a',roof:'#6a3c2a',ridge:'x',front:'y',door:[6,27],panel:'posse',tag:'Station'}),
 smith:bld({id:'smith',name:'',x:21,y:4,w:4,d:3,h:40,wall:'#b98a5e',roof:'#56473c',ridge:'y',front:'x'}),
 house1:bld({id:'house1',name:'',x:30,y:12,w:3,d:3,h:38,wall:'#e4d2b0',roof:'#b0492f',ridge:'y',front:'x'}),
 house2:bld({id:'house2',name:'',x:30,y:21,w:3,d:3,h:38,wall:'#cfe0e6',roof:'#5c6b9c',ridge:'x',front:'y'}),
 house3:bld({id:'house3',name:'',x:3,y:5,w:3,d:3,h:36,wall:'#dcc29a',roof:'#8f3d2c',ridge:'x',front:'y'}),
 barn:bld({id:'barn',name:'',x:24,y:30,w:5,d:4,h:50,wall:'#a8432f',roof:'#5a2e22',ridge:'y',front:'x',barn:1}),
};
walk[6][27]=1;for(let y=23;y<=27;y++)walk[8][y]=1;walk[7][27]=1;
/* props */
const props=[];
const prop=(t,x,y,o={})=>props.push({t,x,y,...o});
[[7,9],[16,22],[24,8],[33,17],[11,31],[20,32],[31,26],[2,15],[26,6],[35,30],[6,30],[34,7],[17,30]].forEach(p=>prop('tree',p[0]+.5,p[1]+.5,{s:.8+rnd()*.5}));
for(let i=0;i<34;i++){let x=rnd()*N,y=rnd()*N;const tx=x|0,ty=y|0;if(road[tx]&&road[tx][ty])continue;if(B.some(b=>x>b.x-1&&x<b.x+b.w+1&&y>b.y-1&&y<b.y+b.d+1))continue;if(x>30&&x<37&&y>8&&y<27)continue;if(x<3)continue;prop(rnd()<.6?'cactus':'rock',x,y,{s:.7+rnd()*.6})}
[[19.5,15.5],[17.5,20.5],[26.5,20.3],[11.2,17.2],[27.8,16.6],[20.4,26.3]].forEach(p=>prop('barrel',p[0],p[1]));
[[8.2,16.2],[8.4,16.8],[24.6,26.2],[6.8,23.2]].forEach(p=>prop('crate',p[0],p[1]));
prop('wagon',15.5,31.5);prop('tower',31.5,17.6);prop('trough',20.8,17.3);prop('well',30.6,28.5);
const pens=[{x:31,y:9,w:6,d:5},{x:32,y:20,w:5,d:6}];
const animals=[];pens.forEach((p,i)=>{for(let k=0;k<3;k++)animals.push({x:p.x+1+rnd()*(p.w-2),y:p.y+1+rnd()*(p.d-2),pen:p,kind:i?'pig':'horse',ph:rnd()*6,vx:0,vy:0})});

/* ---------- ground layer (pre-rendered) ---------- */
const GS=1.5,GX0=-N*TWh-80,GY0=-80,GW=2*N*TWh+160,GH=2*N*THh+160;
const ground=document.createElement('canvas');ground.width=GW*GS;ground.height=GH*GS;
(function paintGround(){
  const c=ground.getContext('2d');c.scale(GS,GS);c.translate(-GX0,-GY0);
  const dia=(x,y,w=1,d=1)=>{const a=iso(x,y),b=iso(x+w,y),e=iso(x+w,y+d),f=iso(x,y+d);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineTo(...e);c.lineTo(...f);c.closePath()};
  const big=c.createLinearGradient(-N*TWh,0,N*TWh,N*THh*2);big.addColorStop(0,'#e7ad6c');big.addColorStop(.5,'#dc9a58');big.addColorStop(1,'#cf8a4a');
  dia(-4,-4,N+8,N+8);c.fillStyle=big;c.fill();
  for(let i=0;i<900;i++){const x=rnd()*N,y=rnd()*N;const[p,q]=iso(x,y);c.fillStyle=rnd()<.5?'rgba(160,90,40,.10)':'rgba(255,225,170,.12)';c.beginPath();c.ellipse(p,q,4+rnd()*26,2+rnd()*10,0,0,7);c.fill()}
  for(let x=0;x<N;x++)for(let y=0;y<N;y++)if(road[x][y]){dia(x-.02,y-.02,1.04,1.04);c.fillStyle='#f1c88d';c.fill()}
  for(let x=0;x<N;x++)for(let y=0;y<N;y++)if(road[x][y]){
    c.strokeStyle='rgba(140,80,30,.45)';c.lineWidth=2.5;
    const e=(ax,ay,bx,by)=>{c.beginPath();c.moveTo(...iso(ax,ay));c.lineTo(...iso(bx,by));c.stroke()};
    if(!road[x][y-1])e(x,y,x+1,y);if(!road[x][y+1])e(x,y+1,x+1,y+1);if(!(road[x-1]&&road[x-1][y]))e(x,y,x,y+1);if(!(road[x+1]&&road[x+1][y]))e(x+1,y,x+1,y+1);
    for(let k=0;k<3;k++){const[p,q]=iso(x+rnd(),y+rnd());c.fillStyle='rgba(170,110,60,.18)';c.fillRect(p,q,2+rnd()*5,1.5)}
  }
  c.strokeStyle='rgba(150,95,45,.22)';c.lineWidth=1.5;c.setLineDash([10,7]);
  const rut=(ax,ay,bx,by)=>{c.beginPath();c.moveTo(...iso(ax,ay));c.lineTo(...iso(bx,by));c.stroke()};
  for(const o of[.65,1.35]){rut(4,18+o,36,18+o);rut(18+o,4,18+o,36);rut(9,27+o,30,27+o);rut(9+o,9,9+o,29);rut(9,9+o,30,9+o);rut(28+o,9,28+o,29)}c.setLineDash([]);
  for(const b of B){dia(b.x-.25,b.y-.25,b.w+.5,b.d+.5);c.fillStyle='rgba(120,70,30,.18)';c.fill()}
  for(const p of pens){dia(p.x,p.y,p.w,p.d);c.fillStyle='#c98a50';c.fill();for(let i=0;i<40;i++){const[a,b2]=iso(p.x+rnd()*p.w,p.y+rnd()*p.d);c.fillStyle='rgba(120,70,30,.2)';c.fillRect(a,b2,3,2)}}
  /* rails */
  c.fillStyle='#8a6a4a';for(let y=-4;y<N+4;y+=.5){const a=iso(.8,y),b=iso(2.2,y),e=iso(2.2,y+.22),f=iso(.8,y+.22);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineTo(...e);c.lineTo(...f);c.fill()}
  c.strokeStyle='#5a5f66';c.lineWidth=3;for(const rx of[1.15,1.85]){c.beginPath();c.moveTo(...iso(rx,-4));c.lineTo(...iso(rx,N+4));c.stroke()}
  c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1;for(const rx of[1.15,1.85]){c.beginPath();c.moveTo(...iso(rx,-4,1.5));c.lineTo(...iso(rx,N+4,1.5));c.stroke()}
  /* station platform */
  dia(2.4,22.5,1.5,6);c.fillStyle='#9c7350';c.fill();
})();

/* ---------- drawing helpers ---------- */
function poly(pts,fill,stroke){g.beginPath();g.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)g.lineTo(...pts[i]);g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke()}}
function faceY(b,y,x0,x1,z0,z1){return[iso(x0,y,z0),iso(x1,y,z0),iso(x1,y,z1),iso(x0,y,z1)]}
function faceX(b,x,y0,y1,z0,z1){return[iso(x,y0,z0),iso(x,y1,z0),iso(x,y1,z1),iso(x,y0,z1)]}
function planks(pts,n,col){g.save();g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);g.closePath();g.clip();g.strokeStyle=col;g.lineWidth=1;
  for(let i=1;i<n;i++){const k=i/n;const a=[pts[0][0]+(pts[3][0]-pts[0][0])*k,pts[0][1]+(pts[3][1]-pts[0][1])*k],b=[pts[1][0]+(pts[2][0]-pts[1][0])*k,pts[1][1]+(pts[2][1]-pts[1][1])*k];g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke()}g.restore()}
function winY(y,x,z,w,h,col='#3b4a5c'){poly([iso(x,y,z),iso(x+w,y,z),iso(x+w,y,z+h),iso(x,y,z+h)],'#5a3a22');poly([iso(x+.05,y,z+2),iso(x+w-.05,y,z+2),iso(x+w-.05,y,z+h-2),iso(x+.05,y,z+h-2)],col);const[a,b]=iso(x+w/2,y,z+h-2),[c2,d]=iso(x+w/2,y,z+2);g.strokeStyle='#5a3a22';g.lineWidth=1.2;g.beginPath();g.moveTo(a,b);g.lineTo(c2,d);g.stroke()}
function winX(x,y,z,w,h,col='#334252'){poly([iso(x,y,z),iso(x,y+w,z),iso(x,y+w,z+h),iso(x,y,z+h)],'#4a2f1c');poly([iso(x,y+.05,z+2),iso(x,y+w-.05,z+2),iso(x,y+w-.05,z+h-2),iso(x,y+.05,z+h-2)],col)}
function signText(txt,face,cx,cy,z,size,col='#fff',bg='#5a3417'){
  g.save();const[p,q]=face=='y'?iso(cx,cy,z):iso(cx,cy,z);g.translate(p,q);g.transform(1,face=='y'?.5:-.5,0,1,0,0);
  g.font=`bold ${size}px 'Bree Serif',Georgia,serif`;const w=g.measureText(txt).width+12;
  g.fillStyle=bg;g.fillRect(-w/2,-size*.85,w,size*1.25);g.strokeStyle='#2a1608';g.lineWidth=1.5;g.strokeRect(-w/2,-size*.85,w,size*1.25);
  g.fillStyle=col;g.textAlign='center';g.fillText(txt,0,size*.2);g.restore()}

function drawBuilding(b,t){
  const{x,y,w,d,h}=b;const x1=x+w,y1=y+d;
  const wl=shade(b.wall,1.06),wr=shade(b.wall,.78);
  // walls
  const L=faceY(b,y1,x,x1,0,h),Rf=faceX(b,x1,y,y1,0,h);
  poly(L,wl);poly(Rf,wr);
  if(b.stone){for(const F of[L,Rf]){g.save();g.beginPath();g.moveTo(...F[0]);F.slice(1).forEach(p=>g.lineTo(...p));g.closePath();g.clip();g.strokeStyle='rgba(60,55,50,.35)';for(let i=0;i<9;i++){planks(F,9,'rgba(60,55,50,.25)')}g.restore()}}
  else{planks(L,Math.round(h/7),'rgba(90,50,20,.18)');planks(Rf,Math.round(h/7),'rgba(60,30,10,.22)')}
  if(b.barn){g.strokeStyle='#f3e6cf';g.lineWidth=2.5;const a=iso(x1,y+d*.3,4),b2=iso(x1,y+d*.7,h*.55),c2=iso(x1,y+d*.7,4),d2=iso(x1,y+d*.3,h*.55);g.beginPath();g.moveTo(...a);g.lineTo(...b2);g.moveTo(...c2);g.lineTo(...d2);g.stroke();poly(faceX(b,x1,y+d*.3,y+d*.7,4,h*.55),null,'#f3e6cf')}
  // windows + door
  const floors=h>56?2:1;
  if(b.front=='y'){
    for(let f=0;f<floors;f++){const z=8+f*(h/floors);const n=Math.max(2,Math.floor(w*1.1));for(let i=0;i<n;i++){const wx=x+(i+.5)*w/n-.22;if(f==0&&Math.abs(wx+.22-(b.door?b.door[0]+.5:-9))<.6)continue;winY(y1,wx,z,.44,Math.min(18,h/floors-14))}}
    if(b.door){const dx=b.door[0]+.2;poly([iso(dx,y1,0),iso(dx+.6,y1,0),iso(dx+.6,y1,22),iso(dx,y1,22)],'#4a2a14');if(b.id=='saloon'){poly([iso(dx+.05,y1,6),iso(dx+.28,y1,6),iso(dx+.28,y1,16),iso(dx+.05,y1,16)],'#b77a3e');poly([iso(dx+.32,y1,6),iso(dx+.55,y1,6),iso(dx+.55,y1,16),iso(dx+.32,y1,16)],'#b77a3e')}}
    for(let i=0;i<Math.max(1,Math.floor(d/2));i++)winX(x1,y+(i+.5)*d/Math.max(1,Math.floor(d/2))-.25,10,.5,14);
  }else{
    for(let f=0;f<floors;f++){const z=8+f*(h/floors);const n=Math.max(2,Math.floor(d*1.1));for(let i=0;i<n;i++){const wy=y+(i+.5)*d/n-.22;if(f==0&&b.door&&Math.abs(wy+.22-b.door[1]-.5)<.6)continue;winX(x1,wy,z,.44,Math.min(18,h/floors-14),b.stone?'#1e1e22':'#334252')}}
    if(b.stone){g.strokeStyle='#2a2a2a';g.lineWidth=2;for(let i=0;i<Math.floor(d*1.1);i++){const wy=y+(i+.5)*d/Math.floor(d*1.1)-.22;for(let k=1;k<4;k++){const a=iso(x1,wy+k*.11,10),c2=iso(x1,wy+k*.11,24);g.beginPath();g.moveTo(...a);g.lineTo(...c2);g.stroke()}}}
    if(b.door){const dy=b.door[1]+.2;poly([iso(x1,dy,0),iso(x1,dy+.6,0),iso(x1,dy+.6,22),iso(x1,dy,22)],b.stone?'#3a3a3a':'#4a2a14')}
    for(let i=0;i<Math.max(1,Math.floor(w/2));i++)winY(y1,x+(i+.5)*w/Math.max(1,Math.floor(w/2))-.25,10,.5,14);
  }
  // roof
  const o=.22,rh=b.facade?16:Math.min(34,Math.max(w,d)*7);const ft=b.facade?h+rh+30:0;const rc=b.roof;
  if(b.ridge=='x'){
    const back=[iso(x-o,y-o,h),iso(x1+o,y-o,h),iso(x1+o,y+d/2,h+rh),iso(x-o,y+d/2,h+rh)];poly(back,shade(rc,.75));
    poly([iso(x1,y,h),iso(x1,y1,h),iso(x1,y+d/2,h+rh)],wr);
    const fr=[iso(x-o,y1+o,h-3),iso(x1+o,y1+o,h-3),iso(x1+o,y+d/2,h+rh),iso(x-o,y+d/2,h+rh)];poly(fr,shade(rc,1.05));planks(fr,6,'rgba(0,0,0,.12)');
  }else{
    const back=[iso(x-o,y-o,h),iso(x-o,y1+o,h),iso(x+w/2,y1+o,h+rh),iso(x+w/2,y-o,h+rh)];poly(back,shade(rc,.75));
    poly([iso(x,y1,h),iso(x1,y1,h),iso(x+w/2,y1,h+rh)],wl);
    const fr=[iso(x1+o,y-o,h-3),iso(x1+o,y1+o,h-3),iso(x+w/2,y1+o,h+rh),iso(x+w/2,y-o,h+rh)];poly(fr,shade(rc,.92));planks(fr,6,'rgba(0,0,0,.12)');
  }
  if(b.tower){const tx=x+w/2-.6,ty=y+d/2-.6,th=h+rh+34;poly(faceY(b,ty+1.2,tx,tx+1.2,h+rh-10,th),'#f1ead8');poly(faceX(b,tx+1.2,ty,ty+1.2,h+rh-10,th),'#cfc6b2');
    const[cx,cy]=iso(tx+.6,ty+1.2,th-14);g.save();g.translate(cx,cy);g.transform(1,.5,0,1,0,0);g.fillStyle='#fff';g.beginPath();g.arc(-6,0,8,0,7);g.fill();g.strokeStyle='#333';g.stroke();g.restore();
    poly([iso(tx-.15,ty-.15,th),iso(tx+1.35,ty-.15,th),iso(tx+.6,ty+.6,th+26)],'#34447a');poly([iso(tx+1.35,ty-.15,th),iso(tx+1.35,ty+1.35,th),iso(tx+.6,ty+.6,th+26)],'#2a3866');poly([iso(tx-.15,ty+1.35,th),iso(tx+1.35,ty+1.35,th),iso(tx+.6,ty+.6,th+26)],'#3e4f86');
    const[fx,fy]=iso(tx+.6,ty+.6,th+26);g.strokeStyle='#333';g.lineWidth=1.5;g.beginPath();g.moveTo(fx,fy);g.lineTo(fx,fy-18);g.stroke();g.fillStyle='#b3261e';g.fillRect(fx,fy-18,12,7);g.fillStyle='#fff';g.fillRect(fx,fy-14,12,1.5)}
  // false front facade
  if(b.facade){
    if(b.front=='y'){const F=faceY(b,y1+.24,x-.05,x1+.05,h-6,ft);poly(F,shade(b.wall,1.1),'rgba(60,30,10,.5)');planks(F,4,'rgba(90,50,20,.15)');
      poly([iso(x-.15,y1+.24,ft),iso(x1+.15,y1+.24,ft),iso(x1+.15,y1+.24,ft+5),iso(x-.15,y1+.24,ft+5)],shade(b.wall,.7))}
    else{const F=faceX(b,x1+.24,y-.05,y1+.05,h-6,ft);poly(F,shade(b.wall,.9),'rgba(60,30,10,.5)');planks(F,4,'rgba(90,50,20,.15)')}
  }
  if(b.balcony){poly([iso(x,y1,h*.5),iso(x1,y1,h*.5),iso(x1,y1+.7,h*.5),iso(x,y1+.7,h*.5)],'#7a4a26');for(let i=0;i<=w*2;i++){const a=iso(x+i/2,y1+.7,h*.5),c2=iso(x+i/2,y1+.7,h*.5+9);g.strokeStyle='#5a3417';g.lineWidth=1.5;g.beginPath();g.moveTo(...a);g.lineTo(...c2);g.stroke()}
    g.beginPath();g.moveTo(...iso(x,y1+.7,h*.5+9));g.lineTo(...iso(x1,y1+.7,h*.5+9));g.stroke()}
  // porch
  if(b.front=='y'&&b.name){const pz=Math.min(h-14,30);poly([iso(x,y1,pz),iso(x1,y1,pz),iso(x1,y1+.8,pz-6),iso(x,y1+.8,pz-6)],shade(b.roof,.95),'rgba(0,0,0,.25)');
    g.strokeStyle='#5a3417';g.lineWidth=2.5;for(let i=0;i<=Math.floor(w);i++){const a=iso(x+i*w/Math.floor(w),y1+.75,0),c2=iso(x+i*w/Math.floor(w),y1+.75,pz-6);g.beginPath();g.moveTo(...a);g.lineTo(...c2);g.stroke()}}
  if(b.front=='x'&&b.name){const pz=Math.min(h-12,30);poly([iso(x1,y,pz),iso(x1,y1,pz),iso(x1+.8,y1,pz-6),iso(x1+.8,y,pz-6)],shade(b.roof,.85),'rgba(0,0,0,.25)');
    g.strokeStyle='#5a3417';g.lineWidth=2.5;for(let i=0;i<=Math.floor(d);i++){const a=iso(x1+.75,y+i*d/Math.floor(d),0),c2=iso(x1+.75,y+i*d/Math.floor(d),pz-6);g.beginPath();g.moveTo(...a);g.lineTo(...c2);g.stroke()}}
  // sign
  if(b.name){if(b.front=='y')signText(b.name,'y',x+w/2,y1+.26,(ft||h)-16,b.name.length>8?12:16);else signText(b.name,'x',x1+.26,y+d/2,(ft||h)-16,b.name.length>8?12:15)}
  if(b.id=='sheriff'){const[sx,sy]=iso(x+w*.85,y1+.26,ft-16);star(sx,sy,9,'#f4cf6a')}
  if(b.id=='bank'){const[sx,sy]=iso(x+w*.5,y1+.26,ft-34);g.fillStyle='#2f7a22';g.font='bold 16px Georgia';g.textAlign='center';g.fillText('$',sx,sy)}
  // chimney smoke for smith
  if(b.id=='smith'){const[cx,cy]=iso(x+1,y+.6,h+20);poly([iso(x+.8,y+.4,h),iso(x+1.3,y+.4,h),iso(x+1.3,y+.4,h+24),iso(x+.8,y+.4,h+24)],'#6b5a4a');for(let i=0;i<4;i++){const k=((t*.3+i/4)%1);g.fillStyle=`rgba(200,200,200,${.35*(1-k)})`;g.beginPath();g.arc(cx+k*14,cy-8-k*40,5+k*10,0,7);g.fill()}}
  b.topPt=b.facade?(b.front=='y'?iso(x+w/2,y1+.24,ft):iso(x1+.24,y+d/2,ft)):iso(x+w/2,y+d/2,h+rh+(b.tower?60:0));
  b.bbox=bboxOf(b);
}
function star(x,y,r,col){g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}g.closePath();g.fillStyle=col;g.fill();g.strokeStyle='#6b4a10';g.lineWidth=1;g.stroke()}
function bboxOf(b){const pts=[iso(b.x,b.y+b.d,0),iso(b.x+b.w,b.y+b.d,0),iso(b.x+b.w,b.y,0),iso(b.x,b.y,b.h+40),iso(b.x+b.w,b.y+b.d,b.h+30),iso(b.x,b.y+b.d,b.h+80)];const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]}

function drawProp(p,t){
  const[x,y]=iso(p.x,p.y);const s=p.s||1;
  g.fillStyle='rgba(80,40,10,.22)';g.beginPath();g.ellipse(x,y,14*s,6*s,0,0,7);g.fill();
  if(p.t=='tree'){g.fillStyle='#6b4423';g.fillRect(x-3*s,y-26*s,6*s,26*s);
    const blobs=[[0,-46,22],[-14,-36,15],[14,-36,15],[-6,-58,15],[9,-56,13]];
    for(const[bx,by,br]of blobs){g.fillStyle='#4f7d2a';g.beginPath();g.arc(x+bx*s,y+by*s,br*s,0,7);g.fill()}
    for(const[bx,by,br]of blobs){g.fillStyle='#7aa83a';g.beginPath();g.arc(x+bx*s-br*s*.3,y+by*s-br*s*.35,br*s*.55,0,7);g.fill()}}
  else if(p.t=='cactus'){g.fillStyle='#4f8a3a';g.strokeStyle='#2f5a22';g.lineWidth=1.5;const r=(a,b,c,d)=>{g.beginPath();g.roundRect(a,b,c,d,c/2);g.fill();g.stroke()};r(x-4*s,y-34*s,8*s,34*s);r(x-13*s,y-24*s,6*s,13*s);r(x-13*s,y-14*s,12*s,5*s);r(x+7*s,y-28*s,6*s,12*s);r(x+2*s,y-19*s,11*s,5*s)}
  else if(p.t=='rock'){g.fillStyle='#b07a4a';g.beginPath();g.ellipse(x,y-5*s,11*s,8*s,0,0,7);g.fill();g.fillStyle='#c99464';g.beginPath();g.ellipse(x-3*s,y-8*s,6*s,4*s,0,0,7);g.fill()}
  else if(p.t=='barrel'){g.fillStyle='#8a5530';g.beginPath();g.roundRect(x-7,y-18,14,18,3);g.fill();g.fillStyle='#5a3417';g.fillRect(x-7,y-14,14,2);g.fillRect(x-7,y-6,14,2);g.fillStyle='#a8703f';g.beginPath();g.ellipse(x,y-18,7,3,0,0,7);g.fill()}
  else if(p.t=='crate'){poly([iso(p.x-.2,p.y+.2,0),iso(p.x+.2,p.y+.2,0),iso(p.x+.2,p.y+.2,14),iso(p.x-.2,p.y+.2,14)],'#c49058','#6b4423');poly([iso(p.x+.2,p.y-.2,0),iso(p.x+.2,p.y+.2,0),iso(p.x+.2,p.y+.2,14),iso(p.x+.2,p.y-.2,14)],'#a8743f','#6b4423');poly([iso(p.x-.2,p.y-.2,14),iso(p.x+.2,p.y-.2,14),iso(p.x+.2,p.y+.2,14),iso(p.x-.2,p.y+.2,14)],'#d9a670','#6b4423')}
  else if(p.t=='wagon'){g.fillStyle='#8a5530';g.beginPath();g.roundRect(x-24,y-20,48,12,3);g.fill();g.fillStyle='#f1e6d0';g.beginPath();g.ellipse(x,y-24,24,14,0,Math.PI,0);g.fill();g.strokeStyle='#cdbfa4';g.lineWidth=1;for(let i=-2;i<=2;i++){g.beginPath();g.moveTo(x+i*9,y-24);g.lineTo(x+i*10,y-37);g.stroke()}
    for(const wx of[-16,16]){g.strokeStyle='#4a2a14';g.lineWidth=2.5;g.beginPath();g.arc(x+wx,y-7,7,0,7);g.stroke()}}
  else if(p.t=='tower'){g.strokeStyle='#6b4423';g.lineWidth=3;for(const dx of[-14,14]){g.beginPath();g.moveTo(x+dx,y);g.lineTo(x+dx*.6,y-50);g.stroke()}g.beginPath();g.moveTo(x-12,y-20);g.lineTo(x+12,y-38);g.moveTo(x+12,y-20);g.lineTo(x-12,y-38);g.stroke();
    g.fillStyle='#8a5530';g.beginPath();g.ellipse(x,y-52,18,6,0,0,7);g.fill();g.fillRect(x-18,y-80,36,28);g.fillStyle='#a8703f';g.beginPath();g.ellipse(x,y-80,18,6,0,0,7);g.fill();g.fillStyle='#5a3417';g.beginPath();g.moveTo(x-20,y-80);g.lineTo(x,y-96);g.lineTo(x+20,y-80);g.fill()}
  else if(p.t=='trough'){g.fillStyle='#7a4a26';g.fillRect(x-14,y-10,28,9);g.fillStyle='#5aa0d0';g.fillRect(x-12,y-10,24,3)}
  else if(p.t=='well'){g.fillStyle='#9b968c';g.beginPath();g.ellipse(x,y-6,12,6,0,0,7);g.fill();g.fillRect(x-12,y-14,24,8);g.fillStyle='#3a5a7a';g.beginPath();g.ellipse(x,y-14,10,4,0,0,7);g.fill();g.strokeStyle='#5a3417';g.lineWidth=2.5;g.beginPath();g.moveTo(x-11,y-14);g.lineTo(x-11,y-36);g.lineTo(x+11,y-36);g.lineTo(x+11,y-14);g.stroke();g.fillStyle='#8d3b2c';g.beginPath();g.moveTo(x-16,y-34);g.lineTo(x,y-46);g.lineTo(x+16,y-34);g.fill()}
}
function drawFence(p){g.strokeStyle='#8a5530';g.lineWidth=2;const seg=(ax,ay,bx,by)=>{const n=Math.round(Math.hypot(bx-ax,by-ay)*2);for(let i=0;i<=n;i++){const[x,y]=iso(ax+(bx-ax)*i/n,ay+(by-ay)*i/n);g.beginPath();g.moveTo(x,y);g.lineTo(x,y-13);g.stroke()}for(const z of[5,11]){g.beginPath();g.moveTo(...iso(ax,ay,z));g.lineTo(...iso(bx,by,z));g.stroke()}};
  return{back:()=>{seg(p.x,p.y,p.x+p.w,p.y);seg(p.x,p.y,p.x,p.y+p.d)},front:()=>{seg(p.x,p.y+p.d,p.x+p.w,p.y+p.d);seg(p.x+p.w,p.y,p.x+p.w,p.y+p.d)}}}
function drawAnimal(a,t){const[x,y]=iso(a.x,a.y);const bob=Math.sin(t*6+a.ph)*(a.moving?1:0);g.fillStyle='rgba(80,40,10,.25)';g.beginPath();g.ellipse(x,y,12,4,0,0,7);g.fill();
  const f=a.vx-a.vy>=0?1:-1;
  if(a.kind=='pig'){g.fillStyle='#f2a7a0';g.beginPath();g.ellipse(x,y-8+bob,11,7,0,0,7);g.fill();g.beginPath();g.arc(x+9*f,y-11+bob,5,0,7);g.fill();g.fillStyle='#d9807a';g.fillRect(x-7,y-3,3,4);g.fillRect(x+4,y-3,3,4)}
  else{g.fillStyle='#8a5530';g.beginPath();g.ellipse(x,y-16+bob,13,7,0,0,7);g.fill();g.fillRect(x-10,y-12,3,12);g.fillRect(x+7,y-12,3,12);g.save();g.translate(x+11*f,y-20+bob);g.rotate(-.7*f);g.fillRect(-3,-12,7,14);g.restore();g.fillStyle='#3a2414';g.fillRect(x-12*f-1,y-18+bob,3,10)}}

/* ---------- characters ---------- */
const actors=[];
let pathCache=null;
function bfs(sx,sy,tx,ty){sx=Math.round(sx-.5);sy=Math.round(sy-.5);tx|=0;ty|=0;
  const ok=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&walk[x][y];
  if(!ok(sx,sy)){let best=null,bd=1e9;for(let x=0;x<N;x++)for(let y=0;y<N;y++)if(walk[x][y]){const dd=(x-sx)**2+(y-sy)**2;if(dd<bd){bd=dd;best=[x,y]}}[sx,sy]=best}
  const prev=new Map(),q=[[sx,sy]],k=(x,y)=>x*64+y;prev.set(k(sx,sy),null);
  while(q.length){const[x,y]=q.shift();if(x==tx&&y==ty)break;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(ok(nx,ny)&&!prev.has(k(nx,ny))){prev.set(k(nx,ny),[x,y]);q.push([nx,ny])}}}
  if(!prev.has(k(tx,ty)))return[];const path=[];let c=[tx,ty];while(c){path.unshift([c[0]+.5,c[1]+.5]);c=prev.get(k(c[0],c[1]))}return path}
const roadTiles=[];for(let x=0;x<N;x++)for(let y=0;y<N;y++)if(road[x][y])roadTiles.push([x,y]);
const randRoad=()=>roadTiles[Math.floor(Math.random()*roadTiles.length)];
const SHIRTS=['#c0392b','#2e6da4','#d68a2e','#5b8c3a','#7d4f9a','#e0c341','#3a8f8f','#a0522d'];
function spawn(kind,x,y,o={}){const a={kind,x,y,path:[],speed:kind=='robber'?2.6:1.5,ph:Math.random()*6,shirt:SHIRTS[(Math.random()*SHIRTS.length)|0],hat:['#6b4423','#3a2a1a','#a8743f','#2b2b2b'][(Math.random()*4)|0],label:null,onArrive:null,idle:0,alpha:1,...o};actors.push(a);return a}
function goTo(a,tx,ty,cb){a.path=bfs(a.x,a.y,tx,ty);a.onArrive=cb||null;if(!a.path.length&&cb){cb(a)}}
function wander(a){const r=randRoad();goTo(a,r[0],r[1])}
function updateActor(a,dt){
  if(a.follow){const f=a.follow;if(!actors.includes(f)){a.follow=null}else{const dx=f.x-a.x-.3,dy=f.y-a.y-.3,dd=Math.hypot(dx,dy);if(dd>.05){a.x+=dx/dd*Math.min(dd,f.speed*dt);a.y+=dy/dd*Math.min(dd,f.speed*dt);a.moving=true}else a.moving=false;return}}
  if(a.path.length){const[tx,ty]=a.path[0];const dx=tx-a.x,dy=ty-a.y,dd=Math.hypot(dx,dy);const st=a.speed*dt;a.moving=true;a.dir=dx-dy>=0?1:-1;
    if(dd<=st){a.x=tx;a.y=ty;a.path.shift();if(!a.path.length){a.moving=false;const cb=a.onArrive;a.onArrive=null;if(cb)cb(a)}}else{a.x+=dx/dd*st;a.y+=dy/dd*st}}
  else{a.moving=false;a.idle-=dt;if(a.idle<=0&&a.autoWander){a.idle=1+Math.random()*4;wander(a)}}
  if(a.fadeOut){a.alpha-=dt*1.5;if(a.alpha<=0)a.dead=true}
}
function drawActor(a,t){
  const[x,y0]=iso(a.x,a.y);const y=y0;g.save();g.globalAlpha=Math.max(0,a.alpha);
  const step=a.moving?Math.sin(t*12+a.ph):0;const bob=a.moving?Math.abs(step)*1.5:0;const s=1.15;
  g.fillStyle='rgba(60,30,10,.28)';g.beginPath();g.ellipse(x,y,7*s,3*s,0,0,7);g.fill();
  if(a.moving&&Math.random()<.15)dust.push({x:a.x,y:a.y,life:1});
  const leg=a.kind=='robber'?'#222':a.kind=='sheriff'?'#4a3a2a':'#3d4e6b';
  g.fillStyle=leg;g.fillRect(x-4*s,y-10*s+step*1.5,3*s,10*s-step*1.5);g.fillRect(x+1*s,y-10*s-step*1.5,3*s,10*s+step*1.5);
  const body=a.kind=='robber'?'#2b2b2b':a.kind=='sheriff'?'#7a5230':a.shirt;
  g.fillStyle=body;g.beginPath();g.roundRect(x-5*s,y-20*s-bob,10*s,11*s,3);g.fill();
  if(a.kind=='sheriff'){g.fillStyle='#e8d5b0';g.fillRect(x-1.5*s,y-20*s-bob,3*s,10*s);star(x-2.5*s,y-15*s-bob,2.6*s,'#f4cf6a')}
  g.fillStyle=body;g.fillRect(x-7*s,y-19*s-bob+step,2.5*s,8*s);g.fillRect(x+4.5*s,y-19*s-bob-step,2.5*s,8*s);
  g.fillStyle='#e8b98a';g.beginPath();g.arc(x,y-24*s-bob,4.2*s,0,7);g.fill();
  if(a.kind=='robber'){g.fillStyle='#b3261e';g.fillRect(x-4.2*s,y-24*s-bob,8.4*s,3.5*s)}
  if(a.kind=='sheriff'||a.beard){g.fillStyle='#5a3a22';g.fillRect(x-3*s,y-22*s-bob,6*s,1.5*s)}
  const hat=a.kind=='robber'?'#151515':a.kind=='sheriff'?'#e3d3b0':a.hat;
  g.fillStyle=hat;g.beginPath();g.ellipse(x,y-27.5*s-bob,7.5*s,2.4*s,0,0,7);g.fill();g.beginPath();g.roundRect(x-4*s,y-33*s-bob,8*s,6*s,2);g.fill();
  if(a.bag){g.fillStyle='#c9a35a';g.beginPath();g.arc(x+8*s,y-12*s-bob,5*s,0,7);g.fill();g.fillStyle='#2f7a22';g.font=`bold ${8*s}px Georgia`;g.textAlign='center';g.fillText('$',x+8*s,y-9*s-bob)}
  if(a.horse){}
  if(a.label){const L=a.label;g.font="13px 'IM Fell English',Georgia,serif";const w=g.measureText(L.txt).width+(L.sub?g.measureText(L.sub).width+8:0)+16;const lx=x-w/2,ly=y-58*s;
    g.fillStyle=L.bg||'#efe3c6';g.shadowColor='rgba(0,0,0,.4)';g.shadowBlur=4;paperRect(lx,ly,w,19,a.ph*10);g.fill();g.shadowColor='transparent';
    g.beginPath();g.moveTo(x-4,ly+18);g.lineTo(x,ly+23);g.lineTo(x+4,ly+18);g.fill();
    g.fillStyle='#24170e';g.textAlign='left';g.fillText(L.txt,lx+8,ly+14);if(L.sub){g.fillStyle=L.subCol||'#3f7a2a';g.fillText(L.sub,lx+8+g.measureText(L.txt).width+8,ly+14)}}
  g.restore();
}
const dust=[];
/* ---------- train ---------- */
const train={y:-12,active:false,v:0,cb:null,stopAt:25,wait:0};
function callTrain(cb){if(train.active){const prev=train.cb;train.cb=()=>{prev&&prev();cb&&cb()};return}train.active=true;train.y=-14;train.wait=0;train.cb=cb;train.phase='in'}
function updateTrain(dt){if(!train.active)return;if(train.phase=='in'){train.y+=dt*Math.max(1.2,(train.stopAt-train.y)*.9);if(train.y>=train.stopAt-.05){train.y=train.stopAt;train.phase='stop';train.wait=1.4;const cb=train.cb;train.cb=null;cb&&cb()}}
  else if(train.phase=='stop'){train.wait-=dt;if(train.wait<=0)train.phase='out'}else{train.y+=dt*(4+(train.y-train.stopAt)*.8);if(train.y>N+16)train.active=false}}
function drawTrainCar(y,kind,t){const x0=.95,x1=2.05,L=kind=='loco'?2.6:2.2;const h=kind=='coal'?16:28;
  const col=kind=='loco'?'#2b2b30':kind=='coal'?'#3a3530':'#7a2e22';
  poly([iso(x1,y,4),iso(x1,y+L,4),iso(x1,y+L,h),iso(x1,y,h)],shade(col,.8));poly([iso(x0,y+L,4),iso(x1,y+L,4),iso(x1,y+L,h),iso(x0,y+L,h)],shade(col,1.15));poly([iso(x0,y,h),iso(x1,y,h),iso(x1,y+L,h),iso(x0,y+L,h)],kind=='coal'?'#151515':shade(col,1.3));
  if(kind=='car')for(let i=0;i<3;i++)poly([iso(x1+.01,y+.3+i*.65,12),iso(x1+.01,y+.7+i*.65,12),iso(x1+.01,y+.7+i*.65,22),iso(x1+.01,y+.3+i*.65,22)],'#f4cf6a');
  if(kind=='loco'){const[cx,cy]=iso(1.5,y+L-.5,h);g.fillStyle='#1a1a1a';g.fillRect(cx-4,cy-16,8,16);poly([iso(x0,y+L,4),iso(x1,y+L,4),iso(1.5,y+L+.5,4)],'#b3261e');for(let i=0;i<5;i++){const k=((t*.8+i/5)%1);g.fillStyle=`rgba(230,230,230,${.5*(1-k)})`;g.beginPath();g.arc(cx-k*20,cy-20-k*50,5+k*12,0,7);g.fill()}}
  for(const wy of[.4,L-.4]){const[a,b]=iso(x1,y+wy,4);g.fillStyle='#111';g.beginPath();g.arc(a,b,4,0,7);g.fill()}}

/* ---------- bubbles + tags ---------- */
const bubbles=[];
function bubble(bid,txt,col='#2a1608',dur=4.5){const b=BL[bid];if(!b)return;const same=bubbles.filter(q=>q.b==b);if(same.length>=2)same[0].life=Math.min(same[0].life,.4);bubbles.push({b,txt,col,life:dur,max:dur})}
const tags={};
function setTag(bid,txt){tags[bid]=txt}
function paperRect(x,y,w,h,seed){g.beginPath();const r=(n)=>((Math.sin(seed*12.9898+n*78.233)*43758.5453)%1+1)%1;const step=9;let n=0;
  g.moveTo(x,y+r(n++)*2);for(let k=step;k<w;k+=step)g.lineTo(x+k,y+r(n++)*2.5);g.lineTo(x+w,y+r(n++)*2);
  for(let k=step;k<h;k+=step)g.lineTo(x+w-r(n++)*2.5,y+k);g.lineTo(x+w-r(n++)*2,y+h);
  for(let k=w-step;k>0;k-=step)g.lineTo(x+k,y+h-r(n++)*2.5);g.lineTo(x,y+h-r(n++)*2);
  for(let k=h-step;k>0;k-=step)g.lineTo(x+r(n++)*2.5,y+k);g.closePath()}
function drawBubbles(dt){for(const q of bubbles){q.life-=dt;const b=q.b;const stack=bubbles.filter(o=>o.b==b&&o.life>0);const idx=stack.indexOf(q);
  if(!b.topPt)continue;const x=b.topPt[0],y=b.topPt[1]-58;const age=q.max-q.life;const sc=Math.min(1,age/.18)*(q.life<.3?q.life/.3:1);if(sc<=0)continue;
  g.save();g.translate(x,y-idx*46);g.scale(sc,sc);g.font="italic 17px 'IM Fell English',Georgia,serif";const w=Math.max(60,g.measureText(q.txt).width+30);
  g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=8;g.shadowOffsetY=3;paperRect(-w/2,-38,w,32,q.max*7+q.txt.length);g.fillStyle='#efe3c6';g.fill();g.shadowColor='transparent';
  g.beginPath();g.moveTo(-7,-7);g.lineTo(0,3);g.lineTo(7,-7);g.fill();
  g.fillStyle=q.col=='#2a1608'?'#24170e':q.col;g.textAlign='center';g.fillText(q.txt,0,-16);g.restore()}
  for(let i=bubbles.length-1;i>=0;i--)if(bubbles[i].life<=0)bubbles.splice(i,1)}
function drawTags(){for(const id in tags){const b=BL[id];const txt=tags[id];if(!txt||!b.topPt)continue;const x=b.topPt[0],y=b.topPt[1]-16;
  g.font="13px Rye,'IM Fell English SC',Georgia,serif";const w=g.measureText(txt.toUpperCase()).width+22;
  g.fillStyle='#3b2718';g.fillRect(x-w/2-3,y-14,w+6,26);g.strokeStyle='#a07a4a';g.lineWidth=1;g.strokeRect(x-w/2+.5,y-11+.5,w-1,20);
  g.fillStyle='#f2e6c9';g.textAlign='center';g.fillText(txt.toUpperCase(),x,y+4)}}

/* ---------- tumbleweeds + clouds ---------- */
const tumbles=[];let tumbleT=3;
const clouds=[{x:-10,y:5,s:1},{x:12,y:-6,s:1.4},{x:30,y:12,s:1.1}];

/* ---------- camera / input ---------- */
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);VW=innerWidth;VH=innerHeight;cv.width=VW*DPR;cv.height=VH*DPR;fit()}
function fit(){cam.tz=Math.max(.5,Math.min(1.2,Math.min(VW/1750,VH/980)));const[cx,cy]=iso(19,17.5);cam.x=cx;cam.y=cy-40}
addEventListener('resize',resize);
let drag=null,moved=0;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y};moved=0;cv.classList.add('drag')});
addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved=Math.max(moved,Math.abs(dx)+Math.abs(dy));cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z;clampCam()});
addEventListener('pointerup',e=>{cv.classList.remove('drag');if(drag&&moved<6)click(e.clientX,e.clientY);drag=null});
cv.addEventListener('wheel',e=>{e.preventDefault();cam.tz=Math.max(.5,Math.min(1.8,cam.tz*(e.deltaY<0?1.12:.89)))},{passive:false});
function clampCam(){cam.x=Math.max(-N*TWh*.8,Math.min(N*TWh*.8,cam.x));cam.y=Math.max(0,Math.min(N*THh*2,cam.y))}
function toWorld(sx,sy){return[(sx-VW/2)/cam.z+cam.x,(sy-VH/2)/cam.z+cam.y]}
let onBuildingClick=null;
function click(sx,sy){const[wx,wy]=toWorld(sx,sy);let hit=null;for(const b of B){if(!b.panel||!b.bbox)continue;const[a,c2,d,e]=b.bbox;if(wx>=a&&wx<=d&&wy>=c2&&wy<=e){if(!hit||b.x+b.y>hit.x+hit.y)hit=b}}if(hit&&onBuildingClick)onBuildingClick(hit)}

/* ---------- main loop ---------- */
let last=performance.now()/1000,hover=null;
const fences=pens.map(drawFence);
function frame(){
  const now=performance.now()/1000,dt=Math.min(.05,now-last);last=now;const t=now;
  cam.z+=(cam.tz-cam.z)*Math.min(1,dt*8);
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#b9773e';g.fillRect(0,0,cv.width,cv.height);
  g.setTransform(DPR*cam.z,0,0,DPR*cam.z,DPR*(VW/2-cam.x*cam.z),DPR*(VH/2-cam.y*cam.z));
  g.imageSmoothingQuality='high';
  g.drawImage(ground,GX0,GY0,GW,GH);
  // cloud shadows
  for(const c of clouds){c.x+=dt*.25;if(c.x>N+14){c.x=-14;c.y=-10+Math.random()*30}const[x,y]=iso(c.x,c.y);g.fillStyle='rgba(90,40,10,.07)';g.beginPath();g.ellipse(x,y,220*c.s,80*c.s,0,0,7);g.fill();g.beginPath();g.ellipse(x+120*c.s,y+30,150*c.s,60*c.s,0,0,7);g.fill()}
  for(const p of fences)p.back();
  // dust
  for(const d of dust){d.life-=dt*1.6;const[x,y]=iso(d.x,d.y);g.fillStyle=`rgba(240,210,160,${.4*Math.max(0,d.life)})`;g.beginPath();g.arc(x+(1-d.life)*4,y-2-(1-d.life)*6,2+(1-d.life)*4,0,7);g.fill()}
  for(let i=dust.length-1;i>=0;i--)if(dust[i].life<=0)dust.splice(i,1);
  // update
  for(const a of actors)updateActor(a,dt);for(let i=actors.length-1;i>=0;i--)if(actors[i].dead)actors.splice(i,1);
  for(const a of animals){a.ph+=dt;if(Math.random()<dt*.3){a.vx=(Math.random()-.5)*.8;a.vy=(Math.random()-.5)*.8}if(Math.random()<dt*.5){a.vx=a.vy=0}a.moving=!!(a.vx||a.vy);a.x=Math.max(a.pen.x+.6,Math.min(a.pen.x+a.pen.w-.6,a.x+a.vx*dt));a.y=Math.max(a.pen.y+.6,Math.min(a.pen.y+a.pen.d-.6,a.y+a.vy*dt))}
  updateTrain(dt);
  tumbleT-=dt;if(tumbleT<=0){tumbleT=6+Math.random()*10;tumbles.push({x:-3,y:5+Math.random()*28,v:2+Math.random()*1.5,r:0})}
  for(const tw of tumbles){tw.x+=tw.v*dt;tw.r+=tw.v*dt*3}for(let i=tumbles.length-1;i>=0;i--)if(tumbles[i].x>N+4)tumbles.splice(i,1);
  // depth sorted drawables
  const D=[];
  for(const b of B)D.push({k:b.x+b.w+b.y+b.d-1.2,f:()=>drawBuilding(b,t)});
  for(const p of props)D.push({k:p.x+p.y,f:()=>drawProp(p,t)});
  for(const a of actors)D.push({k:a.x+a.y+.01,f:()=>drawActor(a,t)});
  for(const a of animals)D.push({k:a.x+a.y,f:()=>drawAnimal(a,t)});
  for(const tw of tumbles)D.push({k:tw.x+tw.y,f:()=>{const[x,y]=iso(tw.x,tw.y);const hop=Math.abs(Math.sin(tw.r*1.3))*8;g.save();g.translate(x,y-8-hop);g.rotate(tw.r);g.strokeStyle='#a87a40';g.lineWidth=1.3;for(let i=0;i<7;i++){g.beginPath();g.arc(0,0,7,i,i+2.5);g.stroke()}g.restore()}});
  if(train.active){const cars=[['loco',0],['car',2.75],['car',5.1],['coal',7.45]];for(const[k,o]of cars){const yy=train.y-o;D.push({k:1.5+yy+1.5,f:()=>drawTrainCar(yy,k,t)})}}
  D.sort((a,b)=>a.k-b.k);for(const d of D)d.f();
  for(const p of fences)p.front();
  drawTags();drawBubbles(dt);
  requestAnimationFrame(frame);
}
/* ---------- populate ambient town ---------- */
for(let i=0;i<9;i++){const r=randRoad();spawn('folk',r[0]+.5,r[1]+.5,{autoWander:true,beard:Math.random()<.4})}
for(let i=0;i<2;i++){const r=randRoad();spawn('sheriff',r[0]+.5,r[1]+.5,{autoWander:true,speed:1.3})}
resize();requestAnimationFrame(frame);
return{BL,actors,spawn,goTo,wander,bubble,setTag,callTrain,cam,fit,set onBuildingClick(f){onBuildingClick=f},iso,star,
  doorOf:id=>{const b=BL[id];return b.door},station:()=>[6.5,26.5]};
})();
