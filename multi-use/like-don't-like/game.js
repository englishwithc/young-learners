/* ============================================================
   The Yummy Yum Café — "I like" / "I don't like"
   A classroom game for young English learners.
   Themes: food · animals · colours · other
   ============================================================ */
"use strict";

/* ---------------- helpers ---------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const esc = (s) => String(s).replace(/[&<>"']/g,
  c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = irnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------------- audio (code-generated, no files) ---------------- */
const Sound = {
  ctx: null, on: true,
  ensure() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  tone(f, dur, type = "sine", vol = .22, delay = 0, slideTo = null) {
    if (!this.on) return; const ctx = this.ensure(); if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + .05);
  },
  pop()   { this.tone(320, .12, "sine", .3, 0, 640); },
  tada()  { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .32, "triangle", .22, i * .09)); },
  boing() { this.tone(180, .32, "sine", .3, 0, 620); },
  whoosh(){ this.tone(220, .28, "sine", .14, 0, 60); },
  bonk()  { this.tone(140, .16, "square", .2, 0, 70); },
  sadTrombone(){ [[311,0],[294,.28],[277,.56],[233,.9]].forEach(([f,d]) => this.tone(f, .5, "sawtooth", .13, d)); },
  buzz()  { this.tone(90, .38, "sawtooth", .22); this.tone(93, .38, "square", .12, .02); },
  splat() { this.tone(120, .2, "square", .3, 0, 40); this.tone(70, .3, "sine", .3, .06, 30); },
  ding()  { this.tone(1319, .5, "sine", .25); this.tone(2093, .45, "sine", .12, .05); },
  bell()  { [880, 1108, 1760].forEach((f, i) => this.tone(f, .3, "sine", .16, i * .06)); },
  party() { [523,659,784,1047,1319].forEach((f,i)=>this.tone(f,.3,"triangle",.2,i*.07)); this.tone(784,.7,"sine",.1,.4); },
  fanfare(){ [392,392,523,659,784,1047].forEach((f,i)=>this.tone(f,.35,"triangle",.22,i*.13)); },
  serve() { this.ding(); this.tone(660,.25,"triangle",.15,.25); this.tone(880,.35,"triangle",.15,.4); },
  chop()  { this.tone(200,.08,"square",.24); this.tone(160,.12,"square",.2,.09); },
  doorOpen(){ this.tone(180,.3,"sine",.2,0,300); this.tone(300,.4,"triangle",.14,.25,240); },
  applause() {
    if (!this.on) return; const ctx = this.ensure(); if (!ctx) return;
    for (let i = 0; i < 22; i++) {
      const t = ctx.currentTime + Math.random() * 1.4;
      const buf = ctx.createBuffer(1, 2205, 44100), d = buf.getChannelData(0);
      for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / 300);
      const s = ctx.createBufferSource(); s.buffer = buf;
      const g = ctx.createGain(); g.gain.value = .08 + Math.random() * .08;
      s.connect(g); g.connect(ctx.destination); s.start(t);
    }
  },
  animalSound(kind) {
    const map = {
      "🦁": () => { this.tone(140, .5, "sawtooth", .2, 0, 90); this.tone(70, .6, "square", .14, .1); },
      "🐱": () => { this.tone(560, .3, "sine", .16, 0, 720); },
      "🐶": () => { this.tone(260, .1, "square", .16); this.tone(210, .12, "square", .16, .13); },
      "🐸": () => { this.tone(150, .14, "square", .2); this.tone(105, .16, "square", .2, .16); },
      "🐮": () => { this.tone(160, .6, "sawtooth", .18, 0, 110); },
      "🐘": () => { this.tone(420, .5, "sawtooth", .18, 0, 180); }
    };
    (map[kind] || (() => this.tone(500, .2, "sine", .15, 0, 300)))();
  }
};

