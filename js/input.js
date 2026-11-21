"use strict";
// ============================================================ input sources (input/*.py)
let src='keyboard',kq=[],kbChord=CHORDS[0],swapHands=false;
const keys={};
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
  if(typeof Hands==='undefined')throw new Error('MediaPipe failed to load (offline?)');
  const s=await navigator.mediaDevices.getUserMedia({video:{width:C.CAM_W,height:C.CAM_H,facingMode:'user'},audio:false});
  V.srcObject=s;await V.play();
  const hands=new Hands({locateFile:f=>'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/'+f});
  hands.setOptions({maxNumHands:2,modelComplexity:0,minDetectionConfidence:.6,minTrackingConfidence:.5});
  hands.onResults(onHands);await hands.initialize();
  cam.ready=true;src='webcam';rec.reset();
  (async function loop(){if(V.readyState>=2)try{await hands.send({image:V})}catch(e){}requestAnimationFrame(loop)})();
 }catch(e){cam.err=(e&&e.name==='NotAllowedError')?'permission denied':(e.message||'unavailable');src='keyboard'}
 cam.loading=false}
function swapInput(){
 if(src==='webcam'){src='keyboard'}
 else if(cam.ready){src='webcam';rec.reset()}
 else initCam()}
const emitKb=(d,strength=.8)=>kq.push({chord:kbChord,strum:d,strength,t:now()});
const moveDir=()=>(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0);
// move the avatar: A/D or arrows in keyboard mode, or the left hand's x in camera mode.
// Shift dashes in either mode; the dash has a short wind window and its own cooldown.
function applyMove(dt){
 if(G.phase!=='PLAYING'||G.paused||!G.e||dt<=0)return;
 const p=G.p,dash=keys.Shift||keys.ShiftLeft||keys.ShiftRight;
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
