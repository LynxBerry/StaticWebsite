'use client';

import { useState } from 'react';
import { Word } from '../data/words';
import { formatDate, getPlantIcon } from '../lib/utils';
import EmptyState from './EmptyState';

type FilterType = 'all' | 'unlearned' | 'due' | 'mastered';
type StatusType = 'mastered' | 'due' | 'pending' | 'unlearned';

interface BankViewProps {
  words: Word[];
  getStatus: (en: string) => StatusType;
  getWordState: (en: string) => { level: number; nextReview: number };
  onGoToSettings: () => void;
}

function wordItemClass(status: StatusType) {
  // List item strip — translucent (no backdrop-blur) so long lists scroll
  // smoothly without per-item GPU compositing. The frosted feel comes from
  // the outer glass-card wrapping the whole <ul>. Slightly higher opacity
  // (25%) than the outer card to keep dense text readable without blur.
  const base =
    'flex items-center gap-3 px-3 py-3 mb-2 rounded-[12px] ' +
    'bg-white/25 ' +
    'transition-colors duration-200 hover:bg-white/35';
  switch (status) {
    case 'due':
      return `${base} ring-1 ring-harvest-400/40`;
    case 'unlearned':
      return `${base} opacity-55`;
    default:
      return base;
  }
}

/** Circular avatar holding the plant icon, tinted by status. */
function iconClass(status: StatusType) {
  const base = 'flex items-center justify-center shrink-0 w-10 h-10 rounded-full text-lg backdrop-blur-md';
  switch (status) {
    case 'mastered':
      return `${base} bg-sprout-400/30`;
    case 'due':
      return `${base} bg-harvest-400/30`;
    case 'unlearned':
      return `${base} bg-white/15`;
    default:
      return `${base} bg-white/20`;
  }
}

function statusTextClass(status: StatusType) {
  switch (status) {
    case 'mastered':
      return 'text-sprout-300';
    case 'due':
      return 'text-harvest-300';
    case 'unlearned':
      return 'text-white/45';
    default:
      return 'text-white/70';
  }
}

export default function BankView({ words, getStatus, getWordState, onGoToSettings }: BankViewProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Empty library: show import guidance instead of empty list
  if (words.length === 0) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="bank-view">
        <EmptyState
          icon="📚"
          title="词库还是空的"
          message="去设置里导入单词，词库就会出现在这里。"
          actionLabel="去导入单词"
          onAction={onGoToSettings}
        />
      </section>
    );
  }

  const term = searchTerm.trim().toLowerCase();

  const items = words
    .map((word) => ({
      word,
      status: getStatus(word.en),
      ws: getWordState(word.en)
    }))
    .filter(({ status }) => (filter === 'all' ? true : status === filter))
    .filter(({ word }) => {
      if (!term) return true;
      return word.en.toLowerCase().includes(term) || word.cn.includes(term);
    });

  const getStatusText = (status: StatusType, ws: { nextReview: number }) => {
    if (status === 'unlearned') return '待播种';
    if (status === 'mastered') return '已掌握';
    if (status === 'due') return '今日到期';
    return `下次复习 ${formatDate(ws.nextReview)}`;
  };

  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="bank-view">
      <div className="mb-4">
        <h2 className="text-xl font-semibold font-display text-white mb-4">词库</h2>
        <input
          type="text"
          className="w-full mb-4 px-3 h-9 rounded-xl bg-white/15 backdrop-blur-xl backdrop-saturate-150 text-white text-sm outline-none transition-all duration-sprout-mid placeholder:text-white/45 focus:bg-white/25 focus:shadow-[0_0_0_2px_rgba(255,255,255,0.25)]"
          placeholder="搜索英文或中文..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {(['all', 'unlearned', 'due', 'mastered'] as FilterType[]).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                className={`inline-flex items-center h-7 px-3 text-xs rounded-full transition-all duration-sprout-mid ${
                  active
                    ? 'bg-white/45 backdrop-blur-md text-white font-semibold shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.4)]'
                    : 'bg-white/15 backdrop-blur-md text-white/70 hover:bg-white/25 hover:text-white'
                }`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? '全部' : f === 'unlearned' ? '待播种' : f === 'due' ? '今日到期' : '已掌握'}
              </button>
            );
          })}
        </div>
      </div>
      <div className="glass-card p-3">
        <ul className="list-none max-h-[55vh] overflow-y-auto no-scrollbar text-left">
        {items.length === 0 ? (
          <li className="flex items-center justify-center px-4 py-3.5 mb-2 rounded-xl text-white/60">
            没有符合条件的单词
          </li>
        ) : (
          items.map(({ word, status, ws }) => (
            <li key={word.en} className={wordItemClass(status)}>
              <span className={iconClass(status)}>
                {status === 'unlearned' ? getPlantIcon(1) : getPlantIcon(ws.level)}
              </span>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="font-bold text-white truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{word.en}</span>
                <span className="text-sm text-white/65 truncate">{word.cn}</span>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs shrink-0">
                <span className="text-white/55">{status === 'unlearned' ? '阶段 1' : `阶段 ${ws.level}`}</span>
                <span className={`font-semibold ${statusTextClass(status)}`}>{getStatusText(status, ws)}</span>
              </div>
            </li>
          ))
        )}
        </ul>
      </div>
    </section>
  );
}
