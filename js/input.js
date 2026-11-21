"use strict";
// ============================================================ input sources (input/*.py)
let src='keyboard',kq=[],kbChord=CHORDS[0],swapHands=false;
const keys={};
// ---- touch input (phones / tablets): joystick axis, held strum, one-shot dash
const touch={mx:0,strum:null,dash:false,chord:CHORDS[0]};
const cam={ready:false,frame:null,fps:0,last:0,err:'',loading:false};
const V=document.getElementById('v');
function onHands(r){
 let L=null,R=null;
 (r.multiHandLandmarks||[]).forEach((lm,i)=>{
  // We feed the un-mirrored video, so MediaPipe's label is flipped vs. the real hand.
  let lab=r.multiHandedness[i].label==='Left'?'Right':'Left';
  if(swapHands)lab=lab==='Left'?'Right':'Left';
  const h=lm.map(p=>({x:1-p.x,y:p.y}));   // mirror x for the selfie view
  if(lab==='Left')L=h;else R=h});
 const t=now();if(cam.last){const d=t-cam.last;if(d>0)cam.fps=.9*cam.fps+.1/d}cam.last=t;
 cam.frame={t,left:L,right:R}}
async function initCam(){
 if(cam.loading||cam.ready)return;cam.loading=true;cam.err='';
 try{
  await loadHands();
  if(typeof Hands==='undefined')throw new Error('MediaPipe failed to load (offline?)');
  const s=await navigator.mediaDevices.getUserMedia({video:{width:C.CAM_W,height:C.CAM_H,facingMode:'user'},audio:false});
  V.srcObject=s;await V.play();
  const hands=new Hands({locateFile:f=>'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/'+f});
  hands.setOptions({maxNumHands:2,modelComplexity:0,minDetectionConfidence:.6,minTrackingConfidence:.5});
  hands.onResults(onHands);await hands.initialize();
  cam.ready=true;src='webcam';rec.reset();
  try{goFull()}catch(e){}                    // camera allowed: fill the screen, no mic asked
  (async function loop(){if(V.readyState>=2)try{await hands.send({image:V})}catch(e){}requestAnimationFrame(loop)})();
 }catch(e){cam.err=(e&&e.name==='NotAllowedError')?'permission denied':(e.message||'unavailable');src='keyboard'}
 cam.loading=false}
function swapInput(){
 if(src==='webcam'){src='keyboard'}
 else if(cam.ready){src='webcam';rec.reset()}
 else initCam()}
// MediaPipe is only fetched on desktop, and only when the camera is actually wanted,
// so a phone never downloads the hand-tracking bundle
function loadHands(){
 if(typeof Hands!=='undefined')return Promise.resolve();
 return new Promise((res,rej)=>{
  const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
  s.crossOrigin='anonymous';s.async=true;
  s.onload=()=>res();s.onerror=()=>rej(new Error('MediaPipe failed to load (offline?)'));
  (document.head||document.body).appendChild(s)})}