/* ---------------- themes ---------------- */
const THEMES = {
  food: {
    key: "food", emoji: "🍽️", name: "Food & Drink",
    venue: "The Yummy Yum Cafe",
    card: { emoji: "🍽️", name: "Food & Drink", desc: "A cozy little cafe full of tasty (and very strange!) treats to taste.", tag: "Serve it in the cafe!" },
    tagline: "The tastiest — and strangest — cafe in town!",
    startWord: "OPEN THE CAFE!", startEmoji: "🥳",
    itemWord: "dish", panelTitle: "🍕 Today's Menu",
    bubble: {
      intro: ["Oooh, a new dish is here! 🌟", "Attention please! New dish! 📣", "Coming right up… look!"],
      reveal: (n) => `Do you like <b>${n}</b>?`,
      frame: (n, y) => `${y} like it — <b>${n}</b> is on the menu! 🍽️`,
      trash: (n, t) => `${t} don't like it… <b>${n}</b> goes in the bin! 🗑️`
    },
    cheers: ["Yum yum! 😋", "Delicious! 🤤", "More please! 🙌", "Five stars! ⭐⭐⭐⭐⭐", "So yummy! 🎉", "Chef's kiss! 😘"],
    nopes:  ["Bluh! 🤢", "Yucky yuck! 🤮", "Not on my plate! 🙅", "No no no! 😖", "YUCK! 🪦"],
    fx: { cheer: ["😋","🤤","🎉","⭐","🍰"], nope: ["🤢","❌","💨"], sparkle: "✨",
          bg: "☕ 🧁 🍩 🥐 🍓 🥞 🍦 🍪 🍰 🍭", conf: ["#ff8a3d","#e74c3c","#f1c40f","#2ecc71","#3498db"] },
    sounds: { good: () => Sound.bell(), bad: () => Sound.buzz() },
    starters: ["🍌 Banana","🍎 Apple","🥛 Milk","💧 Water","🍪 Biscuit","🥪 Sandwich",
               "🍇 Grapes","🧀 Cheese","🍞 Bread","🍓 Strawberry","🍦 Ice cream","🍕 Pizza"],
    caseLabel: "⭐ TODAY'S MENU ⭐", caseEmpty: "The menu is empty… what will get served?",
    reactions: { like: ["Yum yum! 😋","Delicious! 🤤","I'll take two! 🥰","My favourite! 😍"], dislike: ["Yuck! 🤢","No thanks! 🙅","I'm not hungry… 😖"] }
  },
  animals: {
    key: "animals", emoji: "🦁", name: "Animals",
    venue: "The Happy Paws Zoo",
    card: { emoji: "🦁", name: "Animals", desc: "A happy zoo where every creature begs for a home. Do we like them?", tag: "Adopt them into the zoo!" },
    tagline: "Every animal wants a home in our zoo!",
    startWord: "OPEN THE ZOO!", startEmoji: "🐒",
    itemWord: "animal", panelTitle: "🦁 Today's Animals",
    bubble: {
      intro: ["Something's moving in the bushes! 🐾", "A new animal is coming! 🐾", "Listen… footsteps! 🐾"],
      reveal: (n) => `Do you like <b>${n}</b>?`,
      frame: (n, y) => `${y} like it — <b>${n}</b> joins our zoo! 🏡`,
      trash: (n, t) => `${t} don't like it… <b>${n}</b> runs free in the wild! 🌳`
    },
    cheers: ["Aww, so cute! 🥰", "I love it! 💚", "So fluffy! 🤗", "High five! 🖐️", "What a friend! 🐾", "Yay yay yay! 🎉"],
    nopes:  ["Too slimy! 😖", "Eek! 🙈", "It bit me! 😱", "So scary! 🫣", "No no no! 🙅"],
    fx: { cheer: ["🥰","💚","🐾","🎉","🌿"], nope: ["😱","💨","❌"], sparkle: "🌟",
          bg: "🌴 🐾 🌿 🌞 🦜 🌺 🪵 🍃 🌳 🦴", conf: ["#4caf50","#ff9800","#2196f3","#8bc34a","#ffd54f"] },
    sounds: {
      good: () => { Sound.party(); Sound.animalSound(pick(["🦁","🐶","🐸","🐮"])); },
      bad:  () => { Sound.whoosh(); Sound.animalSound(pick(["🐘","🐮","🐱"])); }
    },
    starters: ["🦁 Lion","🐵 Monkey","🐸 Frog","🐍 Snake","🐘 Elephant","🦒 Giraffe",
               "🐬 Dolphin","🦋 Butterfly","🐼 Panda","🐧 Penguin","🦖 Dinosaur","🐢 Turtle"],
    caseLabel: "⭐ OUR ANIMAL FRIENDS ⭐", caseEmpty: "No animals yet… who gets a home?",
    reactions: { like: ["Aww! 🥰","So cute! 💚","Hello friend! 🐾","Yay! 🎉"], dislike: ["Eek! 🙈","Too scary! 😱","Go away! 🙅"] }
  },
  colours: {
    key: "colours", emoji: "🎨", name: "Colours",
    venue: "The Rainbow Art Studio",
    card: { emoji: "🎨", name: "Colours", desc: "A paint-splattery art studio where colours fight for a place on the wall!", tag: "Hang it in the gallery!" },
    tagline: "Which colours belong on our wall of fame?",
    startWord: "OPEN THE STUDIO!", startEmoji: "🖌️",
    itemWord: "colour", panelTitle: "🎨 Today's Colours",
    bubble: {
      intro: ["A colourful surprise appears! 🌈", "New colour incoming! 🖌️", "Look at this one! 🌈"],
      reveal: (n) => `Do you like <b>${n}</b>?`,
      frame: (n, y) => `${y} like it — <b>${n}</b> goes on our wall! 🖼️`,
      trash: (n, t) => `${t} don't like it… <b>${n}</b> gets washed off! 🫧`
    },
    cheers: ["Ooh, pretty! 😍", "So beautiful! ✨", "I love it! 💜", "Wow wow wow! 🎨", "Art-tastic! 🌟", "Mix it up! 🖌️"],
    nopes:  ["Too messy! 🫣", "My eyes! 😵", "No thank you! 🙅", "Ugly ugly! 😝", "Not on my wall! 🚫"],
    fx: { cheer: ["😍","✨","🎨","🌈","💖"], nope: ["😵","🫧","❌"], sparkle: "✨",
          bg: "🖌️ 🌈 💛 💙 🧡 💜 🩷 🩵 ❤️ 💚", conf: ["#e91e63","#4dd0e1","#ffd54f","#ba68c8","#8bc34a"] },
    sounds: { good: () => Sound.tada(), bad: () => Sound.splat() },
    starters: ["🔴 Red","🔵 Blue","🟡 Yellow","🟢 Green","🟣 Purple","🟠 Orange",
               "🩷 Pink","🩵 Light blue","⚫ Black","⚪ White","🟤 Brown","🌈 Rainbow"],
    caseLabel: "⭐ WALL OF COLOURS ⭐", caseEmpty: "The wall is blank… which colours shine?",
    reactions: { like: ["So pretty! 😍","Beautiful! ✨","Wow! 🌈","Masterpiece! 🤩"], dislike: ["Too messy! 🫣","My eyes! 😵","No thanks! 🙅"] }
  },
  other: {
    key: "other", emoji: "🎪", name: "Other (any words!)",
    venue: "The Magic Stage",
    card: { emoji: "🎪", name: "Other (any words!)", desc: "Toys, sports, clothes, anything! The magic stage performs your very own words.", tag: "Ta-daa! Onto the stage!" },
    tagline: "Anything can be magic on this stage!",
    startWord: "START THE SHOW!", startEmoji: "🎩",
    itemWord: "thing", panelTitle: "✨ Today's Things",
    bubble: {
      intro: ["A magical thing appears! ✨", "Abracadabra… look! 🪄", "Ta-daa! What's this? 🎩"],
      reveal: (n) => `Do you like <b>${n}</b>?`,
      frame: (n, y) => `${y} like it — <b>${n}</b> takes a bow on stage! 🎭`,
      trash: (n, t) => `${t} don't like it… <b>${n}</b> falls through the trapdoor! ⬇️`
    },
    cheers: ["Amazing! 🤩", "Wow, magic! ✨", "Bravo! 👏", "Incredible! 🎉", "Best show ever! 💫", "Again again! 🙌"],
    nopes:  ["Boooo! 👎", "Boring! 😴", "Not magic! 🙄", "Nooo! 🛑", "Awful! 🙈"],
    fx: { cheer: ["🤩","✨","⭐","🎉","💫"], nope: ["😴","👎","❌"], sparkle: "✨",
          bg: "🎩 ⭐ 🎪 🃏 🕳️ 🪄 🧸 🎁 🎭 💫", conf: ["#a855f7","#fbbf24","#22d3ee","#f472b6","#fb7185"] },
    sounds: { good: () => Sound.fanfare(), bad: () => Sound.boing() },
    starters: ["⚽ Football","🧸 Teddy bear","🚗 Car","🎮 Video game","📚 Book","🎲 Toy",
               "🪁 Kite","🎸 Guitar","🤖 Robot","🚲 Bike","🪀 Yo-yo","🎩 Magic hat"],
    caseLabel: "⭐ THE MAGIC SHOW ⭐", caseEmpty: "The stage is empty… what takes a bow?",
    reactions: { like: ["Amazing! 🤩","Bravo! 👏","Magic! ✨","Wow! 🎉"], dislike: ["Boooo! 👎","Boring! 😴","Not magic! 🙄"] }
  }
};
let T = THEMES.food;

/* ---------------- avatars ---------------- */
const AVATARS = ["🦊","🐸","🐼","🦁","🐧","🐷","🐨","🐵","🦄","🐯","🐰","🦋","🦖","🐙","🐢","🦉"];
const COLORS = ["#ff6b6b","#ffa94d","#ffd43b","#69db7c","#4dabf7","#b197fc","#f783ac","#38d9a9"];

/* ---------------- state ---------------- */
const state = {
  players: [], items: [], gameItems: [], currentIdx: -1,
  itemVotes: {}, usedStarterEmoji: new Set(),
  chosenTheme: "food", locked: false,
  dragging: null, results: [], awardsDone: false
};
let confettiColors = THEMES.food.fx.conf;

