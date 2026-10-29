'use strict';
/* ============================================================
   MONSTER PARTY NIGHT — game engine
   Vanilla JS, no dependencies, works offline from file://
   ============================================================ */

/* ---------------- vocabulary ---------------- */
const V = {
  broom:    { name:'broom',    file:'broom.png',    fb:'Broom.jpg',            emoji:'🧹' },
  cat:      { name:'cat',      file:'cat.png',      fb:'Cat.jpg',              emoji:'🐈\u200d⬛' },
  ghost:    { name:'ghost',    file:'ghost.png',    fb:'Ghost.png',            emoji:'👻' },
  candy:    { name:'candy',    file:'candy.png',    fb:'Halloween Candy.jpg',  emoji:'🍬' },
  monster:  { name:'monster',  file:'monster.png',  fb:'Monster.png',          emoji:'👹' },
  pirate:   { name:'pirate',   file:'pirate.png',   fb:'Pirate.jpg',           emoji:'🏴\u200d☠️' },
  pumpkin:  { name:'pumpkin',  file:'pumpkin.png',  fb:'Pumpkin.png',          emoji:'🎃' },
  werewolf: { name:'werewolf', file:'werewolf.png', fb:'Werewolf.png',         emoji:'🐺' },
  witch:    { name:'witch',    file:'witch.png',    fb:'Witch.png',            emoji:'🧙' }
};
const ALL = Object.keys(V);

const HOUSES = [
  { n:1, game:'peekaboo', title:'Peek-a-Boo Door',  who:'ghost',    icon:'door', colour:'#9B59C9' },
  { n:2, game:'cauldron', title:"Witch's Cauldron", who:'witch',    icon:'potion', colour:'#7CC242' },
  { n:3, game:'count',    title:'Candy Count',      who:'pumpkin',  icon:'candy', colour:'#F5821F' },
  { n:4, game:'says',     title:'Monster Says',     who:'werewolf', icon:'paw', colour:'#3B82F6' },
  { n:5, game:'missing',  title:"Who's Missing?",   who:'cat',      icon:'party', colour:'#E23E57' }
];

const COLORS = [
  { id:'red',    shape:'●', num:1, hex:'#E23E57' },
  { id:'blue',   shape:'■', num:2, hex:'#3B82F6' },
  { id:'yellow', shape:'▲', num:3, hex:'#FFC93C' },
  { id:'green',  shape:'★', num:4, hex:'#7CC242' }
];

/* ---------------- tiny helpers ---------------- */
const $  = s => document.querySelector(s);
const stage = $('#stage');
const ribbonText = $('#ribbonText');
const ribbonEl = $('#ribbon');

function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function pickN(a,n){ return shuffle(a).slice(0,n); }
function setRibbon(html){ ribbonText.innerHTML = html; }
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

function imgTag(id, cls, extra){
  const v = V[id];
  return `<img class="${cls||''}" src="assets/${v.file}" data-fb="${v.fb}" data-emoji="${v.emoji}" alt="${v.name}" ${extra||''}>`;
}

/* image fallback chain: new asset → original image → emoji */
document.addEventListener('error', e => {
  const img = e.target;
  if(!img || img.tagName !== 'IMG' || !img.dataset.fb) return;
  const step = img.dataset.fbStep || '0';
  if(step === '0'){
    img.dataset.fbStep = '1';
    img.src = img.dataset.fb;
  } else if(step === '1'){
    const span = document.createElement('span');
    span.className = (img.className || '') + ' emoji-fallback';
    span.style.cssText = 'display:grid;place-items:center;width:100%;height:100%;font-size:min(11vh,9vw);line-height:1';
    span.textContent = img.dataset.emoji || '❓';
    img.replaceWith(span);
  }
}, true);

/* ---------------- audio (synthesised, no files) ---------------- */
let AC = null;
let muted = false;

function ac(){
  if(!AC){
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return null;
    AC = new Ctx();
  }
  if(AC.state === 'suspended') AC.resume();
  return AC;
}

function beep(f1, f2, dur, type, vol, delay){
  if(muted) return;
  const c = ac(); if(!c) return;
  const t0 = c.currentTime + (delay||0);
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(f1, t0);
  if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || .18, t0 + .012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + .05);
}

function noiseSweep(dur, f1, f2, vol, delay){
  if(muted) return;
  const c = ac(); if(!c) return;
  const t0 = c.currentTime + (delay||0);
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1 - i/len);
  const src = c.createBufferSource(); src.buffer = buf;
  const flt = c.createBiquadFilter(); flt.type = 'bandpass'; flt.Q.value = 1.2;
  flt.frequency.setValueAtTime(f1, t0);
  flt.frequency.exponentialRampToValueAtTime(Math.max(60,f2), t0+dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol || .2, t0);
  g.gain.exponentialRampToValueAtTime(.0001, t0+dur);
  src.connect(flt); flt.connect(g); g.connect(c.destination);
  src.start(t0);
}

