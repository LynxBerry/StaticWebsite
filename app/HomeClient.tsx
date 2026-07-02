'use client';

import { useState, useEffect } from 'react';
import { useVocabState } from './hooks/useVocabState';
import { useIdlePrompt } from './hooks/useIdlePrompt';
import StudyView from './components/StudyView';
import LearnView from './components/LearnView';
import FarmView from './components/FarmView';
import BankView from './components/BankView';
import SettingsView from './components/SettingsView';
import StalePrompt from './components/StalePrompt';

type ViewType = 'learn' | 'study' | 'farm' | 'bank' | 'settings';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

export default function HomeClient({ userId, email }: { userId: string; email: string }) {
  const [currentView, setCurrentView] = useState<ViewType>('settings');
  const { showPrompt: showStalePrompt, dismiss: dismissStalePrompt } = useIdlePrompt(IDLE_TIMEOUT_MS);
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
    resetWrongQueue,
    siteTitle,
    updateSiteTitle
  } = useVocabState(userId, email);

  // Keep the browser tab title in sync with the user's custom site title.
  useEffect(() => {
    document.title = siteTitle;
  }, [siteTitle]);

  if (!isHydrated) {
    return (
      <main className="w-full max-w-[420px] min-h-[90vh] text-center flex flex-col">
        <header>
          <h1 className="text-3xl font-bold mb-1 font-display bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            {siteTitle}
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
        <h1 className="text-3xl font-bold mb-1 font-display bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          {siteTitle}
        </h1>
        <p className="text-farm-muted mb-6">一份耕耘一份收获</p>
      </header>

      <nav className="flex gap-2 mb-6 p-1.5 rounded-xl bg-[rgba(69,26,3,0.5)] backdrop-blur-glass border border-farm-muted/15 shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
        {[
          { key: 'learn', label: '播种', tooltip: '学习新单词（每日最多15个）' },
          { key: 'study', label: '施肥', tooltip: '复习今日到期单词' },
          { key: 'farm', label: '收成', tooltip: '查看单词农场' },
          { key: 'bank', label: '词库', tooltip: '查看全部单词' },
          { key: 'settings', label: '设置', tooltip: '备份与恢复' }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 py-2 rounded-[0.625rem] font-semibold transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              currentView === tab.key
                ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-farm-text shadow-[0_4px_12px_rgba(249,115,22,0.35)] -translate-y-px'
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
          totalWords={words.length}
          todayCount={todayCount}
          remaining={remaining}
          onLearn={learnNewWord}
          onGoToSettings={() => setCurrentView('settings')}
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
          onGoToSettings={() => setCurrentView('settings')}
        />
      )}

      {currentView === 'farm' && (
        <FarmView
          words={words}
          getStatus={getStatus}
          getWordState={getWordState}
          onGoToSettings={() => setCurrentView('settings')}
        />
      )}

      {currentView === 'bank' && (
        <BankView
          words={words}
          getStatus={getStatus}
          getWordState={getWordState}
          onGoToSettings={() => setCurrentView('settings')}
        />
      )}

      {currentView === 'settings' && (
        <SettingsView
          exportState={exportState}
          importState={importState}
          onReset={reset}
          siteTitle={siteTitle}
          onUpdateSiteTitle={updateSiteTitle}
        />
      )}

      {showStalePrompt && (
        <StalePrompt
          onRefresh={() => window.location.reload()}
          onDismiss={dismissStalePrompt}
        />
      )}
    </main>
  );
}
