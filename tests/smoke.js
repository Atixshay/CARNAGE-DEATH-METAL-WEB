// Headless check: node tests/smoke.js   (stubs the browser, loads the real scripts in index.html order)
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
const ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:100}):()=>ctx,set:()=>true});
const el=()=>({getContext:()=>ctx,width:0,height:0,style:{},addEventListener(){},play(){}});
Object.assign(global,{document:{getElementById:el,createElement:el,fonts:{load(){}}},window:global,addEventListener(){},
 performance:{now:()=>Date.now()},requestAnimationFrame(){},Image:class{},AudioContext:undefined});
Object.defineProperty(global,'navigator',{value:{mediaDevices:{getUserMedia:async()=>{throw new Error('no cam')}}},configurable:true});
const order=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/src="(js\/[^"]+)"/g)].map(m=>m[1]);
let js=order.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
js+=';globalThis.T_={FX,timeScale,burst,CHORD_COL,G,ENEMIES,C,start,startEndless,update,baseDmg,classify,Strum,'+
 'renderChord,draw,handleFx,drawHolo,setDbg:v=>dbg=v,fxTick,loadLevel,spawnDrop,endlessEnemy,enemyForLevel,POWERS,'+
 'applyMove,keys,handSize,countFingers,chordFor,rec,effectsRef:()=>effects,'+
 'startRun,warmStep,cam,setSrc:v=>{src=v},useSuper};';
(0,eval)(js);
const {fxTick,FX,timeScale,burst,CHORD_COL,G,ENEMIES,C,start,startEndless,update,baseDmg,draw,handleFx,drawHolo,
 setDbg,classify,Strum,renderChord,loadLevel,spawnDrop,endlessEnemy,
 applyMove,keys,handSize,countFingers,chordFor,rec,effectsRef,
 startRun,warmStep,cam,setSrc,useSuper}=T_;
let ok=0,bad=0;const check=(l,c)=>{c?ok++:bad++;console.log(c?'  PASS':'  FAIL',l)};
const hit=(chord,t,strength=.5)=>({chord,strum:'DOWN',strength,t});

check('roster has 5 enemies',ENEMIES.length===5);
check('every enemy image exists in assets/',ENEMIES.every(e=>!e.img||fs.existsSync(path.join(root,'assets',e.img+'.webp'))));
check('every enemy has attack moves and a weak chord',ENEMIES.every(e=>e.moves&&e.moves.length&&C.FREQ[e.weak]));

start();const weak=G.e.def.weak;let hp0=G.e.hp;
update(.016,[hit(weak,1)]);const got=hp0-G.e.hp,plain=baseDmg(weak,'DOWN',.5);
check('weak chord does 2x its normal damage ('+got+' vs '+plain+')',got===plain*2);

start();update(.016,[hit('E',1)]);check('hit builds a streak',G.streak===1);
update(2,[]);check('streak decays after 1.5s',G.streak===0);

start();G.e.hp=1;update(.016,[hit('E',1)]);
check('killing an enemy advances to level 2',G.level===1&&G.e.hp===ENEMIES[1].hp&&G.score>=250&&G.phase==='PLAYING');
check('the level banner and stage effect fire',G.fx.some(f=>f.k==='stage')&&G.banner&&G.banner.big==='LEVEL 2');

start();G.p.iframe=1e9;let tt=0,i=0;                     // invulnerable: this test is about progression only
while(G.phase==='PLAYING'&&i++<6000){tt+=.05;update(.05,[hit(G.e.def.weak,tt,1)])}
check('campaign clears all 5 levels and reaches the boss win',G.phase==='WIN'&&G.level===4);

start();for(let j=0;j<4000&&G.phase==='PLAYING';j++)update(.1,[]);
check('idle player loses',G.phase==='LOSE');

// ---- enemy attack variety
const shotKinds=new Set(),blastKinds=new Set();
for(let lv=0;lv<ENEMIES.length;lv++){
 start();loadLevel(lv);G.p.iframe=1e9;G.e.timer=99;
 for(let j=0;j<70;j++){update(.05,[]);G.shots.forEach(s=>shotKinds.add(s.kind));G.blasts.forEach(b=>blastKinds.add(b.kind))}}
