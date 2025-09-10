document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const titleScreen = document.getElementById('title-screen');
  const startButton = document.getElementById('start-button');
  const deckButton = document.getElementById('deck-button');
  const gameContainer = document.getElementById('game-container');
  const deckBuilderModal = document.getElementById('deck-builder-modal');
  const startBattleButton = document.getElementById('start-battle-button');
  const deckTabs = document.querySelectorAll('.deck-tab');
  const currentDeckEl = document.getElementById('current-deck');
  const cardCollectionEl = document.getElementById('card-collection');
  const deckCountEl = document.getElementById('deck-count');
  const cardHandEl = document.getElementById('card-hand');
  const elixirCountEl = document.getElementById('elixir-count');
  const elixirBarFill = document.getElementById('elixir-bar-fill');
  const messageModal = document.getElementById('message-modal');
  const restartButton = document.getElementById('restart-button');
  const messageTitle = document.getElementById('message-title');
  const messageText = document.getElementById('message-text');
  const aiTowersEl = document.getElementById('ai-towers');
  const playerTowersEl = document.getElementById('player-towers');
  const timerEl = document.getElementById('timer');

  // Game state
  let currentDeck = 0;
  const decks = [[], [], []];
  const allCards = [];
  const handSize = 4;
  let playerElixir = 3;
  const maxElixir = 10;
  let timer = 180;
  let timerInterval = null;

  // Generate 40 cards (more like Clash Royale)
  const cardTypes = ["Troop","Troop","Troop","Troop","Spell","Spell","Building"];
  const troopNames = ["Knight","Archer","Giant","Goblin","Wizard","Skeleton","Minion","Balloon","Hog Rider","Valkyrie","P.E.K.K.A","Musketeer","Baby Dragon","Electro Wizard","Ice Spirit","Fire Spirit","Mega Minion","Royal Ghost","Prince","Dark Prince","Ram Rider"];
  const spellNames = ["Fireball","Zap","Arrows","Lightning","Freeze","Poison","Rocket","Clone","Tornado","Heal"];
  const buildingNames = ["Cannon","Inferno Tower","Tesla","Bomb Tower","Mortar","Elixir Collector","Goblin Hut","Barbarian Hut","Furnace","X-Bow"];

  troopNames.forEach(name=>allCards.push({name,type:"Troop",cost:Math.floor(Math.random()*6)+1}));
  spellNames.forEach(name=>allCards.push({name,type:"Spell",cost:Math.floor(Math.random()*6)+1}));
  buildingNames.forEach(name=>allCards.push({name,type:"Building",cost:Math.floor(Math.random()*6)+1}));

  function renderDeck(){
    currentDeckEl.innerHTML = '';
    decks[currentDeck].forEach((card,index)=>{
      const cardEl = document.createElement('div');
      cardEl.classList.add('card','bg-gray-500','p-2','rounded','text-sm','text-center','cursor-pointer');
      cardEl.textContent = `${card.name} (${card.cost})`;
      cardEl.addEventListener('click',()=>{
        decks[currentDeck].splice(index,1);
        renderDeck();
        renderCardCollection();
      });
      currentDeckEl.appendChild(cardEl);
    });
    deckCountEl.textContent = decks[currentDeck].length;
    startBattleButton.disabled = decks[currentDeck].length<4;
  }

  function renderCardCollection(){
    cardCollectionEl.innerHTML = '';
    allCards.forEach((card)=>{
      const cardEl = document.createElement('div');
      cardEl.classList.add('card','bg-gray-700','p-2','rounded','text-sm','text-center');
      cardEl.textContent = `${card.name} (${card.cost})`;
      if(decks[currentDeck].includes(card)) cardEl.classList.add('disabled');
      else cardEl.addEventListener('click',()=>{
        if(decks[currentDeck].length>=8) return;
        decks[currentDeck].push(card);
        renderDeck();
        renderCardCollection();
      });
      cardCollectionEl.appendChild(cardEl);
    });
  }

  // Title screen buttons
  startButton.addEventListener('click',()=>{
    titleScreen.classList.add('hidden');
    if(decks[0].length<4){
      deckBuilderModal.classList.remove('hidden');
      renderDeck();
      renderCardCollection();
    }else{
      startGame();
    }
  });
  deckButton.addEventListener('click',()=>{
    titleScreen.classList.add('hidden');
    deckBuilderModal.classList.remove('hidden');
    renderDeck();
    renderCardCollection();
  });

  startBattleButton.addEventListener('click',()=>{
    deckBuilderModal.classList.add('hidden');
    startGame();
  });

  deckTabs.forEach(tab=>{
    tab.addEventListener('click',()=>{
      deckTabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      currentDeck=parseInt(tab.dataset.deck);
      renderDeck();
      renderCardCollection();
    });
  });

  function startGame(){
    gameContainer.classList.remove('hidden');
    playerElixir = 3;
    elixirCountEl.textContent=playerElixir;
    elixirBarFill.style.width = (playerElixir/maxElixir*100)+'%';
    timer = 180;
    timerEl.textContent=timer;
    aiTowersEl.textContent=3;
    playerTowersEl.textContent=3;

    cardHandEl.innerHTML='';
    for(let i=0;i<handSize;i++){
      if(decks[currentDeck][i]) drawCard(decks[currentDeck][i]);
    }

    if(timerInterval) clearInterval(timerInterval);
    timerInterval=setInterval(()=>{
      timer--;
      timerEl.textContent=timer;
      if(timer<=0){
        endGame("Draw","Time ran out!");
      }
    },1000);
  }

  function drawCard(card){
    const cardEl=document.createElement('div');
    cardEl.classList.add('card','bg-purple-500','p-2','rounded','text-sm','text-center','cursor-pointer');
    cardEl.textContent=`${card.name} (${card.cost})`;
    if(playerElixir<card.cost) cardEl.classList.add('disabled');
    cardEl.addEventListener('click',()=>{
      if(playerElixir>=card.cost){
        playerElixir-=card.cost;
        elixirCountEl.textContent=playerElixir;
        elixirBarFill.style.width=(playerElixir/maxElixir*100)+'%';
        cardEl.remove();
        // Here you can implement troop deployment
      }
    });
    cardHandEl.appendChild(cardEl);
  }

  function endGame(title,text){
    gameContainer.classList.add('hidden');
    messageTitle.textContent=title;
    messageText.textContent=text;
    messageModal.classList.remove('hidden');
    clearInterval(timerInterval);
  }

  restartButton.addEventListener('click',()=>{
    messageModal.classList.add('hidden');
    titleScreen.classList.remove('hidden');
  });

});
