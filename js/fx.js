"use strict";
// ============================================================ visual effects: leaves, embers, pollen, wind
const CHORD_COL={E:'#c2532f',A:'#dfa63c',D:'#5a9d93',G:'#8bab55',C:'#8b7ab8'};
const FX={parts:[],rings:[],bolts:[],slashes:[],embers:[],leaves:[],zoom:1,glitch:0,aber:0,rot:0,freeze:0,slow:0,lunge:0,spawn:0};
for(let i=0;i<30;i++)FX.embers.push({x:rr(0,C.W),y:rr(140,C.H),v:rr(7,20),s:rr(.9,1.7),p:rr(0,6.3)});
for(let i=0;i<22;i++)FX.leaves.push({x:rr(0,C.W),y:rr(-20,C.H),vx:rr(-18,14),vy:rr(14,34),
 s:rr(.7,1.5),a:rr(0,6.3),spin:rr(-1.4,1.4),col:['#6e7f3f','#8a7a3c','#5c6b35','#9d6b34'][i%4]});
const beatPulse=()=>Math.exp(-(((AC?AC.currentTime:now())*110/60)%1)*4.5);   // 110 BPM, same as the drum loop
function burst(x,y,col,n,spd=520){for(let i=0;i<n;i++){const a=rr(0,6.283),s=rr(.2,1)*spd;
 FX.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-120,life:0,max:rr(.45,1),col,sz:rr(2.5,7.5),leaf:Math.random()<.55,a:rr(0,6.3)})}}
const ring=(x,y,col,R=300,w=10)=>FX.rings.push({x,y,col,R,w,life:0});
function bolt(x1,y1,x2,y2,col){const pts=[[x1,y1]];
 for(let i=1;i<9;i++){const t=i/9;pts.push([x1+(x2-x1)*t+rr(-70,70),y1+(y2-y1)*t+rr(-25,25)])}
 pts.push([x2,y2]);FX.bolts.push({pts,col,life:0})}
const slash=(x,y,col)=>FX.slashes.push({x,y,a:rr(-.9,.9)+(Math.random()<.5?0:Math.PI),L:rr(220,340),col,life:0});
function timeScale(dt){                       // hit-stop and slow-mo: scales game time, not effects
 if(FX.freeze>0){FX.freeze-=dt;return 0}
 if(FX.slow>0){FX.slow-=dt;return .3}return 1}
function fxTick(dt){
 const age=(a,max)=>{for(const o of a)o.life+=dt;return a.filter(o=>o.life<(o.max||max))};
 for(const p of FX.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=760*dt;p.vx*=1-.6*dt;p.a+=dt*6}
 FX.parts=age(FX.parts,1);FX.rings=age(FX.rings,.55);FX.bolts=age(FX.bolts,.28);FX.slashes=age(FX.slashes,.26);
 for(const m of FX.embers){m.y-=m.v*dt;m.x+=Math.sin(m.y/70+m.p)*14*dt;if(m.y<90){m.y=C.H+10;m.x=rr(0,C.W)}}
 for(const l of FX.leaves){l.x+=l.vx*dt+Math.sin(l.y/90+l.a)*22*dt;l.y+=l.vy*dt;l.a+=l.spin*dt;
  if(l.y>C.H+20){l.y=-20;l.x=rr(0,C.W)}}
 FX.zoom+=(1-FX.zoom)*Math.min(1,dt*10);
 for(const k of ['glitch','lunge','spawn'])FX[k]=Math.max(0,FX[k]-dt);
 FX.aber=Math.max(0,FX.aber-dt*2.2);FX.rot=Math.max(0,FX.rot-dt*1.6)}
function leafShape(x,y,s,a,col,alpha){
 X.save();X.translate(x,y);X.rotate(a);X.globalAlpha=alpha;X.fillStyle=col;
 X.beginPath();X.ellipse(0,0,s*2,s,a,0,7);X.fill();X.restore()}
