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

// 艾宾浩斯 / Leitner 复习间隔（单位：天）
const INTERVALS = {
  1: 1,   // 第 1 盒：1 天后复习
  2: 2,   // 第 2 盒：2 天后
  3: 4,   // 第 3 盒：4 天后
  4: 7,   // 第 4 盒：7 天后
  5: 14   // 第 5 盒：14 天后（即将掌握）
};

const MASTERED_LEVEL = 6;

let state = loadState();
let dueWords = [];
let currentIndex = 0;

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // 兼容旧版数据：mastered 数组
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

function render() {
  const now = Date.now();
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
  wordLevel.textContent = `Box ${ws.level} · 下次复习 ${formatDate(ws.nextReview)}`;
  btnKnow.disabled = false;
  btnAgain.disabled = false;
  hintEl.textContent = '点击卡片查看释义';

  card.classList.remove('flipped');
}

function handleKnown() {
  if (dueWords.length === 0) return;

  const { index } = dueWords[currentIndex];
  const ws = getWordState(index);

  ws.level = Math.min(ws.level + 1, MASTERED_LEVEL);

  if (ws.level >= MASTERED_LEVEL) {
    ws.nextReview = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 天后仍可复习
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

  // 不认识：退回 Box 1，明天复习
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

card.addEventListener('click', () => {
  if (dueWords.length === 0) return;
  card.classList.toggle('flipped');
});

btnKnow.addEventListener('click', handleKnown);
btnAgain.addEventListener('click', handleAgain);
btnReset.addEventListener('click', handleReset);

document.addEventListener('keydown', (e) => {
  if (dueWords.length === 0) return;
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