const sfx = {
  pop(){ beep(420, 900, .12, 'square', .16); beep(700, 1200, .10, 'sine', .1, .03); },
  chime(){ [523,659,784,1047].forEach((f,i)=>beep(f, f, .32, 'sine', .14, i*.075)); },
  sparkle(){ [1200,1600,2000,2400].forEach((f,i)=>beep(f,f,.18,'triangle',.09,i*.05)); },
  wrong(){ beep(300, 140, .38, 'sawtooth', .13); beep(180, 110, .42, 'sine', .12, .08); },
  whoosh(){ noiseSweep(.45, 1800, 300, .18); },
  bubble(){ beep(180, 560, .30, 'sine', .16); beep(300, 800, .18, 'sine', .08, .06); },
  cackle(){ [0,.11,.22,.33].forEach((d,i)=>beep(700 - i*70, 520 - i*60, .13, 'triangle', .12, d)); },
  fanfare(){ const n=[523,523,523,659,784,1047]; n.forEach((f,i)=>beep(f,f,.30,'square',.10,i*.12)); beep(1319,1319,.7,'triangle',.12,.72); },
  drumroll(){ for(let i=0;i<14;i++) noiseSweep(.05, 900, 400, .07, i*.035); },
  boing(){ beep(160, 640, .35, 'sine', .16); beep(200, 900, .25, 'triangle', .07, .05); },
  thud(){ beep(120, 60, .25, 'sine', .2); }
};

/* ---------------- confetti / particles ---------------- */
const canvas = $('#fx');
const ctx = canvas.getContext('2d');
let parts = [];
let rafId = null;
let dpr = 1;

function sizeCanvas(){
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
sizeCanvas();
addEventListener('resize', sizeCanvas);

const PARTY_COLOURS = ['#FFC93C','#F5821F','#E23E57','#7CC242','#9B59C9','#3B82F6','#FFF7E8','#FFE9A8'];

function spawn(x, y, n, opts){
  opts = opts || {};
  for(let i=0;i<n;i++){
    const a = Math.random() * Math.PI * 2;
    const sp = (opts.speed || 8) * (0.35 + Math.random());
    parts.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - (opts.lift || 3),
      g: opts.gravity == null ? .28 : opts.gravity,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random()-.5) * .3,
      size: 5 + Math.random() * 9,
      colour: pick(PARTY_COLOURS),
      shape: Math.random() < .34 ? 'circle' : (Math.random() < .5 ? 'rect' : 'star'),
      life: 1,
      decay: .008 + Math.random() * .012
    });
  }
  if(!rafId) rafId = requestAnimationFrame(tick);
}

function confetti(x, y, n){
  x = x == null ? innerWidth/2 : x;
  y = y == null ? innerHeight*0.4 : y;
  spawn(x, y, n || 60, { speed: 12, lift: 4 });
  sfx.sparkle();
}

function rain(n){
  for(let i=0;i<(n||50);i++){
    parts.push({
      x: Math.random()*innerWidth, y: -20 - Math.random()*innerHeight*.5,
      vx: (Math.random()-.5)*2, vy: 2+Math.random()*3, g:.05,
      rot: Math.random()*6, vr:(Math.random()-.5)*.2,
      size: 6+Math.random()*8, colour: pick(PARTY_COLOURS),
      shape: Math.random()<.4?'circle':'rect', life:1, decay:.0035
    });
  }
  if(!rafId) rafId = requestAnimationFrame(tick);
}

function firework(x, y){
  spawn(x, y, 70, { speed: 14, lift: 0, gravity: .12 });
  beep(900, 300, .3, 'triangle', .1, 0);
  noiseSweep(.35, 2400, 600, .12);
}

function tick(){
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for(let i=parts.length-1;i>=0;i--){
    const p = parts[i];
    p.vy += p.g;
    p.x += p.vx; p.y += p.vy;
    p.rot += p.vr;
    p.vx *= .995;
    p.life -= p.decay;
    if(p.life <= 0 || p.y > innerHeight + 60){ parts.splice(i,1); continue; }
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.colour;
    if(p.shape === 'circle'){
      ctx.beginPath(); ctx.arc(0,0,p.size*.5,0,Math.PI*2); ctx.fill();
    } else if(p.shape === 'rect'){
      ctx.fillRect(-p.size*.5, -p.size*.28, p.size, p.size*.56);
    } else {
      star(0,0,p.size*.6,p.size*.28,5); ctx.fill();
    }
    ctx.restore();
  }
  if(parts.length) rafId = requestAnimationFrame(tick);
  else { rafId = null; ctx.clearRect(0,0,innerWidth,innerHeight); }
}

function star(cx, cy, outer, inner, pts){
  ctx.beginPath();
  for(let i=0;i<pts*2;i++){
    const r = i%2 ? inner : outer;
    const a = (i/(pts*2)) * Math.PI*2 - Math.PI/2;
    const x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r;
    i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  }
  ctx.closePath();
}

/* ---------------- state ---------------- */
const KEY = 'monster-party-night-v1';
const DEFAULT_STATE = { done:{}, candy:0, muted:false, name:'' };
let state = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return { ...DEFAULT_STATE, done:{} };
    const s = JSON.parse(raw);
    return { done: s.done || {}, candy: s.candy || 0, muted: !!s.muted, name: s.name || '' };
  }catch(e){ return { ...DEFAULT_STATE, done:{} }; }
}
function saveState(){
  try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){}
}