/* ---------------- persistence ---------------- */
const STORE_KEY = "yycafe_v1";
function storage() { try { return window.localStorage; } catch (e) { return null; } }
function saveState() {
  const ls = storage(); if (!ls) return;
  try {
    ls.setItem(STORE_KEY, JSON.stringify({
      players: state.players.map(p => ({ name: p.name, avatar: p.avatar, color: p.color })),
      themeKey: state.chosenTheme
    }));
  } catch (e) {}
}
function loadState() {
  const ls = storage(); if (!ls) return;
  try {
    const d = JSON.parse(ls.getItem(STORE_KEY) || "{}");
    if (Array.isArray(d.players)) state.players = d.players.filter(p => p && p.name).slice(0, 6);
    if (d.themeKey && THEMES[d.themeKey]) state.chosenTheme = d.themeKey;
  } catch (e) {}
}
function saveCustomItems() {
  const ls = storage(); if (!ls) return;
  const items = state.items.filter(i => i.img).map(i => ({ name: i.name, img: i.img }));
  try { ls.setItem(STORE_KEY + "_custom_" + state.chosenTheme, JSON.stringify(items)); } catch (e) {}
}
function loadCustomItems() {
  const ls = storage(); if (!ls) return [];
  try { return JSON.parse(ls.getItem(STORE_KEY + "_custom_" + state.chosenTheme) || "[]"); } catch (e) { return []; }
}

/* ---------------- FX layers ---------------- */
function fxLayer() { return $("#fxLayer"); }
function confettiBurst(n = 90) {
  const layer = fxLayer();
  for (let i = 0; i < n; i++) {
    const c = document.createElement("div");
    c.className = "confetti-bit";
    c.style.left = rnd(0, 100) + "vw";
    c.style.top = rnd(-25, -5) + "vh";
    c.style.background = pick(confettiColors);
    c.style.animationDuration = rnd(1.6, 3.6) + "s";
    c.style.animationDelay = rnd(0, .6) + "s";
    layer.appendChild(c);
    setTimeout(() => c.remove(), 4500);
  }
}
function floatIt(emoji, x, y) {
  const s = document.createElement("div");
  s.className = "float-emoji"; s.textContent = emoji;
  s.style.left = x + "px"; s.style.top = y + "px";
  s.style.transform = `translate(${rnd(-30,30)}px, -20px)`;
  fxLayer().appendChild(s); setTimeout(() => s.remove(), 1700);
}
function floatFrom(emoji, el) {
  if (!el) return; const r = el.getBoundingClientRect();
  floatIt(emoji, r.left + r.width / 2, r.top + r.height / 2);
}
function sparklesAt(el, emoji = "✨", n = 8) {
  if (!el) return; const r = el.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const s = document.createElement("div");
    s.className = "sparkle"; s.textContent = emoji;
    s.style.left = (r.left + rnd(0, r.width)) + "px";
    s.style.top = (r.top + rnd(0, r.height)) + "px";
    fxLayer().appendChild(s); setTimeout(() => s.remove(), 1100);
  }
}
function buzzFlies(n = 3) {
  const layer = $("#flyLayer"), disp = $("#itemDisplay");
  if (!disp) return; const r = disp.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const f = document.createElement("div");
    f.className = "fly"; f.textContent = "🪰";
    f.style.left = (r.left + r.width / 2) + "px";
    f.style.top = (r.top + r.height / 2) + "px";
    f.style.animationDelay = (i * .35) + "s";
    layer.appendChild(f); setTimeout(() => f.remove(), 3000);
  }
}
function bgDecorInit() {
  const d = $("#bgDecor");
  d.style.fontSize = "34px";
  d.innerHTML = T.fx.bg.split(" ").map(e => `<span style="display:inline-block;margin:18px 22px;transform:rotate(${irnd(-15,15)}deg)">${e}</span>`).join("");
}

/* ---------------- screens ---------------- */
function showScreen(id) {
  $$(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
}

/* ---------------- theme picker ---------------- */
function buildThemeGrid() {
  const grid = $("#themeGrid"); grid.innerHTML = "";
  Object.values(THEMES).forEach(t => {
    const card = document.createElement("button");
    card.className = "theme-card"; card.type = "button";
    card.innerHTML = `
      <div class="theme-emoji">${t.card.emoji}</div>
      <div class="theme-name">${esc(t.card.name)}</div>
      <div class="theme-desc">${esc(t.card.desc)}</div>
      <div class="theme-note">${esc(t.card.tag)}</div>`;
    card.onclick = () => { Sound.pop(); chooseTheme(t.key); };
    grid.appendChild(card);
  });
}
function chooseTheme(key) {
  state.chosenTheme = key; T = THEMES[key];
  document.body.dataset.theme = key;
  document.title = `${T.venue} — I like / I don't like`;
  confettiColors = T.fx.conf;
  $("#themeMastEmoji").textContent = T.card.emoji;
  $(".game-title").textContent = T.venue;
  $("#pickSub").textContent = `First… pick your world! ${T.card.emoji}`;
  bgDecorInit();
  state.items = []; loadCustomItems().forEach(c => state.items.push({ id: "c_" + Math.random().toString(36).slice(2,9), name: c.name, img: c.img, custom: true }));
  saveState();
  applyThemeToSetup();
  renderItems(); updateStartBtn();
  showScreen("#screen-setup");
  Sound.doorOpen(); confettiBurst(40);
}
function applyThemeToSetup() {
  $("#venueTitle").textContent = `${T.venue} ${T.emoji}`;
  $("#venueSub").textContent = T.tagline;
  $("#venueMini").textContent = `${T.emoji} ${T.venue}`;
  $("#itemsPanelTitle").textContent = T.panelTitle;
  $("#startGameBtn .grand-text").textContent = T.startWord;
  $("#startGameBtn .grand-emoji").textContent = T.startEmoji;
  $("#itemHint").textContent = `Names are optional — a mystery ${T.itemWord} is fun too!`;
  $("#playersPanelTitle").textContent = "⭐ The Players";
  document.body.dataset.theme = state.chosenTheme;
}

/* ---------------- setup: players ---------------- */
function renderPlayers() {
  const list = $("#playerList"); list.innerHTML = "";
  state.players.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "player-row"; row.style.setProperty("--rowColor", p.color);
    row.innerHTML = `
      <div class="player-avatar">${AVATARS[p.avatar] || AVATARS[0]}</div>
      <span class="p-name" contenteditable="true" data-pi="${i}">${esc(p.name)}</span>
      <div class="picker-row avatars">
        ${AVATARS.map((a, ai) => `<button class="avatar-choice ${ai === p.avatar ? "selected" : ""}" data-pi="${i}" data-ai="${ai}" title="avatar">${a}</button>`).join("")}
      </div>
      <button class="p-remove" data-pi="${i}" title="Remove player">✖</button>`;
    // color strip
    const colors = document.createElement("div");
    colors.className = "picker-row";
    colors.innerHTML = COLORS.map((c, ci) => `<span class="color-choice ${p.color === c ? "selected" : ""}" data-pi="${i}" data-ci="${ci}" style="background:${c}"></span>`).join("");
    row.appendChild(colors);
    list.appendChild(row);
  });
  $$("#playerList .avatar-choice").forEach(b => b.onclick = () => {
    const p = state.players[+b.dataset.pi]; p.avatar = +b.dataset.ai; Sound.pop(); renderPlayers(); saveState();
  });
  $$("#playerList .color-choice").forEach(c => c.onclick = () => {
    const p = state.players[+c.dataset.pi]; p.color = COLORS[+c.dataset.ci]; Sound.pop(); renderPlayers(); saveState();
  });
  $$("#playerList .p-name").forEach(el => {
    el.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); el.blur(); } };
    el.oninput = () => { state.players[+el.dataset.pi].name = el.textContent.trim().slice(0,14); saveState(); };
  });
  $$("#playerList .p-remove").forEach(b => b.onclick = () => {
    state.players.splice(+b.dataset.pi, 1); Sound.bonk(); renderPlayers(); saveState(); updateStartBtn();
  });
}
function addPlayer() {
  if (state.players.length >= 6) { $("#setupFooterHint").textContent = "Six players max! 😊"; Sound.bonk(); return; }
  const input = $("#playerNameInput");
  const name = (input.value || "").trim().slice(0, 14);
  const used = new Set(state.players.map(p => p.avatar));
  let avatar = AVATARS.findIndex((_, i) => !used.has(i)); if (avatar < 0) avatar = irnd(0, AVATARS.length - 1);
  const usedColors = new Set(state.players.map(p => p.color));
  let color = COLORS.find(c => !usedColors.has(c)) || pick(COLORS);
  state.players.push({ name: name || `Player ${state.players.length + 1}`, avatar, color });
  input.value = ""; Sound.pop(); renderPlayers(); saveState(); updateStartBtn();
  input.focus();
}

