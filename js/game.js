"use strict";
// ============================================================ game logic
const loadBest=()=>{try{return +localStorage.getItem('carnage-best')||0}catch(e){return 0}};
const POWERS={
 heal:{name:'HEAL',col:C.GREEN,dur:0,tag:'+'},
 overdrive:{name:'OVERDRIVE',col:C.RED,dur:8,tag:'2X'},
 fury:{name:'FURY',col:C.YEL,dur:9,tag:'F+'},
 guard:{name:'GUARD',col:C.BLUE,dur:0,tag:'G'},
 slow:{name:'SLOW-MO',col:C.PURPLE,dur:7,tag:'S'}};
const G={phase:'MENU',score:0,elapsed:0,fx:[],paused:false,level:0,endless:false,streak:0,streakT:0,
 best:loadBest(),dodges:0,banner:null,wipe:0,dropT:5,super:0,superOn:false,superT:0,superHit:false,
 p:{hp:C.PHP,buf:[],hurt:0,x:C.W/2,tx:C.W/2,guard:0,iframe:0,powers:{},
  face:1,dashT:0,dashCD:0,swing:0},
 e:null,shots:[],drops:[],blasts:[]};
const emit=(k,d={})=>G.fx.push({k,d});
const streakMult=()=>1+Math.min(.5,G.streak*.05);       // +5% per chained hit, capped at +50%
function enemyForLevel(n){return n<ENEMIES.length?ENEMIES[n]:endlessEnemy(n-ENEMIES.length+1)}
function newEnemy(d){const s=d.shield||null;
 return {def:d,hp:d.hp,max:d.hp,x:C.W/2,tx:C.W/2,hurt:0,timer:0,tel:false,move:-1,atk:null,stun:0,age:0,
  shield:{on:false,max:s?s.hp:0,hp:0,t:0,cd:s?s.every:0,hit:0}}}
function loadLevel(n){
 const d=enemyForLevel(n);
 G.level=n;G.e=newEnemy(d);G.shots=[];G.blasts=[];
 G.banner={t:0,dur:2.2,big:G.endless?'WAVE '+(n-ENEMIES.length+1):'LEVEL '+(n+1),small:d.name};
 G.wipe=1}
function saveBest(){if(G.score>G.best){G.best=G.score;try{localStorage.setItem('carnage-best',G.best)}catch(e){}}}
function start(){
 Object.assign(G.p,{hp:C.PHP,buf:[],hurt:0,x:C.W/2,tx:C.W/2,guard:0,iframe:0,powers:{},face:1,dashT:0,dashCD:0,swing:0});
 G.phase='PLAYING';G.score=0;G.elapsed=0;G.paused=false;G.streak=0;G.streakT=0;
 G.endless=false;G.dodges=0;G.drops=[];G.dropT=5;G.shots=[];G.blasts=[];G.banner=null;G.wipe=0;
 G.super=0;G.superOn=false;G.superT=0;G.superHit=false;
 loadLevel(0)}
function startEndless(){
 Object.assign(G.p,{hp:C.PHP,buf:[],guard:1,iframe:1,powers:{},dashT:0,dashCD:0,swing:0});
 G.endless=true;G.phase='PLAYING';G.shots=[];G.blasts=[];
 G.super=0;G.superOn=false;G.superT=0;G.superHit=false;
 loadLevel(ENEMIES.length)}
// ---- super: fills as you land hits, then one huge crescent cutscene
const SUPER={dmg:C.SUP_DMG,dur:C.SUP_DUR,hit:C.SUP_HIT};
function useSuper(){
 if(G.phase!=='PLAYING'||G.superOn||G.super<1||!G.e)return false;
 G.super=0;G.superOn=true;G.superT=0;G.superHit=false;G.p.swing=C.SWING;
 emit('super_start');return true}
function superTick(dt){
 G.superT+=dt;
 G.p.swing=Math.max(0,G.p.swing-dt);
 if(!G.superHit&&G.superT>=SUPER.hit){
  G.superHit=true;const e=G.e;
  if(e){e.shield.on=false;e.shield.hp=0;e.hp=Math.max(0,e.hp-SUPER.dmg);
   e.hurt=.5;e.stun=2.4;e.atk=null;e.tel=false;
   G.score+=SUPER.dmg;chain();emit('super_hit',{x:e.x,dmg:SUPER.dmg})}}
 if(G.superT>=SUPER.dur){G.superOn=false;G.superT=0;if(G.e&&G.e.hp<=0)advance()}}