function setJar(){
  const total = 26;
  const pct = Math.min(100, (state.candy/total)*100);
  $('#jarFill').style.height = pct + '%';
  $('#jarCount').textContent = state.candy;
}
function addCandy(n){
  state.candy += (n||1);
  saveState();
  setJar();
  const jar = $('#jar');
  jar.classList.remove('bump');
  void jar.offsetWidth;
  jar.classList.add('bump');
}

/* ---------------- stars in the sky ---------------- */
(function makeStars(){
  const box = $('#stars');
  let html = '';
  for(let i=0;i<70;i++){
    const s = (Math.random()*2.4+1.2).toFixed(1);
    html += `<i class="star" style="left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*70).toFixed(1)}%;width:${s}px;height:${s}px;animation-delay:${(Math.random()*3.4).toFixed(1)}s"></i>`;
  }
  box.innerHTML = html;
})();

/* ---------------- screen plumbing ---------------- */
let keyMap = {};
let currentScreen = 'title';

function mount(html, cls){
  const old = document.getElementById('congaBar');
  if(old && cls !== 'says') old.remove();
  stage.innerHTML = `<div class="screen is-active ${cls||''}">${html}</div>`;
  return stage.firstElementChild;
}

function onKeys(map){ keyMap = map || {}; }

function goTitle(){ currentScreen='title'; setScene(''); renderTitle(); }
function goMap(){ currentScreen='map'; setScene('street'); renderMap(); }

/* swap the illustrated backdrop (missing files simply fall back to the CSS sky) */
function setScene(kind){
  const el = document.getElementById('sceneBg');
  if(!el) return;
  el.className = kind ? 'bg-' + kind : '';
}

/* ---------------- title ---------------- */
function renderTitle(){
  document.body.classList.add('title-mode');
  const letters = 'HALLOWEEN'.split('').map((c,i)=>`<span style="animation-delay:${(i*0.11).toFixed(2)}s">${c}</span>`).join('');
  const monsters = ['ghost','witch','pumpkin','monster','cat'].map((id,i)=>
    imgTag(id,'','style="animation-delay:' + (i*0.18).toFixed(2) + 's"')).join('');

  mount(`
    <div class="title-wrap">
      <div class="title-monsters">${monsters}</div>
      <div class="title-halloween">${letters}</div>
      <div class="title-sub">Monster Party Night</div>
      <button class="big-play" id="playBtn">PLAY ▶</button>
      <div class="title-note">Press PLAY, then pick a house on Spooky Street</div>
    </div>
  `);

  $('#playBtn').addEventListener('click', ()=>{
    ac(); sfx.chime(); rain(30);
    setTimeout(goMap, 220);
  });
  onKeys({ ' ':{ el:'#playBtn' }, 'enter':{ el:'#playBtn' } });
  setRibbon('Say: <b>Knock knock!</b> — the monsters are having a party. Let\'s help them get there!');
}

/* ---------------- map ---------------- */
function isUnlocked(n){
  if(n === 1) return true;
  return !!state.done[n-1];
}
function nextHouse(){
  for(let i=1;i<=5;i++) if(!state.done[i]) return i;
  return null;
}

function renderMap(){
  document.body.classList.remove('title-mode');
  const nh = nextHouse();
  const houses = HOUSES.map(h=>{
    const unlocked = isUnlocked(h.n);
    const done = !!state.done[h.n];
    const cls = ['house'];
    if(!unlocked) cls.push('locked');
    if(done) cls.push('done');
    if(nh === h.n) cls.push('next');
    const inner = done
      ? imgTag(h.who, '', 'style="width:112%;height:112%;object-fit:contain"')
      : (unlocked ? `<svg style="width:5vh;height:5vh;color:#3B1A00"><use href="#i-${h.icon}"/></svg>` : '<svg style="width:4.4vh;height:4.4vh;color:#9C8FAB"><use href="#i-lock-big"/></svg>');
    return `
      <button class="${cls.join(' ')}" data-house="${h.n}" ${unlocked?'':'disabled'} style="--hc:${h.colour}">
        <span class="num">${h.n}</span>
        <span class="roof"></span>
        <span class="body"><span class="win">${inner}</span></span>
        <span class="label">${unlocked ? h.title : 'Locked'}</span>
      </button>`;
  }).join('');

  const doneCount = Object.keys(state.done).length;

  mount(`
    <div class="map-wrap">
      <div class="map-head">
        <span class="map-title">Spooky Street</span>
        <span class="ghost-btn" id="resetBtn" style="font-size:1.7vh">↺ New class</span>
      </div>
      <div class="street">${houses}</div>
      <div class="street-ground"></div>
      <div class="map-foot">${doneCount}/5 houses ready ${doneCount===5?'— the party is waiting! 🎉':''}</div>
    </div>
  `);

  stage.querySelectorAll('.house').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const n = +btn.dataset.house;
      if(!isUnlocked(n)) return;
      sfx.pop();
      goHouse(n);
    });
  });
  $('#resetBtn').addEventListener('click', resetClass);

  const nhBtn = stage.querySelector('.house.next');
  onKeys({ ' ': { el: nhBtn }, enter: { el: nhBtn }, space: { el: nhBtn } });
  setRibbon('Say: <b>Which house?</b> Shout the number — 1, 2, 3, 4 or 5!');
}

