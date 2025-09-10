/* src/main.js - optimized game loop and DOM interactions (complete) */
document.addEventListener('DOMContentLoaded', () => {
  // Elements
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

  // Game state
  let elixir = 5, aiElixir = 5, maxElixir = 10;
  let selectedTroop = null;
  let gameTime = 180;
  let gameObjects = []; // objects {id, el, x,y, ...}
  let nextId = 0;
  const DECK_SIZE = 8, HAND_SIZE = 4;
  let playerDeck = [], playerDeckFull = [], playerHand = [], drawPile = [];

  // intervals
  let elixirInterval = null;
  let aiInterval = null;
  let lastTimestamp = performance.now();
  let running = false;

  // Full CARD_DATA (kept from original)
  const CARD_DATA = {
    knight: { cardType: 'troop', name: 'Knight', emoji: '⚔️', cost: 3, hp: 155, damage: 20, range: 1.5, speed: 1.2, type: 'ground', attackSpeed: 1200 },
    archer: { cardType: 'troop', name: 'Archer', emoji: '🏹', cost: 3, hp: 65, damage: 13, range: 5, speed: 1.2, type: 'ground', attackSpeed: 1000 },
    giant: { cardType: 'troop', name: 'Giant', emoji: '🗿', cost: 5, hp: 500, damage: 28, range: 1.5, speed: 0.8, type: 'ground', targets: 'buildings', attackSpeed: 1700 },
    dragon: { cardType: 'troop', name: 'Dragon', emoji: '🐉', cost: 4, hp: 160, damage: 28, range: 4, speed: 1.4, type: 'air', attackSpeed: 1600, splashDamage: true, splashRadius: 10 },
    pekka: { cardType: 'troop', name: 'P.E.K.K.A', emoji: '🤖', cost: 7, hp: 650, damage: 120, range: 1.6, speed: 0.7, type: 'ground', attackSpeed: 1900 },
    wizard: { cardType: 'troop', name: 'Wizard', emoji: '🧙', cost: 5, hp: 110, damage: 45, range: 5.5, speed: 1.1, type: 'ground', attackSpeed: 1600, splashDamage: true, splashRadius: 15 },
    golem: { cardType: 'troop', name: 'Golem', emoji: '🪨', cost: 8, hp: 850, damage: 40, range: 1.5, speed: 0.6, type: 'ground', targets: 'buildings', attackSpeed: 2500 },
    minions: { cardType: 'troop', name: 'Minions', emoji: '🦇', cost: 3, hp: 48, damage: 16, range: 2.5, speed: 1.8, type: 'air', spawnCount: 3, spawnRadius: 15, attackSpeed: 1000 },
    hogRider: { cardType: 'troop', name: 'Hog Rider', emoji: '🐗', cost: 4, hp: 220, damage: 45, range: 1.5, speed: 2.2, type: 'ground', targets: 'buildings', attackSpeed: 1600 },
    musketeer: { cardType: 'troop', name: 'Musketeer', emoji: '💂‍♀️', cost: 4, hp: 120, damage: 40, range: 6, speed: 1.1, type: 'ground', attackSpeed: 1200 },
    valkyrie: { cardType: 'troop', name: 'Valkyrie', emoji: '👩‍🦰', cost: 4, hp: 190, damage: 32, range: 1.5, speed: 1.3, type: 'ground', attackSpeed: 1500, attackType: 'melee-splash' },
    goblins: { cardType: 'troop', name: 'Goblins', emoji: '👺', cost: 2, hp: 38, damage: 13, range: 1.5, speed: 2.0, type: 'ground', spawnCount: 3, spawnRadius: 10, attackSpeed: 1100 },
    skeletons: { cardType: 'troop', name: 'Skeletons', emoji: '💀', cost: 1, hp: 16, damage: 6, range: 1.5, speed: 1.9, type: 'ground', spawnCount: 4, spawnRadius: 10, attackSpeed: 1000 },
    spearGoblins: { cardType: 'troop', name: 'Spear Goblins', emoji: '🔱', cost: 2, hp: 28, damage: 9, range: 5, speed: 2.0, type: 'ground', spawnCount: 3, spawnRadius: 10, attackSpeed: 1200 },
    bomber: { cardType: 'troop', name: 'Bomber', emoji: '💣', cost: 2, hp: 45, damage: 30, range: 4.5, speed: 1.2, type: 'ground', attackSpeed: 1800, splashDamage: true, splashRadius: 12 },
    miniPekka: { cardType: 'troop', name: 'Mini P.E.K.K.A', emoji: '⚙️', cost: 4, hp: 300, damage: 90, range: 1.5, speed: 1.5, type: 'ground', attackSpeed: 1700 },
    prince: { cardType: 'troop', name: 'Prince', emoji: '🐴', cost: 5, hp: 320, damage: 65, range: 1.6, speed: 1.7, type: 'ground', attackSpeed: 1500, canCharge: true },
    eliteBarbarians: { cardType: 'troop', name: 'Elite Barbarians', emoji: '💪', cost: 6, hp: 220, damage: 42, range: 1.5, speed: 2.1, type: 'ground', spawnCount: 2, spawnRadius: 5, attackSpeed: 1500 },
    royalGiant: { cardType: 'troop', name: 'Royal Giant', emoji: '👑', cost: 6, hp: 550, damage: 35, range: 6.0, speed: 0.7, type: 'ground', targets: 'buildings', attackSpeed: 1800 },
    megaMinion: { cardType: 'troop', name: 'Mega Minion', emoji: '👿', cost: 3, hp: 130, damage: 35, range: 2.5, speed: 1.4, type: 'air', attackSpeed: 1500 },
    iceGolem: { cardType: 'troop', name: 'Ice Golem', emoji: '🧊', cost: 2, hp: 280, damage: 10, range: 1.5, speed: 0.9, type: 'ground', targets: 'buildings', attackSpeed: 2500 },
    dartGoblin: { cardType: 'troop', name: 'Dart Goblin', emoji: '🎯', cost: 3, hp: 55, damage: 11, range: 6.5, speed: 2.0, type: 'ground', attackSpeed: 700 },
    witch: { cardType: 'troop', name: 'Witch', emoji: '🧹', cost: 5, hp: 130, damage: 18, range: 5, speed: 1.1, type: 'ground', attackSpeed: 1100, splashDamage: true, splashRadius: 8, spawnId: 'skeletons', spawnSpeed: 7000 },
    electroWizard: { cardType: 'troop', name: 'E. Wizard', emoji: '⚡️🧙', cost: 4, hp: 110, damage: 18, range: 5, speed: 1.2, type: 'ground', attackSpeed: 1800, stunDuration: 500 },
    goblinGang: { cardType: 'troop', name: 'Goblin Gang', emoji: ' Gang ', cost: 3, spawnIds: [{id: 'goblins', count: 2}, {id: 'spearGoblins', count: 2}], type: 'ground' },

    // Spells
    fireball: { cardType: 'spell', name: 'Fireball', emoji: '🔥', cost: 4, damage: 70, radius: 15 },
    arrows: { cardType: 'spell', name: 'Arrows', emoji: '🎯', cost: 3, damage: 35, radius: 25 },
    zap: { cardType: 'spell', name: 'Zap', emoji: '⚡️', cost: 2, damage: 25, radius: 12, stunDuration: 500 },
    rage: { cardType: 'spell', name: 'Rage', emoji: '😡', cost: 2, radius: 20, duration: 6000, speedBoost: 1.35, attackSpeedBoost: 1.35 },
    freeze: { cardType: 'spell', name: 'Freeze', emoji: '🥶', cost: 4, radius: 20, duration: 3500 },
    theLog: { cardType: 'spell', name: 'The Log', emoji: '🌲', cost: 2, damage: 30, width: 20, type: 'groundOnly' },

    // Buildings
    cannon: { cardType: 'building', name: 'Cannon', emoji: '💣', cost: 3, hp: 280, damage: 35, range: 5.5, attackSpeed: 1100, lifetime: 30, targets: 'ground' },
    tombstone: { cardType: 'building', name: 'Tombstone', emoji: '🪦', cost: 3, hp: 220, lifetime: 40, spawnSpeed: 2900, spawnId: 'skeletons', spawnOnDeath: 4 },
    infernoTower: { cardType: 'building', name: 'Inferno Tower', emoji: '🔥🗼', cost: 5, hp: 350, damage: 12, damageRamp: 1.25, maxDamage: 180, range: 6, attackSpeed: 400, lifetime: 40, targets: 'any' },
    goblinHut: { cardType: 'building', name: 'Goblin Hut', emoji: '🛖', cost: 5, hp: 300, lifetime: 50, spawnSpeed: 4900, spawnId: 'spearGoblins' },
    bombTower: { cardType: 'building', name: 'Bomb Tower', emoji: '💣🗼', cost: 4, hp: 380, damage: 45, range: 5, attackSpeed: 1600, lifetime: 35, targets: 'ground', splashDamage: true, splashRadius: 15 }
  };

  // Small helper caches used by renderer to avoid repeated DOM reads:
  const cache = {
    boardRect: null,
    lastUI: { elixir: null, playerTowers: null, aiTowers: null }
  };

  // ----------------- Utilities -----------------
  function createEl(className) { const d = document.createElement('div'); d.className = className; return d; }
  function createHealthBar() {
    const bar = createEl('health-bar');
    const inner = createEl('health-bar-inner');
    bar.appendChild(inner);
    return { bar, inner };
  }

  // ----------------- Object creation -----------------
  function createTower(owner, type, x, y, hp) {
    const tower = {
      id: nextId++,
      objType: 'tower',
      owner, type, x, y, hp, maxHp: hp,
      damage: type === 'king' ? 25 : 20,
      range: 2.4,
      attackSpeed: 2000,
      lastAttack: 0,
      isActivated: type === 'king' ? false : true,
      el: createEl(`tower ${owner} ${type}-tower w-[12%] h-[12%]`)
    };
    setupEntityElement(tower);
    if (owner === 'player') tower.el.style.backgroundColor = '#87CEEB';
    if (owner === 'ai') tower.el.style.backgroundColor = '#F08080';
    gameObjects.push(tower);
  }

  function setupEntityElement(entity) {
    const el = entity.el;
    el.style.position = 'absolute';
    el.style.left = '0';
    el.style.top = '0';
    el.style.transform = 'translate(-50%,-50%)';
    const hb = createHealthBar();
    el.appendChild(hb.bar);
    entity.healthBarInner = hb.inner;
    gameBoard.appendChild(el);
    updateEntityVisual(entity);
  }

  function createSingleTroop(owner, troopId, x, y) {
    const data = CARD_DATA[troopId];
    const troop = Object.assign({
      id: nextId++,
      objType: 'troop',
      owner, troopId, x, y,
      hp: data.hp, maxHp: data.hp,
      target: null, lastAttack: 0, isCharging: false,
      frozenUntil: 0, stunnedUntil: 0, rageUntil: 0,
      originalSpeed: data.speed, originalAttackSpeed: data.attackSpeed,
      el: createEl('troop w-10 h-10')
    }, data);
    troop.el.innerHTML = data.emoji;
    if (owner === 'player') {
      troop.el.style.backgroundColor = 'rgba(135,206,250,0.7)';
      troop.el.style.border = '2px solid #4682B4';
    } else {
      troop.el.style.backgroundColor = 'rgba(240,128,128,0.7)';
      troop.el.style.border = '2px solid #CD5C5C';
    }
    setupEntityElement(troop);
    gameObjects.push(troop);
  }

  // ----------------- Drawing & animation helpers -----------------
  function updateEntityVisual(entity) {
    if (!cache.boardRect) cache.boardRect = gameBoard.getBoundingClientRect();
    const br = cache.boardRect;
    const px = br.width * (entity.x / 100);
    const py = br.height * (entity.y / 100);
    entity.el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%,-50%)`;
    const healthPercentage = Math.max(0, Math.min(100, (entity.hp / entity.maxHp) * 100));
    entity.healthBarInner.style.width = `${healthPercentage}%`;
  }

  function getDistance(a,b){
    if(!a || !b) return Infinity;
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx*dx + dy*dy);
  }

  // ----------------- Projectile (optimized) -----------------
  function createProjectile(startObj, endObj) {
    if (!cache.boardRect) cache.boardRect = gameBoard.getBoundingClientRect();
    const br = cache.boardRect;
    const startX = br.width * (startObj.x / 100);
    const startY = br.height * (startObj.y / 100);
    const endX = br.width * (endObj.x / 100);
    const endY = br.height * (endObj.y / 100);

    const p = createEl('projectile');
    p.style.left = `${startX}px`;
    p.style.top = `${startY}px`;
    p.style.transform = 'translate(-50%,-50%)';
    gameBoard.appendChild(p);

    requestAnimationFrame(() => {
      p.style.transform = `translate(${endX - startX}px, ${endY - startY}px) translate(-50%,-50%)`;
      p.style.opacity = '0';
    });

    setTimeout(() => {
      p.remove();
      if (startObj.splashDamage) dealSplashDamage(startObj, endObj);
      else dealSingleDamage(startObj, endObj);
    }, 300);
  }

  // ----------------- Interaction -----------------
  gameBoard.addEventListener('click', (e) => {
    if (!selectedTroop) return;
    const cardData = CARD_DATA[selectedTroop];
    if (!cardData || elixir < cardData.cost) return;

    cache.boardRect = gameBoard.getBoundingClientRect();
    const rect = cache.boardRect;
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    if ((cardData.cardType === 'troop' || cardData.cardType === 'building')) {
      if (y < 55) return;
      elixir -= cardData.cost;
      if (cardData.cardType === 'troop') createTroop('player', selectedTroop, x, y);
      else createBuilding('player', selectedTroop, x, y);
    } else if (cardData.cardType === 'spell') {
      elixir -= cardData.cost;
      castSpell('player', selectedTroop, x, y);
    }

    cycleCard(selectedTroop);
    selectedTroop = null;
    const selectedCardEl = cardHandEl.querySelector('.selected');
    if (selectedCardEl) selectedCardEl.classList.remove('selected');
    drawCards();
    updateUI(true);
  });

  function cycleCard(playedCardId) {
    const idx = playerHand.indexOf(playedCardId);
    if (idx > -1) {
      const played = playerHand.splice(idx,1)[0];
      drawPile.push(played);
      const next = drawPile.shift();
      if(next) playerHand.push(next);
    }
  }

  function createTroop(owner, troopId, x, y) {
    const def = CARD_DATA[troopId];
    if (def.spawnIds) {
      def.spawnIds.forEach(sp => {
        for(let i=0;i<sp.count;i++) createTroop(owner, sp.id, x, y);
      });
      return;
    }
    if (def.spawnCount > 1) {
      for (let i=0;i<def.spawnCount;i++) {
        const angle = Math.random()*Math.PI*2;
        const radius = Math.random()*(def.spawnRadius||10);
        const spawnX = x + (radius / 100) * Math.cos(angle);
        const spawnY = y + (radius / 100) * Math.sin(angle);
        createSingleTroop(owner, troopId, spawnX, spawnY);
      }
      return;
    }
    createSingleTroop(owner, troopId, x, y);
  }

  function createBuilding(owner, buildingId, x, y) {
    const data = CARD_DATA[buildingId];
    const building = Object.assign({
      id: nextId++,
      objType: 'building',
      owner, buildingId, x, y,
      hp: data.hp, maxHp: data.hp, target: null,
      lastAttack: 0, lastSpawn: Date.now(), currentDamage: data.damage, currentTargetId: null,
      el: createEl('building w-[10%] h-[10%]')
    }, data);
    building.el.innerHTML = data.emoji;
    if(owner==='player') building.el.style.backgroundColor = '#87CEEB';
    if(owner==='ai') building.el.style.backgroundColor = '#F08080';
    setupEntityElement(building);
    gameObjects.push(building);
  }

  function castSpell(owner, spellId, x, y) {
    const spellData = CARD_DATA[spellId];
    const opponent = owner === 'player' ? 'ai' : 'player';
    const el = createEl('absolute border-4 rounded-full');
    el.style.left = `${x}%`; el.style.top = `${y}%`;
    el.style.width = `${spellData.radius*2}%`; el.style.height = `${spellData.radius*2}%`;
    el.style.transform = 'translate(-50%,-50%) scale(0.5)'; el.style.opacity = '1'; el.style.pointerEvents='none';
    if (spellId === 'fireball') el.style.borderColor = 'rgba(255,100,0,0.8)';
    if (spellId === 'freeze') el.style.borderColor = 'rgba(173,216,230,0.8)';
    gameBoard.appendChild(el);
    requestAnimationFrame(()=>{ el.style.transform='translate(-50%,-50%) scale(1)'; el.style.opacity='0'; });
    setTimeout(()=>el.remove(), 300);

    if (spellId === 'theLog') {
      const targets = gameObjects.filter(o => o.owner === opponent && o.hp>0 && o.type!=='air');
      targets.forEach(t => {
        const isinX = Math.abs(t.x - x) < spellData.width/2;
        const isinY = owner === 'player' ? (t.y < y) : (t.y > y);
        if (isinX && isinY) dealSingleDamage({damage: spellData.damage}, t);
      });
      return;
    }

    if (spellId === 'rage' || spellId === 'freeze') {
      const radius = spellData.radius;
      const now = Date.now();
      gameObjects.forEach(target=>{
        if (target.hp<=0) return;
        if (getDistance({x,y}, target) <= radius) {
          if (spellId === 'rage' && target.owner === owner) {
            target.rageUntil = now + spellData.duration;
            target.speed = target.originalSpeed * spellData.speedBoost;
            target.attackSpeed = target.originalAttackSpeed / spellData.attackSpeedBoost;
          } else if (spellId === 'freeze') {
            target.frozenUntil = now + spellData.duration;
          }
        }
      });
      return;
    }

    gameObjects.filter(o=>o.owner===opponent && o.hp>0).forEach(target=>{
      if (getDistance({x,y}, target) <= spellData.radius) {
        dealSingleDamage({damage: spellData.damage, stunDuration: spellData.stunDuration || 0}, target);
      }
    });
  }

  // ----------------- Combat helpers -----------------
  function dealSingleDamage(attacker, target) {
    if (!target) return;
    target.hp -= attacker.damage;
    if (attacker.stunDuration) target.stunnedUntil = Date.now() + attacker.stunDuration;
    target.el.style.filter = 'brightness(2)';
    setTimeout(()=>{ if (target.el) target.el.style.filter = ''; }, 100);
  }

  function dealSplashDamage(attacker, primaryTarget) {
    if (!primaryTarget) return;
    const enemies = gameObjects.filter(o => o.owner !== attacker.owner && o.hp > 0);
    enemies.forEach(enemy => {
      if (getDistance(primaryTarget, enemy) < (attacker.splashRadius || 0)) {
        dealSingleDamage(attacker, enemy);
      }
    });
  }

  function findTarget(attacker) {
    let potential = gameObjects.filter(obj => obj.owner !== attacker.owner && obj.hp > 0 && (obj.objType === 'troop' || obj.objType === 'tower' || obj.objType === 'building'));
    if (attacker.objType === 'tower' || (attacker.objType === 'building' && attacker.damage > 0)) {
      if (attacker.targets !== 'any') {
        potential = potential.filter(o => o.objType === 'troop' && (attacker.targets !== 'ground' || o.type !== 'air'));
      }
    }
    if (attacker.targets === 'buildings') {
      const buildings = potential.filter(t => t.objType === 'tower' || t.objType === 'building');
      if (buildings.length) potential = buildings;
    }
    let minD = Infinity, closest = null;
    for (let i=0;i<potential.length;i++){
      const t = potential[i];
      const d = getDistance(attacker, t);
      if (d < minD) { minD = d; closest = t; }
    }
    attacker.target = closest;
  }

  function move(obj, target, dtMultiplier = 1) {
    const angle = Math.atan2(target.y - obj.y, target.x - obj.x);
    const distance = (obj.speed || 0.9) * 0.2 * dtMultiplier;
    obj.x += Math.cos(angle) * distance;
    obj.y += Math.sin(angle) * distance;
    if (obj.canCharge) {
      obj.chargeDistance = (obj.chargeDistance || 0) + distance;
      if (obj.chargeDistance > 30 && !obj.isCharging) {
        obj.isCharging = true;
        obj.el.style.boxShadow = '0 0 20px rgba(255,100,255,0.9)';
      }
    }
  }

  function attack(attacker, target) {
    if(!target) return;
    const now = Date.now();
    const attackSpeed = attacker.attackSpeed || 1500;
    if (now - (attacker.lastAttack||0) > attackSpeed) {
      attacker.lastAttack = now;
      let damage = attacker.damage;
      if (attacker.isCharging) damage *= 2;
      if (attacker.damageRamp) {
        if (attacker.currentTargetId === target.id) {
          attacker.currentDamage = Math.min(attacker.maxDamage||attacker.damage, (attacker.currentDamage||attacker.damage) * attacker.damageRamp);
        } else {
          attacker.currentDamage = attacker.damage;
        }
        damage = attacker.currentDamage;
        attacker.currentTargetId = target.id;
      }
      if (attacker.attackType === 'melee-splash') {
        const enemies = gameObjects.filter(o => o.owner !== attacker.owner && o.hp > 0);
        enemies.forEach(enemy => {
          if (getDistance(attacker, enemy) <= (attacker.range||1.5) * 10) dealSingleDamage({damage}, enemy);
        });
      } else if ((attacker.range||0) > 2) {
        createProjectile(attacker, target);
      } else {
        dealSingleDamage({damage}, target);
      }
    }
  }

  // ----------------- Game loop (rAF + delta) -----------------
  function gameLoopRaf(timestamp) {
    if (!running) return;
    const dt = Math.min(40, timestamp - lastTimestamp);
    lastTimestamp = timestamp;
    const dtMulti