check('enemies fire dodgeable projectiles',shotKinds.size>0);
check('attack variety includes notes, walls and spreads',['note','wall','spread'].every(k=>shotKinds.has(k)));
check('beams and ground slams are telegraphed attacks',blastKinds.has('beam')&&blastKinds.has('slam'));

// ---- dodging
start();G.shots=[];const h1=G.p.hp;
G.shots.push({x:G.p.x,y:C.PY-40,vx:0,vy:400,r:14,col:'#fff',kind:'note'});
update(.05,[]);
check('a projectile that reaches the player deals damage',G.p.hp<h1);
start();G.shots=[];const h2=G.p.hp;
G.shots.push({x:G.p.x+320,y:C.PY-120,vx:0,vy:400,r:14,col:'#fff',kind:'note'});
for(let j=0;j<20;j++)update(.05,[]);
check('moving out of the way dodges it and scores',G.p.hp===h2&&G.dodges>0);

// ---- shield phase
start();loadLevel(1);G.e.shield.cd=0;update(.1,[]);
check('enemy raises a shield phase',G.e.shield.on===true&&G.e.shield.hp===G.e.shield.max);
const ehp=G.e.hp,shp=G.e.shield.hp;
update(.02,[hit('A',1)]);
check('the shield eats damage instead of the enemy',G.e.hp===ehp&&G.e.shield.hp<shp);
update(.02,[hit('E',1)]);
check('the weak chord shatters the shield and stuns the enemy',G.e.shield.on===false&&G.e.stun>0);

// ---- power-ups
start();G.drops=[];spawnDrop('overdrive',G.p.x,C.PY-30);update(.02,[]);
check('falling power-up is collected',G.p.powers.overdrive>0&&G.drops.length===0);
const eh2=G.e.hp;update(.016,[hit('D',1)]);            // 'D' is not this enemy's weak chord
check('overdrive doubles chord damage',eh2-G.e.hp===baseDmg('D','DOWN',.5)*2);
start();spawnDrop('guard',G.p.x,C.PY-30);update(.02,[]);
const gh=G.p.hp;update(.02,[]);G.shots.push({x:G.p.x,y:C.PY,vx:0,vy:0,r:14,col:'#fff',kind:'note'});update(.02,[]);
check('guard absorbs a hit',G.p.hp===gh&&G.p.guard<2);

// ---- endless mode
startEndless();
check('endless starts after the boss at wave 1',G.endless&&G.level===ENEMIES.length&&G.banner.big==='WAVE 1');
const e1=endlessEnemy(1),e2=endlessEnemy(2);
check('endless waves scale in hp, damage and shield',e2.hp>e1.hp&&e2.dmg>=e1.dmg&&e2.shield.hp>e1.shield.hp);
G.e.hp=1;update(.016,[hit('A',1)]);
check('endless advances to wave 2',G.level===ENEMIES.length+1&&G.banner.big==='WAVE 2');

// ---- rendering
try{
 for(let s=0;s<ENEMIES.length+2;s++){start();loadLevel(s);setDbg(s%2===0);G.e.tel=s%2===1;
  G.e.timer=99;update(.02,[]);
  for(let j=0;j<14;j++)update(.05,[]);
  G.p.guard=2;G.p.powers={slow:5};spawnDrop('heal',600,400);draw(.016,60)}
 cam.ready=true;cam.frame=null;G.phase='MENU';startRun();draw(.016,60);   // camera check page
 G.phase='MENU';draw(.016,60);G.phase='WIN';draw(.016,60);G.phase='LOSE';draw(.016,60);
 start();update(.016,[hit('E',1)]);handleFx(G.fx.splice(0));draw(.2,60);
 G.e.hp=1;update(.016,[hit('E',1)]);handleFx(G.fx.splice(0));draw(.1,60);
 G.p.hp=50;FX.glitch=.5;FX.aber=1;draw(.1,60);drawHolo();
 check('all enemies, shields, drops and screens render without errors',true)
}catch(e){console.log(e);check('render',false)}