function resetClass(){
  sfx.thud();
  if(!confirm('Start again for a new class?\n\nThis clears the houses and the candy jar.')) return;
  state = { ...DEFAULT_STATE, done:{}, candy:0, muted:state.muted, name:state.name };
  saveState(); setJar(); renderMap();
  setRibbon('Fresh start! The street is dark again — time to light it up.');
}

/* ---------------- house dispatch ---------------- */
function goHouse(n){
  const h = HOUSES.find(x=>x.n===n);
  currentHouse = h;
  if(h.game === 'peekaboo') startPeekaboo();
  else if(h.game === 'cauldron') startCauldron();
  else if(h.game === 'count') startCount();
  else if(h.game === 'says') startSays();
  else if(h.game === 'missing') startMissing();
}
let currentHouse = null;

/* ---------------- shared game bits ---------------- */
function header(total, idx){
  let dots = '';
  for(let i=0;i<total;i++){
    dots += `<i class="round-dot ${i<idx?'done':''} ${i===idx?'on':''}"></i>`;
  }
  return `<div class="game-head"><div class="round-dots">${dots}</div><span class="count">${idx+1} / ${total}</span></div>`;
}

function colorFor(i){ return COLORS[i % 4]; }

function optionCard(id, i, handler){
  const c = colorFor(i);
  const b = document.createElement('button');
  b.className = 'opt ' + c.id;
  b.dataset.id = id;
  b.innerHTML = `
    <span class="badge">${c.shape}</span>
    ${imgTag(id, '', '')}
    <span class="num">${c.num}</span>`;
  b.addEventListener('click', ()=> handler(id, b, c));
  return b;
}

function buildOptions(container, ids, onPick){
  container.className = 'options ' + (ids.length === 4 ? 'four' : 'three');
  container.innerHTML = '';
  const colours = shuffle(COLORS).slice(0, ids.length);
  ids.forEach((id, i)=>{
    const c = colours[i];
    const b = document.createElement('button');
    b.className = 'opt ' + c.id;
    b.dataset.id = id;
    b.dataset.num = c.num;
    b.setAttribute('aria-label', `${c.id} ${c.shape} ${c.num} — ${V[id].name}`);
    b.innerHTML = `<span class="badge">${c.shape}</span>${imgTag(id,'','')}<span class="num">${c.num}</span>`;
    b.addEventListener('click', ()=> onPick(id, b, c));
    container.appendChild(b);
  });
  return colours;
}

/* keyboard shortcut: press the colour's number (shown on the card badge) */
function answerKeys(){
  return { 1:()=>clickNum(1), 2:()=>clickNum(2), 3:()=>clickNum(3), 4:()=>clickNum(4) };
}
function clickNum(n){
  const el = stage.querySelector(`.opt[data-num="${n}"]`);
  if(el) el.click();
}

/* reward screen after a house */
function showReward(house){
  currentScreen = 'reward';
  sfx.fanfare();
  rain(70);
  setTimeout(()=>confetti(innerWidth*.3, innerHeight*.35, 60), 120);
  setTimeout(()=>confetti(innerWidth*.7, innerHeight*.3, 60), 320);

  mount(`
    <div class="reward">
      <div class="reward-badge"><svg><use href="#i-party"/></svg></div>
      <div class="reward-title">House ${house.n} Ready!</div>
      <div class="reward-monster">${imgTag(house.who,'','')}</div>
      <div class="reward-sub">The <b>${V[house.who].name}</b> is on the way to the party!</div>
      <div class="reward-candy">🍬 ${state.candy} candies in the jar</div>
      <button class="big-play" id="nextBtn" style="font-size:4vh;padding:1.6vh 4vw">NEXT ▶</button>
    </div>
  `);

  $('#nextBtn').addEventListener('click', ()=>{
    sfx.pop();
    if(house.n >= 5) goFinale();
    else goMap();
  });
  onKeys({ ' ':{el:'#nextBtn'}, enter:{el:'#nextBtn'} });
  setRibbon(`Say: <b>Well done!</b> Give me a big clap! The ${V[house.who].name} is coming to the party.`);
}

function completeHouse(){
  if(!state.done[currentHouse.n]){
    state.done[currentHouse.n] = true;
    saveState();
  }
  setTimeout(()=>showReward(currentHouse), 500);
}

/* ============================================================
   GAME 1 — PEEK-A-BOO DOOR
   ============================================================ */
