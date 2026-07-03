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
  const base =
    'flex items-center gap-3 px-3 py-3 mb-2 rounded-[18px] bg-white/30 backdrop-blur-2xl border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-l-4';
  switch (status) {
    case 'mastered':
      return `${base} border-l-sprout-500 bg-sprout-50/60`;
    case 'due':
      return `${base} border-l-harvest-500 bg-harvest-50/60`;
    case 'unlearned':
      return `${base} border-l-farm-border`;
    default:
      return `${base} border-l-farm-accent`;
  }
}

/** Circular avatar holding the plant icon, tinted by status. */
function iconClass(status: StatusType) {
  const base = 'flex items-center justify-center shrink-0 w-10 h-10 rounded-full text-lg';
  switch (status) {
    case 'mastered':
      return `${base} bg-sprout-50`;
    case 'due':
      return `${base} bg-harvest-50`;
    case 'unlearned':
      return `${base} bg-farm-fillQuaternary opacity-60`;
    default:
      return `${base} bg-sprout-50`;
  }
}

function statusTextClass(status: StatusType) {
  switch (status) {
    case 'mastered':
      return 'text-sprout-600';
    case 'due':
      return 'text-harvest-600';
    case 'unlearned':
      return 'text-farm-muted';
    default:
      return 'text-farm-text';
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
        <h2 className="text-xl font-semibold font-display text-farm-text mb-4">词库</h2>
        <input
          type="text"
          className="w-full mb-4 px-3 h-8 rounded-2xl border border-[#d9d6d1] bg-farm-bg text-farm-text text-sm outline-none transition-all duration-sprout-mid placeholder:text-farm-muted/60 focus:border-farm-accent/60 focus:shadow-[0_0_0_3px_rgba(112,176,112,0.18)]"
          placeholder="搜索英文或中文..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 justify-center">
          {(['all', 'unlearned', 'due', 'mastered'] as FilterType[]).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                className={`inline-flex items-center h-6 px-2 text-sm rounded-[11px] border transition-all duration-sprout-mid ${
                  active
                    ? 'text-farm-accent bg-sprout-50 border-sprout-200'
                    : 'text-farm-textSecondary bg-farm-bg border-farm-borderSecondary hover:text-farm-text hover:bg-farm-fillQuaternary'
                }`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? '全部' : f === 'unlearned' ? '待播种' : f === 'due' ? '今日到期' : '已掌握'}
              </button>
            );
          })}
        </div>
      </div>
      <ul className="list-none max-h-[60vh] overflow-y-auto no-scrollbar text-left">
        {items.length === 0 ? (
          <li className="flex items-center justify-center px-4 py-3.5 mb-2 rounded-xl text-farm-muted">
            没有符合条件的单词
          </li>
        ) : (
          items.map(({ word, status, ws }) => (
            <li key={word.en} className={wordItemClass(status)}>
              <span className={iconClass(status)}>
                {status === 'unlearned' ? getPlantIcon(1) : getPlantIcon(ws.level)}
              </span>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="font-bold text-farm-text truncate">{word.en}</span>
                <span className="text-sm text-farm-muted truncate">{word.cn}</span>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs shrink-0">
                <span className="text-farm-muted">{status === 'unlearned' ? '阶段 1' : `阶段 ${ws.level}`}</span>
                <span className={`font-semibold ${statusTextClass(status)}`}>{getStatusText(status, ws)}</span>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