const emitKb=(d,strength=.8)=>kq.push({chord:kbChord,strum:d,strength,t:now()});
// the joystick only pushes the fighter left/right: it is a one-line arena
const stickDir=()=>Math.abs(touch.mx)>.16?Math.sign(touch.mx):0;
const moveDir=()=>((keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0))||stickDir();
// move the avatar: A/D or arrows in keyboard mode, or the left hand's x in camera mode.
// Shift dashes in either mode; the dash has a short wind window and its own cooldown.
function applyMove(dt){
 const tapDash=touch.dash;touch.dash=false;          // one tap = one dash
 if(G.phase!=='PLAYING'||G.paused||!G.e||dt<=0)return;
 const p=G.p,dash=keys.Shift||keys.ShiftLeft||keys.ShiftRight||tapDash;
 if(dash&&p.dashCD<=0){
  const d=moveDir();
  p.dashT=C.DASH_T;p.dashCD=C.DASH_CD;p.dashDir=d||p.face||1;
  p.iframe=Math.max(p.iframe,C.DASH_IF);
  emit('dash',{x:p.x,dir:p.dashDir});playSfx('slam',.16)}
 if(src==='keyboard'){
  const a=moveDir();
  if(a){p.face=a;p.tx=clamp(p.tx+a*C.PX_SPEED*dt,C.PX_MIN,C.PX_MAX)}
  if(p.dashT>0)p.tx=clamp(p.tx+p.dashDir*C.PX_SPEED*C.DASH_MULT*dt,C.PX_MIN,C.PX_MAX)}
 else if(cam.frame&&cam.frame.left){
  const hx=clamp((cam.frame.left[0].x-.16)/.68,0,1);
  const tgt=C.PX_MIN+(C.PX_MAX-C.PX_MIN)*hx;
  const dz=(C.PX_MAX-C.PX_MIN)*C.STEER_DZ;
  const diff=tgt-p.tx;
  if(Math.abs(diff)>dz){
   p.face=Math.sign(diff);
   const step=clamp(diff*Math.min(1,dt*C.STEER_LERP),-C.PX_SPEED*dt*1.4,C.PX_SPEED*dt*1.4);
   p.tx=clamp(p.tx+step,C.PX_MIN,C.PX_MAX)}
  if(p.dashT>0)p.tx=clamp(p.tx+p.dashDir*C.PX_SPEED*C.DASH_MULT*dt,C.PX_MIN,C.PX_MAX)}
}
// ---- on-screen controls: built once, only on touch devices. Nothing here is needed on a
// desktop, where the camera gestures and the keyboard stay exactly as they were.
let uiSuper=null,uiSuperLit=false,uiFight=false;
function syncTouchUi(){
 if(!MOBILE)return;
 // the pad only covers the screen once a fight is on, so the menu cards stay readable
 const fight=G.phase==='PLAYING'||G.phase==='WARMUP';
 if(fight!==uiFight){uiFight=fight;document.documentElement.classList.toggle('fight',fight)}
 if(!uiSuper)return;
 const lit=G.super>=1&&!G.superOn&&G.phase==='PLAYING';   // light it when the meter is full
 if(lit!==uiSuperLit){uiSuperLit=lit;uiSuper.classList.toggle('ready',lit)}}
function initTouch(){
 const stick=document.getElementById('stick'),knob=document.getElementById('knob');
 if(!stick||!knob)return;
 let sid=null;
 const setStick=e=>{
  const r=stick.getBoundingClientRect(),R=r.width/2||1;
  const dx=clamp((e.clientX-(r.left+R))/R,-1,1);
  touch.mx=Math.abs(dx)<.16?0:dx;
  knob.style.transform='translate('+(touch.mx*r.width*.26).toFixed(1)+'px,-50%)'};
 const release=()=>{sid=null;touch.mx=0;knob.style.transform='translate(0,-50%)';stick.classList.remove('on')};
 stick.addEventListener('pointerdown',e=>{
  sid=e.pointerId;try{stick.setPointerCapture(sid)}catch(err){}
  stick.classList.add('on');setStick(e);e.preventDefault()});
 stick.addEventListener('pointermove',e=>{if(e.pointerId===sid){setStick(e);e.preventDefault()}});
 stick.addEventListener('pointerup',release);
 stick.addEventListener('pointercancel',release);
 stick.addEventListener('pointerleave',e=>{if(e.pointerId===sid)release()});
 // attack buttons: press and hold to keep strumming at the song tempo
 const press=(id,down,up)=>{
  const el=document.getElementById(id);if(!el)return null;
  el.addEventListener('pointerdown',e=>{
   e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch(err){}
   el.classList.add('on');if(down)down()});
  const off=()=>{el.classList.remove('on');if(up)up()};
  el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);
  return el};
 press('b-down',()=>{touch.strum='DOWN'},()=>{if(touch.strum==='DOWN')touch.strum=null});
 press('b-up',()=>{touch.strum='UP'},()=>{if(touch.strum==='UP')touch.strum=null});
 press('b-dash',()=>{touch.dash=true});
 uiSuper=press('b-super',()=>{useSuper()});
 // chord row: E A D G C, the same five chords the 1-5 keys pick
 const pick=c=>{
  kbChord=c;touch.chord=c;
  for(const o of CHORDS){const b=document.getElementById('n-'+o);if(b)b.classList.toggle('on',o===c)}};
 for(const c of CHORDS){
  const el=document.getElementById('n-'+c);if(!el)continue;
  el.addEventListener('pointerdown',e=>{e.preventDefault();pick(c)})}
}
if(MOBILE){document.documentElement.classList.add('mobile');initTouch()}