function startPeekaboo(){
  currentScreen = 'peekaboo'; setScene('house');
  const total = 6;
  let idx = 0;
  const bag = shuffle(ALL);
  let bagPos = 0;
  const rounds = [
    { mode:'open',   opts:3 },
    { mode:'open',   opts:3 },
    { mode:'open',   opts:4 },
    { mode:'shadow', opts:4 },
    { mode:'shadow', opts:4 },
    { mode:'open',   opts:4 }
  ];

  function nextTarget(){
    if(bagPos >= bag.length){
      bagPos = 0;
      const fresh = shuffle(bag);
      bag.length = 0; bag.push(...fresh);
    }
    return bag[bagPos++];
  }

  function round(){
    const r = rounds[idx];
    const target = nextTarget();
    const others = pickN(ALL.filter(x=>x!==target), r.opts - 1);
    const ids = shuffle([target, ...others]);
    const shadow = r.mode === 'shadow';

    const screen = mount(`
      ${header(total, idx)}
      <div class="clue-wrap"><div class="clue">${imgTag(target,'','')}</div>
        <div class="clue-cap">a spooky shadow…</div></div>
      <div class="game">
        <div class="door-scene">
          <div class="door-frame" id="doorFrame">
            <div class="peeker" id="peeker">${imgTag(target,'','')}</div>
            <div class="door-eyes"><i></i><i></i></div>
            <div class="door"></div>
          </div>
        </div>
        <div class="options" id="opts"></div>
      </div>
    `, 'peek');

    const frame = screen.querySelector('#doorFrame');
    const peeker = screen.querySelector('#peeker');
    const opts = screen.querySelector('#opts');

    buildOptions(opts, ids, (id, btn, c)=>{
      if(btn.dataset.locked) return;
      if(id === target){
        btn.classList.add('good');
        opts.querySelectorAll('.opt').forEach(o=>{ if(o!==btn) o.classList.add('dim'); o.dataset.locked='1'; });
        sfx.chime();
        const r0 = btn.getBoundingClientRect();
        confetti(r0.left + r0.width/2, r0.top + r0.height/2, 40);
        peeker.classList.add('show');
        frame.classList.add('open');
        setTimeout(()=>sfx.boing(), 260);
        setTimeout(()=>{
          const nameEl = document.createElement('div');
          nameEl.className = 'name-burst';
          nameEl.textContent = V[target].name.toUpperCase();
          screen.querySelector('.door-scene').appendChild(nameEl);
          confetti(innerWidth/2, innerHeight*.42, 45);
        }, 480);
        addCandy(1);
        setTimeout(()=>{
          idx++;
          if(idx >= total) completeHouse();
          else round();
        }, 2200);
      } else {
        btn.classList.add('bad');
        sfx.wrong();
        setTimeout(()=>btn.classList.remove('bad'), 500);
      }
    });

    onKeys({
      ...answerKeys(),
      r:()=>{ if(!frame.classList.contains('open')) sfx.bubble(); }
    });

    setRibbon(shadow
      ? 'Say: <b>Look at the shadow!</b> Who is it? Shout the colour — red, blue, yellow or green!'
      : 'Say: <b>Who is hiding?</b> Look at the shadow above the door! Shout the colour — red, blue, yellow or green!');
  }

  round();
}

/* ============================================================
   GAME 2 — WITCH'S CAULDRON
   ============================================================ */
function startCauldron(){
  currentScreen = 'cauldron'; setScene('house');
  const total = 5;
  let idx = 0;
  const bag = shuffle(ALL);
  let bagPos = 0;

  function nextTarget(){
    if(bagPos >= bag.length){
      bagPos = 0;
      const fresh = shuffle(bag);
      bag.length = 0; bag.push(...fresh);
    }
    return bag[bagPos++];
  }

  function round(){
    const isLike = idx === total - 1;
    const target = nextTarget();
    const disliked = pick(ALL.filter(x=>x!==target));
    const others = pickN(ALL.filter(x=>x!==target && x!==disliked), 3);
    const ids = shuffle(isLike ? [target, disliked, ...others.slice(0,2)] : [target, ...others]);

    const screen = mount(`
      ${header(total, idx)}
      <div class="game">
        <div class="cauldron-scene">
          <div class="witch-side">
            <div class="want-bubble" id="wantBubble">
              ${imgTag(target,'','')}
              ${isLike ? '<span class="like-tag">❤</span>' : ''}
            </div>
            <div class="witch-img-wrap">${imgTag('witch','','')}</div>
          </div>
          <div class="cauldron-side" id="cauldronSide">
            <div class="cauldron-holder" id="cauldronHolder">
              <img class="cauldron-img" src="assets/cauldron.png" data-fb="" alt="cauldron"
                   onerror="this.remove()">
              <div class="cauldron-fallback"></div>
            </div>
          </div>
        </div>
        <div class="options" id="opts"></div>
      </div>
    `, 'cauldron');

    const opts = screen.querySelector('#opts');
    const holder = screen.querySelector('#cauldronHolder');

    buildOptions(opts, ids, (id, btn, c)=>{
      if(btn.dataset.locked) return;
      if(id === target){
        btn.dataset.locked = '1';
        btn.classList.add('good');
        opts.querySelectorAll('.opt').forEach(o=>{ if(o!==btn) o.classList.add('dim'); o.dataset.locked='1'; });

        const img = btn.querySelector('img');
        if(img) flyTo(img, holder);
        sfx.whoosh();
        setTimeout(()=>{
          sfx.bubble();
          for(let i=0;i<5;i++){
            const s = document.createElement('div');
            s.className = 'smoke puff';
            s.innerHTML = '<svg style="width:3.4vh;height:3.4vh;color:#C7FF8F"><use href="#i-bubble"/></svg>';
            s.style.left = (35 + Math.random()*30) + '%';
            s.style.animationDelay = (i*0.09)+'s';
            holder.appendChild(s);
          }
          confetti(holder.getBoundingClientRect().left + 40, holder.getBoundingClientRect().top, 35);
        }, 640);
        addCandy(1);
        setTimeout(()=>{ sfx.cackle(); }, 720);
        setTimeout(()=>{
          idx++;
          if(idx >= total) completeHouse();
          else round();
        }, 1900);
      } else {
        btn.classList.add('bad');
        sfx.wrong();
        setTimeout(()=>btn.classList.remove('bad'), 520);
      }
    });

    onKeys(answerKeys());

    setRibbon(isLike
      ? 'Say: <b>The witch LOVES this one!</b> (the heart) She does NOT like the other one. Which one does she want?'
      : 'Say: <b>What does the witch want?</b> Shout the colour — red, blue, yellow or green!');
  }

  round();
}