/* ---------------- setup: items ---------------- */
function renderItems() {
  const list = $("#itemList"); list.innerHTML = "";
  $("#starterCount").textContent = T.starters.length;
  const startersOn = state.items.some(i => i.starter);
  $("#starterToggle").classList.toggle("on", startersOn);

  if (!state.items.length) {
    list.innerHTML = `<p class="pill-note">No items yet! Use the gift pack 🎁 or drop pictures 🖼️</p>`;
  }
  state.items.forEach((it, idx) => {
    const chip = document.createElement("div");
    chip.className = "item-chip" + (it.starter ? " starter-chip" : "");
    const shown = it.img ? `<img class="chip-img" src="${it.img}" alt="">` : `<div class="chip-img">${it.emoji}</div>`;
    const label = esc(it.name) || `Mystery #${it.num}`;
    chip.innerHTML = `${shown}<div class="chip-name">${label}</div><button class="chip-x" data-idx="${idx}">✖</button>`;
    chip.onmouseenter = () => Sound.pop();
    chip.querySelector(".chip-x").onclick = (e) => {
      e.stopPropagation();
      state.items.splice(+e.currentTarget.dataset.idx, 1);
      state.items.forEach((i, j) => i.num = j + 1);
      Sound.bonk(); renderItems(); updateStartBtn(); saveCustomItems();
    };
    list.appendChild(chip);
  });
}
function toggleStarters() {
  const on = !$("#starterToggle").classList.contains("on");
  if (on) {
    T.starters.forEach(s => {
      const [emoji, ...rest] = s.split(" ");
      if (state.items.some(i => i.starter && i.emoji === emoji)) return;
      state.items.push({ id: "st_" + emoji, emoji, name: rest.join(" "), starter: true, num: 0 });
    });
    Sound.party();
  } else {
    state.items = state.items.filter(i => !i.starter);
    Sound.bonk();
  }
  state.items.forEach((i, j) => i.num = j + 1);
  renderItems(); updateStartBtn();
}
function wireUploads() {
  const zone = $("#uploadZone"), input = $("#fileInput");
  const bar = $("#newUploadsBar"), list = $("#newUploadsList");
  zone.onclick = () => input.click();
  zone.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") input.click(); };
  input.onchange = () => { handleFiles([...input.files]); input.value = ""; };
  ["dragover", "dragenter"].forEach(ev =>
    zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add("drag-over"); }));
  ["dragleave", "drop"].forEach(ev =>
    zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove("drag-over"); }));
  zone.addEventListener("drop", e => handleFiles([...e.dataTransfer.files]));

  function handleFiles(files) {
    const images = files.filter(f => f.type.startsWith("image/")).slice(0, 16);
    if (!images.length) return;
    list.innerHTML = ""; bar.hidden = false;
    images.forEach((f, k) => {
      const rd = new FileReader();
      rd.onload = () => {
        const tile = document.createElement("div");
        tile.className = "upload-tile";
        tile.innerHTML = `<img class="upload-thumb" src="${rd.result}" alt="">
          <input type="text" maxlength="20" placeholder="Mystery item #${k + 1}?">
          <button class="mini-btn discard-btn" style="margin-top:4px" type="button">🗑 Discard</button>`;
        tile.dataset.src = rd.result;
        tile.querySelector(".discard-btn").onclick = () => {
          tile.remove(); if (!list.children.length) bar.hidden = true; Sound.bonk();
        };
        list.appendChild(tile);
        Sound.pop();
      };
      rd.readAsDataURL(f);
    });
  }
  $("#confirmUploadsBtn").onclick = () => {
    [...list.children].forEach(tile => {
      const name = tile.querySelector("input").value.trim().slice(0, 20);
      state.items.push({ id: "c_" + Math.random().toString(36).slice(2, 9), name, img: tile.dataset.src, custom: true, num: 0 });
    });
    state.items.forEach((i, j) => i.num = j + 1);
    bar.hidden = true; list.innerHTML = "";
    Sound.tada(); confettiBurst(35);
    $("#itemHint").textContent = "Added! Tap ✖ on a chip to remove it.";
    renderItems(); updateStartBtn(); saveCustomItems();
  };
}
function updateStartBtn() {
  const okP = state.players.length >= 2, okI = state.items.length >= 2;
  const ok = okP && okI;
  $("#startGameBtn").disabled = !ok;
  const needP = okP ? "" : `${2 - state.players.length} more player${2 - state.players.length > 1 ? "s" : ""}`;
  const needI = okI ? "" : `${2 - state.items.length} more item${2 - state.items.length > 1 ? "s" : ""}`;
  $("#setupFooterHint").textContent = ok
    ? "Everything's ready — let's play! 🎉"
    : [needP, needI].filter(Boolean).join(" · ") + " — then open up!";
}

/* ---------- helpers for flow ---------- */
function isAtLastItem() { return state.currentIdx >= state.gameItems.length - 1; }

/* ---------------- game flow ---------------- */
function startGame() {
  Sound.ensure();
  state.gameItems = shuffle(state.items.map(i => ({ ...i })));
  state.currentIdx = -1; state.results = []; state.itemVotes = {};
  state.votesLocked = false;
  applyThemeToSetup();
  $("#venueMini").textContent = `${T.emoji} ${T.venue}`;
  renderPlayerCards(); renderDots();
  showScreen("#screen-game");
  Sound.doorOpen();
  setTimeout(nextFood, 450);
}