start();G.p.iframe=1e9;G.e.shield.on=false;
const wordsBefore=effectsRef().length;
update(.016,[{chord:G.e.def.weak,strum:'DOWN',strength:.5,t:1}]);handleFx(G.fx.splice(0));
check('a weak-spot hit calls out WEAK SPOT',effectsRef().some(w=>w.text==='WEAK SPOT!'));
const afterWeak=effectsRef().length;
update(.016,[{chord:'E',strum:'DOWN',strength:.5,t:2}]);handleFx(G.fx.splice(0));
check('an ordinary hit shows no text, just visuals',effectsRef().length===afterWeak&&afterWeak>wordsBefore);

FX.slow=0;FX.freeze=.05;check('hit-stop freezes game time then releases',timeScale(.03)===0&&timeScale(.03)===0&&timeScale(.03)===1);
FX.slow=.2;check('slow-mo scales time',timeScale(.1)===.3);FX.slow=0;
burst(100,100,'#fff',30);check('particles spawn and expire',FX.parts.length>=30&&(()=>{for(let i=0;i<80;i++)fxTick(.05);return FX.parts.length===0})());
check('every chord has a colour',Object.keys(C.FREQ).every(c=>CHORD_COL[c]));
const handWith=(n,k=1)=>{
 const w={x:.5,y:.9};
 const h=Array.from({length:21},()=>({x:.5,y:.9}));
 h[0]=w;h[17]={x:.61,y:.62};
 for(let i=0;i<4;i++){
  const x=.4+i*.07,up=i<n-1;
  h[5+i*4]={x,y:.62};
  h[6+i*4]={x,y:up?.48:.7};
  h[7+i*4]={x,y:up?.45:.75};
  h[8+i*4]={x,y:up?.42:.8}}
 h[1]={x:.45,y:.75};h[2]={x:.42,y:.72};h[3]={x:.39,y:.69};
 h[4]=n>=1?{x:.3,y:.62}:{x:.46,y:.66};
 return h.map(p=>({x:w.x+(p.x-w.x)*k,y:w.y+(p.y-w.y)*k}))};
const LETTERS=['E','A','D','G','C'];
check('finger count picks the chord (1-5 = E A D G C)',LETTERS.every((c,i)=>classify(handWith(i+1))===c));
check('the finger count reads the same near or far',LETTERS.every((c,i)=>classify(handWith(i+1,1.9))===c&&classify(handWith(i+1,.55))===c));
check('a shaky finger does not flip the chord',(()=>{rec.reset();
 rec.process({t:0,left:handWith(3),right:null});rec.process({t:.05,left:handWith(3),right:null});
 const was=rec.stable;rec.process({t:.1,left:handWith(2),right:null});
 return was==='D'&&rec.stable==='D'})());
const swipeAt=(k,n=2)=>{const st=new Strum(),base=handWith(n,k);let out=null;
 for(let i=0;i<14;i++){const h=base.map(p=>({x:p.x,y:p.y+i*.03*k}));
  const r=st.update(h,i*.02);if(r[0])out=out||r[0]}return out};
check('a wrist swipe fires DOWN at any hand size',swipeAt(1.8)==='DOWN'&&swipeAt(.55)==='DOWN');
check('a swipe attacks with only the left hand in view',(()=>{rec.reset();let fired=null;
 for(let i=0;i<16;i++){const h=handWith(2).map(p=>({x:p.x,y:p.y+i*.03}));
  const ev=rec.process({t:i*.02,left:h,right:null});if(ev.length)fired=ev[0].chord}
 return !!fired})());
const w=renderChord(C.FREQ.E);check('chord synth intact',w.length===79380);