function flyTo(imgEl, targetEl){
  const a = imgEl.getBoundingClientRect();
  const b = targetEl.getBoundingClientRect();
  const f = document.createElement('img');
  f.src = imgEl.src;
  f.className = 'flyer';
  f.style.left = a.left + 'px';
  f.style.top  = a.top + 'px';
  f.style.width = a.width + 'px';
  f.style.height = a.height + 'px';
  document.body.appendChild(f);
  requestAnimationFrame(()=>{
    f.style.left = (b.left + b.width*0.3) + 'px';
    f.style.top  = (b.top + b.height*0.1) + 'px';
    f.style.width = '6vh';
    f.style.height = '6vh';
    f.style.opacity = '0.2';
    f.style.transform = 'rotate(220deg) scale(.4)';
  });
  setTimeout(()=>f.remove(), 800);
}

/* ============================================================
   GAME 3 — CANDY COUNT
   ============================================================ */
function startCount(){
  currentScreen = 'count'; setScene('house');
  const rounds = [3, 5, 6, 8, 10];
  const total = rounds.length;
  let idx = 0;

  function round(){
    const n = rounds[idx];
    const wrongs = new Set();
    while(wrongs.size < 3){
      let w = Math.max(1, Math.min(10, n + pick([-2,-1,1,2,3,-3])));
      if(w !== n) wrongs.add(w);
    }
    const nums = shuffle([n, ...wrongs]);

    const cells = Array.from({length:10}, (_,i)=>
      `<div class="cell ${i<n?'filled':''}">${i<n?'<svg><use href="#i-candy"/></svg>':''}</div>`).join('');

    const screen = mount(`
      ${header(total, idx)}
      <div class="game">
        <div class="count-scene">
          <div class="bucket-wrap">
            <img class="bucket-img" src="assets/candy-bucket.png" data-fb="" alt=""
                 onerror="this.remove()">
            <div class="tenframe">${cells}</div>
          </div>
        </div>
        <div class="options four" id="opts"></div>
      </div>
    `, 'count');

    const opts = screen.querySelector('#opts');
    const colours = shuffle(COLORS);
    nums.forEach((num, i)=>{
      const c = colours[i];
      const b = document.createElement('button');
      b.className = 'opt numcard ' + c.id;
      b.dataset.v = num;
      b.dataset.num = c.num;
      b.innerHTML = `
        <span class="badge">${c.shape}</span>
        <span class="big-num">${num}</span>
        <span class="dots">${'●'.repeat(num)}</span>
        <span class="num">${c.num}</span>`;
      b.addEventListener('click', ()=>{
        if(b.dataset.locked) return;
        if(num === n){
          b.dataset.locked='1';
          b.classList.add('good');
          opts.querySelectorAll('.opt').forEach(o=>{ if(o!==b){ o.classList.add('dim'); o.dataset.locked='1'; } });
          sfx.chime();
          const r = b.getBoundingClientRect();
          confetti(r.left+r.width/2, r.top+r.height/2, 30);
          addCandy(1);
          rain(14);
          setTimeout(()=>{
            idx++;
            if(idx >= total) completeHouse();
            else round();
          }, 1500);
        } else {
          b.classList.add('bad');
          sfx.wrong();
          setTimeout(()=>b.classList.remove('bad'), 520);
        }
      });
      opts.appendChild(b);
    });

    onKeys(answerKeys());
    setRibbon('Say: <b>How many candies?</b> Let\'s count together! Then shout the colour of the right number.');
  }
  round();
}

/* ============================================================
   GAME 4 — MONSTER SAYS
   ============================================================ */