function fxDraw(){
 // pollen / fireflies behind everything else
 X.save();
 for(const m of FX.embers){const g=.28+.38*Math.abs(Math.sin(G.elapsed*1.5+m.p));
  X.globalAlpha=g*.32;X.fillStyle='#f2d79a';X.beginPath();X.arc(m.x,m.y,m.s*2.6,0,7);X.fill();
  X.globalAlpha=g*.85;X.fillStyle='#ffeec2';X.beginPath();X.arc(m.x,m.y,m.s*.8,0,7);X.fill()}
 for(const l of FX.leaves)leafShape(l.x,l.y,l.s,l.a,l.col,.55);
 X.globalCompositeOperation='lighter';
 for(const p of FX.parts){const t=p.life/p.max;X.globalAlpha=Math.max(0,1-t)*.9;
  if(p.leaf){X.fillStyle=p.col;X.beginPath();X.ellipse(p.x,p.y,p.sz*.9,p.sz*.4,p.a,0,7);X.fill()}
  else{X.fillStyle=p.col;X.beginPath();X.arc(p.x,p.y,p.sz*.5,0,7);X.fill()}}
 X.globalCompositeOperation='source-over';
 for(const r of FX.rings){const t=r.life/.55;X.globalAlpha=(1-t)*.75;X.lineWidth=r.w*(1-t)+1;
  X.strokeStyle=r.col;X.beginPath();X.arc(r.x,r.y,20+(r.R-20)*Math.sqrt(t),0,7);X.stroke();
  X.globalAlpha=(1-t)*.25;X.strokeStyle='#f7edd2';X.lineWidth=2*(1-t)+.5;
  X.beginPath();X.arc(r.x,r.y,16+(r.R-16)*Math.sqrt(t),0,7);X.stroke()}
 X.lineJoin='round';X.lineCap='round';
 for(const b of FX.bolts){const a=1-b.life/.28;
  for(const [w,c,al] of [[9,b.col,a*.5],[3.5,'#fdf3d5',a]]){X.globalAlpha=al;X.strokeStyle=c;X.lineWidth=w;
   X.beginPath();b.pts.forEach((p,i)=>X[i?'lineTo':'moveTo'](p[0],p[1]));X.stroke()}}
 for(const s of FX.slashes){const t=s.life/.26;
  X.globalAlpha=(1-t)*.85;X.strokeStyle=s.col;X.lineWidth=13*(1-t)+2;X.lineCap='round';
  const dx=Math.cos(s.a)*s.L/2,dy=Math.sin(s.a)*s.L/2,nx=-Math.sin(s.a)*26,ny=Math.cos(s.a)*26;
  X.beginPath();X.moveTo(s.x-dx,s.y-dy);X.quadraticCurveTo(s.x+nx,s.y+ny,s.x+dx,s.y+dy);X.stroke();
  X.globalAlpha=(1-t)*.5;X.strokeStyle='#fdf6e0';X.lineWidth=4*(1-t)+1;X.stroke()}
 X.restore()}
// cached full-screen layers: vignette, low-health vignette, film grain, glitch buffer
const mkLayer=f=>{const c=document.createElement('canvas');c.width=C.W;c.height=C.H;f(c.getContext('2d'));return c};
const radial=col=>mkLayer(g=>{const r=g.createRadialGradient(C.W/2,C.H/2,C.H*.38,C.W/2,C.H/2,C.H*.98);
 r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,col);g.fillStyle=r;g.fillRect(0,0,C.W,C.H)});
const VIG=radial('rgba(10,14,8,.78)'),VIGR=radial('rgba(184,69,47,.8)'),GLB=mkLayer(()=>{});
const SCAN=mkLayer(g=>{let s=1337;const r=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
 for(let i=0;i<5200;i++){g.fillStyle='rgba(255,248,224,'+(.02+r()*.05)+')';g.fillRect(r()*C.W,r()*C.H,1.4,1.4)}});
function overlays(){
 X.drawImage(VIG,0,0);
 if(G.phase==='PLAYING'&&G.p.hp<C.PHP*.3){X.globalAlpha=.3+.4*Math.sin(G.elapsed*7);X.drawImage(VIGR,0,0);X.globalAlpha=1}
 X.globalAlpha=.5;X.drawImage(SCAN,0,0);X.globalAlpha=1}
function glitchPass(){                        // short directional smears, kept soft so the scene stays readable
 if(FX.glitch<=0&&FX.aber<=0)return;
 const g=GLB.getContext('2d');g.clearRect(0,0,C.W,C.H);g.drawImage(cv,0,0);
 if(FX.aber>0){const d=1.5+6*Math.min(1,FX.aber);
  X.save();X.globalAlpha=.3;X.globalCompositeOperation='lighter';
  X.drawImage(GLB,d,0);X.drawImage(GLB,-d,0);X.restore()}
 // slicing the frame into shifted bars read as a glitchy UI; the chromatic split alone
 // keeps the hit feedback without cutting the scene apart.
}