function renderPlayerCards() {
  const wrap = $("#playerCards"); wrap.innerHTML = "";
  state.players.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "player-card"; card.style.setProperty("--rowColor", p.color);
    card.dataset.pi = i;
    card.innerHTML = `
      <div class="pc-avatar">${AVATARS[p.avatar]}</div>
      <div class="pc-name">${esc(p.name)}</div>
      <div class="pc-plate"><span class="pc-wait">waiting…</span></div>
      <div class="pc-count"></div>
      <div class="pc-btns">
        <button class="btn-like" data-pi="${i}" aria-label="like">👍</button>
        <button class="btn-dislike" data-pi="${i}" aria-label="dislike">👎</button>
      </div>`;
    wrap.appendChild(card);
  });
  $$("#playerCards .btn-like").forEach(b => b.onclick = () => castVote(+b.dataset.pi, "like"));
  $$("#playerCards .btn-dislike").forEach(b => b.onclick = () => castVote(+b.dataset.pi, "dislike"));
}
function renderDots() {
  const wrap = $("#progressDots"); wrap.innerHTML = "";
  const row = document.createElement("div"); row.className = "dots-row";
  state.gameItems.forEach(() => {
    const d = document.createElement("div"); d.className = "dot"; row.appendChild(d);
  });
  wrap.appendChild(row);
  $("#itemTotal").textContent = state.gameItems.length;
}
function updateDots() {
  $$("#progressDots .dot").forEach((d, i) => {
    d.classList.remove("done", "cased", "trashed", "assigned");
    if (i < state.currentIdx) d.classList.add("assigned");
    const res = state.results[i];
    if (!res) return;
    d.classList.add("done", res.verdict === "in" ? "cased" : "trashed");
  });
  $("#itemIndex").textContent = Math.min(state.currentIdx + 1, state.gameItems.length);
}