function startSays(){
  currentScreen = 'says'; setScene('street');
  const conga = [];
  const rounds = [
    { type:'find', target:'pumpkin' },
    { type:'do',   text:'Howl like a werewolf!',      sound:'🐺' },
    { type:'find', target:'ghost' },
    { type:'do',   text:'Touch your nose like the witch!', sound:'👃' },
    { type:'find', target:'candy' },
    { type:'do',   text:'Spin like a ghost!',          sound:'🌀' }
  ];
  const total = rounds.length;
  let idx = 0;

  function congaBar(){
    let bar = document.getElementById('congaBar');
    if(!bar){
      bar = document.createElement('div');
      bar.id = 'congaBar';
      bar.className = 'conga';
      document.body.appendChild(bar);
    }
    bar.innerHTML = `<div class="conga-line">${
      conga.map((id,i)=>`<div class="conga-m" style="animation-delay:${(i*0.09).toFixed(2)}s">${imgTag(id,'','')}</div>`).join('')
    }</div>`;
  }
  function clearConga(){
    const bar = document.getElementById('congaBar');
    if(bar) bar.remove();
  }

  function round(){
    const r = rounds[idx];
    let bodyHtml = '';

    if(r.type === 'find'){
      const others = pickN(ALL.filter(x=>x!==r.target), 3);
      bodyHtml = `
        <div class="game">
          <div class="says-scene">
            <div class="says-monster-wrap">${imgTag('monster','says-monster','')}</div>
            <div class="says-card">Monster says… find the <b>${V[r.target].name}</b>!</div>
          </div>
          <div class="options four" id="opts"></div>
        </div>`;
    } else {
      bodyHtml = `
        <div class="game">
          <div class="says-scene">
            <div class="says-monster-wrap">${imgTag('monster','says-monster','')}</div>
            <div class="says-card">Monster says… <b>${r.text}</b> ${r.sound}</div>
            <button class="big-play" id="doneBtn" style="font-size:3.4vh;padding:1.4vh 4vw">WE DID IT! ✅</button>
          </div>
        </div>`;
    }

    const screen = mount(`${header(total, idx)}${bodyHtml}`, 'says');

    const advance = ()=>{
      conga.push(r.type === 'do' ? pick(ALL.filter(x=>!conga.includes(x))) : r.target);
      congaBar();
      sfx.pop();
      addCandy(1);
      rain(12);
      setTimeout(()=>{
        idx++;
        if(idx >= total){ clearConga(); completeHouse(); }
        else round();
      }, 900);
    };

    if(r.type === 'find'){
      const opts = screen.querySelector('#opts');
      buildOptions(opts, shuffle([r.target, ...others()]), (id, btn)=>{
        if(btn.dataset.locked) return;
        if(id === r.target){
          btn.dataset.locked='1';
          btn.classList.add('good');
          opts.querySelectorAll('.opt').forEach(o=>{ if(o!==btn){ o.classList.add('dim'); o.dataset.locked='1'; } });
          sfx.chime();
          const rc = btn.getBoundingClientRect();
          confetti(rc.left+rc.width/2, rc.top+rc.height/2, 40);
          advance();
        } else {
          btn.classList.add('bad');
          sfx.wrong();
          setTimeout(()=>btn.classList.remove('bad'), 520);
        }
      });
      onKeys(answerKeys());
      setRibbon(`Say: <b>Monster says… find the ${V[r.target].name}!</b> Shout the colour — red, blue, yellow or green!`);
    } else {
      screen.querySelector('#doneBtn').addEventListener('click', ()=>{
        sfx.boing();
        confetti(innerWidth/2, innerHeight*.55, 50);
        advance();
      });
      onKeys({ ' ':{el:'#doneBtn'}, enter:{el:'#doneBtn'} });
      setRibbon(`Say: <b>${r.text}</b> — everybody do it! Then press space.`);
    }

    function others(){
      return pickN(ALL.filter(x=>x!==r.target), 3);
    }
  }

  round();
}

/* ============================================================
   GAME 5 — WHO'S MISSING?
   ============================================================ */
function startMissing(){
  currentScreen = 'missing'; setScene('party');
  const total = 4;
  let idx = 0;

  function round(){
    const crew = pickN(ALL, 5);
    const missing = pick(crew);
    const shown = crew.slice();   // 5 dancers

    const screen = mount(`
      ${header(total, idx)}
      <div class="game">
        <div class="missing-scene">
          <div class="dance-floor" id="floor">
            ${shown.map((id,i)=>`<div class="dancer" data-id="${id}" style="animation-delay:${(i*0.13).toFixed(2)}s">${imgTag(id,'','')}</div>`).join('')}
          </div>
          <div class="curtain" id="curtain"></div>
        </div>
        <div class="options four" id="opts" style="opacity:0;pointer-events:none"></div>
      </div>
    `, 'missing');

    const floor = screen.querySelector('#floor');
    const curtain = screen.querySelector('#curtain');
    const opts = screen.querySelector('#opts');

    // how long the children get to look at the dancers before the curtain falls
    const LOOK_MS = 3000;
    // how long the curtain stays down while the missing one sneaks away
    const CURTAIN_MS = 1200;

    setTimeout(()=>{
      sfx.drumroll();
      curtain.classList.add('show');
      setTimeout(()=>{
        const m = floor.querySelector(`[data-id="${missing}"]`);
        if(m){ m.remove(); }
        // refill grid so the gap closes
        setTimeout(()=>{
          curtain.classList.remove('show');
          sfx.sparkle();
          const others = pickN(ALL.filter(x=>x!==missing), 3);
          buildOptions(opts, shuffle([missing, ...others]), (id, btn)=>{
            if(btn.dataset.locked) return;
            if(id === missing){
              btn.dataset.locked='1';
              btn.classList.add('good');
              opts.querySelectorAll('.opt').forEach(o=>{ if(o!==btn){ o.classList.add('dim'); o.dataset.locked='1'; } });
              sfx.chime();
              // bring dancer back
              const back = document.createElement('div');
              back.className = 'dancer';
              back.dataset.id = missing;
              back.innerHTML = imgTag(missing,'','');
              floor.appendChild(back);
              confetti(back.getBoundingClientRect().left + 40, back.getBoundingClientRect().top + 40, 50);
              addCandy(1);
              setTimeout(()=>{
                idx++;
                if(idx >= total) completeHouse();
                else round();
              }, 1900);
            } else {
              btn.classList.add('bad');
              sfx.wrong();
              setTimeout(()=>btn.classList.remove('bad'), 520);
            }
          });
          opts.style.transition = 'opacity .4s';
          opts.style.opacity = '1';
          opts.style.pointerEvents = 'auto';
        }, 450);
      }, CURTAIN_MS);
    }, LOOK_MS);

    onKeys(answerKeys());
    setRibbon('Say: <b>Boo! Who\'s missing?</b> Look carefully… shout the colour of the monster that is gone!');
  }

  round();
}

