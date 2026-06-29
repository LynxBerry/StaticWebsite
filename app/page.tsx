'use client';

import { useState } from 'react';
import { useVocabState } from './hooks/useVocabState';
import StudyView from './components/StudyView';
import FarmView from './components/FarmView';
import BankView from './components/BankView';

type ViewType = 'study' | 'farm' | 'bank';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('study');
  const {
    isHydrated,
    getWordState,
    markKnown,
    markAgain,
    reset,
    getDueWords,
    getMasteredCount,
    getStatus,
    WORDS
  } = useVocabState();

  if (!isHydrated) {
    return (
      <main className="app">
        <header>
          <h1>Zeno的单词农场</h1>
          <p>一份耕耘一份收获</p>
        </header>
        <p style={{ textAlign: 'center', color: '#fdba74' }}>加载中...</p>
      </main>
    );
  }

  const dueWords = getDueWords();
  const masteredCount = getMasteredCount();

  return (
    <main className="app">
      <header>
        <h1>Zeno的单词农场</h1>
        <p>一份耕耘一份收获</p>
      </header>

      <nav className="tabs">
        {[
          { key: 'study', label: '学习' },
          { key: 'farm', label: '农场' },
          { key: 'bank', label: '词库' }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab ${currentView === tab.key ? 'active' : ''}`}
            onClick={() => setCurrentView(tab.key as ViewType)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {currentView === 'study' && (
        <StudyView
          dueWords={dueWords}
          masteredCount={masteredCount}
          total={WORDS.length}
          getWordState={getWordState}
          onKnown={markKnown}
          onAgain={markAgain}
          onReset={reset}
        />
      )}

      {currentView === 'farm' && (
        <FarmView
          words={WORDS}
          getStatus={getStatus}
          getWordState={getWordState}
        />
      )}

      {currentView === 'bank' && (
        <BankView
          words={WORDS}
          getStatus={getStatus}
          getWordState={getWordState}
        />
      )}
    </main>
  );
}
