"use strict";
// ============================================================ config (config.py)
const C={W:1280,H:720,PREVIEW:.42,CAM_W:640,CAM_H:480,WARM:3.2,
 HOLD:2,EXT:.10,THR:1.5,COOL:110,REARM:.30,ARM_T:.04,SMOOTH:.5,PEAK_DECAY:.995,
 MAP:{FIST:'E',OPEN:'A',PEACE:'D',HORNS:'G',THUMB:'C'},
 FREQ:{E:[82.41,123.47,164.81,207.65,246.94,329.63],A:[110,164.81,220,277.18,329.63],
  D:[146.83,220,293.66,369.99],G:[98,123.47,146.83,196,246.94,392],C:[130.81,164.81,196,261.63,329.63]},
 PHP:520,HEAL:150,SUP_DMG:500,SUP_DUR:2.9,SUP_HIT:1.35,
 REACH:170,STANDOFF:330,NEAR_GAP:120,APPR_CD:4.5,APPR_T:1.9,DMG:{E:15,A:10,D:12,G:13,C:11},UP:.8,STR:.6,
 ETEL:.5,CWIN:2500,
 COMBOS:{'E,E,A':['POWER SLIDE',45],'D,D,G':['SONIC BOOM',50],'A,D,E':['THUNDER RIFF',60],'C,G,C':['HARMONY BLAST',40]},
 HSHAKE:12,CSHAKE:28,
 // ---- arena / player ----
 PX_MIN:170,PX_MAX:1110,PX_SPEED:780,PY:598,PR:30,IFRAME:.9,EY:296,ESH:.74,
 // ---- keyboard feel ----
 DASH_T:.16,DASH_MULT:2.7,DASH_CD:.75,DASH_IF:.2,STRUM_REPEAT:.16,SWING:.32,
 // ---- gesture feel ----
 STEER_LERP:7,STEER_DZ:.035,
 // ---- natural palette: bark, moss, clay, river, dusk ----
 INK:'#141a12',PAPER:'#f4edda',RED:'#b8452f',YEL:'#dfa63c',BLUE:'#4f9187',
 GREEN:'#82a75a',PURPLE:'#7d6b9e',ORANGE:'#c07a45',WHITE:'#fffdf5',
 WAKE:'jarvis',TITLE:'CARNAGE: DEATH METAL'};
const CHORDS=Object.values(C.MAP);
const ri=(a,b)=>Math.floor(Math.random()*(b-a+1))+a, rr=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const now=()=>performance.now()/1000;