/* ============================================================
   FINALE
   ============================================================ */
function goFinale(){
  currentScreen = 'finale';
  setScene('party');
  document.body.classList.remove('title-mode');
  buildCertificate();
}

let finaleTimers = [];
function buildCertificate(){
  const disco = shuffle(ALL).map((id,i)=>
    `<div style="animation-delay:${(i*0.1).toFixed(2)}s">${imgTag(id,'','')}</div>`).join('');

  mount(`
    <div class="finale">
      <div class="finale-title">HALLOWEEN PARTY!</div>
      <div class="disco" id="disco">${disco}</div>
      <div class="certificate">
        <div class="cert-title">🎃 Monster Party Champion 🎃</div>
        <div class="cert-line">This class helped every monster get to the party!</div>
        <input class="cert-name" id="certName" placeholder="Class name…" maxlength="28" value="${(state.name||'').replace(/"/g,'&quot;')}">
        <div class="cert-line">🍬 ${state.candy} candies collected · All 5 houses complete</div>
      </div>
      <button class="ghost-btn" id="againBtn" style="font-size:2.2vh">↺ New class</button>
    </div>
  `, 'finale');

  const nameEl = $('#certName');
  nameEl.addEventListener('input', ()=>{ state.name = nameEl.value; saveState(); });

  $('#againBtn').addEventListener('click', ()=>{
    state = { ...DEFAULT_STATE, done:{}, candy:0, muted:state.muted, name:'' };
    saveState(); setJar(); goTitle();
  });

  onKeys({
    ' ':()=>nameEl.focus(),
    'enter':()=>nameEl.blur(),
    m:()=>goMap()
  });

  setRibbon('Say: <b>Look at the monsters dance!</b> Type the class name on the certificate, then take a screenshot!');
  sfx.fanfare();
  rain(90);

  finaleTimers.forEach(clearInterval);
  finaleTimers = [];
  let count = 0;
  finaleTimers.push(setInterval(()=>{
    firework(innerWidth*(0.15 + Math.random()*0.7), innerHeight*(0.15 + Math.random()*0.35));
    count++;
    if(count > 26){ clearInterval(finaleTimers[0]); }
  }, 850));
}

/* ============================================================
   GLOBAL CONTROLS
   ============================================================ */
$('#btnMap').addEventListener('click', ()=>{
  if(currentScreen === 'title') return;
  sfx.pop();
  goMap();
});

function setSoundIcon(){
  const use = $('#btnSound').querySelector('use');
  if(use) use.setAttribute('href', muted ? '#i-sound-off' : '#i-sound-on');
}
$('#btnSound').addEventListener('click', toggleSound);
function toggleSound(){
  muted = !muted;
  state.muted = muted;
  saveState();
  setSoundIcon();
  $('#btnSound').classList.toggle('off', muted);
  if(!muted) sfx.pop();
}

window.addEventListener('keydown', (e)=>{
  if(e.target && e.target.tagName === 'INPUT'){
    if(e.key === 'Escape') e.target.blur();
    return;
  }
  const k = e.key;
  const lower = k.toLowerCase();

  if(lower === 'f'){ toggleFullscreen(); return; }
  if(lower === 't'){ ribbonEl.classList.toggle('hidden'); return; }
  if(lower === 's'){ toggleSound(); return; }
  if(lower === 'm'){
    if(currentScreen !== 'title' && currentScreen !== 'finale'){ e.preventDefault(); goMap(); }
    else if(k === 'm'){ goMap(); }
    return;
  }

  const action = keyMap[k] || keyMap[lower] || keyMap[' '] && k === ' ';
  if(keyMap[k] && typeof keyMap[k] === 'function'){ e.preventDefault(); keyMap[k](e); return; }
  if(keyMap[lower] && typeof keyMap[lower] === 'function'){ e.preventDefault(); keyMap[lower](e); return; }

  if(k === ' ' || k === 'Spacebar' || k === 'Enter'){
    const entry = keyMap[' '] || keyMap['enter'];
    if(entry){
      e.preventDefault();
      if(entry.el){
        const el = typeof entry.el === 'string' ? document.querySelector(entry.el) : entry.el;
        if(el && el.click) el.click();
      }
      else if(typeof entry === 'function'){ entry(); }
    }
  }
});

function toggleFullscreen(){
  if(!document.fullscreenElement){
    (document.documentElement.requestFullscreen || function(){})
      .call(document.documentElement).catch(()=>{});
  } else {
    document.exitFullscreen().catch(()=>{});
  }
}

document.addEventListener('click', ()=>{ ac(); }, { once:true });

/* ---------------- boot ---------------- */
muted = !!state.muted;
setSoundIcon();
$('#btnSound').classList.toggle('off', muted);
setJar();
goTitle();