function nextFood() {
  if (isAtLastItem()) { updateDots(); return finale(); }
  state.currentIdx++;
  state.itemVotes = {}; state.votesLocked = false;
  const item = state.gameItems[state.currentIdx];
  const disp = $("#itemDisplay"), nameEl = $("#itemName"), bubble = $("#speechBubble");

  disp.className = "item-display";
  if (item.img) {
    disp.innerHTML = `<img class="is-img" src="${item.img}" alt="">`;
  } else {
    disp.textContent = item.emoji;
  }
  disp.classList.remove("item-enter"); void disp.offsetWidth; disp.classList.add("item-enter");
  const label = item.name || `${cap(T.itemWord)} #${item.num}`;
  nameEl.textContent = label;
  setBubble(pick(T.bubble.intro), false);
  Sound.pop(); sparklesAt(disp, T.fx.sparkle, 6);
  $("#voteControls").hidden = true;
  $$(".pc-plate").forEach(p => p.innerHTML = `<span class="pc-wait">waiting…</span>`);
  $$(".pc-count").forEach(c => c.textContent = "");
  $$(".player-card").forEach(c => c.classList.remove("bye"));
  updateDots(); updateScore(0, 0);

  setTimeout(() => {
    setBubble(T.bubble.reveal(esc(label)), true);
    Sound.tada(); Sound.chop();
    $("#voteControls").hidden = false;
    $("#dragHintBtn").textContent = `🖐️ Drag the ${item.name || T.itemWord} to a friend — or to the bin!`;
  }, 1100);
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function setBubble(html, shout) {
  const b = $("#speechBubble");
  $("#bubbleText").innerHTML = html;
  b.classList.remove("shout"); void b.offsetWidth;
  if (shout) b.classList.add("shout");
}
function updateScore(likes, dislikes) {
  const lc = $("#likeCount"), dc = $("#dislikeCount");
  if (lc.textContent !== String(likes)) { lc.textContent = likes; chipBump(".chip-like"); }
  if (dc.textContent !== String(dislikes)) { dc.textContent = dislikes; chipBump(".chip-dislike"); }
}
function chipBump(sel) {
  const c = $(sel); if (!c) return;
  c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
}
function voteCounts() {
  let likes = 0, dislikes = 0;
  Object.values(state.itemVotes).forEach(v => v === "like" ? likes++ : dislikes++);
  return { likes, dislikes };
}

/* voting */
function castVote(pi, vote) {
  if (state.votesLocked) return;
  const prev = state.itemVotes[pi];
  if (prev === vote) return;
  state.itemVotes[pi] = vote;
  const card = $$("#playerCards .player-card")[pi];
  const plate = card.querySelector(".pc-plate");
  const count = card.querySelector(".pc-count");
  card.classList.toggle("bye", vote === "dislike");
  const cur = state.gameItems[state.currentIdx];
  if (vote === "like") {
    Sound.pop(); floatFrom(pick(T.fx.cheer), card);
    plate.innerHTML = `<span>😋</span><span class="food-mini">${foodMini(cur)}</span>`;
    count.textContent = `${state.players[pi].name} likes it! 😋`;
  } else {
    Sound.bonk(); floatFrom(pick(T.fx.nope), card);
    plate.innerHTML = `<span>🤢</span><span class="food-mini">${foodMini(cur)}</span>`;
    count.textContent = `${state.players[pi].name} doesn't like it! 🤢`;
  }
  const { likes, dislikes } = voteCounts();
  updateScore(likes, dislikes);
  checkAllVoted();
}
function foodMini(item) {
  return item.img ? `<img class="food-mini" src="${item.img}" alt="">` : `<span class="food-mini">${item.emoji}</span>`;
}
function checkAllVoted() {
  if (state.votesLocked) return;
  if (Object.keys(state.itemVotes).length === state.players.length && state.players.length > 0) {
    state.votesLocked = true;
    setTimeout(showVerdict, 550);
  }
}

/* verdict */
function showVerdict() {
  state.votesLocked = true;
  const item = state.gameItems[state.currentIdx];
  const { likes, dislikes } = voteCounts();
  const label = item.name || cap(T.itemWord) + " #" + item.num;
  const likers = state.players.filter((_, i) => state.itemVotes[i] === "like").map(p => p.name);
  const dislikers = state.players.filter((_, i) => state.itemVotes[i] === "dislike").map(p => p.name);
  const likersHtml = esc(likers.join(", "));
  const dislikersHtml = esc(dislikers.join(", "));

  if (likes === dislikes) {
    // tie → teacher decides
    $("#tieScore").innerHTML = `👍 ${likes} : ${dislikes} 👎`;
    $("#tieEmojiRow").textContent = `😍 🆚 🤢`;
    setBubble(pick(["It's a TIE! 🤯", "Ohh, a tie! 🤔", "Split decision! ⚖️"]), true);
    $("#tieOverlay").hidden = false;
    Sound.bonk(); setTimeout(() => Sound.tone(90, .5, "sine", .26, 0, 50), 260);
    $("#tieKeepBtn").onclick = () => { $("#tieOverlay").hidden = true; verdictIn(item, likes, dislikes, label, likers, dislikers, true); };
    $("#tieTrashBtn").onclick = () => { $("#tieOverlay").hidden = true; verdictOut(item, likes, dislikes, label, likers, dislikers, true); };
    return;
  }
  if (likes > dislikes) {
    T.sounds?.good?.();
    verdictIn(item, likes, dislikes, label, likers, dislikers, false);
  } else {
    T.sounds?.bad?.();
    verdictOut(item, likes, dislikes, label, likers, dislikers, false);
  }
}

async function verdictIn(item, likes, dislikes, label, likers, dislikers, wasTie) {
  state.results[state.currentIdx] = { item, verdict: "in", likes, dislikes, likers, dislikers };
  setBubble(T.bubble.frame(esc(label), esc(likers.join(", "))), true);
  Sound.tada(); confettiBurst(90); Sound.applause();
  floatFrom("😍", $("#itemDisplay"));
  await sleep(1600);
  // fly to showcase tray
  setTray(true);
  const tray = $("#showcaseTray .tray-items");
  const mini = document.createElement("div");
  mini.className = "case-item tray-fly";
  mini.innerHTML = `${item.img ? `<img class="ci-emoji" src="${item.img}" alt="">` : `<div class="ci-emoji">${item.emoji}</div>`}<div class="ci-name">${esc(label)}</div>`;
  tray.appendChild(mini);
  Sound.serve();
  await sleep(900);
  updateDots();
  await sleep(500);
  nextFood();
}

async function verdictOut(item, likes, dislikes, label, likers, dislikers, wasTie) {
  state.results[state.currentIdx] = { item, verdict: "out", likes, dislikes, likers, dislikers };
  // splat onto the giant displayed item
  const disp = $("#itemDisplay");
  disp.classList.add("item-out");
  setBubble(T.bubble.trash(esc(label), esc(dislikers.join(", "))), true);
  Sound.splat(); buzzFlies(4);
  if (T.key === "animals") Sound.animalSound("🐘");
  // shake
  $("#stage").classList.add("shake");
  $("#voteControls").hidden = true;
  await sleep(700);
  // full-screen trash splash — teacher taps NEXT when the class is ready
  const splash = $("#trashSplash");
  $("#splashX").innerHTML = `${esc(item.name || cap(T.itemWord))} — YUCK! 🤮`;
  $("#splashVotes").textContent = `👍 ${likes} like it · 👎 ${dislikes} don't like it`;
  $("#splashBin").textContent = T.key === "colours" ? "🪣" : T.key === "animals" ? "🌿" : T.key === "other" ? "🕳️" : "🗑️";
  splash.hidden = false;
  Sound.sadTrombone(); setTimeout(() => Sound.buzz(), 700);
  floatFrom(pick(T.fx.nope), $("#splashBin"));
  await waitSplash();
  splash.hidden = true;
  $("#stage").classList.remove("shake");
  disp.classList.remove("item-out");
  showTrayRejected(label, dislikes);
  updateDots();
  nextFood();
}

function showTrayRejected(label, dislikes) {
  setTray(true);
  const tray = $("#showcaseTray .tray-items");
  const gone = document.createElement("div");
  gone.className = "case-item";
  const bin = T.key === "colours" ? "🪣" : T.key === "animals" ? "🌳" : T.key === "other" ? "🕳️" : "🗑️";
  gone.innerHTML = `<div class="ci-emoji">→ ${bin}</div><div class="ci-name">${esc(label)} (${dislikes} 👎)</div>`;
  tray.appendChild(gone);
  Sound.whoosh();
}

/* pause the trash splash on the NEXT button (auto-continues after 4s) */
function waitSplash() {
  return new Promise(res => {
    let done = false;
    const btn = $("#splashNextBtn");
    const finish = () => {
      if (done) return;
      done = true;
      btn.removeEventListener("click", onBtn);
      clearTimeout(timer);
      res();
    };
    const onBtn = () => finish();
    const timer = setTimeout(finish, 4000);
    btn.addEventListener("click", onBtn);
  });
}

/* skip */
function skipFood() {
  const item = state.gameItems[state.currentIdx];
  if (item && !state.results[state.currentIdx]) {
    state.results[state.currentIdx] = { item, verdict: "skipped", likes: voteCounts().likes, dislikes: voteCounts().dislikes };
  }
  Sound.whoosh();
  state.votesLocked = true;
  updateDots();
  nextFood();
}

/* ---------- grand finale ---------- */
function finale() {
  setTray(false);
  $("#voteControls").hidden = true;
  showScreen("#screen-finale");
  Sound.fanfare(); confettiBurst(120); Sound.applause();
  const ins = state.results.filter(r => r && r.verdict === "in");
  const outs = state.results.filter(r => r && r.verdict === "out");
  $("#finaleTitle").textContent = `${T.emoji} ${T.venue} — Grand Finale! ${T.card.emoji}`;
  $("#finaleScore").innerHTML =
    `👍 <b>${ins.length}</b> ${T.itemWord}${ins.length !== 1 ? "s" : ""} made it into the ${T.key === "food" ? "cafe" : T.key === "animals" ? "zoo" : T.key === "colours" ? "gallery" : "show"} · 🗑️ <b>${outs.length}</b> went out!`;

  // showcase
  const win = $("#caseWindow"); win.innerHTML = "";
  addShine(win);
  $("#caseMarquee").textContent = T.caseLabel;
  if (!ins.length) {
    win.innerHTML = `<div class="case-empty">${T.caseEmpty}</div>`;
  } else {
    ins.forEach((r, idx) => {
      setTimeout(() => {
        const c = document.createElement("div");
        c.className = "case-item";
        const emojiHtml = r.item.img
          ? `<img class="ci-emoji" src="${r.item.img}" alt="">`
          : `<div class="ci-emoji">${r.item.emoji}</div>`;
        c.innerHTML = `${emojiHtml}<div class="ci-name">${esc(r.item.name || cap(T.itemWord))}</div>`;
        win.appendChild(c);
        Sound.pop(); sparklesAt(c, T.fx.sparkle, 3);
      }, idx * 220);
    });
  }

  // customers
  const custRow = $("#customersRow"); custRow.innerHTML = "";
  const custEmojis = shuffle(["🧑‍🦰","👩‍🦱","🧓","👨‍🦱","👵","🧒","👦","👧","🧕","👨‍🦳","👩‍🦳"]).slice(0, 6);
  setTimeout(() => {
    custEmojis.forEach((ce, i) => {
      setTimeout(() => addCustomer(ce, custRow, i), i * 420);
    });
    Sound.applause();
  }, ins.length * 220 + 600);
  addShine(custRow.parentElement === null ? $("#customersRow") : $("#customersRow"));

  // hall of fame + awards + recap built after a beat
  setTimeout(() => { buildHallOfFame(); buildAwards(); buildRecap(); }, ins.length * 220 + 1200);
}
function addShine(el) {
  if (!el) return;
  const s = document.createElement("div");
  s.className = "shine-sweep";
  el.appendChild(s);
}
function addCustomer(emoji, row, i) {
  const liked = Math.random() < .7;
  const box = document.createElement("div");
  box.className = "customer-box";
  const bubbleHtml = `<div class="cust-bubble ${liked ? "" : "nah"}">${liked ? pick(T.reactions.like) : pick(T.reactions.dislike)}</div>`;
  box.innerHTML = `${bubbleHtml}<div class="customer-emoji">${emoji}</div>`;
  box.style.animationDelay = "0s";
  row.appendChild(box);
  if (liked) { Sound.pop(); Sound.tada(); sparklesAt(box, T.fx.sparkle, 3); }
  else { Sound.bonk(); floatFrom(pick(T.fx.nope), box); }
}

function hallData() {
  return state.players.map(p => {
    const liked = state.results.filter(r => r && r.verdict === "in" && r.likers.includes(p.name));
    return { player: p, items: liked.map(r => r.item) };
  });
}
function buildHallOfFame() {
  const wrap = $("#hallGrid"); wrap.innerHTML = "";
  $("#hallTitle").textContent = `🏆 Hall of Fame — "I like" Collections! 🏆`;
  hallData().forEach(({ player, items }, i) => {
    setTimeout(() => {
      const card = document.createElement("div");
      card.className = "hall-card"; card.style.setProperty("--hc", player.color);
      const itemsHtml = items.length
        ? items.map(it => `<span class="hall-pill" title="${esc(it.name || cap(T.itemWord))}">${it.img ? `<img src="${it.img}" alt="">` : it.emoji}</span>`).join("")
        : `<span class="hall-none">${esc(player.name)} liked nothing today! 😅</span>`;
      card.innerHTML = `
        <div class="hall-avatar">${AVATARS[player.avatar]}</div>
        <div class="hall-name">${esc(player.name)}</div>
        <div class="hall-count">liked ${items.length} ${items.length === 1 ? T.itemWord : T.itemWord + "s"}</div>
        <div class="hall-items">${itemsHtml}</div>`;
      wrap.appendChild(card);
      if (items.length) { Sound.pop(); sparklesAt(card, T.fx.sparkle, 2); }
    }, i * 300);
  });
}
function buildAwards() {
  const wrap = $("#awardGrid"); wrap.innerHTML = "";
  const data = hallData().filter(h => h.items.length);
  const awards = [];
  if (data.length) {
    const most = [...data].sort((a, b) => b.items.length - a.items.length)[0];
    awards.push({ emoji: "🍟", title: "Adventurous Eater", player: most.player.name, sub: `liked ${most.items.length} things!` });
    const least = [...data].sort((a, b) => a.items.length - b.items.length)[0];
    if (least.items.length < (state.players.length - 0)) {
      awards.push({ emoji: "😿", title: "Pickiest Eater", player: least.player.name, sub: `only liked ${least.items.length}!` });
    }
  }
  const ins = state.results.filter(r => r && r.verdict === "in");
  if (ins.length) {
    const top = ins.reduce((a, b) => (b.likes > a.likes ? b : a), ins[0]);
    awards.push({ emoji: "⭐", title: "Star " + cap(T.itemWord), player: top.item.name || cap(T.itemWord), sub: `${top.likes} votes!` });
  }
  if (!awards.length) awards.push({ emoji: "🤷", title: "Try Again Award", player: "Everyone", sub: "No winners today…" });
  $("#awardsTitle").textContent = `🎖️ Award Time! 🎖️`;
  awards.forEach((a, i) => {
    setTimeout(() => {
      const card = document.createElement("div");
      card.className = "award-card";
      card.innerHTML = `<div class="award-emoji">${a.emoji}</div><div class="award-title">${esc(a.title)}</div><div class="award-player">${esc(a.player)}</div><div class="award-sub">${esc(a.sub)}</div>`;
      wrap.appendChild(card);
      Sound.fanfare(); sparklesAt(card, "🏆", 3); confettiBurst(25);
    }, i * 800);
  });
}
function buildRecap() {
  const box = $("#recapBox"); box.innerHTML = "";
  $("#recapTitle").textContent = `📖 What did we say? Say it with me!`;
  const lines = [];
  state.results.forEach(r => {
    if (!r) return;
    const label = r.item.name || cap(T.itemWord);
    const emoji = r.item.img ? `<img src="${r.item.img}" alt="">` : r.item.emoji;
    if (r.verdict === "in") lines.push(`<div class="recap-line"><span class="r-emoji">${emoji}</span> “I like ${esc(label)}!”</div>`);
    else if (r.verdict === "out") lines.push(`<div class="recap-line dt"><span class="r-emoji">${emoji}</span> “I don't like ${esc(label)}.”</div>`);
  });
  if (!lines.length) lines.push(`<div class="recap-line">Hmm, nothing today? Try again!</div>`);
  else { lines.push(`<div class="recap-note">Read together, then tap the big button to play again! ▶️</div>`); }
  box.innerHTML = lines.join("");
}

/* ---------------- tray (live showcase during game) ---------------- */
function wireShowcaseTray() {
  $("#trayCloseBtn").onclick = () => setTray(false);
}
function setTray(on) {
  $("#showcaseTray").classList.toggle("show", on);
  document.body.classList.toggle("tray-open", on);
}

/* ---------------- wire up ---------------- */
function wireUp() {
  // theme screen
  buildThemeGrid();

  // setup
  $("#backToThemes").onclick = () => { Sound.whoosh(); showScreen("#screen-theme"); };
  $("#addPlayerBtn").onclick = addPlayer;
  $("#playerNameInput").addEventListener("keydown", e => { if (e.key === "Enter") addPlayer(); });
  $("#starterToggle").onclick = toggleStarters;
  wireUploads();
  $("#startGameBtn").onclick = () => { if (!$("#startGameBtn").disabled) startGame(); };

  // game
  $("#skipFoodBtn").onclick = skipFood;
  $("#dragHintBtn").onclick = () => startDragFromCentre();
  wireShowcaseTray();
  wireDragAndDrop();
  $("#verdictLikeBtn").onclick = () => {
    // counts as the class verdict button: every unvoted player votes like
    state.players.forEach((_, i) => { if (!state.itemVotes[i]) castVote(i, "like"); });
  };
  $("#verdictDislikeBtn").onclick = () => {
    state.players.forEach((_, i) => { if (!state.itemVotes[i]) castVote(i, "dislike"); });
  };

  // tie
  // (buttons wired dynamically in showVerdict)

  // finale
  $("#restartBtn").onclick = () => { Sound.doorOpen(); showScreen("#screen-setup"); renderItems(); updateStartBtn(); };
  $("#fullRestartBtn").onclick = () => {
    state.results = []; state.gameItems = []; state.currentIdx = -1;
    $("#showcaseTray .tray-items").innerHTML = "";
    Sound.whoosh();
    showScreen("#screen-theme");
    confettiBurst(30);
  };
  $("#hallBtn").onclick = () => { $("#hallOverlay").hidden = false; buildHall(); };
  $("#hallCloseBtn").onclick = () => { $("#hallOverlay").hidden = true; };

  // utilities
  $("#soundToggle").onclick = () => {
    Sound.on = !Sound.on;
    $("#soundToggle").textContent = Sound.on ? "🔊" : "🔇";
    if (Sound.on) Sound.pop();
  };
  $("#fullscreenToggle").onclick = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };
  document.addEventListener("keydown", e => {
    if (e.repeat) return;
    if (e.code === "Space" && $("#screen-game").classList.contains("active")) {
      e.preventDefault();
      const vc = $("#voteControls");
      if (vc && !vc.hidden) return; // already revealing
      nextFood();
    }
  });
}
function buildHall() {
  const wrap = $("#hallOverlayGrid"); wrap.innerHTML = "";
  hallData().forEach(({ player, items }) => {
    const card = document.createElement("div");
    card.className = "hall-card"; card.style.setProperty("--hc", player.color);
    card.innerHTML = `
      <div class="hall-avatar">${AVATARS[player.avatar]}</div>
      <div class="hall-name">${esc(player.name)}</div>
      <div class="hall-items">${items.map(it => `<span class="hall-pill" title="${esc(it.name || cap(T.itemWord))}">${it.img ? `<img src="${it.img}" alt="">` : it.emoji}</span>`).join("") || `<span class="hall-none">Nothing yet…</span>`}</div>`;
    wrap.appendChild(card);
  });
}

