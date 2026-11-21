"use strict";
// ============================================================ voice / Jarvis (voice/*.py)
const PHRASES={start:['start','begin','play',"let's go",'lets go','rock'],restart:['restart','again','retry','reset','new game'],
 pause:['pause','hold on','wait','stop'],resume:['resume','continue','carry on'],
 status:['status','how am i doing','health','hp','score'],help:['help','how do i play','controls','explain','instructions'],
 debug:['debug','diagnostics','show data'],hologram:['hologram','holo','pyramid'],
 keyboard:['keyboard','manual mode','backup mode'],camera:['camera','webcam','hand mode','gesture mode'],
 quit:['quit','exit','shut down','close the game']};
const REPLIES={start:'Amps are hot. Go.',restart:'Resetting the stage.',pause:'Paused.',resume:'Back in.',
 help:'Left hand makes the chord shape. Fist for E, open palm for A, peace sign for D. Right hand strums up or down. Chain three chords for a combo.',
 debug:'Diagnostics on screen.',hologram:'Hologram window toggled.',keyboard:'Switching to keyboard control.',
 camera:'Switching to hand tracking.',quit:'Shutting down. Nice set.'};
function matchCommand(t){t=(t||'').toLowerCase().trim();if(!t)return null;
 let best=null,bl=0;for(const a in PHRASES)for(const p of PHRASES[a])if(t.includes(p)&&p.length>bl){best=a;bl=p.length}return best}
const say=t=>{if(voice.on&&window.speechSynthesis)speechSynthesis.speak(new SpeechSynthesisUtterance(t))};
const voice={on:false,rec:null,heard:'',
 start(){
  const SRc=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SRc||this.on)return;
  const r=this.rec=new SRc();r.continuous=true;r.interimResults=false;r.lang='en-US';
  r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){
   if(!e.results[i].isFinal)continue;
   let t=e.results[i][0].transcript.toLowerCase();this.heard=t;
   if(t.includes(C.WAKE))t=t.split(C.WAKE)[1].trim()||t;
   const a=matchCommand(t);if(a)voiceCmd(a)}};
  r.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed')this.on=false};
  r.onend=()=>{if(this.on)try{r.start()}catch(e){}};
  try{r.start();this.on=true;say('Jarvis online. Say jarvis start to begin.')}catch(e){this.on=false}},
 stop(){this.on=false;try{this.rec&&this.rec.stop()}catch(e){}}};
function voiceCmd(a){
 if(a==='start'&&G.phase!=='PLAYING')start();
 else if(a==='restart')start();
 else if(a==='status'){say(`You are on ${G.p.hp} health. Enemy on ${G.e?G.e.hp:0}. Score ${G.score}.`);return}
 else if(a==='debug')dbg=!dbg;
 else if(a==='keyboard'&&src!=='keyboard')swapInput();
 else if(a==='camera'&&src!=='webcam')swapInput();
 else if(a==='hologram')toggleHolo();
 else if(a==='pause')G.paused=true;
 else if(a==='resume')G.paused=false;
 else if(a==='quit')G.phase='MENU';
 if(REPLIES[a])say(REPLIES[a])}

