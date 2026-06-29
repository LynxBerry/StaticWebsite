const STORAGE_KEY = 'zeno-vocab-progress-v2';

const card = document.getElementById('card');
const wordEn = document.getElementById('word-en');
const wordCn = document.getElementById('word-cn');
const wordLevel = document.getElementById('word-level');
const btnKnow = document.getElementById('btn-know');
const btnAgain = document.getElementById('btn-again');
const btnReset = document.getElementById('btn-reset');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const dueCountEl = document.getElementById('due-count');
const masteredCountEl = document.getElementById('mastered-count');
const hintEl = document.querySelector('.hint');

const tabs = document.querySelectorAll('.tab');
const studyView = document.getElementById('study-view');
const bankView = document.getElementById('bank-view');
const wordList = document.getElementById('word-list');
const filters = document.querySelectorAll('.filter');
const searchInput = document.getElementById('search-input');
const farmView = document.getElementById('farm-view');
const farmGrid = document.getElementById('farm-grid');

// 艾宾浩斯 / Leitner 复习间隔（单位：天）
const INTERVALS = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14
};

const MASTERED_LEVEL = 6;

let state = loadState();
let dueWords = [];
let currentIndex = 0;
let currentFilter = 'all';
let currentView = 'study';
let searchTerm = '';

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.mastered)) {
        return migrateFromV1(parsed);
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse progress', e);
    }
  }
  return { wordStates: {} };
}

