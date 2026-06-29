'use client';

import { useState } from 'react';
import { useVocabState } from './hooks/useVocabState';
import StudyView from './components/StudyView';
import LearnView from './components/LearnView';
import FarmView from './components/FarmView';
import BankView from './components/BankView';
import SettingsView from './components/SettingsView';

type ViewType = 'learn' | 'study' | 'farm' | 'bank' | 'settings';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('study');
  const {
    isHydrated,
    words,
    getWordState,
    learnNewWord,
    markKnown,
    markAgain,
    reset,
    getUnlearnedWords,
    getNewWordsStats,
    getDueWords,
    getMasteredCount,
    getStatus,
    exportState,
    importState,
    wrongQueue,
    addToWrongQueue,
    decrementWrongRemaining,
    resetWrongQueue
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
  const unlearnedWords = getUnlearnedWords();
  const { todayCount, remaining } = getNewWordsStats();

  return (
    <main className="app">
      <header>
        <h1>Zeno的单词农场</h1>
        <p>一份耕耘一份收获</p>
      </header>

      <nav className="tabs">
        {[
          { key: 'learn', label: '播种', tooltip: '学习新单词（每日最多15个）' },
          { key: 'study', label: '施肥', tooltip: '复习今日到期单词' },
          { key: 'farm', label: '收成', tooltip: '查看单词农场' },
          { key: 'bank', label: '词库', tooltip: '查看全部单词' },
          { key: 'settings', label: '设置', tooltip: '备份与恢复' }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab ${currentView === tab.key ? 'active' : ''}`}
            onClick={() => setCurrentView(tab.key as ViewType)}
            title={tab.tooltip}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {currentView === 'learn' && (
        <LearnView
          unlearnedWords={unlearnedWords}
          todayCount={todayCount}
          remaining={remaining}
          onLearn={learnNewWord}
        />
      )}

      {currentView === 'study' && (
        <StudyView
          words={words}
          dueWords={dueWords}
          masteredCount={masteredCount}
          total={words.length}
          wrongQueue={wrongQueue}
          getWordState={getWordState}
          onKnown={markKnown}
          onAgain={markAgain}
          onAddToWrongQueue={addToWrongQueue}
          onDecrementWrongRemaining={decrementWrongRemaining}
          onResetWrongQueue={resetWrongQueue}
        />
      )}

      {currentView === 'farm' && (
        <FarmView
          words={words}
          getStatus={getStatus}
          getWordState={getWordState}
        />
      )}

      {currentView === 'bank' && (
        <BankView
          words={words}
          getStatus={getStatus}
          getWordState={getWordState}
        />
      )}

      {currentView === 'settings' && (
        <SettingsView
          exportState={exportState}
          importState={importState}
          onReset={reset}
        />
      )}
    </main>
  );
}
