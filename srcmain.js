/* src/main.js */
document.addEventListener('DOMContentLoaded', () => {
  // ---------------- Elements ----------------
  const gameBoard = document.getElementById('game-board');
  const elixirBarFill = document.getElementById('elixir-bar-fill');
  const elixirCountEl = document.getElementById('elixir-count');
  const cardHandEl = document.getElementById('card-hand');
  const timerEl = document.getElementById('timer');
  const playerTowersEl = document.getElementById('player-towers');
  const aiTowersEl = document.getElementById('ai-towers');

  const messageModal = document.getElementById('message-modal');
  const messageTitle = document.getElementById('message-title');
  const messageText = document.getElementById('message-text');
  const restartButton = document.getElementById('restart-button');

  const deckBuilderModal = document.getElementById('deck-builder-modal');
  const currentDeckEl = document.getElementById('current-deck');
  const cardCollectionEl = document.getElementById('card-collection');
  const startBattleButton = document.getElementById('start-battle-button');
  const deckCountEl = document.getElementById('deck-count');

  // ---------------- Game state ----------------
  let elixir = 5, aiElixir = 5, maxElixir = 10;
  let selectedTroop = null;
  let gameTime = 180;
  let gameObjects = [];
  let nextId = 0;
  const DECK_SIZE = 8, HAND_SIZE = 4;
  let playerDeckFull = [];
  let playerDeck = [];
  let playerHand = [];
  let drawPile = [];
  let running = false;
  let lastTimestamp = performance.now();

  // ---------------- Card data ----------------
  const CARD_DATA = {
    knight: { cardType: 'troop', name: 'Knight', emoji: '⚔️', cost: 3, hp: 155, damage: 20, range: 1.5, speed: 1.2, type: 'ground', attackSpeed: 1200 },
    archer: { cardType: 'troop', name: 'Archer', emoji: '🏹', cost: 3, hp: 65, damage: 13, range: 5, speed: 1.2, type: 'ground', attackSpeed: 1000 },
    giant: { cardType: 'troop', name: 'Giant', emoji: '🗿', cost: 5, hp: 500, damage: 28, range: 1.5, speed: 0.8, type: 'ground', targets: 'buildings', attackSpeed: 1700 },
    fireball: { cardType: 'spell', name: 'Fireball', emoji: '🔥', cost: 4, damage: 70, radius: 15 },
    arrows: { cardType: 'spell', name: 'Arrows', emoji: '🎯', cost: 3, damage: 35, radius: 25 }
    // Add more cards as needed
  };

  const cache = { boardRect: null, lastUI: { elixir: null, playerTowers: null, aiTowers: null } };

  // ---------------- Utilities ----------------
  const createEl = className => { const d = document.createElement('div'); d.className = className; return d; };
  const createHealthBar = () => {
    const bar = createEl('health-bar');
    const inner = createEl('health-bar-inner');
    bar.appendChild(inner);
    return { bar, inner };
  };

  function setupEntityElement(entity) {
    entity.el.style.position = 'absolute';
    entity.el.style.transform = 'translate(-50%,-50%)';
    const hb = createHealthBar();
    entity.el.appendChild(hb.bar);
    entity.healthBarInner = hb.inner;
    gameBoard.appendChild(entity.el);
    updateEntityVisual(entity);
  }

  function updateEntityVisual(entity) {
    if (!cache.boardRect) cache.boardRect = gameBoard.getBoundingClientRect();
    const br = cache.boardRect;
    const px = br.width * (entity.x / 100);
    const py = br.height * (entity.y / 100);
    entity.el.style.transform = `translate3d(${px}px,${py}px,0) translate(-50%,-50%)`;
    if(entity.healthBarInner) {
      const perc = Math.max(0, Math.min(100, (entity.hp / entity.maxHp) * 100));
      entity.healthBarInner.style.width = `${perc}%`;
    }
  }

  function getDistance(a,b){ if(!a||!b) return Infinity; return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2); }

  function createSingleTroop(owner, troopId, x, y) {
    const data = CARD_DATA[troopId];
    if(!data) return;
    const troop = { id: nextId++, objType:'troop', owner, troopId, x, y,
      hp:data.hp, maxHp:data.hp, target:null, lastAttack:0, el:createEl('troop w-12 h-12') };
    troop.el.innerHTML = data.emoji;
    troop.el.style.backgroundColor = owner==='player'?'rgba(135,206,250,0.7)':'rgba(240,128,128,0.7)';
    troop.el.style.border = owner==='player'?'2px solid #4682B4':'2px solid #CD5C5C';
    setupEntityElement(troop);
    gameObjects.push(troop);
  }

  function createTroop(owner, troopId, x, y) { createSingleTroop(owner,troopId,x,y); }

  // ----------------- Deck Builder -----------------
  function renderCollection() {
    cardCollectionEl.innerHTML = '';
    Object.keys(CARD_DATA).forEach(id=>{
      const card = createEl('card');
      card.dataset.id = id;
      card.innerHTML = `<div class="text-2xl">${CARD_DATA[id].emoji}</div><div class="text-sm mt-1">${CARD_DATA[id].name} (${CARD_DATA[id].cost})</div>`;
      card.addEventListener('click',()=>addCardToDeck(id));
      cardCollectionEl.appendChild(card);
    });
  }

  function renderDeck() {
    currentDeckEl.innerHTML = '';
    playerDeckFull.forEach((id,index)=>{
      const card = createEl('card');
      card.innerHTML = `<div class="text-2xl">${CARD_DATA[id].emoji}</div><div class="text-sm mt-1">${CARD_DATA[id].name}</div>`;
      card.addEventListener('click',()=>removeCardFromDeck(index));
      currentDeckEl.appendChild(card);
    });
    deckCountEl.textContent = playerDeckFull.length;
    startBattleButton.disabled = playerDeckFull.length!==DECK_SIZE;
  }

  function addCardToDeck(id){
    if(playerDeckFull.length>=DECK_SIZE) return;
    playerDeckFull.push(id);
    renderDeck();
  }

  function removeCardFromDeck(index){
    playerDeckFull.splice(index,1);
    renderDeck();
  }

  startBattleButton.addEventListener('click',()=>{
    playerDeck = [...playerDeckFull];
    playerHand = playerDeck.slice(0,HAND_SIZE);
    drawPile = playerDeck.slice(HAND_SIZE);
    deckBuilderModal.classList.add('hidden');
    running = true;
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoopRaf);
    drawCards();
  });

  function drawCards(){
    cardHandEl.innerHTML='';
    playerHand.forEach(id=>{
      const card = createEl('card');
      card.dataset.id=id;
      const data = CARD_DATA[id];
      card.innerHTML=`<div class="text-3xl">${data.emoji}</div><div class="text-sm mt-1">${data.name}</div>`;
      if(data.cost>elixir) card.classList.add('disabled');
      card.addEventListener('click',()=>{ selectedTroop=id; });
      cardHandEl.appendChild(card);
    });
  }

  function cycleCard(playedCardId){
    const idx = playerHand.indexOf(playedCardId);
    if(idx>-1){
      const played = playerHand.splice(idx,1)[0];
      drawPile.push(played);
      const next = drawPile.shift();
      if(next) playerHand.push(next);
    }
  }

  function updateUI(force=false){
    if(force || cache.lastUI.elixir!==elixir){
      elixirBarFill.style.width = `${(elixir/maxElixir)*100}%`;
      elixirCountEl.textContent = elixir;
      cache.lastUI.elixir = elixir;
      drawCards();
    }
    if(force || cache.lastUI.playerTowers!==3){
      playerTowersEl.textContent=3;
      aiTowersEl.textContent=3;
      cache.lastUI.playerTowers=3;
      cache.lastUI.aiTowers=3;
    }
  }

  function gameLoopRaf(timestamp){
    if(!running) return;
    const dt=Math.min(40,timestamp-lastTimestamp);
    lastTimestamp=timestamp;
    gameObjects.forEach(updateEntityVisual);
    if(gameTime>0){
      gameTime-=dt/1000;
      timerEl.textContent=Math.ceil(gameTime);
      requestAnimationFrame(gameLoopRaf);
    } else endGame("Time's Up!","Draw!");
  }

  function endGame(title,text){
    running=false;
    messageTitle.textContent=title;
    messageText.textContent=text;
    messageModal.classList.remove('hidden');
  }

  restartButton.addEventListener('click',()=>location.reload());

  renderCollection();
});
