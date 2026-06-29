const STORAGE_KEY = 'zeno-vocab-progress';

const card = document.getElementById('card');
const wordEn = document.getElementById('word-en');
const wordCn = document.getElementById('word-cn');
const btnKnow = document.getElementById('btn-know');
const btnAgain = document.getElementById('btn-again');
const btnReset = document.getElementById('btn-reset');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const masteredCount = document.getElementById('mastered-count');
const reviewCount = document.getElementById('review-count');

let state = loadState();
let isFlipped = false;

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse progress', e);
    }
  }
  return {
    mastered: [],
    currentIndex: 0
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getReviewWords() {
  return WORDS.filter((_, index) => !state.mastered.includes(index));
}

function render() {
  const reviewWords = getReviewWords();
  const total = WORDS.length;
  const mastered = state.mastered.length;
  const progress = total === 0 ? 0 : Math.round((mastered / total) * 100);

  progressText.textContent = `${mastered} / ${total}`;
  progressFill.style.width = `${progress}%`;
  masteredCount.textContent = mastered;
  reviewCount.textContent = reviewWords.length;

  if (reviewWords.length === 0) {
    wordEn.textContent = '🎉 恭喜！';
    wordCn.textContent = '所有单词都掌握了，好好过暑假！';
    btnKnow.disabled = true;
    btnAgain.disabled = true;
    return;
  }

  // Keep currentIndex within review list bounds
  state.currentIndex = state.currentIndex % reviewWords.length;
  const current = reviewWords[state.currentIndex];

  wordEn.textContent = current.en;
  wordCn.textContent = current.cn;
  btnKnow.disabled = false;
  btnAgain.disabled = false;

  card.classList.remove('flipped');
  isFlipped = false;
}

function handleKnown() {
  const reviewWords = getReviewWords();
  if (reviewWords.length === 0) return;

  const currentWord = reviewWords[state.currentIndex];
  const originalIndex = WORDS.indexOf(currentWord);

  if (!state.mastered.includes(originalIndex)) {
    state.mastered.push(originalIndex);
  }

  state.currentIndex = state.currentIndex % Math.max(getReviewWords().length, 1);
  saveState();
  render();
}

function handleAgain() {
  const reviewWords = getReviewWords();
  if (reviewWords.length === 0) return;

  state.currentIndex = (state.currentIndex + 1) % reviewWords.length;
  saveState();
  render();
}

function handleReset() {
  if (confirm('确定要重置所有学习进度吗？')) {
    state = { mastered: [], currentIndex: 0 };
    saveState();
    render();
  }
}

card.addEventListener('click', () => {
  if (getReviewWords().length === 0) return;
  card.classList.toggle('flipped');
  isFlipped = !isFlipped;
});

btnKnow.addEventListener('click', handleKnown);
btnAgain.addEventListener('click', handleAgain);
btnReset.addEventListener('click', handleReset);

document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    card.click();
  } else if (e.key === 'ArrowRight' || e.key === 'k') {
    handleKnown();
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    handleAgain();
  }
});

render();
