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
      <main className="w-full max-w-[420px] min-h-[90vh] text-center flex flex-col">
        <header>
          <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Zeno的单词农场
          </h1>
          <p className="text-farm-muted mb-6">一份耕耘一份收获</p>
        </header>
        <p className="text-center text-farm-muted">加载中...</p>
      </main>
    );
  }

  const dueWords = getDueWords();
  const masteredCount = getMasteredCount();
  const unlearnedWords = getUnlearnedWords();
  const { todayCount, remaining } = getNewWordsStats();

  return (
    <main className="w-full max-w-[420px] min-h-[90vh] text-center flex flex-col">
      <header>
        <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Zeno的单词农场
        </h1>
        <p className="text-farm-muted mb-6">一份耕耘一份收获</p>
      </header>

      <nav className="flex gap-2 mb-6 p-1 rounded-xl bg-[rgba(69,26,3,0.5)] backdrop-blur-glass border border-farm-muted/15 shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
        {[
          { key: 'learn', label: '播种', tooltip: '学习新单词（每日最多15个）' },
          { key: 'study', label: '施肥', tooltip: '复习今日到期单词' },
          { key: 'farm', label: '收成', tooltip: '查看单词农场' },
          { key: 'bank', label: '词库', tooltip: '查看全部单词' },
          { key: 'settings', label: '设置', tooltip: '备份与恢复' }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 py-2 rounded-[0.625rem] font-semibold transition-all duration-200 ${
              currentView === tab.key
                ? 'bg-orange-500/90 text-farm-text shadow-[0_4px_12px_rgba(249,115,22,0.35)]'
                : 'bg-transparent text-farm-muted hover:text-farm-text hover:bg-white/5'
            }`}
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