function migrateFromV1(old) {
  const wordStates = {};
  WORDS.forEach((_, index) => {
    const isMastered = old.mastered.includes(index);
    wordStates[index] = {
      level: isMastered ? MASTERED_LEVEL : 1,
      nextReview: isMastered ? Date.now() + 365 * 24 * 60 * 60 * 1000 : Date.now()
    };
  });
  return { wordStates };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getWordState(index) {
  if (!state.wordStates[index]) {
    state.wordStates[index] = {
      level: 1,
      nextReview: Date.now()
    };
  }
  return state.wordStates[index];
}

function getDueWords() {
  const now = Date.now();
  return WORDS.map((word, index) => ({ word, index }))
    .filter(({ index }) => {
      const ws = getWordState(index);
      return ws.level < MASTERED_LEVEL && ws.nextReview <= now;
    });
}

function getMasteredCount() {
  return Object.values(state.wordStates).filter((ws) => ws.level >= MASTERED_LEVEL).length;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getPlantIcon(level) {
  if (level >= MASTERED_LEVEL) return '✨🌳✨';
  const icons = {
    1: '🌰',
    2: '🌱',
    3: '🌿',
    4: '🪴',
    5: '🌳'
  };
  return icons[level] || icons[1];
}

function getStatus(index) {
  const ws = getWordState(index);
  const now = Date.now();
  if (ws.level >= MASTERED_LEVEL) return 'mastered';
  if (ws.nextReview <= now) return 'due';
  return 'pending';
}

function getStatusText(status) {
  if (status === 'mastered') return '已掌握';
  if (status === 'due') return '今日到期';
  return `下次复习 ${formatDate(getWordState(arguments[0]).nextReview)}`;
}

function renderStudy() {
  dueWords = getDueWords();
  const mastered = getMasteredCount();
  const total = WORDS.length;
  const progress = total === 0 ? 0 : Math.round((mastered / total) * 100);

  progressText.textContent = `${mastered} / ${total} 已掌握`;
  progressFill.style.width = `${progress}%`;
  dueCountEl.textContent = dueWords.length;
  masteredCountEl.textContent = mastered;

  if (dueWords.length === 0) {
    wordEn.textContent = '🎉 今日任务完成';
    wordCn.textContent = '明天再来复习吧，好好过暑假！';
    wordLevel.textContent = '';
    btnKnow.disabled = true;
    btnAgain.disabled = true;
    hintEl.textContent = '所有到期单词都已复习完';
    card.classList.remove('flipped');
    return;
  }

  currentIndex = currentIndex % dueWords.length;
  const { word, index } = dueWords[currentIndex];
  const ws = getWordState(index);

  wordEn.textContent = word.en;
  wordCn.textContent = word.cn;
  wordLevel.textContent = `${getPlantIcon(ws.level)} Box ${ws.level} · 下次复习 ${formatDate(ws.nextReview)}`;
  btnKnow.disabled = false;
  btnAgain.disabled = false;
  hintEl.textContent = '点击卡片查看释义';

  card.classList.remove('flipped');
}

function renderBank() {
  wordList.innerHTML = '';

  const term = searchTerm.trim().toLowerCase();

  const items = WORDS.map((word, index) => {
    const status = getStatus(index);
    const ws = getWordState(index);
    return { word, index, status, ws };
  }).filter(({ status, word }) => {
    if (currentFilter === 'all') return true;
    return status === currentFilter;
  }).filter(({ word }) => {
    if (!term) return true;
    return word.en.toLowerCase().includes(term) || word.cn.includes(term);
  });

  if (items.length === 0) {
    wordList.innerHTML = '<li class="word-item empty">没有符合条件的单词</li>';
    return;
  }

  items.forEach(({ word, index, status, ws }) => {
    const li = document.createElement('li');
    li.className = `word-item ${status}`;

    const statusText = status === 'mastered'
      ? '已掌握'
      : status === 'due'
        ? '今日到期'
        : `下次复习 ${formatDate(ws.nextReview)}`;

    li.innerHTML = `
      <div class="word-info">
        <span class="word-en">${word.en}</span>
        <span class="word-cn">${word.cn}</span>
      </div>
      <div class="word-meta">
        <span class="word-box">${getPlantIcon(ws.level)} Box ${ws.level}</span>
        <span class="word-status">${statusText}</span>
      </div>
    `;
    wordList.appendChild(li);
  });
}

function renderFarm() {
  farmGrid.innerHTML = '';

  WORDS.forEach((word, index) => {
    const ws = getWordState(index);
    const status = getStatus(index);

    const tile = document.createElement('div');
    tile.className = `farm-tile ${status}`;
    tile.title = `${word.en} · ${word.cn} · Box ${ws.level}`;
    tile.innerHTML = `
      <span class="farm-plant">${getPlantIcon(ws.level)}</span>
      <span class="farm-word">${word.en}</span>
    `;
    farmGrid.appendChild(tile);
  });
}

function render() {
  renderStudy();
  if (currentView === 'bank') {
    renderBank();
  }
  if (currentView === 'farm') {
    renderFarm();
  }
}

function handleKnown() {
  if (dueWords.length === 0) return;

  const { index } = dueWords[currentIndex];
  const ws = getWordState(index);

  ws.level = Math.min(ws.level + 1, MASTERED_LEVEL);

  if (ws.level >= MASTERED_LEVEL) {
    ws.nextReview = Date.now() + 30 * 24 * 60 * 60 * 1000;
  } else {
    ws.nextReview = Date.now() + INTERVALS[ws.level] * 24 * 60 * 60 * 1000;
  }

  saveState();
  render();
}

function handleAgain() {
  if (dueWords.length === 0) return;

  const { index } = dueWords[currentIndex];
  const ws = getWordState(index);

  ws.level = 1;
  ws.nextReview = Date.now() + INTERVALS[1] * 24 * 60 * 60 * 1000;

  saveState();
  render();
}

function handleReset() {
  if (confirm('确定要重置所有学习进度吗？')) {
    state = { wordStates: {} };
    saveState();
    render();
  }
}

function switchView(view) {
  currentView = view;
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view));
  studyView.classList.toggle('hidden', view !== 'study');
  bankView.classList.toggle('hidden', view !== 'bank');
  farmView.classList.toggle('hidden', view !== 'farm');

  if (view === 'bank') {
    renderBank();
  }
  if (view === 'farm') {
    renderFarm();
  }
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => switchView(tab.dataset.view));
});

filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    currentFilter = filter.dataset.filter;
    filters.forEach((f) => f.classList.toggle('active', f === filter));
    renderBank();
  });
});

searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value;
  renderBank();
});

card.addEventListener('click', () => {
  if (dueWords.length === 0) return;
  card.classList.toggle('flipped');
});

btnKnow.addEventListener('click', handleKnown);
btnAgain.addEventListener('click', handleAgain);
btnReset.addEventListener('click', handleReset);

document.addEventListener('keydown', (e) => {
  if (currentView !== 'study' || dueWords.length === 0) return;
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    card.classList.toggle('flipped');
  } else if (e.key === 'ArrowRight' || e.key === 'k') {
    handleKnown();
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    handleAgain();
  }
});

render();
