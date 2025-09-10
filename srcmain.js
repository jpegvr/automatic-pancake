/* Complete Tower Duel JS - Deck builder, multiple decks, title screen, battle, all cards */
document.addEventListener('DOMContentLoaded', () => {

  // -------------------- Elements --------------------
  const titleScreen = document.getElementById('title-screen');
  const startButton = document.getElementById('start-button');
  const deckButton = document.getElementById('deck-button');

  const gameContainer = document.getElementById('game-container');
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
  const deckCountEl = document.getElementById('deck-count');
  const startBattleButton = document.getElementById('start-battle-button');
  const deckTabs = document.querySelectorAll('.deck-tab');

  // -------------------- Cards --------------------
  const allCards = [
    {name:'Knight', emoji:'🗡️', cost:3, type:'troop', hp:300, dmg:50, speed:1},
    {name:'Archers', emoji:'🏹', cost:3, type:'troop', hp:150, dmg:25, speed:1.5},
    {name:'Giant', emoji:'💪', cost:5, type:'troop', hp:600, dmg:60, speed:0.7},
    {name:'Goblin', emoji:'👹', cost:2, type:'troop', hp:100, dmg:20, speed:2},
    {name:'Valkyrie', emoji:'🪓', cost:4, type:'troop', hp:400, dmg:50, speed:1},
    {name:'Baby Dragon', emoji:'🐉', cost:4, type:'troop', hp:300, dmg:40, speed:1},
    {name:'Wizard', emoji:'🔥', cost:5, type:'troop', hp:250, dmg:80, speed:1},
    {name:'Prince', emoji:'🏇', cost:5, type:'troop', hp:350, dmg:70, speed:1.2},
    {name:'Hog Rider', emoji:'🏹🐴', cost:4, type:'troop', hp:300, dmg:50, speed:1.5},
    {name:'Cannon', emoji:'🛡️', cost:3, type:'building', hp:500, dmg:30, speed:1},
    {name:'Tesla', emoji:'⚡', cost:4, type:'building', hp:400, dmg:40, speed:1},
    {name:'Arrows', emoji:'🏹💨', cost:3, type:'spell', hp:0, dmg:100, speed:0},
    {name:'Fireball', emoji:'🔥💥', cost:4, type:'spell', hp:0, dmg:150, speed:0},
    {name:'Zap', emoji:'⚡💥', cost:2, type:'spell', hp:0, dmg:50, speed:0},
    {name:'Ice Spirit', emoji:'❄️', cost:1, type:'troop', hp:100, dmg:20, speed:2},
    {name:'Skeletons', emoji:'💀', cost:1, type:'troop', hp:50, dmg:15, speed:2.5},
    {name:'Mega Minion', emoji:'🦇', cost:3, type:'troop', hp:200, dmg:60, speed:1.5},
    {name:'Mini P.E.K.K.A', emoji:'🤖', cost:4, type:'troop', hp:400, dmg:120, speed:1},
    {name:'Balloon', emoji:'🎈💣', cost:5, type:'troop', hp:250, dmg:200, speed:1},
    {name:'Goblins Barrel', emoji:'🛢️👹', cost:3, type:'spell', hp:0, dmg:50, speed:0},
    {name:'Lightning', emoji:'⚡💥⚡', cost:6, type:'spell', hp:0, dmg:300, speed:0},
    {name:'Miner', emoji:'⛏️', cost:3, type:'troop', hp:250, dmg:60, speed:1.5},
    {name:'Elixir Collector', emoji:'🧪', cost:6, type:'building', hp:500, dmg:0, speed:0},
    {name:'Baby Dragon', emoji:'🐲', cost:4, type:'troop', hp:300, dmg:40, speed:1},
    // you can add even more cards here; currently 24+
  ];

  // -------------------- State --------------------
  let currentDeck = 0;
  const decks = [[], [], []];
  let hand = [];
  let elixir = 3;
  let elixirMax = 10;
  let gameTimer = 180;
  let timerInterval;
  let playerTowers = 3;
  let aiTowers = 3;

  // -------------------- Deck Builder --------------------
  function renderDeck() {
    currentDeckEl.innerHTML = '';
    decks[currentDeck].forEach((card,i)=>{
      const div = document.createElement('div');
      div.className = 'card';
      div.textContent = card.emoji;
      div.title = card.name;
      div.addEventListener('click',()=>{ decks[currentDeck].splice(i,1); renderDeck(); });
      currentDeckEl.appendChild(div);
    });
    deckCountEl.textContent = decks[currentDeck].length;
    startBattleButton.disabled = decks[currentDeck].length!==8;
  }

  function renderCardCollection() {
    cardCollectionEl.innerHTML='';
    allCards.forEach((card)=>{
      const div = document.createElement('div');
      div.className = 'card';
      div.textContent = card.emoji;
      div.title = `${card.name} (${card.cost})`;
      div.addEventListener('click', ()=>{
        if(decks[currentDeck].length<8){
          decks[currentDeck].push(card);
          renderDeck();
        }
      });
      cardCollectionEl.appendChild(div);
    });
  }

  deckTabs.forEach(tab=>{
    tab.addEventListener('click',()=>{
      deckTabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      currentDeck = parseInt(tab.dataset.deck);
      renderDeck();
    });
  });

  startBattleButton.addEventListener('click',()=>{
    deckBuilderModal.classList.add('hidden');
    startGame();
  });

  deckButton.addEventListener('click',()=>{
    titleScreen.classList.add('hidden');
    deckBuilderModal.classList.remove('hidden');
    renderDeck();
    renderCardCollection();
  });

  startButton.addEventListener('click',()=>{
    titleScreen.classList.add('hidden');
    if(decks[0].length<8){
      deckBuilderModal.classList.remove('hidden');
      renderDeck();
      renderCardCollection();
    } else {
      startGame();
    }
  });

  restartButton.addEventListener('click',()=>{
    messageModal.classList.add('hidden');
    titleScreen.classList.remove('hidden');
    resetGame();
  });

  // -------------------- Game --------------------
  function resetGame(){
    elixir = 3;
    gameTimer = 180;
    hand = [];
    playerTowers = 3;
    aiTowers = 3;
    cardHandEl.innerHTML='';
    playerTowersEl.textContent = playerTowers;
    aiTowersEl.textContent = aiTowers;
    timerEl.textContent = gameTimer;
    elixirCountEl.textContent = elixir;
    elixirBarFill.style.width = `${elixir/elixirMax*100}%`;
  }

  function startGame(){
    gameContainer.classList.remove('hidden');
    resetGame();
    drawInitialHand();
    timerInterval = setInterval(()=>{
      gameTimer--;
      timerEl.textContent = gameTimer;
      if(gameTimer<=0){ endGame('Draw'); }
    },1000);
    setInterval(()=>{ if(elixir<elixirMax){ elixir++; elixirCountEl.textContent=elixir; elixirBarFill.style.width=`${elixir/elixirMax*100}%`; updateHand(); } },2000);
  }

  function endGame(result){
    clearInterval(timerInterval);
    messageTitle.textContent = result==='Draw'?'Draw!':result==='Win'?'Victory!':'Defeat!';
    messageText.textContent = `You: ${playerTowers} Towers | AI: ${aiTowers} Towers`;
    messageModal.classList.remove('hidden');
    gameContainer.classList.add('hidden');
  }

  // -------------------- Hand --------------------
  function drawInitialHand(){
    hand = [];
    for(let i=0;i<4;i++){
      hand.push(decks[currentDeck][i]);
    }
    renderHand();
  }

  function renderHand(){
    cardHandEl.innerHTML='';
    hand.forEach((card,i)=>{
      const div = document.createElement('div');
      div.className = 'card';
      if(elixir<card.cost) div.classList.add('disabled');
      div.textContent = card.emoji;
      div.title = `${card.name} (${card.cost})`;
      div.addEventListener('click',()=>{
        if(elixir>=card.cost){
          elixir-=card.cost;
          elixirCountEl.textContent = elixir;
          elixirBarFill.style.width = `${elixir/elixirMax*100}%`;
          playCard(card);
        }
      });
      cardHandEl.appendChild(div);
    });
  }

  function updateHand(){ renderHand(); }

  // -------------------- Play Cards --------------------
  function playCard(card){
    const troop = document.createElement('div');
    troop.className='troop';
    troop.textContent=card.emoji;
    const boardRect = gameBoard.getBoundingClientRect();
    const startX = boardRect.width/2;
    const startY = boardRect.height*0.85;
    troop.style.left=startX+'px';
    troop.style.top=startY+'px';
    gameBoard.appendChild(troop);

    const targetY = boardRect.height*0.2;
    const duration = 3000 / (card.speed||1);
    const startTime = performance.now();

    function animate(time){
      const progress = Math.min((time-startTime)/duration,1);
      troop.style.top = startY - (startY-targetY)*progress + 'px';
      if(progress<1){ requestAnimationFrame(animate); }
      else{ troop.remove(); aiTowers--; aiTowersEl.textContent = aiTowers; checkWinLoss(); }
    }
    requestAnimationFrame(animate);
    updateHand();
  }

  function checkWinLoss(){
    if(aiTowers<=0){ endGame('Win'); }
    if(playerTowers<=0){ endGame('Lose'); }
  }

});
