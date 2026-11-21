"use strict";
// ============================================================ main loop (main.py)
let booted=false,nextStrum=0;
function boot(){initAudio();if(!booted){booted=true;voice.start()}}
// one chord key + a strum key: hold the strum key to keep playing at the song tempo
const STUMS={ArrowDown:'DOWN',ArrowUp:'UP',j:'DOWN',k:'UP',s:'DOWN',w:'UP'};
addEventListener('keydown',e=>{
 const k=e.key.length===1?e.key.toLowerCase():e.key;
 if(['F1','F2','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(k))e.preventDefault();
 keys[k]=true;
 boot();
 const st=STUMS[k];
 if(st&&src==='keyboard'){
  const t=performance.now();
  if(t>=nextStrum){emitKb(st,.85);nextStrum=t+C.STRUM_REPEAT*1000}
  return}
 if(e.repeat&&k!=='['&&k!==']')return;
 if(k==='Escape')G.phase='MENU';
 else if(k===' '&&G.phase==='MENU')startRun();
 else if(k===' '&&G.phase==='WARMUP')endWarm();
 else if(k===' '&&G.phase==='WIN')startEndless();
 else if(k==='r')start();
 else if(k==='q')useSuper();
 else if(k==='F1')dbg=!dbg;
 else if(k==='F2')swapInput();
 else if(k==='h')toggleHolo();
 else if(k==='p'){if(G.phase==='PLAYING')G.paused=!G.paused}
 else if(k==='m')toggleMute();
 else if(k==='x'){swapHands=!swapHands;rec.reset()}
 else if(k==='v'){voice.on?voice.stop():voice.start()}
 else if(k==='[')C.THR=Math.max(1,C.THR-.4);
 else if(k===']')C.THR=Math.min(9,C.THR+.4);
 else if(src==='keyboard'&&'12345'.includes(k)&&k.length===1)kbChord=CHORDS[+k-1]});
addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
cv.addEventListener('pointerdown',()=>{boot();
 if(G.phase==='MENU')startRun();else if(G.phase==='WARMUP')endWarm();
 else if(G.phase==='WIN')startEndless();
 else if(G.phase==='LOSE'&&MOBILE)start()});     // phones have no R key: tap to run it back
// ---- phones: first tap goes fullscreen and asks the OS for landscape; if the phone is
// still upright a rotate prompt covers the game until it is turned
function goLandscape(){
 try{const d=document.documentElement,f=d.requestFullscreen||d.webkitRequestFullscreen;
  if(f){const p=f.call(d);if(p&&p.catch)p.catch(()=>{})}}catch(e){}
 try{if(screen.orientation&&screen.orientation.lock){const p=screen.orientation.lock('landscape');if(p&&p.catch)p.catch(()=>{})}}catch(e){}}
function checkOrient(){
 if(!MOBILE)return;
 const o=document.getElementById('orient');if(!o)return;
 const portrait=innerHeight>innerWidth;
 o.style.display=portrait?'flex':'none';
 if(portrait){for(const k in keys)keys[k]=false;touch.mx=0;touch.strum=null}}
if(MOBILE){
 const gate=document.getElementById('gate');
 const enter=e=>{
  if(e&&e.preventDefault)e.preventDefault();
  boot();goLandscape();
  if(gate){gate.classList.add('gone');gate.style.display='none'}
  checkOrient()};
 if(gate)gate.addEventListener('pointerdown',enter);
 addEventListener('resize',checkOrient);
 addEventListener('orientationchange',()=>setTimeout(checkOrient,120));
 checkOrient()}
let last=performance.now(),fps=60;
function frame(tm){
 const dt=Math.min(.1,(tm-last)/1000);last=tm;if(dt>0)fps=.95*fps+.05/dt;
 let ev=[];const ts=timeScale(dt);
 if(src==='keyboard'){
  // held strum key keeps firing, so a chord rings like a strummed guitar instead of a tap
  // a held strum key - or a held touch button - keeps firing
  const held=Object.keys(STUMS).find(k=>keys[k])||(touch.strum||null);
  if(held&&tm>=nextStrum){emitKb(STUMS[held]||held,.8);nextStrum=tm+C.STRUM_REPEAT*1000}
  ev=kq;kq=[]}
 else if(cam.frame)ev=rec.process(cam.frame);
 if(rec.superAsk){rec.superAsk=false;useSuper()}   // both fists held = super
 if(MOBILE)syncTouchUi()                          // light the on-screen super button
 if(G.phase==='WARMUP'){warmStep(dt,ev);ev=[]}     // swipes here only start the run
 if(G.phase!=='WARMUP')applyMove(dt*ts);
 update(dt*ts,ev);handleFx(G.fx.splice(0));
 draw(dt,src==='webcam'&&cam.fps?cam.fps:fps);
 if(holoOn)drawHolo();
 requestAnimationFrame(frame)}
if(document.fonts&&document.fonts.load){document.fonts.load('64px Cinzel');document.fonts.load('700 64px Cinzel');document.fonts.load('64px Bangers')}
if(!MOBILE)initCam();       // phones play by touch: no webcam, no MediaPipe download
requestAnimationFrame(frame);