// ---- camera warm-up: a few seconds in front of the camera so you can see it read your hand
let warmT=0,warmSeen=0;
function startRun(){                     // space / tap: camera runs check the hand first
 if(src==='webcam'&&cam.ready){G.phase='WARMUP';warmT=0;warmSeen=0;rec.reset();G.fx.length=0;return}
 start()}
function endWarm(){start()}
function warmStep(dt,ev){
 if(G.phase!=='WARMUP')return;
 warmT+=dt;
 if(cam.frame&&cam.frame.left)warmSeen+=dt;
 // a swipe is you saying "yes, you can see me"; with no hand at all we start anyway so
 // nobody is stuck staring at a check screen
 if(ev.length||(warmSeen>0&&warmT>=C.WARM)||warmT>=C.WARM*2.5)endWarm()}
const baseDmg=(c,s,st)=>Math.max(1,Math.round((C.DMG[c]||8)*(s==='UP'?C.UP:1)*(1+st*C.STR)));
function detectCombo(){const r=G.p.buf.map(x=>x[0]);
 for(const k in C.COMBOS){const pat=k.split(',');
  if(r.length>=pat.length&&pat.every((c,i)=>r[r.length-pat.length+i]===c))return C.COMBOS[k]}return null}
function chain(){G.streak++;G.streakT=1.5}
// ---- enemy damage + shield phase
function shatter(){
 const e=G.e;e.shield.on=false;e.shield.cd=e.def.shield?e.def.shield.every:0;
 e.stun=1.7;e.atk=null;e.tel=false;G.score+=150;emit('shatter',{x:e.x})}
function beginShield(){const e=G.e,s=e.shield;
 s.on=true;s.hp=s.max;s.t=e.def.shield.dur;e.atk=null;e.tel=false;e.timer=0;emit('shield',{x:e.x})}
function damageEnemy(dmg){
 const e=G.e,s=e.shield;
 if(s.on){s.hp=Math.max(0,s.hp-dmg);s.hit=.2;if(s.hp<=0)shatter();return {dealt:dmg,shielded:true}}
 const stun=e.stun>0,d=stun?Math.round(dmg*1.8):dmg;
 e.hp=Math.max(0,e.hp-d);e.hurt=.25;
 return {dealt:d,shielded:false,stun}}
function damagePlayer(n,src){
 const p=G.p;if(p.iframe>0)return false;
 if(p.guard>0){p.guard--;p.iframe=.7;emit('guard',{x:p.x,src});return false}
 p.hp=Math.max(0,p.hp-n);p.hurt=.45;p.iframe=C.IFRAME;G.streak=0;G.streakT=0;
 emit('player_hurt',{damage:n,src,x:p.x});return true}
function resolve(ev){
 const p=G.p,e=G.e;
 // melee range: the glaive only bites when the two are close, so you have to close
 // the gap yourself or catch the enemy when it lunges in
 if(Math.abs(e.x-p.x)>C.REACH){p.swing=C.SWING;emit('whiff',{x:p.x});return}
 p.buf.push([ev.chord,ev.t]);
 p.buf=p.buf.filter(x=>ev.t-x[1]<=C.CWIN/1000).slice(-6);
 const cb=detectCombo(),pw=p.powers;
 let dmg,weak=false;
 if(cb){dmg=cb[1];p.buf=[]}
 else{
  weak=ev.chord===e.def.weak;
  dmg=baseDmg(ev.chord,ev.strum,ev.strength)*streakMult();
  if(pw.overdrive)dmg*=2;
  if(pw.fury)dmg*=1.4;
  if(weak)dmg*=2;
  if(e.shield.on&&weak)dmg*=3;              // weak chords shatter shields three times faster
  dmg=Math.max(1,Math.round(dmg))}
 const onBeat=beatPulse()>.55;
 p.swing=C.SWING;                            // the glaive swings on every chord
 const res=damageEnemy(dmg);
 G.score+=res.dealt+(onBeat?Math.round(res.dealt*.5):0);
 chain();
 emit('hit',{chord:ev.chord,strum:ev.strum,damage:res.dealt,weak,shielded:res.shielded,onBeat,x:e.x,strength:ev.strength});
 if(cb){G.score+=cb[1]*3;emit('combo',{name:cb[0],damage:cb[1],chord:ev.chord,x:e.x})}
 // the super meter fills with hits; crossing 1 announces that it is ready
 const wasFull=G.super;
 G.super=Math.min(1,(G.super||0)+(cb?.06:weak?.05:.03)+(res.shielded?.01:0));
 if(wasFull<1&&G.super>=1)emit('super_ready')}
