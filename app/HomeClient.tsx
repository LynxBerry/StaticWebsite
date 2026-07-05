'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useVocabState } from './hooks/useVocabState';
import { useIdlePrompt } from './hooks/useIdlePrompt';
import StudyView from './components/StudyView';
import LearnView from './components/LearnView';
import FarmView from './components/FarmView';
import BankView from './components/BankView';
import SettingsView from './components/SettingsView';
import StalePrompt from './components/StalePrompt';
import DashboardView from './components/DashboardView';
import ParallaxBackground from './components/ParallaxBackground';
import Logo from './components/Logo';
import Toast, { type ToastData } from './components/ui/Toast';


type ViewType = 'dashboard' | 'learn' | 'study' | 'farm' | 'bank' | 'settings';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

// Child-friendly title font stack: Fredoka renders latin glyphs, ZCOOL
// KuaiLe renders Chinese glyphs (the variables are set on <html> in
// layout.tsx). Both are round and playful, fitting the kids audience.
const titleFont = 'var(--font-fredoka), var(--font-zcool), var(--font-nunito), system-ui, sans-serif';

const tabs = [
  { key: 'dashboard', label: '首页', tooltip: '总览与统计' },
  { key: 'learn', label: '播种', tooltip: '学习新单词（每日最多15个）' },
  { key: 'study', label: '施肥', tooltip: '复习今日到期单词' },
  { key: 'farm', label: '收成', tooltip: '查看单词农场' },
  { key: 'bank', label: '词库', tooltip: '查看全部单词' },
  { key: 'settings', label: '设置', tooltip: '备份与恢复' }
] as const;