/* ---------------- drag & drop ---------------- */
let dragGhost = null;
function startDragFromCentre() {
  const disp = $("#itemDisplay");
  if (!disp) return;
  beginDrag({ emoji: getCurrentEmoji(), img: getCurrentImg() }, disp.getBoundingClientRect());
  // hide original while dragging? keep it visible but faded
  disp.style.opacity = ".35";
}
function getCurrentItem() {
  return state.gameItems[state.currentIdx];
}
function getCurrentEmoji() { const it = getCurrentItem(); return it && !it.img ? it.emoji : "🍽️"; }
function getCurrentImg() { const it = getCurrentItem(); return it && it.img ? it.img : null; }

function beginDrag(src, fromRect) {
  if (state.votesLocked || !getCurrentItem()) return;
  state.dragging = true;
  dragGhost = document.createElement(src.img ? "img" : "div");
  dragGhost.className = src.img ? "drag-ghost is-img" : "drag-ghost";
  if (src.img) dragGhost.src = src.img; else dragGhost.textContent = src.emoji;
  document.body.appendChild(dragGhost);
  buildPlateZone();
  $("#playerPlateZone").hidden = false;
  trashState(true);
  moveGhost({ clientX: fromRect.left + fromRect.width / 2, clientY: fromRect.top + fromRect.height / 2 });
}
function moveGhost(e) {
  if (!dragGhost) return;
  dragGhost.style.left = e.clientX + "px";
  dragGhost.style.top = e.clientY + "px";
  // hit tests
  const cards = $$("#playerPlateZone .dd-card");
  let overAny = false;
  cards.forEach(c => {
    const r = c.getBoundingClientRect();
    const inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
    c.classList.toggle("hot", inside);
    if (inside) overAny = true;
  });
  const tz = $("#trashZone .trash-body");
  if (tz) {
    const r = tz.getBoundingClientRect();
    const inside = e.clientX > r.left - 20 && e.clientX < r.right + 20 && e.clientY > r.top - 26 && e.clientY < r.bottom + 20;
    tz.classList.toggle("wiggle", inside);
    if (inside) overAny = true;
  }
}
function endDrag(e) {
  if (!state.dragging) return;
  state.dragging = false;
  if (dragGhost) { dragGhost.remove(); dragGhost = null; }
  // measure drop targets BEFORE hiding anything
  const dropIdx = getDropTarget(e);
  $("#playerPlateZone").hidden = true;
  trashState(false);
  $("#itemDisplay").style.opacity = "";
  if (dropIdx?.type === "player") { castVote(dropIdx.pi, "like"); return; }
  if (dropIdx?.type === "bin") {
    const unvoted = state.players.findIndex((_, i) => !state.itemVotes[i]);
    if (unvoted >= 0) castVote(unvoted, "dislike");
  }
}
function getDropTarget(e) {
  const cards = $$("#playerPlateZone .dd-card");
  for (const c of cards) {
    const r = c.getBoundingClientRect();
    if (r.width === 0) continue;
    if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) {
      return { type: "player", pi: +c.dataset.pi };
    }
  }
  const tz = $("#trashZone .trash-body");
  if (tz) {
    const r = tz.getBoundingClientRect();
    if (r.width > 0 && e.clientX > r.left - 20 && e.clientX < r.right + 20 && e.clientY > r.top - 26 && e.clientY < r.bottom + 20) {
      return { type: "bin" };
    }
  }
  return null;
}
function trashState(on) {
  const tz = $("#trashZone");
  if (!tz || tz.hidden === !on) return;
  tz.hidden = !on;
  $("#playerPlateZone")?.classList.toggle("has-trash", on);
  if (on) Sound.whoosh();
}
function buildPlateZone() {
  const zone = $("#playerPlateZone");
  zone.innerHTML = `<div class="drop-top-label">Drop on a friend who LIKES it! 👇 &nbsp;·&nbsp; or on the bin for NOPE 🗑️</div>`;
  const row = document.createElement("div"); row.className = "dd-cards-row";
  state.players.forEach((p, i) => {
    const voted = state.itemVotes[i];
    const card = document.createElement("div");
    card.className = "dd-card"; card.dataset.pi = i;
    card.style.setProperty("--rowColor", p.color);
    card.innerHTML = `
      <div class="dd-avatar">${AVATARS[p.avatar]}</div>
      <div class="dd-name">${esc(p.name)}</div>
      <div class="dd-likes">${voted === "like" ? "😋 already!" : voted === "dislike" ? "🤢 already!" : "👍?"}</div>`;
    row.appendChild(card);
  });
  zone.appendChild(row);
}
function wireDragAndDrop() {
  // mouse
  document.addEventListener("mousedown", (e) => {
    if (e.target.closest("#dragHintBtn") || e.target.closest("#itemDisplay")) {
      e.preventDefault();
      startDragFromCentre();
    }
  });
  document.addEventListener("mousemove", (e) => { if (state.dragging) { e.preventDefault(); moveGhost(e); } });
  document.addEventListener("mouseup", (e) => { if (state.dragging) endDrag(e); });
  // touch
  document.addEventListener("touchstart", (e) => {
    if (e.target.closest("#dragHintBtn") || e.target.closest("#itemDisplay")) {
      const t = e.touches[0];
      startDragFromCentre();
      // prevent scroll
      e.preventDefault();
      moveGhost(t);
    }
  }, { passive: false });
  document.addEventListener("touchmove", (e) => {
    if (state.dragging) { e.preventDefault(); moveGhost(e.touches[0]); }
  }, { passive: false });
  document.addEventListener("touchend", (e) => {
    if (state.dragging) {
      const t = e.changedTouches[0];
      endDrag(t);
    }
  });
}

/* ---------------- boot ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  document.body.dataset.theme = state.chosenTheme;
  T = THEMES[state.chosenTheme];
  confettiColors = T.fx.conf;
  $("#themeMastEmoji").textContent = T.card.emoji;
  $(".game-title").textContent = T.venue;
  bgDecorInit();
  // prefill setup with saved players so it's ready to go
  applyThemeToSetup();
  state.items = [];
  loadCustomItems().forEach(c => state.items.push({ id: "c_" + Math.random().toString(36).slice(2, 9), name: c.name, img: c.img, custom: true }));
  renderPlayers(); renderItems(); updateStartBtn();
  wireUp();
});
