"use strict";
// ============================================================ gestures (gestures/*.py)
// Simple on purpose: the number of fingers you hold up on your left hand is the chord.
//   1 = E   2 = A   3 = D   4 = G   5 = C   (a closed hand keeps whatever you had)
// Any hand swiping up or down is the strum, so one hand in view is enough to fight.
const CHORD_BY_COUNT=['E','A','D','G','C'];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const handSize=h=>Math.max(.06,dist(h[0],h[9]));      // wrist -> middle knuckle
function fingers(h){
 const w=h[0],m=C.EXT*handSize(h);
 const ext=(t,p)=>dist(h[t],w)>dist(h[p],w)+m;
 return [dist(h[4],h[17])>dist(h[3],h[17])+m,ext(8,6),ext(12,10),ext(16,14),ext(20,18)]}
const countFingers=h=>h?fingers(h).filter(Boolean).length:0;
const chordFor=n=>n?CHORD_BY_COUNT[Math.min(5,n)-1]:null;
const classify=h=>h?(chordFor(countFingers(h))||'NONE'):'NONE';
const describe=h=>h?countFingers(h)+' finger'+(countFingers(h)===1?'':'s'):'no left hand';
// strum: wrist speed normalised by hand size, with a threshold that calibrates to your swing
class Strum{
 constructor(){this.reset()}
 reset(){this.ly=null;this.lt=null;this.v=0;this.nv=0;this.lf=-9;this.armed=true;this.armT=0;
  this.size=.22;this.peak=C.THR*1.4;this.thr=C.THR}
 update(h,t){
  if(!h){this.ly=this.lt=null;this.v*=.5;this.armT=0;this.peak=Math.max(C.THR*1.1,this.peak*C.PEAK_DECAY);return[null,0]}
  const size=handSize(h);this.size=.8*this.size+.2*size;
  const y=(h[0].y+h[9].y)/2;
  if(this.ly===null){this.ly=y;this.lt=t;return[null,0]}
  const dt=t-this.lt;if(dt<=0)return[null,0];
  const rv=((y-this.ly)/dt)/Math.max(.09,this.size);     // hand-heights per second
  this.ly=y;this.lt=t;this.nv=rv;
  this.v=C.SMOOTH*this.v+(1-C.SMOOTH)*rv;
  this.peak=Math.max(Math.abs(this.v),this.peak*C.PEAK_DECAY);
  this.thr=clamp(this.thr+(this.peak*.55-this.thr)*Math.min(1,dt*.6),C.THR*.5,C.THR*1.8);
  const thr=this.thr;
  if(Math.abs(this.v)<thr*C.REARM){this.armT+=dt;if(this.armT>=C.ARM_T)this.armed=true}else this.armT=0;
  if(!this.armed||t-this.lf<C.COOL/1000)return[null,0];
  const dir=this.v>thr?'DOWN':this.v<-thr?'UP':null;
  if(!dir)return[null,0];
  this.armed=false;this.lf=t;
  return[dir,Math.min(1,Math.abs(this.v)/(thr*2.4))]}}
const rec={strum:new Strum(),stable:'E',cand:'E',streak:0,count:0,fistT:0,fistDid:false,superAsk:false,lt:null,
 reset(){this.strum.reset();this.stable='E';this.cand='E';this.streak=0;this.count=0;
  this.fistT=0;this.fistDid=false;this.superAsk=false;this.lt=null},
 process(f){
  if(!f)return[];
  const dt=this.lt==null||f.t==null?0:Math.min(.2,Math.max(0,f.t-this.lt));this.lt=f.t;
  // both hands closed is the super: a fist pair is unambiguous, a one-hand count is not
  const crunch=!!(f.left&&f.right&&countFingers(f.left)===0&&countFingers(f.right)===0);
  this.fistT=crunch?this.fistT+dt:0;
  if(this.fistT>=.5){
   this.fistT=0;
   if(G.super>=1&&!G.superOn&&!this.fistDid){this.fistDid=true;this.superAsk=true}
  }else if(!crunch)this.fistDid=false;
  // chord: finger count, held steady for a couple of frames
  this.count=countFingers(f.left);
  const raw=chordFor(this.count);
  if(raw){
   if(raw===this.cand)this.streak++;else{this.cand=raw;this.streak=1}
   if(this.streak>=C.HOLD)this.stable=raw}
  // strum: right hand if we see it, otherwise the left one (swipe up or down)
  const hand=f.right||f.left;
  const [dir,str]=this.strum.update(hand,f.t);
  if(!dir)return[];
  return[{chord:this.stable,strum:dir,strength:str,t:f.t}]}};