start();G.p.tx=600;G.p.dashCD=0;keys.d=true;keys.Shift=true;
const before=G.p.tx;applyMove(.016);const dashGain=G.p.tx-before;
check('shift dashes further than a normal step',dashGain>C.PX_SPEED*.016*2&&G.p.dashCD>0&&G.p.iframe>0);
const dt0=G.p.dashT;applyMove(.016);applyMove(.016);
check('the dash does not restart while it is on cooldown',G.p.dashT===dt0&&G.p.dashCD===C.DASH_CD);
for(let i=0;i<80;i++)update(.02,[]);
check('the dash is ready again after its cooldown',G.p.dashCD===0&&G.p.dashT===0);
keys.d=false;keys.Shift=false;
// ---- melee reach: close the gap or catch the enemy when it comes to you
start();G.e.x=G.p.x+420;G.e.tx=G.e.x;const farHp=G.e.hp;
update(.016,[hit('E',1)]);
check('a chord out of reach does not damage the enemy',G.e.hp===farHp&&G.streak===0);
start();G.e.x=G.p.x+90;G.e.tx=G.e.x;const nearHp=G.e.hp;
update(.016,[hit('E',1)]);
check('a chord inside reach does damage',G.e.hp<nearHp);
start();G.p.iframe=1e9;G.p.x=G.p.tx=900;G.e.x=120;G.e.tx=120;G.e.appr=1.5;G.e.apprCd=99;
for(let i=0;i<90;i++)update(.02,[]);
check('the enemy closes in on the player when it lunges',Math.abs(G.e.x-G.p.x)<C.REACH+40);

// ---- super attack: fill the meter, then one 500-damage cutscene
start();G.super=0;
for(let i=0;i<12;i++)update(.016,[hit('E',1+i*.1)]);
check('landing hits fills the super meter',G.super>0&&G.super<1);
G.super=.98;update(.016,[hit('E',99)]);
check('the meter fills up to full and stops there',G.super===1);
G.super=.4;check('the super will not fire before the meter is full',useSuper()===false);
G.super=1;G.e.hp=900;G.e.max=900;G.e.shield.on=true;
check('a full meter starts the cutscene and spends the meter',useSuper()===true&&G.superOn&&G.super===0);
update(.5,[]);check('the cutscene holds the fight until the hit lands',G.e.hp===900);
for(let i=0;i<10;i++)update(.1,[]);
check('the super lands 500 damage and wipes the shield',G.e.hp===400&&G.e.shield.on===false);
for(let i=0;i<20;i++)update(.1,[]);
check('the cutscene ends and play resumes',!G.superOn&&G.phase==='PLAYING');
rec.reset();G.super=1;
for(let i=0;i<8;i++)rec.process({t:i*.1,left:handWith(0),right:handWith(0)});
check('clenching both fists asks for the super on camera',rec.superAsk===true);
rec.superAsk=false;G.super=0;

// ---- camera warm-up: a camera run checks the hand before the fight
setSrc('keyboard');cam.ready=true;cam.frame=null;G.phase='MENU';startRun();
check('a desktop run opens the camera check page first',G.phase==='WARMUP');
warmStep(.05,[{chord:'D',strum:'DOWN',strength:.5,t:1}]);
check('a swipe begins the fight from the camera check page',G.phase==='PLAYING');
setSrc('webcam');G.phase='MENU';cam.frame=null;startRun();
check('a camera run opens the hand check first',G.phase==='WARMUP');
warmStep(.2,[]);check('the hand check waits while no hand is in view',G.phase==='WARMUP');
warmStep(.05,[{chord:'D',strum:'DOWN',strength:.5,t:1}]);
check('a swipe starts the fight from the hand check',G.phase==='PLAYING');
setSrc('webcam');G.phase='MENU';cam.frame=null;startRun();
warmStep(C.WARM-.1,[]);const stillWarm=G.phase;
cam.frame={t:1,left:handWith(2),right:null};warmStep(.2,[]);
check('with a hand in view the countdown starts the fight by itself',stillWarm==='WARMUP'&&G.phase==='PLAYING');
cam.frame=null;setSrc('keyboard');

console.log(`\n${ok} passed, ${bad} failed`);process.exit(bad?1:0)
