"use strict";
// ============================================================ rendering (render/*.py)
const cv=document.getElementById('c'),X=cv.getContext('2d');
const holo=document.getElementById('holo'),HX=holo.getContext('2d');
const FONT="Cinzel,Georgia,'Times New Roman',serif";       // carved, storybook caps
const POP="Bangers,Impact,'Arial Black',sans-serif";        // impact words only
const SPR={};for(const d of ENEMIES)if(d.img&&!SPR[d.img]){SPR[d.img]=new Image();SPR[d.img].src='assets/'+d.img+'.webp'}
const hexA=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`};
const srand=s=>{let x=s>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296}};
function T(s,x,y,size,col,al='center',bl='middle',mw){
 X.font=size+'px '+FONT;X.textAlign=al;X.textBaseline=bl;
 if(size<64&&(col===C.INK||col===C.PAPER)){X.lineJoin='round';X.lineWidth=Math.max(2,size/5);
  X.strokeStyle=col===C.INK?C.PAPER:C.INK;mw?X.strokeText(s,x,y,mw):X.strokeText(s,x,y)}
 X.fillStyle=col;mw?X.fillText(s,x,y,mw):X.fillText(s,x,y)}
function neon(s,x,y,size,col,blur=16,al='center',bl='middle',mw){
 X.save();X.shadowColor=hexA(col.startsWith('#')?col:'#dfa63c',.55);X.shadowBlur=blur;
 T(s,x,y,size,col,al,bl,mw);X.restore()}
function panel(x,y,w,h,lw,col=C.INK){X.strokeStyle=col;X.lineWidth=lw;X.beginPath();X.roundRect(x+lw/2,y+lw/2,w-lw,h-lw,10);X.stroke()}
function starburst(cx,cy,r,col,pts=12){                       // soft ink splash behind titles
 X.beginPath();for(let i=0;i<pts*2;i++){const rad=i%2?r*.6:r,a=i/(pts*2)*Math.PI*2;
  X[i?'lineTo':'moveTo'](cx+Math.cos(a)*rad,cy+Math.sin(a)*rad)}
 X.closePath();X.fillStyle=hexA(col,.22);X.fill()}
function speedLines(cx,cy,count=26,inner=300,outer=820){
 X.save();X.strokeStyle='rgba(18,24,14,.30)';
 for(let i=0;i<count;i++){const a=i/count*Math.PI*2+rr(-.03,.03),r1=inner+rr(-20,40);
  X.lineWidth=ri(1,3);X.beginPath();X.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);
  X.lineTo(cx+Math.cos(a)*outer,cy+Math.sin(a)*outer);X.stroke()}
 X.restore()}
const shake={a:0,kick(n){this.a=Math.max(this.a,n)},
 tick(dt){this.a=Math.max(0,this.a-dt*60);if(this.a<=0)return[0,0];const m=Math.floor(this.a);return[ri(-m,m),ri(-m,m)]}};
let effects=[],flash=0,speedT=0,dbg=false,holoOn=false;
class ImpactWord{
 constructor(text,x,y,color=C.YEL,scale=1){Object.assign(this,{text,x,y,color,scale,life:0,max:.85,angle:rr(-9,9),drift:rr(-40,40)})}
 get dead(){return this.life>=this.max}
 tick(dt){this.life+=dt;this.y-=dt*64;this.x+=this.drift*dt}
 draw(){
  const p=this.life/this.max,pop=1+.7*Math.sin(Math.min(1,p*3.2)*Math.PI*.5);
  let size=Math.max(.1,this.scale*pop*(1-.22*p));
  const alpha=1-Math.max(0,(p-.6)/.4);
  X.font='64px '+POP;const w0=X.measureText(this.text).width||10;
  if(w0*size>C.W*.8)size=C.W*.8/w0;
  X.save();X.translate(this.x,this.y);X.rotate(-this.angle*Math.PI/180);X.globalAlpha=alpha;X.scale(size,size);
  X.textAlign='center';X.textBaseline='middle';
     // keep the outline thin: a stroke close to the stroke width of the letters
   // swallows the fill and the word reads as a dark blob on a dark scene
   X.lineJoin='round';X.lineWidth=5;X.strokeStyle=C.INK;
   X.strokeText(this.text,0,0);X.lineWidth=2;X.strokeStyle='rgba(255,250,235,.3)';X.strokeText(this.text,0,0);
  X.fillStyle=this.color;X.fillText(this.text,0,0);X.restore()}}
function handleFx(list){
 const cx=C.W/2,cy=C.H/2-20;
 for(const {k,d} of list){
  if(k==='hit'){
   const col=CHORD_COL[d.chord]||C.YEL,ex=(d.x||cx)+ri(-60,60),ey=C.EY+ri(-40,110),w=d.weak?1.5:1;
   shake.kick(C.HSHAKE*(.7+d.strength)*w);FX.zoom=1+.022*w;FX.freeze=d.weak?.07:.035;
   FX.aber=Math.max(FX.aber,d.weak?.5:.16);FX.rot=Math.max(FX.rot,d.weak?.45:.16);
   burst(ex,ey,d.shielded?C.BLUE:col,d.weak?44:22);slash(ex,ey,d.shielded?C.BLUE:col);
   ring(ex,ey,d.shielded?C.BLUE:col,d.weak?300:205,7);
   // ordinary hits stay silent and purely visual; only a weak-spot strike is called out
   if(d.weak&&!d.shielded){flash=.1;
    effects.push(new ImpactWord('WEAK SPOT!',ex+ri(-60,60),ey-104,C.YEL,1.05+(d.strength||0)*.25))}
   playChord(d.chord,.6+d.strength*.4)}
  else if(k==='whiff'){
   slash(d.x,C.PY-120,'rgba(244,237,218,.34)');playSfx('shoot',.2);
   effects.push(new ImpactWord('OUT OF REACH',d.x,C.PY-206,'#c9c1a6',.48))}
  else if(k==='combo'){
   shake.kick(C.CSHAKE);flash=.3;speedT=.45;FX.zoom=1.06;FX.glitch=.35;FX.freeze=.09;FX.aber=.8;
   for(let i=0;i<5;i++)bolt(rr(100,1180),0,cx+rr(-80,80),cy+rr(-60,60),C.YEL);
   burst(cx,cy,C.YEL,80,740);ring(cx,cy,C.PAPER,500,14);ring(cx,cy,CHORD_COL[d.chord]||C.GREEN,360,10);
   effects.push(new ImpactWord(d.name,cx,cy-40,C.RED,1.15));playChord(d.chord,1);playSfx('combo',.9)}
  else if(k==='player_hurt'){
   shake.kick(C.HSHAKE*1.3);flash=.2;FX.glitch=.28;FX.lunge=.3;FX.aber=.7;FX.rot=.7;
   burst(d.x||240,C.PY-40,C.RED,28,480);playSfx('hurt',.8)}
  else if(k==='guard'){
   ring(d.x||cx,C.PY-30,C.BLUE,215,9);burst(d.x||cx,C.PY-30,C.BLUE,22,400);
   effects.push(new ImpactWord('GUARD!',d.x||cx,C.PY-110,C.BLUE,.8));playSfx('shield',.6)}
  else if(k==='shield'){
   ring(d.x,C.EY,C.BLUE,345,12);FX.aber=.4;shake.kick(C.HSHAKE*.6);
   effects.push(new ImpactWord('SHIELD UP',d.x,C.EY-120,C.BLUE,.85));playSfx('shield',.7)}
  else if(k==='shield_off'){ring(d.x,C.EY,C.PURPLE,255,7);playSfx('shield',.3)}
  else if(k==='shatter'){
   shake.kick(C.CSHAKE*.8);flash=.25;FX.glitch=.3;FX.aber=.8;FX.slow=.5;
   burst(d.x,C.EY,C.BLUE,76,680);burst(d.x,C.EY,C.PAPER,36,500);ring(d.x,C.EY,C.PAPER,540,14);
   effects.push(new ImpactWord('SHIELD BREAK!',d.x,C.EY-120,C.PURPLE,1.05));playSfx('shatter',.9)}
  else if(k==='beam'){shake.kick(C.HSHAKE);flash=.16;FX.aber=.5;burst(d.x,C.PY,C.YEL,24,500);playSfx('beam',.5)}
  else if(k==='slam'){shake.kick(C.CSHAKE);flash=.22;FX.aber=.6;FX.rot=.8;
   burst(d.x,C.PY,C.ORANGE,48,680);ring(d.x,C.PY,C.ORANGE,410,12);playSfx('slam',.6)}
  else if(k==='wall'){burst(d.x,d.y,C.GREEN,10,220)}
  else if(k==='dodge'){burst(d.x,C.H-90,C.BLUE,8,240)}
  else if(k==='dash'){burst(d.x,C.PY-10,C.ORANGE,12,240);ring(d.x,C.PY,C.ORANGE,130,6)}
  else if(k==='power'){
   ring(C.W/2,C.PY,C.GREEN,310,10);burst(cx,C.PY-80,d.col,44,540);
   effects.push(new ImpactWord(d.name,cx,C.PY-150,d.col,1));playSfx('power',.9)}
  else if(k==='stage'){
   flash=.35;FX.slow=.6;FX.spawn=.5;FX.zoom=1.08;FX.aber=.8;shake.kick(C.CSHAKE);
   burst(cx,C.EY,C.YEL,120,800);burst(cx,C.EY,C.RED,70,580);ring(cx,C.EY,C.PAPER,600,16);ring(cx,C.EY,C.YEL,420,10);
   effects.push(new ImpactWord('NEXT: '+d.name,cx,cy-40,C.BLUE,1));playSfx('level',.8)}
  else if(k==='attack')playSfx('telegraph',.35);
  else if(k==='telegraph')playSfx('telegraph',.5);
  else if(k==='super_ready'){
   playSfx('ready',.9);flash=.14;
   effects.push(new ImpactWord('SUPER READY!',cx,C.PY-212,C.RED,1))}
  else if(k==='super_start'){
   playSfx('super',1);flash=.3;FX.slow=.25;FX.zoom=1.04;shake.kick(C.CSHAKE);
   for(let i=0;i<6;i++)bolt(rr(80,1200),-40,cx+rr(-120,120),cy+rr(-60,60),C.RED)}
  else if(k==='super_hit'){
   flash=1;FX.aber=1;FX.glitch=.6;FX.rot=1.4;shake.kick(C.CSHAKE*2.2);
   burst(d.x,C.EY,C.PAPER,120,980);burst(d.x,C.EY,C.RED,90,780);
   ring(d.x,C.EY,C.PAPER,780,20);ring(d.x,C.EY,C.YEL,520,12);
   playSfx('shatter',1);playSfx('slam',1)}
  else if(k==='win'){flash=.45;FX.slow=1;burst(cx,cy,C.YEL,140,880);ring(cx,cy,C.PAPER,680,18);playSfx('win')}
  else if(k==='lose'){FX.glitch=.7;FX.slow=.8;flash=.3;playSfx('lose')}}}
function bar(x,y,w,h,ratio,fill,label,flip){
 X.fillStyle='rgba(18,22,14,.82)';X.beginPath();X.roundRect(x,y,w,h,9);X.fill();
 const iw=Math.floor((w-8)*clamp(ratio,0,1));
 if(iw>0){const gr=X.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,fill);gr.addColorStop(1,'rgba(244,237,218,.8)');
  X.fillStyle=gr;X.beginPath();X.roundRect(flip?x+w-4-iw:x+4,y+4,iw,h-8,6);X.fill()}
 X.strokeStyle='rgba(223,166,60,.45)';X.lineWidth=2;X.beginPath();X.roundRect(x+1,y+1,w-2,h-2,9);X.stroke();
 T(label,x+8,y-4,20,C.PAPER,'left','bottom')}
function drawMonster(d,cx,cy,s,col,tel){
 X.lineWidth=5;X.strokeStyle=C.INK;X.lineJoin='round';
 const poly=(pts,f)=>{X.beginPath();pts.forEach((p,i)=>X[i?'lineTo':'moveTo'](cx+p[0]*s,cy+p[1]*s));X.closePath();X.fillStyle=f;X.fill();X.stroke()};
 const ell=(x,y,rx,ry,f)=>{X.beginPath();X.ellipse(cx+x*s,cy+y*s,rx*s,ry*s,0,0,7);X.fillStyle=f;X.fill();X.stroke()};
 for(const k of [-1,1]){
  if(d.horns)poly([[k*.16,-.34],[k*.42,-.66],[k*.34,-.24]],'#cdbf9c');
  if(d.ears)poly([[k*.34,-.12],[k*.66,-.34],[k*.38,.08]],col);
  ell(k*.5,.1,.1,.22,col);ell(k*.2,.48,.15,.07,col)}
 ell(0,0,.38,.46,col);
 const eye=(x,y,r)=>{if(d.skull)ell(x,y,r,r*1.2,C.INK);
  else{ell(x,y,r,r,C.PAPER);X.beginPath();X.arc(cx+x*s,cy+(y+.02)*s,r*s*.45,0,7);X.fillStyle=C.INK;X.fill()}};
 if(d.eyes===1)eye(0,-.12,.16);else{eye(-.14,-.12,.1);eye(.14,-.12,.1)}
 const mh=tel?.2:.1,ty=.22-mh;
 ell(0,.22,.2,mh,C.INK);
 if(d.fangs||d.skull)for(const k of [-1,1])poly([[k*.15,ty],[k*.05,ty],[k*.1,ty+.09]],C.PAPER)}
function drawSprite(d,cx,cy,h,pulse,hot=false,hurt=false){
 const img=SPR[d.img];if(!(img&&img.naturalWidth))return false;
 const w=h*img.naturalWidth/img.naturalHeight;
 // warm key light from the left, cool shade to the right, and a grounded contact shadow
 const halo=X.createRadialGradient(cx-w*.1,cy,10,cx-w*.1,cy,h*.62);
 halo.addColorStop(0,hexA(hot?C.RED:(d.aura||C.YEL),.16+.12*pulse+(hot?.16:0)));
 halo.addColorStop(1,'rgba(0,0,0,0)');
 X.fillStyle=halo;X.beginPath();X.arc(cx-w*.1,cy,h*.62,0,7);X.fill();
 X.save();X.globalAlpha=.35;X.fillStyle='#0f150e';X.beginPath();
 X.ellipse(cx,C.EY+h*.5,h*.30,h*.055,0,0,7);X.fill();X.restore();
 X.drawImage(img,cx-w/2,cy-h/2,w,h);
 if(hurt){X.save();X.globalCompositeOperation='lighter';X.globalAlpha=.4;
  X.drawImage(img,cx-w/2,cy-h/2,w,h);X.restore()}
 return true}
function godRays(pulse){
 X.save();X.globalCompositeOperation='lighter';
 for(let i=0;i<4;i++){
  const ox=-80+i*52,w=72+i*26,sk=560+i*170;
  X.globalAlpha=.018+.012*pulse+.005*Math.sin((G.elapsed||0)*.35+i);
  X.fillStyle='#ffe6b0';X.beginPath();
  X.moveTo(ox,-40);X.lineTo(ox+w,-40);X.lineTo(sk+w*.6,C.H);X.lineTo(sk,C.H);X.closePath();X.fill()}
 X.restore()}
// ---- dusk woodland backdrop, generated once
const HORIZON=470;
const SKY=mkLayer(g=>{
 const gr=g.createLinearGradient(0,0,0,HORIZON+120);
 gr.addColorStop(0,'#16282a');gr.addColorStop(.26,'#2b433c');gr.addColorStop(.52,'#54654c');
 gr.addColorStop(.72,'#9c8148');gr.addColorStop(.88,'#d8ac6c');gr.addColorStop(1,'#6d5334');
 g.fillStyle=gr;g.fillRect(0,0,C.W,C.H);
 // low sun just above the treeline
 const sx=C.W*.30,sy=430;
 const disc=g.createRadialGradient(sx,sy,8,sx,sy,86);
 disc.addColorStop(0,'rgba(255,246,214,.62)');disc.addColorStop(.42,'rgba(255,214,150,.26)');
 disc.addColorStop(1,'rgba(255,196,120,0)');
 g.fillStyle=disc;g.beginPath();g.arc(sx,sy,86,0,7);g.fill();
 const hz=g.createRadialGradient(sx,456,20,sx,456,560);
 hz.addColorStop(0,'rgba(255,220,160,.42)');hz.addColorStop(.45,'rgba(232,164,96,.16)');hz.addColorStop(1,'rgba(0,0,0,0)');
 g.fillStyle=hz;g.fillRect(0,0,C.W,C.H)});
const ridgeLayer=(baseY,amp,col,seed)=>mkLayer(g=>{
 const r=srand(seed),pts=[];
 for(let x=-40;x<=C.W+40;x+=30){
  const y=baseY+Math.sin(x*.0055+seed)*amp+Math.sin(x*.016+seed*.7)*amp*.45+(r()-.5)*amp*.3;
  pts.push([x,y])}
 g.beginPath();g.moveTo(-40,C.H);
 for(const p of pts)g.lineTo(p[0],p[1]);
 g.lineTo(C.W+40,C.H);g.closePath();g.fillStyle=col;g.fill()});
function pine(g,x,base,h){
 const steps=7;
 g.beginPath();g.moveTo(x-h*.045,base);
 for(let i=0;i<steps;i++){
  const t=i/steps,t2=(i+.5)/steps;
  g.lineTo(x-h*.27*(1-t*.9),base-h*t*.84);
  g.lineTo(x-h*.27*(1-t2*.9)*.55,base-h*t2*.84)}
 g.lineTo(x,base-h);
 for(let i=steps-1;i>=0;i--){
  const t=i/steps,t2=(i+.5)/steps;
  g.lineTo(x+h*.27*(1-t2*.9)*.55,base-h*t2*.84);
  g.lineTo(x+h*.27*(1-t*.9),base-h*t*.84)}
 g.lineTo(x+h*.045,base);g.closePath();g.fill();
 g.fillRect(x-h*.02,base-h*.12,h*.04,h*.13)}
const treeLayer=(col,seed,count,hMin,hMax,baseY)=>mkLayer(g=>{
 const r=srand(seed);g.fillStyle=col;
 for(let i=0;i<count;i++){const x=r()*C.W,h=hMin+r()*(hMax-hMin);
  pine(g,x,baseY+r()*10,h);
  if(r()<.35){g.beginPath();g.ellipse(x+h*.1,baseY-h*.55,h*.12,h*.075,0,0,7);g.fill()}}});
const CANOPY=mkLayer(g=>{
 const r=srand(31);
 g.fillStyle='#0c1511';
 for(let i=0;i<70;i++){const x=r()*C.W,y=-14+r()*54,s=16+r()*34;
  g.beginPath();g.ellipse(x,y,s,s*.6,r()*3,0,7);g.fill()}
 for(const [x0,dir] of [[0,1],[C.W,-1]])
  for(let i=0;i<16;i++){const x=x0+dir*(r()*130),y=r()*300,s=16+r()*30;
   g.beginPath();g.ellipse(x,y,s,s*.55,r()*3,0,7);g.fill()}
 g.strokeStyle='#12200f';g.lineWidth=3;
 for(let i=0;i<8;i++){const x=60+r()*(C.W-120),len=40+r()*90;
  g.beginPath();g.moveTo(x,0);g.quadraticCurveTo(x+12,len*.6,x-6,len);g.stroke()}});
const GROUND=mkLayer(g=>{
 const r=srand(99);
 const gr=g.createLinearGradient(0,HORIZON,0,C.H);
 gr.addColorStop(0,'#63763f');gr.addColorStop(.14,'#4c5c34');gr.addColorStop(.42,'#38432a');
 gr.addColorStop(.74,'#2a3020');gr.addColorStop(1,'#1b1f15');
 g.fillStyle=gr;g.fillRect(0,HORIZON-2,C.W,C.H-HORIZON+2);
 const path=g.createRadialGradient(C.W/2,600,40,C.W/2,600,470);
 path.addColorStop(0,'rgba(126,108,74,.20)');path.addColorStop(1,'rgba(0,0,0,0)');
 g.fillStyle=path;g.fillRect(0,HORIZON,C.W,C.H-HORIZON);
 for(let i=0;i<320;i++){const x=r()*C.W,y=HORIZON+r()*84,len=4+r()*13;
  g.strokeStyle=r()<.5?'#7d9152':'#55693a';g.lineWidth=.8+r()*1.2;
  g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+(r()-.5)*4,y-len*.6,x+(r()-.5)*8,y-len);g.stroke()}
 for(let i=0;i<22;i++){const x=r()*C.W,y=505+r()*180,s=4+r()*13;
  g.fillStyle='#55513f';g.beginPath();g.ellipse(x,y,s,s*.55,0,0,7);g.fill();
  g.fillStyle='#6d6952';g.beginPath();g.ellipse(x-s*.2,y-s*.2,s*.55,s*.3,0,0,7);g.fill()}
 // moss patches catching the last light
 for(let i=0;i<26;i++){const x=r()*C.W,y=500+r()*190,w=20+r()*70,h=6+r()*14;
  g.globalAlpha=.16+r()*.12;g.fillStyle=i%2?'#8ba35a':'#6f8a45';
  g.beginPath();g.ellipse(x,y,w,h,0,0,7);g.fill()}
 g.globalAlpha=1;
 for(let i=0;i<90;i++){const x=r()*C.W,y=515+r()*190;
  g.globalAlpha=.45;g.fillStyle=['#6e7f3f','#8a7a3c','#5c6b35','#96682f'][i%4];
  g.beginPath();g.ellipse(x,y,3+r()*2.4,1.4+r(),r()*3,0,7);g.fill()}
 g.globalAlpha=1});
const RIDGE_FAR=ridgeLayer(432,26,'#26332e',3),RIDGE_NEAR=ridgeLayer(456,15,'#1c2823',8);
const TREES_FAR=treeLayer('#1b2a22',11,24,110,190,478),TREES_NEAR=treeLayer('#101a15',23,14,180,300,486);
function backdrop(){
 const t=G.elapsed||now(),pulse=beatPulse();
 X.drawImage(SKY,0,0);
 X.drawImage(RIDGE_FAR,0,0);
 X.drawImage(RIDGE_NEAR,0,0);
 X.drawImage(TREES_FAR,0,0);
 X.drawImage(TREES_NEAR,0,0);
 X.save();X.globalCompositeOperation='lighter';X.globalAlpha=.05+.03*pulse;
 X.fillStyle='#f4d29a';X.beginPath();X.arc(C.W*.30,452,190,0,7);X.fill();X.restore();
 X.drawImage(GROUND,0,0);
 const mg=X.createLinearGradient(0,428,0,528);
 mg.addColorStop(0,'rgba(236,230,206,0)');mg.addColorStop(.55,'rgba(236,230,206,.10)');mg.addColorStop(1,'rgba(236,230,206,0)');
 X.fillStyle=mg;X.fillRect(0,428,C.W,100);
 X.drawImage(CANOPY,0,0);
 godRays(pulse)}
function rays(col,pulse,x,y){
 X.save();X.globalCompositeOperation='lighter';
 const g=X.createRadialGradient(x,y,40,x,y,430);
 g.addColorStop(0,hexA(col,.08+.07*pulse));g.addColorStop(1,'rgba(0,0,0,0)');
 X.fillStyle=g;X.beginPath();X.arc(x,y,430,0,7);X.fill();X.restore()}
// ---- entities
function drawShieldDome(x,y){
 const s=G.e.shield,r=200,pulse=beatPulse(),hit=s.hit>0;
 const ratio=s.max?Math.max(0,s.hp/s.max):0;
 X.save();
 const gr=X.createRadialGradient(x,y,50,x,y,r*.9);
 gr.addColorStop(0,'rgba(79,145,135,0)');gr.addColorStop(.74,'rgba(79,145,135,.20)');gr.addColorStop(1,'rgba(125,107,158,.34)');
 X.fillStyle=gr;X.beginPath();X.arc(x,y,r*.86,0,7);X.fill();
 X.globalAlpha=hit?.95:.5+.2*pulse;X.strokeStyle=hit?C.PAPER:C.BLUE;X.lineWidth=hit?6:3;
 X.beginPath();X.arc(x,y,r*.86,0,7);X.stroke();
 for(let i=0;i<14;i++){
  const a=i/14*Math.PI*2+(G.elapsed||0)*.5;
  X.save();X.translate(x+Math.cos(a)*r*.86,y+Math.sin(a)*r*.86);X.rotate(a+1.2);
  X.globalAlpha=.8;X.fillStyle=i%2?C.GREEN:'#a9c07a';
  X.beginPath();X.ellipse(0,0,13,5.5,0,0,7);X.fill();X.restore()}
 X.globalAlpha=.85;X.strokeStyle=C.BLUE;X.lineWidth=9;X.lineCap='round';
 X.beginPath();X.arc(x,y,r*.86,-Math.PI*.5,-Math.PI*.5+Math.PI*2*ratio);X.stroke();
 X.restore();
 T('SHIELD '+Math.ceil(s.hp),x,y+r*.86+24,22,C.BLUE);
 T('WEAK CHORD = 3X SHIELD DAMAGE',x,y+r*.86+46,15,'#a7c9bd')}
function groundTuft(x,y,s=1){                       // small foreground plants that sit the actor in the scene
 X.strokeStyle='#3f5730';X.lineWidth=2;X.lineCap='round';
 for(let i=-2;i<=2;i++){X.beginPath();X.moveTo(x+i*6*s,y);
  X.quadraticCurveTo(x+i*7*s,y-8*s,x+i*11*s,y-15*s);X.stroke()}}
function drawEnemy(){
 const e=G.e,d=e.def,t=G.elapsed,bob=Math.sin(t*3.5)*13,sway=Math.sin(t*2.2)*6,pulse=beatPulse();
 let k=1;if(e.tel)k+=.05*Math.abs(Math.sin(t*12))+.03*Math.sin(t*26);
 k+=FX.lunge*.9;
 if(FX.spawn>0)k*=1-.8*(FX.spawn/.5)**2;
 let x=e.x+sway,y=C.EY+bob;
 if(e.hurt>0){x+=ri(-10,10);y+=ri(-6,6)}
 groundTuft(e.x-70,C.PY+34,1.2);groundTuft(e.x+80,C.PY+40,1);
 if(!drawSprite(d,x,y,(d.h||440)*C.ESH*k,pulse,e.tel||e.shield.on,e.hurt>0))
  drawMonster(d,x,y,300*k,e.hurt>0?C.PAPER:e.tel?C.RED:d.color,e.tel);
 if(e.stun>0)T('STUNNED',x,y-172,26,C.BLUE);
 else if(e.tel&&!e.shield.on)T('INCOMING!',x,y-172,28,C.RED);
 if(e.shield.on)drawShieldDome(e.x,C.EY)}
// ---- the player: an ink silhouette with a crescent glaive (see README)
function bladePath(){
 X.beginPath();
 X.moveTo(12,6);
 X.bezierCurveTo(-14,-10,-34,-38,-36,-66);
 X.bezierCurveTo(-38,-94,-26,-118,-6,-124);
 X.bezierCurveTo(-15,-102,-15,-80,-9,-62);
 X.bezierCurveTo(-2,-38,13,-14,18,-2);
 X.closePath()}
function drawPlayer(){
 const p=G.p,t=G.elapsed||now(),x=p.x,y=C.PY;
 const move=clamp(Math.abs(p.tx-p.x)/90,0,1);
 // walk cycle: the legs alternate while he moves and settle when he stands still
 const cycle=t*(6.5+7.5*move),amp=.2+.8*move,stepA=Math.sin(cycle)*amp;
 const facing=(p.face||1)<0?-1:1;               // he turns to face the way he is going
 const bob=Math.sin(t*2.4)*1.2+Math.abs(stepA)*1.8;
 const lean=clamp((p.tx-p.x)/80,-1,1)*.09+clamp(p.face||1,-1,1)*.02;
 const sw=p.swing>0?Math.min(1,1-p.swing/C.SWING):1;
 const swingK=p.swing>0?Math.sin(Math.PI*Math.min(1,sw*1.08)):0;
 const guard=p.guard>0,S=1.5;
 // contact shadow
 X.save();X.translate(x,y+5);X.scale(1,.32);
 const sh=X.createRadialGradient(0,0,2,0,0,54);
 sh.addColorStop(0,'rgba(8,12,6,.62)');sh.addColorStop(1,'rgba(8,12,6,0)');
 X.fillStyle=sh;X.beginPath();X.arc(0,0,54,0,7);X.fill();X.restore();
 X.save();
 X.translate(x,y+bob);X.rotate(lean);X.scale(S*facing,S);
 X.globalAlpha=p.iframe>0&&!p.dashT&&Math.floor(t*22)%2?.55:1;
 // warm pool of light so the silhouette reads against the grass
 X.save();X.scale(1,.3);
 const lg=X.createRadialGradient(0,0,4,0,0,124);
 lg.addColorStop(0,'rgba(255,226,168,.28)');lg.addColorStop(1,'rgba(255,226,168,0)');
 X.fillStyle=lg;X.beginPath();X.arc(0,0,124,0,7);X.fill();X.restore();
 const BODY='#12170f',RIM='rgba(255,222,164,.5)';
 X.lineCap='round';X.lineJoin='round';
 // legs: wide stance, thick tapered limbs, blocky feet, stepping in opposite phase
 const BACK='#222b1f';                       // the far leg is a touch lighter so the stride reads
 const leg=(hx,ph,ink)=>{
  const s=Math.sin(cycle+ph),lift=Math.max(0,s);
  const stance=hx<0?-12:12;                  // feet stay apart even when he stands still
  const fx=hx+stance+s*19*amp,fy=-4-lift*11*amp;  // the foot swings out and lifts off the grass
  X.strokeStyle=ink;X.lineWidth=14;X.lineCap='round';
  X.beginPath();X.moveTo(hx,-66);
  X.quadraticCurveTo(hx+s*12*amp,-33,fx,fy+6);X.stroke();
  X.save();X.translate(fx,fy);
  X.fillStyle=ink;X.beginPath();X.roundRect(-9,-6,21,12,4);X.fill();
  X.strokeStyle='rgba(255,222,164,.25)';X.lineWidth=1.8;
  X.beginPath();X.moveTo(-7,-4);X.lineTo(9,-4);X.stroke();X.restore()};
 leg(-3,0,BACK);leg(2,Math.PI,BODY);
 // torso: narrow waist, sloping shoulders, one ink mass
 X.fillStyle=BODY;
 X.beginPath();
 X.moveTo(-12,-118);X.quadraticCurveTo(0,-125,12,-118);
 X.quadraticCurveTo(11,-98,9,-80);X.quadraticCurveTo(5,-68,0,-66);
 X.quadraticCurveTo(-6,-68,-9,-80);X.quadraticCurveTo(-12,-98,-12,-118);
 X.closePath();X.fill();
 X.beginPath();X.ellipse(-1,-68,8,6,0,0,7);X.fill();
 // neck + head
 X.strokeStyle=BODY;X.lineWidth=8;X.beginPath();X.moveTo(0,-120);X.lineTo(0,-129);X.stroke();
 X.beginPath();X.arc(1,-142,15,0,7);X.fillStyle=BODY;X.fill();
 // a short tuft of hair so the head has a direction
 X.beginPath();X.moveTo(-12,-147);X.quadraticCurveTo(-21,-155,-14,-159);
 X.quadraticCurveTo(-9,-152,-6,-149);X.closePath();X.fill();
 // ---- the glaive: haft in both hands, crescent blade at the far end
 const gx=32-swingK*4,gy=-100-swingK*9,wepAng=-0.10-swingK*1.0;
 const hb={x:gx-Math.cos(wepAng)*34,y:gy-Math.sin(wepAng)*34};
 X.save();X.translate(gx,gy);X.rotate(wepAng);
 // ghost copies left behind by the swing
 if(p.swing>0)for(let i=1;i<=3;i++){
  X.save();X.rotate(-i*.19);X.globalAlpha=(.34/i)*(.35+.65*swingK);X.fillStyle='#2b3327';
  X.translate(-84,0);bladePath();X.fill();X.restore()}
 X.strokeStyle=BODY;X.lineWidth=7;X.lineCap='round';
 X.beginPath();X.moveTo(7,0);X.lineTo(-84,0);X.stroke();
 X.fillStyle=BODY;X.beginPath();X.arc(7,0,3.6,0,7);X.fill();
 X.save();X.translate(-84,0);
 const bg=X.createLinearGradient(-40,-120,12,10);
 bg.addColorStop(0,'#454d40');bg.addColorStop(.42,'#242b21');bg.addColorStop(1,'#0f130e');
 bladePath();X.fillStyle=bg;X.fill();
 X.strokeStyle='rgba(8,12,7,.85)';X.lineWidth=2;X.stroke();
 // honed edge catching the low sun, brighter mid-swing
 X.strokeStyle=`rgba(255,226,172,${.32+.55*swingK})`;X.lineWidth=2.4;X.lineCap='round';
 X.beginPath();X.moveTo(12,2);X.bezierCurveTo(-14,-12,-33,-40,-35,-66);
 X.bezierCurveTo(-37,-94,-25,-117,-6,-123);X.stroke();
 // the little notch in the blade
 X.fillStyle='rgba(244,237,218,.45)';
 X.beginPath();X.moveTo(-20,-92);X.lineTo(-27,-101);X.lineTo(-17,-105);X.closePath();X.fill();
 // hooked tail under the blade
 X.fillStyle=BODY;X.beginPath();X.moveTo(8,2);X.lineTo(28,15);X.lineTo(4,13);X.closePath();X.fill();
 X.restore();
 X.restore();
 // arms: both hands stay on the haft through the swing
 const arm=(sx,sy,ex,ey,hx,hy)=>{
  X.strokeStyle=BODY;X.lineWidth=11;X.lineCap='round';
  X.beginPath();X.moveTo(sx,sy);X.quadraticCurveTo(ex,ey,hx,hy);X.stroke();
  X.beginPath();X.arc(hx,hy,5.4,0,7);X.fillStyle=BODY;X.fill()};
 arm(11,-116,25,-115,gx,gy);
 arm(-11,-116,-19,-101,hb.x,hb.y);
 // rim light along the leading edge
 X.strokeStyle=RIM;X.lineWidth=2;
 X.beginPath();X.arc(1,-142,15,-.75,.3);X.stroke();
 X.beginPath();X.moveTo(-12,-116);X.quadraticCurveTo(-15,-90,-11,-72);X.stroke();
 X.beginPath();X.moveTo(-30,-8);X.lineTo(-22,-6);X.stroke();
 if(guard){
  for(let i=0;i<Math.max(2,p.guard);i++){
   const a=t*1.4+i*2.1;
   X.save();X.translate(Math.cos(a)*44,-64+Math.sin(a)*32);X.rotate(a);
   X.fillStyle=C.BLUE;X.globalAlpha=.85;X.beginPath();X.ellipse(0,0,7.5,3.4,0,0,7);X.fill();X.restore()}}
 X.restore();
 // the label stays upright even when the fighter is facing left
 if(guard)T('GUARD '+p.guard,x,y+bob-186*S,17,C.BLUE)}

function drawShots(){
 for(const s of G.shots){
  const a=Math.atan2(s.vy,s.vx);
  if(s.kind==='wall'){
   X.save();X.translate(s.x,s.y);X.rotate(a+Math.PI/2);
   X.fillStyle='#3d5a34';X.beginPath();X.ellipse(0,0,s.r*1.05,s.r*1.5,0,0,7);X.fill();
   X.strokeStyle='#8aa85a';X.lineWidth=2.2;
   for(let i=0;i<6;i++){const ang=i/6*6.283;
    X.beginPath();X.moveTo(Math.cos(ang)*s.r*.6,Math.sin(ang)*s.r*.6);
    X.lineTo(Math.cos(ang)*s.r*1.65,Math.sin(ang)*s.r*1.65);X.stroke()}
   X.restore();continue}
  const tail=s.kind==='spread'?20:38;
  X.save();X.globalCompositeOperation='lighter';X.lineCap='round';
  const tailg=X.createLinearGradient(s.x-Math.cos(a)*tail,s.y-Math.sin(a)*tail,s.x,s.y);
  tailg.addColorStop(0,'rgba(0,0,0,0)');tailg.addColorStop(1,hexA(s.col,.5));
  X.strokeStyle=tailg;X.lineWidth=s.r*1.4;
  X.beginPath();X.moveTo(s.x-Math.cos(a)*tail,s.y-Math.sin(a)*tail);X.lineTo(s.x,s.y);X.stroke();
  const rg=X.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*2.3);
  rg.addColorStop(0,'#fff6d8');rg.addColorStop(.32,s.col);rg.addColorStop(1,'rgba(0,0,0,0)');
  X.fillStyle=rg;X.beginPath();X.arc(s.x,s.y,s.r*2.3,0,7);X.fill();
  X.restore();
  X.fillStyle='#fff8e4';X.beginPath();X.arc(s.x,s.y,s.r*.42,0,7);X.fill()}}
function drawAttackFx(){
 const a=G.e&&G.e.atk;
 if(a){
  if(a.kind==='beam'&&!a.fired){
   const p=Math.min(1,a.t/a.warn),w=190;
   X.save();
   X.fillStyle=`rgba(60,40,18,${.12+.22*p})`;X.fillRect(a.x-w/2,C.EY,w,C.H-C.EY);
   X.strokeStyle='rgba(223,166,60,.75)';X.setLineDash([16,12]);X.lineWidth=3;
   X.beginPath();X.moveTo(a.x-w/2,C.EY);X.lineTo(a.x-w/2,C.H);X.moveTo(a.x+w/2,C.EY);X.lineTo(a.x+w/2,C.H);X.stroke();
   X.restore()}
  if(a.kind==='slam'&&!a.fired){
   const p=Math.min(1,a.t/a.warn);
   X.save();X.strokeStyle=C.ORANGE;X.globalAlpha=.25+.5*p;X.lineWidth=4;
   X.beginPath();X.arc(a.x,C.PY,40+130*p,0,7);X.stroke();
   X.beginPath();X.ellipse(a.x,C.PY,170*(.6+.4*p),52*(.6+.4*p),0,0,7);X.stroke();
   X.globalAlpha=.16+.2*p;X.fillStyle='#3b3524';
   X.beginPath();X.ellipse(a.x,C.PY,150*(.6+.4*p),46*(.6+.4*p),0,0,7);X.fill();X.restore()}
  if(a.kind==='wall'&&a.t<a.warn){
   const p=a.t/a.warn,gx=80+a.gap*180;
   X.save();X.globalAlpha=.2+.4*p;X.strokeStyle=C.GREEN;X.lineWidth=3;
   X.beginPath();X.moveTo(80,gx-70);X.lineTo(C.W, gx-70);X.stroke();
   X.globalAlpha=.1;X.fillStyle=C.GREEN;X.fillRect(gx-64,C.EY+120,128,C.H);X.restore()}}
 for(const b of G.blasts){
  const t=b.t/b.dur;
  if(b.kind==='beam'){
   const w=190,p=Math.min(1,t*3);
   X.save();X.globalCompositeOperation='lighter';
   const gr=X.createLinearGradient(b.x-w/2,0,b.x+w/2,0);
   gr.addColorStop(0,'rgba(223,166,60,0)');gr.addColorStop(.5,`rgba(255,238,196,${1-t})`);gr.addColorStop(1,'rgba(223,166,60,0)');
   X.fillStyle=gr;X.fillRect(b.x-w/2,C.EY,w*p,C.H-C.EY);
   X.fillStyle=`rgba(255,253,242,${(1-t)*.85})`;X.fillRect(b.x-w*.13,C.EY,w*.26*p,C.H-C.EY);
   X.restore()}
  else{
   X.save();
   X.globalAlpha=1-t;X.strokeStyle=C.ORANGE;X.lineWidth=7*(1-t)+2;
   X.beginPath();X.ellipse(b.x,C.PY,60+220*t,16+64*t,0,0,7);X.stroke();
   X.globalAlpha=(1-t)*.5;X.strokeStyle='#f6ecd2';X.lineWidth=2.4;
   X.beginPath();X.ellipse(b.x,C.PY,52+210*t,13+60*t,0,0,7);X.stroke();
   X.globalAlpha=(1-t)*.25;X.fillStyle='#6b5b38';
   X.beginPath();X.ellipse(b.x,C.PY,40+190*t,10+54*t,0,0,7);X.fill();X.restore()}}}
function drawDrops(){
 for(const d of G.drops){
  const pw=POWERS[d.type],bob=Math.sin(d.t*4)*6,r=24;
  X.save();X.translate(d.x,d.y+bob);
  X.globalAlpha=.25+.12*Math.sin(d.t*6);X.fillStyle=pw.col;
  X.beginPath();X.arc(0,0,r*1.9,0,7);X.fill();X.globalAlpha=1;
  X.rotate(Math.sin(d.t*2)*.12);
  X.fillStyle='rgba(26,30,20,.94)';X.beginPath();X.roundRect(-r,-r,r*2,r*2,7);X.fill();
  X.strokeStyle=pw.col;X.lineWidth=3;X.stroke();
  X.fillStyle=pw.col;X.globalAlpha=.9;
  for(const [ox,oy,rot] of [[-r,-r,.7],[r,-r,-.7]]){X.save();X.translate(ox,oy);X.rotate(rot);
   X.beginPath();X.ellipse(0,0,7.5,3.2,0,0,7);X.fill();X.restore()}
  X.globalAlpha=1;T(pw.tag,0,1,29,pw.col);X.restore()}}
// selfie preview: mirrored video plus the hand the camera is tracking (x is already mirrored)
function camDraw(x,y,w,h,a=1){
 if(!V||!V.videoWidth)return;                 // camera off: nothing to paste in
 X.save();X.translate(x+w,y);X.scale(-1,1);X.drawImage(V,0,0,w,h);X.restore();
 if(!cam.frame)return;
 const bones=[[0,5],[5,9],[9,13],[13,17],[0,17],[0,1],[1,2],[2,3],[3,4]];
 for(let k=0;k<4;k++)for(let j=0;j<3;j++)bones.push([5+k*4+j,5+k*4+j+1]);
 for(const [hd,col] of [[cam.frame.left,C.GREEN],[cam.frame.right,C.BLUE]]){
  if(!hd)continue;
  const pts=hd.map(p=>[x+p.x*w,y+p.y*h]);
  X.save();X.strokeStyle=col;X.lineWidth=2;X.globalAlpha=.6*a;
  X.beginPath();for(const [i,j] of bones){X.moveTo(pts[i][0],pts[i][1]);X.lineTo(pts[j][0],pts[j][1])}X.stroke();
  X.globalAlpha=.9*a;X.fillStyle=col;
  if(dbg)for(const [px,py] of pts){X.beginPath();X.arc(px,py,2.5,0,7);X.fill()}
  else for(const i of [0,4,8,12,16,20]){X.beginPath();X.arc(pts[i][0],pts[i][1],3.2,0,7);X.fill()}
  X.strokeStyle=col;X.lineWidth=2.5;X.globalAlpha=.8*a;
  X.beginPath();X.arc(pts[0][0],pts[0][1],17,0,7);X.stroke();X.restore()}}
function drawCam(){
 const w=Math.floor(C.CAM_W*C.PREVIEW),h=Math.floor(C.CAM_H*C.PREVIEW),x=C.W-w-34,y=C.H-h-34;
 camDraw(x,y,w,h,.75);
 // what the camera thinks you are holding up: 3 fingers -> D
 const n=rec.count,ch=chordFor(n);
 T(n?n+'  '+ch:'HOLD UP 1-5 FINGERS',x+w/2,y-16,16,n?C.PAPER:'#b6b3a0','center','bottom',w-16);
 T('SWIPE UP OR DOWN TO ATTACK',x+w/2,y-2,13,'rgba(244,237,218,.55)','center','bottom',w-16);
 panel(x-4,y-4,w+8,h+8,4,'rgba(20,27,18,.7)')}
// camera check page (desktop): the webcam, the hand it reads, the chord that makes and how
// to start. It opens on every run launched from the menu, camera or keyboard.
function warmScene(){
 const cx=C.W/2,pw=1000,ph=598,px=cx-pw/2,py=14;
 const w=380,h=Math.round(w*C.CAM_H/C.CAM_W),x=cx-w/2,y=100;
 const has=!!(cam.frame&&cam.frame.left),n=rec.count,ch=chordFor(n);
 X.save();X.fillStyle='rgba(16,20,13,.88)';X.beginPath();X.roundRect(px,py,pw,ph,18);X.fill();
 X.strokeStyle='rgba(223,166,60,.42)';X.lineWidth=2;X.stroke();X.restore();
 starburst(cx,52,62,C.GREEN,12);
 T('CAMERA CHECK',cx,46,38,C.PAPER);
 T('WHAT THE CAMERA SEES, BEFORE THE FIGHT',cx,80,15,'#c9c1a6');
 camDraw(x,y,w,h,1);
 if(!has){X.save();X.globalAlpha=.4;X.fillStyle=C.INK;X.fillRect(x,y,w,h);X.restore()}
 if(!cam.ready){
  T('NO CAMERA',cx,y+h/2-14,30,'#c9c1a6');
  T('F2 TO TRY AGAIN  ·  KEYBOARD PLAYS RIGHT NOW',cx,y+h/2+20,14,'#8f8b76','center','middle',w-30)}
 panel(x-6,y-6,w+12,h+12,4,'rgba(223,166,60,.55)');
 // camera status right under the preview
 const sy=y+h+26;
 if(!cam.ready) T('CAMERA '+(cam.err?cam.err.toUpperCase():'OFF')+'   ·   KEYBOARD STILL PLAYS',cx,sy,17,C.RED,'center','middle',w+280);
 else if(has) T(n+' FINGER'+(n===1?'':'S')+'   =   '+ch,cx,sy,26,C.PAPER,'center','middle',w+280);
 else T('HOLD UP 1-5 FINGERS ON YOUR LEFT HAND',cx,sy,18,C.YEL,'center','middle',w+300);
 // the whole control sheet, in three lines
 const gy=sy+40;
 T('1 E  ·  2 A  ·  3 D  ·  4 G  ·  5 C      SWIPE UP OR DOWN TO SWING',cx,gy,17,C.PAPER,'center','middle',w+420);
 T('MOVE: SLIDE YOUR LEFT HAND  (OR A / D)      SUPER: CLENCH BOTH FISTS',cx,gy+26,15,'#c9c1a6','center','middle',w+420);
 T('CLOSE IN: THE GLAIVE ONLY REACHES A NEARBY ENEMY',cx,gy+50,14,'#a9a491','center','middle',w+420);
 // the countdown only runs while the camera can actually see your hand
 const counting=cam.ready&&warmSeen>0&&warmT<C.WARM;
 const bw=340,bx=cx-bw/2,by=gy+82,p=counting?clamp(warmT/C.WARM,0,1):0;
 X.fillStyle='rgba(8,11,8,.75)';X.fillRect(bx,by,bw,8);
 X.fillStyle=p>=1?C.GREEN:C.YEL;X.fillRect(bx,by,Math.max(2,bw*p),8);
 T(counting?'STARTING IN '+Math.max(0,C.WARM-warmT).toFixed(1)+'S'
   :cam.ready?'SPACE OR CLICK TO BEGIN  ·  WAITING FOR YOUR HAND':'SPACE OR CLICK TO BEGIN',
   cx,by+28,17,'#c9c1a6','center','middle',w+320);
 T('SPACE BEGIN   ·   F2 CAMERA / KEYBOARD   ·   X SWAP HANDS   ·   ESC MENU',
   cx,by+56,14,'rgba(244,237,218,.5)','center','middle',w+460)}
function hud(fps){
 const W=C.W,p=G.p,e=G.e,cx=W/2;
 bar(40,54,430,34,p.hp/C.PHP,C.GREEN,'YOU  '+Math.ceil(p.hp));
 let px=40;
 if(p.guard>0)for(let i=0;i<p.guard;i++){
  X.fillStyle=C.BLUE;X.beginPath();X.arc(px+8+i*22,112,6,0,7);X.fill();
  X.strokeStyle=C.INK;X.lineWidth=2;X.stroke()}
 px+=p.guard?p.guard*22+14:0;
 for(const k in p.powers){const pw=POWERS[k];
  X.fillStyle='rgba(18,22,14,.85)';X.beginPath();X.roundRect(px,99,74,25,6);X.fill();
  X.strokeStyle=pw.col;X.lineWidth=2;X.stroke();
  T(pw.tag+' '+Math.ceil(p.powers[k]),px+37,112,16,pw.col);px+=82}
 bar(W-470,54,430,34,e.hp/e.max,C.RED,e.def.name+'  '+Math.ceil(e.hp),true);
 T('WEAK: '+e.def.weak,W-40,96,21,C.YEL,'right','top');
 const lvl=G.endless?'WAVE '+(G.level-ENEMIES.length+1):'LEVEL '+(G.level+1)+' / '+ENEMIES.length;
 T(lvl,cx,26,23,C.PURPLE);
 const chord=src==='webcam'?rec.stable:kbChord,lab=chord!=='NONE'?chord:'--';
 T(lab,cx+2,95,86,C.INK);X.save();T(lab,cx,92,86,CHORD_COL[chord]||'#8d8873');X.restore();
 if(G.streak>=2)T(G.streak+' HIT STREAK!',cx,172,30+Math.min(20,G.streak*2),C.YEL);
 const trail=p.buf.slice(-4).map(x=>x[0]).join(' > ');if(trail)T(trail,cx,204,20,C.PAPER);
 if(G.super>=1&&!G.superOn){
  X.save();X.globalAlpha=.5+.2*Math.sin((G.elapsed||0)*8);X.fillStyle='rgba(12,16,10,.86)';
  X.beginPath();X.roundRect(cx-236,232,472,74,16);X.fill();X.restore();
  X.save();X.globalAlpha=.7+.3*Math.sin((G.elapsed||0)*8);
  T('SUPER READY',cx,254,30,C.RED);
  T(MOBILE?'TAP THE SUPER BUTTON':'PRESS Q   ·   OR CLENCH BOTH FISTS',cx,286,16,C.PAPER);X.restore()}
 // super meter: fills with hits, shouts when it is ready
 const sy=C.H-186,full=G.super>=1;
 T('SUPER',40,sy,17,full?C.RED:'#a8a48e','left','middle');
 X.fillStyle='rgba(16,20,13,.85)';X.beginPath();X.roundRect(112,sy-8,236,16,8);X.fill();
 X.fillStyle=full?(beatPulse()>.5?C.RED:C.YEL):C.ORANGE;
 X.beginPath();X.roundRect(115,sy-5,Math.max(0,230*G.super),10,5);X.fill();
 if(full){X.save();X.globalAlpha=.55+.45*Math.sin((G.elapsed||0)*8);
  T(MOBILE?'READY  ·  SUPER':'READY  ·  Q',360,sy,19,C.RED,'left','middle');X.restore()}
 else T(Math.round(G.super*100)+'%',360,sy,15,'#8f8b76','left','middle');
 // the bottom-left corner belongs to the joystick on a phone, so the score moves up
 T('SCORE '+G.score,40,MOBILE?150:C.H-134,MOBILE?26:29,C.PAPER,'left','top');
 T('DODGES '+G.dodges,40,MOBILE?178:C.H-104,MOBILE?17:19,C.BLUE,'left','top');
 if(!MOBILE){                                 // on a phone the bottom corners are controls
  T(`${fps.toFixed(1)} FPS   input: ${src}   A/D move   SHIFT dash   ${p.dashCD>0?'dash '+p.dashCD.toFixed(1)+'s':'dash ready'}`,
    28,C.H-74,16,'#b6b3a0','left','top',620);
  T('1-5 chord   UP/DOWN or J/K strum (hold)   F1 debug   F2 input   H holo   V voice   P pause   M mute   R restart',
    28,C.H-46,16,'#b6b3a0','left','top',960)}
 if(dbg){
  const L=[];const f=cam.frame;
  if(src==='webcam'&&f){L.push('left hand:  '+(f.left?'yes':'no'),'right hand: '+(f.right?'yes':'no'),'chord read: '+describe(f.left),
   'swing:      '+rec.strum.nv.toFixed(2)+' hand-heights/s','threshold:  '+rec.strum.thr.toFixed(2)+'  ([ / ] to tune)',
   'armed:      '+(rec.strum.armed?'yes':'no'),'stable:     '+rec.stable)}
  else L.push('input: '+src,'heard: '+voice.heard,'player tx: '+Math.round(G.p.tx),'dash cd: '+G.p.dashCD.toFixed(2));
  X.fillStyle='rgba(18,22,14,.86)';X.fillRect(16,180,350,24*L.length+20);
  L.forEach((s,i)=>T(s,26,190+i*24,16,C.PAPER,'left','top'))}}
// ---- super cutscene: ink spokes, title slam, three glaive cuts, 500 and a slow-mo out
function bigText(s,x,y,size,col,rot=0,alpha=1){
 X.save();X.translate(x,y);X.rotate(rot);X.globalAlpha=alpha;
 X.font=size+'px '+POP;X.textAlign='center';X.textBaseline='middle';X.lineJoin='round';
 X.lineWidth=Math.max(6,size*.16);X.strokeStyle=C.INK;X.strokeText(s,0,0);
 X.fillStyle=col;X.fillText(s,0,0);X.restore()}
function drawSuper(){
 const t=G.superT,cx=C.W/2,cy=C.H/2,D=SUPER.dur;
 const bar=Math.min(1,t/.22)*(1-clamp((t-(D-.35))/.35,0,1))*96;
 X.save();
 X.fillStyle='rgba(8,11,8,'+(.52*Math.min(1,t/.2))+')';X.fillRect(0,0,C.W,C.H);
 // rotating ink spokes behind everything
 X.save();X.translate(cx,cy);X.rotate(t*.5);
 const sp=X.createRadialGradient(0,0,70,0,0,780);
 sp.addColorStop(0,'rgba(184,69,47,.26)');sp.addColorStop(1,'rgba(184,69,47,0)');X.fillStyle=sp;
 for(let i=0;i<14;i++){X.rotate(Math.PI*2/14);
  X.beginPath();X.moveTo(0,0);X.lineTo(820,-64);X.lineTo(820,64);X.closePath();X.fill()}
 X.restore();
 // close-up on the glaive while the title lands
 if(t<1.05){
  const s=1.55+.4*Math.sin(Math.min(1,t/1.05)*Math.PI),hold=Math.min(1,(1.05-t)/.3);
  X.save();X.globalAlpha=Math.min(1,t*5)*hold;
  X.translate(cx,C.PY-20);X.scale(s,s);X.translate(-G.p.x,-(C.PY-20));
  drawPlayer();X.restore()}
 // title
 if(t<1.3){
  const pin=clamp(t/.28,0,1),out=clamp((t-1.02)/.28,0,1),sc=2.7-1.7*Math.min(1,pin*1.5);
  X.save();X.globalAlpha=1-out;X.translate(cx,cy-30);X.scale(sc,sc);
  bigText('CRESCENT',0,-28,86,C.PAPER);
  bigText('EXECUTION',0,46,96,C.RED);
  X.restore();
  T('SUPER ATTACK',cx,cy-138,24,C.YEL)}
 // three glaive cuts sweep the frame
 for(let i=0;i<3;i++){
  const p=(t-.46-i*.15)/.44;
  if(p<=0||p>=1)continue;
  const w=2200*(.35+.65*Math.min(1,p*2.2)),a=Math.min(1,p*6)*(1-clamp((p-.55)/.45,0,1));
  X.save();X.translate(cx+(i-1)*150,cy+(i-1)*44);X.rotate(-.34+(i-1)*.06);X.globalAlpha=a;
  X.fillStyle='rgba(255,251,238,.94)';X.fillRect(-w/2,-10,w,20);
  X.fillStyle='rgba(184,69,47,.62)';X.fillRect(-w/2,-30,w,12);
  X.fillStyle='rgba(223,166,60,.5)';X.fillRect(-w/2,14,w,7);
  X.restore()}
 // the hit lands: 500, stamped
 if(t>=SUPER.hit-.02){
  const p=clamp((t-SUPER.hit)/.5,0,1),sc=1.75-.75*Math.min(1,p*2);
  bigText('500',cx,cy+16,150*sc,C.YEL,-.04,1-clamp((t-(SUPER.hit+1))/.5,0,1));
  const st=clamp((t-(SUPER.hit+.4))/.35,0,1);
  if(st>0)bigText('EXECUTED',cx,cy+156,62*(1.5-.5*Math.min(1,st*2)),C.RED,-.07,st)}
 // letterbox bars slam in and retract
 X.fillStyle='#080b08';X.fillRect(0,0,C.W,bar);X.fillRect(0,C.H-bar,C.W,bar);
 X.restore()}
function card(){
 const cx=C.W/2,cy=C.H/2,ph=G.phase;let title,sub,col,lines;
 if(ph==='MENU'){
  title=C.TITLE;sub=MOBILE?'TAP TO PLAY':'PRESS SPACE TO PLAY';col=C.YEL;
  lines=MOBILE?
   ['JOYSTICK BOTTOM LEFT: DRAG LEFT / RIGHT TO MOVE · DASH ROUND BUTTON TO DASH',
    'THE DOWN AND UP BUTTONS STRUM THE GLAIVE - HOLD ONE TO KEEP SWINGING.',
    'THE NOTE ROW PICKS YOUR CHORD: E A D G C',
    'EVERY CHORD SWINGS THE GLAIVE. THE WEAK CHORD DOES 2X AND BREAKS SHIELDS.',
    'HITS FILL THE SUPER METER: WHEN IT LIGHTS UP TAP SUPER.',
    'CLOSE IN TO HIT - THE GLAIVE ONLY REACHES A NEARBY ENEMY.',
    'DODGE THORNS, SUNBEAMS AND SLAMS. GRAB THE FALLING CHARMS.',
    'LEVELS 1-5 END IN CARNAGE. THEN ENDLESS WAVES UNTIL YOU DROP.',
    'TOUCH CONTROLS - THE CAMERA GESTURES ARE A DESKTOP THING.',
    'BEST SCORE '+G.best+'     HOLD THE PHONE IN LANDSCAPE']
   :['CAMERA: HOLD UP 1-5 FINGERS ON YOUR LEFT HAND FOR E A D G C',
    'SWIPE EITHER HAND UP OR DOWN TO ATTACK. THE LEFT HAND STEERS.',
    'KEYBOARD: A/D MOVE · SHIFT DASH · 1-5 CHORD · UP/DOWN OR J/K STRUM (HOLD)',
    'EVERY CHORD SWINGS THE GLAIVE. THE WEAK CHORD DOES 2X AND BREAKS SHIELDS.',
    'HITS FILL THE SUPER METER: WHEN IT IS FULL PRESS Q - OR CLENCH BOTH FISTS.',
    'CLOSE IN TO HIT - THE GLAIVE ONLY REACHES A NEARBY ENEMY.',
    'DODGE THORNS, SUNBEAMS AND SLAMS. GRAB THE FALLING CHARMS.',
    'LEVELS 1-5 END IN CARNAGE. THEN ENDLESS WAVES UNTIL YOU DROP.',
    cam.ready?'CAMERA READY - space or click opens the camera check':cam.err?'CAMERA: '+cam.err+' - keyboard plays fine, F2 retries':'CAMERA LOADING...',
    'BEST SCORE '+G.best+'     F2 keyboard mode     P pause     M mute']}
 else if(ph==='WIN'){title='YOU SHRED!';sub='SCORE '+G.score+'   BEST '+G.best;col=C.GREEN;
  lines=MOBILE?['TAP THE SCREEN = ENDLESS MODE   (waves 1+ scale forever)','TAP AGAIN ANY TIME TO RESTART THE CAMPAIGN']
   :['SPACE = ENDLESS MODE   (waves 1+ scale forever)','R = RESTART THE CAMPAIGN']}
 else{title='WIPED OUT';sub='SCORE '+G.score+'   BEST '+G.best;col=C.RED;
  lines=['REACHED '+(G.endless?'WAVE '+(G.level-ENEMIES.length+1):'LEVEL '+(G.level+1)),
   MOBILE?'TAP THE SCREEN TO TRY AGAIN':'PRESS R TO TRY AGAIN']}
 const h=52+lines.length*29,cw=MOBILE?1010:1132;   // phones keep the corners clear for the controls
 X.save();
 X.fillStyle='rgba(16,20,13,.80)';X.beginPath();X.roundRect(cx-cw/2,cy-74,cw,h+34,16);X.fill();
 X.strokeStyle='rgba(223,166,60,.5)';X.lineWidth=2;X.beginPath();X.roundRect(cx-cw/2,cy-74,cw,h+34,16);X.stroke();
 X.restore();
 // leaf crest above the title
 starburst(cx,cy-186,120,col,14);
 for(const k of [-1,1]){X.save();X.translate(cx+k*72,cy-186);X.rotate(k*.9);X.fillStyle=C.GREEN;
  X.beginPath();X.ellipse(0,0,20,8,0,0,7);X.fill();
  X.beginPath();X.ellipse(k*16,-4,16,6,k*.2,0,7);X.fill();X.restore()}
 T(title,cx,cy-186,84,C.PAPER,'center','middle',1080);
 T(sub,cx,cy-104,30,col);
 lines.forEach((s,i)=>T(s,cx,cy-42+i*29,19,C.PAPER,'center','middle',cw-60))}
function drawBanner(){
 const b=G.banner;if(!b)return;
 const p=b.t/b.dur;if(p>=1){G.banner=null;return}
 const inp=Math.min(1,b.t/.2),out=Math.max(0,(p-.72)/.28),a=1-out;
 X.save();X.globalAlpha=a;
 X.fillStyle='rgba(16,20,13,.84)';X.fillRect(0,286,C.W*inp,148);
 X.fillStyle=C.YEL;X.fillRect(0,282,C.W*inp,3);X.fillStyle=C.GREEN;X.fillRect(0,434,C.W*inp,3);
 T(b.big,cx0(),352,54,C.PAPER,'center','middle');
 T(b.small,cx0(),398,23,C.YEL,'center','middle');
 X.restore()}
function cx0(){return C.W/2}
function drawWipe(){
 if(G.wipe<=0)return;
 const p=1-G.wipe,tri=1-Math.abs(p*2-1),bh=C.H/5;
 X.save();
 for(let i=0;i<5;i++){
  const t=clamp(tri*1.35-i*.07,0,1),w=C.W*t;
  X.fillStyle='#10140d';X.fillRect(0,i*bh,w,bh-2);
  if(w>0){X.fillStyle=i%2?C.GREEN:C.YEL;X.fillRect(Math.max(0,w-5),i*bh,5,bh-2)}}
 X.restore()}
function draw(dt,fps){
 const [ox,oy]=shake.tick(dt);flash=Math.max(0,flash-dt*3);speedT=Math.max(0,speedT-dt);
 fxTick(dt);if(G.banner)G.banner.t+=dt;if(G.wipe>0)G.wipe=Math.max(0,G.wipe-dt*1.8);
 const cx=C.W/2,cy=C.H/2-10,pulse=beatPulse(),play=G.phase==='PLAYING'&&G.e;
 const aura=play?(G.e.def.aura||C.YEL):C.GREEN;
 X.save();X.translate(cx,cy);X.rotate(FX.rot*.04);X.scale(FX.zoom,FX.zoom);X.translate(-cx,-cy);
 X.translate(ox,oy);
 backdrop();
 rays(aura,pulse,cx,cy);
 if(speedT>0)speedLines(cx,cy);
 if(play){drawAttackFx();drawEnemy();drawShots();drawDrops();drawPlayer()}
 else if(G.phase==='WARMUP')warmScene()
 else card()
 fxDraw();
 X.restore();
 if(play&&!G.superOn){if(src==='webcam'&&cam.ready)drawCam();hud(fps)}
 if(play&&G.paused&&!G.superOn)T('PAUSED',cx,cy,110,C.PAPER)
 if(G.phase==='WIN'&&Math.random()<.12)burst(rr(100,1180),rr(80,400),[C.RED,C.YEL,C.GREEN,C.PURPLE][ri(0,3)],32,400);
 effects=effects.filter(f=>{f.tick(dt);f.draw();return!f.dead});
 overlays();drawBanner();drawWipe();
 if(G.superOn)drawSuper();
 if(flash>0){X.fillStyle=`rgba(255,246,224,${180*flash/255})`;X.fillRect(0,0,C.W,C.H)}
 glitchPass();
 panel(10,10,C.W-20,C.H-20,8,'rgba(223,166,60,.28)')}
// hologram: the scene four times, rotated 90 degrees apart, on black (render/hologram.py)
function toggleHolo(){holoOn=!holoOn;holo.style.display=holoOn?'block':'none';cv.style.display=holoOn?'none':'block'}
function drawHolo(){
 const s=720,q=s/2;HX.fillStyle='#000';HX.fillRect(0,0,s,s);
 for(const [x,y,deg] of [[s/2,3*s/4,0],[s/2,s/4,180],[s/4,s/2,90],[3*s/4,s/2,270]]){
  HX.save();HX.translate(x,y);HX.rotate(-deg*Math.PI/180);HX.drawImage(cv,-q/2,-q/2,q,q);HX.restore()}}