// ---- enemy attack patterns
function startMove(){
 const e=G.e,m=e.def.moves&&e.def.moves.length?e.def.moves:['notes'];
 e.move=(e.move+1)%m.length;const kind=m[e.move];
 e.tel=true;
 if(kind==='notes')e.atk={kind,t:0,warn:.35,left:3+Math.min(3,Math.floor(G.level/2)),sp:.1};
 else if(kind==='wall')e.atk={kind,t:0,warn:.8,gap:ri(0,6),fired:false};
 else if(kind==='beam')e.atk={kind,t:0,warn:.85,x:G.p.x,fired:false};
 else if(kind==='slam')e.atk={kind,t:0,warn:.8,x:G.p.x,fired:false};
 else e.atk={kind:'spread',t:0,warn:.6,fired:false};
 emit('attack',{kind})}
function endAttack(){if(G.e){G.e.atk=null;G.e.tel=false}}
function fireAimed(){
 const e=G.e,p=G.p,ox=e.x+rr(-50,50),oy=C.EY+80;
 const dx=p.x-ox,dy=C.PY-oy,d=Math.hypot(dx,dy)||1,sp=480;
 G.shots.push({x:ox,y:oy,vx:dx/d*sp+rr(-70,70),vy:dy/d*sp,r:14,col:C.YEL,kind:'note'});
 playSfx('shoot',.3)}
function fireWall(a){
 const y=C.EY+120;
 for(let i=0;i<7;i++){if(i===a.gap)continue;
  G.shots.push({x:80+i*180,y,vx:0,vy:300,r:15,col:C.BLUE,kind:'wall'})}
 emit('wall',{x:80+a.gap*180,y});playSfx('shoot',.45)}
function fireSpread(){
 const e=G.e,ox=e.x,oy=C.EY+80;
 for(let i=0;i<9;i++){const ang=Math.PI/2+(i-4)*.16;
  G.shots.push({x:ox,y:oy,vx:Math.cos(ang)*420,vy:Math.sin(ang)*420,r:12,col:C.PURPLE,kind:'spread'})}
 playSfx('shoot',.5)}
function fireBeam(a){
 G.blasts.push({kind:'beam',x:a.x,t:0,dur:.4});
 if(Math.abs(G.p.x-a.x)<96)damagePlayer(Math.round(G.e.def.dmg*2.4),'beam');
 emit('beam',{x:a.x});playSfx('beam',.6)}
function fireSlam(a){
 G.blasts.push({kind:'slam',x:a.x,t:0,dur:.5});
 if(Math.abs(G.p.x-a.x)<170)damagePlayer(Math.round(G.e.def.dmg*3),'slam');
 emit('slam',{x:a.x});playSfx('slam',.7)}
function tickAttack(dt){
 const a=G.e.atk;if(!a)return;
 a.t+=dt;
 if(a.kind==='notes'){
  if(a.t>=a.warn){a.sp=Math.max(0,a.sp-dt);
   if(a.left>0&&a.sp<=0){a.left--;a.sp=.11;fireAimed()}
   if(a.left<=0)endAttack()}
  return}
 if(a.t<a.warn)return;
 if(!a.fired){a.fired=true;
  if(a.kind==='wall')fireWall(a);
  else if(a.kind==='spread')fireSpread();
  else if(a.kind==='beam')fireBeam(a);
  else fireSlam(a)}
 a.t2=(a.t2||0)+dt;
 if(a.t2>.45)endAttack()}
// ---- world ticks
function tickEnemy(dt){
 const e=G.e,p=G.p,spd=p.powers.slow?.45:1;
 e.age+=dt;e.hurt=Math.max(0,e.hurt-dt);e.stun=Math.max(0,e.stun-dt);e.shield.hit=Math.max(0,e.shield.hit-dt);
 // it stalks its own patch of ground and lunges in now and then; walking into its
 // reach is the other half of getting a hit in
 e.appr=Math.max(0,(e.appr||0)-dt);
 e.apprCd=(e.apprCd==null?C.APPR_CD*.6:e.apprCd)-dt;
 if(e.apprCd<=0&&e.appr<=0&&e.stun<=0){e.appr=C.APPR_T;e.apprCd=C.APPR_CD}
 if(e.appr>0)e.tx=clamp(p.x+(e.x<p.x?-1:1)*(C.NEAR_GAP+40),140,C.W-140);
 else e.tx=C.W/2+Math.sin(e.age*.55)*300;
 e.x+=(e.tx-e.x)*Math.min(1,dt*1.6);
 const s=e.shield;
 if(s.on){s.t-=dt*spd;
  if(s.t<=0){s.on=false;s.cd=e.def.shield.every;emit('shield_off',{x:e.x})}}
 else if(e.def.shield){s.cd-=dt*spd;if(s.cd<=0&&e.stun<=0&&!e.atk)beginShield()}
 if(e.stun>0)return;
 e.timer+=dt*spd;
 if(e.atk)tickAttack(dt*spd);
 else if(!s.on&&e.timer>=e.def.every){e.timer=0;startMove()}}