export default function HomeClient({ userId, email }: { userId: string; email: string }) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { showPrompt: showStalePrompt, dismiss: dismissStalePrompt } = useIdlePrompt(IDLE_TIMEOUT_MS);
  const [toast, setToast] = useState<ToastData | null>(null);

  /** Delete a word and surface an undo toast for 5 seconds. */
  const handleRemoveWord = (en: string) => {
    const removed = removeWord(en);
    if (removed) {
      setToast({
        message: `已删除 ${en}`,
        action: {
          label: '撤销',
          onClick: () => undoRemoveWord(removed.word, removed.state)
        },
        duration: 5000
      });
    }
  };

  const navRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const container = navRef.current;
      const activeIndex = tabs.findIndex((t) => t.key === currentView);
      const activeBtn = buttonRefs.current[activeIndex];
      if (!container || !activeBtn) return;
      const cRect = container.getBoundingClientRect();
      const bRect = activeBtn.getBoundingClientRect();
      // Subtract scrollLeft because the nav scrolls horizontally when tabs overflow.
      setIndicatorStyle({
        left: bRect.left - cRect.left + container.scrollLeft,
        width: bRect.width,
        opacity: 1
      });
    };
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    // Font load (Nunito→Quicksand swap) changes button widths; re-measure when ready.
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(updateIndicator);
    }
    return () => window.removeEventListener('resize', updateIndicator);
  }, [currentView]);
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
    getReviewStats,
    getMasteredCount,
    getStatus,
    exportState,
    importState,
    addWord,
    updateWord,
    removeWord,
    undoRemoveWord,
    wrongQueue,
    addToWrongQueue,
    decrementWrongRemaining,
    resetWrongQueue,
    siteTitle,
    updateSiteTitle,
    dailyNewLimit,
    updateDailyNewLimit
  } = useVocabState(userId, email);

  // Shared site header content (logo + title block). Used by both the
  // loading state and the hydrated state. Only difference: the hydrated
  // version fades up on mount.
  const renderHeaderContent = (animate: boolean) => (
    <div className={`px-5 pt-12 pb-4 flex items-center justify-center gap-3${animate ? ' animate-fade-up' : ''}`}>
      <Logo size={40} />
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: titleFont }}>
          {siteTitle}
        </h1>
        <p className="text-white/70 italic tracking-wide text-sm mt-0.5">One seed, one harvest</p>
      </div>
    </div>
  );

  // Keep the browser tab title in sync with the user's custom site title.
  useEffect(() => {
    document.title = siteTitle;
  }, [siteTitle]);

  if (!isHydrated) {
    return (
      <main className="w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[540px] min-h-[90vh] text-center flex flex-col mx-auto">
        <div
          className="glass-card w-full mb-6 animate-descend"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40px)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 40px)'
          }}
        >
          {renderHeaderContent(false)}
        </div>
        <p className="text-center text-white/70">加载中...</p>
      </main>
    );
  }

  const dueWords = getDueWords();
  const masteredCount = getMasteredCount();
  const unlearnedWords = getUnlearnedWords();
  const { todayCount, remaining } = getNewWordsStats();

  return (
    <main className="w-full max-w-[420px] min-h-[90vh] text-center flex flex-col">
      <ParallaxBackground />

      {/* Unified top bar: header + nav merged into one glass container.
          A faint gradient divider separates the brand block from the tabs,
          so it reads as a single "app bar" instead of two stacked cards.
          The mask fades the top edge into the background so the bar reads
          as emerging from the scene, not pasted on top of it. */}
      <div
        className="glass-card w-full mb-6 animate-descend"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40px)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 40px)'
        }}
      >
        {renderHeaderContent(true)}
        {/* Divider — fades from transparent to ~12% white and back, so it
            reads as a hairline etched into the glass, not a hard line. */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <nav ref={navRef} className="flex justify-center gap-1 overflow-x-auto no-scrollbar p-1.5 relative">
          <span
            className="absolute top-1.5 bottom-1.5 rounded-xl bg-white/25 backdrop-blur-md transition-all duration-300 ease-out pointer-events-none"
            style={indicatorStyle}
          />
          {tabs.map((tab, index) => {
            const active = currentView === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => { buttonRefs.current[index] = el; }}
                className={`relative z-10 px-3 py-1.5 text-sm font-medium rounded-xl whitespace-nowrap transition-colors duration-300 ${
                  active
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/90'
                }`}
                onClick={() => setCurrentView(tab.key as ViewType)}
                title={tab.tooltip}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {currentView === 'dashboard' && (
        <DashboardView
          words={words}
          dueCount={dueWords.length}
          masteredCount={masteredCount}
          todayCount={todayCount}
          todayRemaining={remaining}
          unlearnedCount={unlearnedWords.length}
          wrongQueue={wrongQueue}
          getWordState={getWordState}
          getReviewStats={getReviewStats}
          onGoToStudy={() => setCurrentView('study')}
          onGoToLearn={() => setCurrentView('learn')}
          onGoToFarm={() => setCurrentView('farm')}
          onGoToBank={() => setCurrentView('bank')}
          onGoToSettings={() => setCurrentView('settings')}
        />
      )}

      {currentView === 'learn' && (
        <LearnView
          unlearnedWords={unlearnedWords}
          totalWords={words.length}
          todayCount={todayCount}
          remaining={remaining}
          dailyNewLimit={dailyNewLimit}
          onLearn={learnNewWord}
          onGoToBank={() => setCurrentView('bank')}
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
          onGoToBank={() => setCurrentView('bank')}
          onGoToSettings={() => setCurrentView('settings')}
        />
      )}

      {currentView === 'farm' && (
        <FarmView
          words={words}
          getStatus={getStatus}
          getWordState={getWordState}
          onGoToBank={() => setCurrentView('bank')}
          onGoToSettings={() => setCurrentView('settings')}
        />
      )}

      {currentView === 'bank' && (
        <BankView
          words={words}
          getStatus={getStatus}
          getWordState={getWordState}
          onGoToSettings={() => setCurrentView('settings')}
          onAddWord={addWord}
          onUpdateWord={updateWord}
          onRemoveWord={handleRemoveWord}
          onUndoRemove={undoRemoveWord}
        />
      )}

      {currentView === 'settings' && (
        <SettingsView
          exportState={exportState}
          importState={importState}
          onReset={reset}
          siteTitle={siteTitle}
          onUpdateSiteTitle={updateSiteTitle}
          dailyNewLimit={dailyNewLimit}
          onUpdateDailyNewLimit={updateDailyNewLimit}
        />
      )}

      {showStalePrompt && (
        <StalePrompt
          onRefresh={() => window.location.reload()}
          onDismiss={dismissStalePrompt}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}
