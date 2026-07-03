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
  const base = 'flex items-center justify-between gap-4 px-4 py-3.5 mb-2 rounded-xl bg-white border border-farm-border border-l-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]';
  switch (status) {
    case 'mastered':
      return `${base} border-l-[#5CA85C] bg-[#F7FBF7]`;
    case 'due':
      return `${base} border-l-orange-500 bg-[#FFF7ED] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_12px_rgba(240,128,0,0.12)]`;
    case 'unlearned':
      return `${base} border-l-stone-400 bg-white`;
    default:
      return `${base} border-l-farm-accent bg-[#FAFCFA]`;
  }
}

function statusTextClass(status: StatusType) {
  switch (status) {
    case 'mastered':
      return 'text-green-600';
    case 'due':
      return 'text-orange-600';
    case 'unlearned':
      return 'text-stone-500';
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

  const getLevelText = (status: StatusType, ws: { level: number }) => {
    if (status === 'unlearned') return `${getPlantIcon(1)} 待播种`;
    return `${getPlantIcon(ws.level)} 阶段 ${ws.level}`;
  };

  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="bank-view">
      <div className="mb-4">
        <h2 className="text-xl text-farm-muted mb-4">词库</h2>
        <input
          type="text"
          className="w-full mb-4 px-4 py-2.5 rounded-xl border border-farm-border bg-white text-farm-text text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-farm-muted/60 focus:border-farm-accent/60 focus:shadow-[0_0_0_3px_rgba(112,176,112,0.18)]"
          placeholder="搜索英文或中文..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 justify-center">
          {(['all', 'unlearned', 'due', 'mastered'] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`px-3.5 py-1.5 rounded-[0.625rem] border text-sm transition-all duration-200 ${
                filter === f
                  ? 'bg-[#70B070] border-[#70B070] text-white'
                  : 'border-farm-border bg-white text-farm-muted hover:text-farm-text hover:bg-black/5'
              }`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '全部' : f === 'unlearned' ? '待播种' : f === 'due' ? '今日到期' : '已掌握'}
            </button>
          ))}
        </div>
      </div>
      <ul className="list-none max-h-[60vh] overflow-y-auto text-left">
        {items.length === 0 ? (
          <li className="flex items-center justify-center px-4 py-3.5 mb-2 rounded-xl text-farm-muted">
            没有符合条件的单词
          </li>
        ) : (
          items.map(({ word, status, ws }) => (
            <li key={word.en} className={wordItemClass(status)}>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-farm-text">{word.en}</span>
                <span className="text-sm text-farm-muted">{word.cn}</span>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs">
                <span className="text-farm-muted">{getLevelText(status, ws)}</span>
                <span className={`font-semibold ${statusTextClass(status)}`}>{getStatusText(status, ws)}</span>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