function tickShots(dt){
 const p=G.p,spd=p.powers.slow?.45:1;
 for(const s of G.shots){
  s.x+=s.vx*dt*spd;s.y+=s.vy*dt*spd;
  if(!s.dead&&p.iframe<=0){
   const dx=s.x-p.x,dy=s.y-C.PY;
   if(dx*dx+dy*dy<(s.r+20)*(s.r+20)){s.dead=true;s.hit=true;
    damagePlayer(Math.round(G.e.def.dmg*1.7)+(s.kind==='wall'?2:0),'shot')}}
  if(s.y>C.H+50||s.x<-70||s.x>C.W+70){
   if(!s.dead){G.dodges++;G.score+=6;if(G.dodges%3===0)emit('dodge',{x:s.x})}
   s.dead=true}}
 G.shots=G.shots.filter(s=>!s.dead)}
// ---- power-ups
function pickType(){const r=Math.random();
 return r<.34?'heal':r<.55?'overdrive':r<.72?'fury':r<.88?'guard':'slow'}
function spawnDrop(type,x,y=120){G.drops.push({type,x,y,vy:rr(90,150),t:0,hold:5,dead:false})}
function collect(d){
 const p=G.p,pw=POWERS[d.type];
 if(d.type==='heal')p.hp=Math.min(C.PHP,p.hp+140);
 else if(d.type==='guard')p.guard=Math.min(3,p.guard+2);
 else p.powers[d.type]=pw.dur;
 G.score+=50;emit('power',{type:d.type,name:pw.name,col:pw.col});playSfx('power',.7)}
function tickDrops(dt){
 const p=G.p;
 for(const d of G.drops){
  d.t+=dt;
  if(d.y<C.PY-30)d.y=Math.min(C.PY-30,d.y+d.vy*dt);else d.hold-=dt;
  if(Math.abs(d.x-p.x)<62&&Math.abs(d.y-(C.PY-30))<80){collect(d);d.dead=true}
  else if(d.hold<=0)d.dead=true}
 G.drops=G.drops.filter(d=>!d.dead)}
// ---- level flow
function advance(){
 const e=G.e;
 G.score+=250+50*G.level;
 G.p.hp=Math.min(C.PHP,G.p.hp+C.HEAL);
 emit('stage',{name:e.def.name,level:G.level});
 G.shots=[];
 if(!G.endless&&G.level>=ENEMIES.length-1){G.phase='WIN';G.drops=[];saveBest();emit('win');return}
 loadLevel(G.level+1);
 spawnDrop(pickType(),C.W/2,300)}
function update(dt,events){
 if(G.phase!=='PLAYING'||G.paused||!G.e)return;
 if(G.superOn){superTick(dt);return}          // the world holds still for the cutscene
 const p=G.p,e=G.e;
 G.elapsed+=dt;
 p.hurt=Math.max(0,p.hurt-dt);p.iframe=Math.max(0,p.iframe-dt);
 p.dashT=Math.max(0,p.dashT-dt);p.dashCD=Math.max(0,p.dashCD-dt);p.swing=Math.max(0,p.swing-dt);
 p.x+=(p.tx-p.x)*Math.min(1,dt*14);
 for(const k in p.powers){p.powers[k]-=dt;if(p.powers[k]<=0)delete p.powers[k]}
 if(G.streakT>0&&(G.streakT=Math.max(0,G.streakT-dt))===0)G.streak=0;
 events.forEach(resolve);
 tickEnemy(dt);tickShots(dt);
 G.dropT-=dt;if(G.dropT<=0){G.dropT=rr(5.5,8.5);spawnDrop(pickType(),rr(240,1040),120)}
 tickDrops(dt);
 G.blasts=G.blasts.filter(b=>(b.t+=dt)<b.dur);
 if(G.e.hp<=0)advance();
 else if(p.hp<=0){G.phase='LOSE';saveBest();emit('lose')}}
