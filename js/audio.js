"use strict";
// ============================================================ audio (audio/sounds.py)
const SR=44100;let AC=null,MASTER=null,muted=false;
function toggleMute(){muted=!muted;if(MASTER)MASTER.gain.value=muted?0:1}
const SND={chords:{},sfx:{}};
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
function norm(m,k){let pk=0;for(let i=0;i<m.length;i++)pk=Math.max(pk,Math.abs(m[i]));pk=pk||1;for(let i=0;i<m.length;i++)m[i]=m[i]/pk*k}
function karplus(f,sec,dec){
 const n=SR*sec|0,per=Math.max(2,SR/f|0),r=rng(f*100|0),buf=new Float32Array(per),o=new Float32Array(n);
 for(let i=0;i<per;i++)buf[i]=r()*2-1;
 for(let i=0;i<n;i++){const a=i%per,b=(i+1)%per;o[i]=buf[a];buf[b]=dec*.5*(buf[a]+buf[b])}
 return o}
function renderChord(fr,sec=1.8){
 const n=SR*sec|0,m=new Float32Array(n);
 fr.forEach((f,i)=>{const t=karplus(f,sec,.998),off=SR*.008*i|0,g=.75**i;for(let j=off;j<n;j++)m[j]+=t[j-off]*g});
 norm(m,1);
 for(let i=0;i<n;i++)m[i]=Math.tanh(m[i]*3.2);                                   // amp distortion
 for(let i=0;i<n;i++){const x=m[i];m[i]=x+Math.tanh(x*2)*.18+Math.tanh(x*3)*.08} // harmonics
 for(let i=0;i<n;i++){const t=i/SR;m[i]*=(1-Math.exp(-t*90))*Math.exp(-t*.75)}   // pick attack + decay
 for(let i=1;i<n;i++)m[i]=m[i-1]*.15+m[i]*.85;                                   // cabinet roll-off
 norm(m,.9);return m}
function blip(f,sec,kind='sine'){
 const n=SR*sec|0,o=new Float32Array(n),r=rng(7);
 for(let i=0;i<n;i++){const t=i/SR;
  const w=kind==='noise'?r()*2-1:kind==='saw'?2*((t*f)%1)-1:kind==='square'?(Math.sin(2*Math.PI*f*t)>0?1:-1):Math.sin(2*Math.PI*f*t);
  o[i]=w*Math.exp(-6*t/sec)*.7}
 return o}
const cat=a=>{const o=new Float32Array(a.reduce((s,x)=>s+x.length,0));let k=0;a.forEach(x=>{o.set(x,k);k+=x.length});return o};
function drumLoop(bpm=110,bars=2){
 const beats=4*bars,bt=60/bpm,n=SR*beats*bt|0,m=new Float32Array(n);
 const add=(s,t,v)=>{const st=t*SR|0;for(let i=0;i<s.length&&st+i<n;i++)m[st+i]+=s[i]*v};
 const kick=blip(75,.16),snare=blip(180,.12,'noise'),hat=blip(7000,.045,'noise');
 for(let b=0;b<beats;b++){const t=b*bt;
  if(b%4===0||b%4===2)add(kick,t,.65);
  if(b%4===1||b%4===3)add(snare,t,.38);
  add(hat,t,.16);add(hat,t+bt*.5,.11)}
 norm(m,.32);return m}
const toBuf=a=>{const b=AC.createBuffer(1,a.length,SR);b.copyToChannel(a,0);return b};
function playBuf(b,vol=1,loop=false){
 const s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;s.loop=loop;g.gain.value=vol;
 s.connect(g).connect(MASTER);s.start();return s}
function initAudio(){
 if(AC){if(AC.state==='suspended')AC.resume();return}
 try{
  AC=new(window.AudioContext||window.webkitAudioContext)({sampleRate:SR});MASTER=AC.createGain();MASTER.gain.value=muted?0:1;MASTER.connect(AC.destination);
  for(const c in C.FREQ)SND.chords[c]=toBuf(renderChord(C.FREQ[c]));
  const S=SND.sfx;
  S.hurt=toBuf(blip(140,.25,'saw'));
  S.combo=toBuf(cat([440,660,880,1320].map(f=>blip(f,.12,'saw'))));
  S.win=toBuf(cat([523,659,784,1047].map(f=>blip(f,.18))));
  S.lose=toBuf(cat([330,262,196,147].map(f=>blip(f,.22,'saw'))));
  S.telegraph=toBuf(blip(90,.35,'noise'));
  S.shoot=toBuf(blip(760,.07,'square'));
  S.beam=toBuf(blip(120,.4,'saw'));
  S.slam=toBuf(blip(60,.38,'noise'));
  S.shield=toBuf(cat([220,330,440].map(f=>blip(f,.18,'sine'))));
  S.shatter=toBuf(blip(180,.3,'noise'));
  S.power=toBuf(cat([523,784,1047,1319].map(f=>blip(f,.1,'square'))));
  S.level=toBuf(cat([392,523,659,784,1047].map(f=>blip(f,.14))));
  S.ready=toBuf(cat([880,1174,1568].map(f=>blip(f,.11,'square'))));
  S.super=toBuf(cat([110,165,220,330,440,660,880].map(f=>blip(f,.17,'saw'))));
  playBuf(toBuf(drumLoop()),.25,true);
 }catch(e){console.warn('[audio] disabled:',e);AC=null}}
const playChord=(c,v=1)=>{if(AC&&SND.chords[c])playBuf(SND.chords[c],Math.max(.25,Math.min(1,v)))};
const playSfx=(k,v=1)=>{if(AC&&SND.sfx[k])playBuf(SND.sfx[k],v)};
