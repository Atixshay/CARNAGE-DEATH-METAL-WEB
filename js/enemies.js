"use strict";
// ============================================================ enemy roster
// Add your own: push another object here. No other file needs to change.
//   name   shown on the HUD          hp     health
//   every  seconds between attacks   dmg    damage per hit
//   weak   chord that does 2x damage color  body colour
//   moves  attack rotation: 'notes' aimed notes | 'wall' note wall with one gap
//          'beam' telegraphed column | 'slam' ground pound | 'spread' fan of notes
//   shield {every, dur, hp} - periodic shield phase; weak chords do 3x to it
//   eyes (1|2)  horns  ears  fangs  skull   cosmetic options
//   img    file in assets/ (no extension) drawn as the enemy; h = height in px; aura = glow colour
//          leave img out to get the drawn cartoon body instead
const ENEMIES=[
 {name:'AMP GOBLIN',     hp:220, every:2.2,dmg:9, weak:'A',img:'goblin', h:430,aura:'#7cff3a',color:'#50c878',
  moves:['notes','slam']},
 {name:'SKULL SHREDDER', hp:380, every:2.0,dmg:11,weak:'E',img:'skull',  h:450,aura:'#ff2a2a',color:'#e8e2cc',
  moves:['notes','wall','slam'],shield:{every:9,dur:5,hp:110}},
 {name:'SHADOW DEMON',   hp:520, every:1.9,dmg:12,weak:'G',img:'demon',  h:500,aura:'#ff1a3a',color:'#8a3ad8',
  moves:['beam','notes','wall'],shield:{every:8,dur:5,hp:140}},
 {name:'DOOM DRUMMER',   hp:640, every:1.7,dmg:12,weak:'D',img:'drummer',h:390,aura:'#ffb03a',color:'#3a86ff',
  moves:['wall','spread','slam','beam'],shield:{every:7.5,dur:4.5,hp:160}},
 {name:'CARNAGE',        hp:1000,every:1.6,dmg:14,weak:'C',img:'carnage',h:500,aura:'#ff2030',color:'#de343a',
  moves:['notes','beam','spread','wall','slam'],shield:{every:6.5,dur:5,hp:190}}];
const ENDLESS_MOVES=['notes','wall','beam','spread','slam'];
// endless waves: level 6, 7, 8 ... forever, cycling art but scaling up
function endlessEnemy(n){
 const base=ENEMIES[(n-1)%ENEMIES.length],k=Math.pow(1.2,n-1);
 const moves=ENDLESS_MOVES.slice(0,Math.min(5,2+Math.floor(n/2)));
 return {name:base.name+' '+n,hp:Math.round(300*k),every:Math.max(.75,2.0*Math.pow(.965,n-1)),
  dmg:Math.round(12*Math.pow(1.07,n-1)),weak:CHORDS[n%CHORDS.length],
  img:base.img,h:base.h,aura:base.aura,color:base.color,
  moves:moves.slice(n%Math.max(1,moves.length)).concat(moves.slice(0,n%Math.max(1,moves.length))),
  shield:{every:Math.max(4,8-n*.3),dur:4.5,hp:Math.round(130*Math.pow(1.12,n-1))}}
}
