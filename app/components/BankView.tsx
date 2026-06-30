'use client';

import { useState } from 'react';
import { Word } from '../data/words';
import { formatDate, getPlantIcon } from '../lib/utils';

type FilterType = 'all' | 'unlearned' | 'due' | 'mastered';
type StatusType = 'mastered' | 'due' | 'pending' | 'unlearned';

interface BankViewProps {
  words: Word[];
  getStatus: (en: string) => StatusType;
  getWordState: (en: string) => { level: number; nextReview: number };
}

function wordItemClass(status: StatusType) {
  const base = 'flex items-center justify-between gap-4 px-4 py-3.5 mb-2 rounded-xl backdrop-blur-lg border border-farm-muted/10 border-l-4';
  switch (status) {
    case 'mastered':
      return `${base} border-l-green-500 bg-[rgba(20,40,20,0.6)]`;
    case 'due':
      return `${base} border-l-orange-500 bg-[rgba(67,20,7,0.65)] shadow-[0_0_16px_rgba(249,115,22,0.15)]`;
    case 'unlearned':
      return `${base} border-l-stone-400 bg-[rgba(40,35,30,0.5)]`;
    default:
      return `${base} border-l-farm-muted bg-[rgba(42,24,11,0.6)]`;
  }
}

function statusTextClass(status: StatusType) {
  switch (status) {
    case 'mastered':
      return 'text-green-400';
    case 'due':
      return 'text-farm-muted';
    case 'unlearned':
      return 'text-stone-300';
    default:
      return 'text-farm-text';
  }
}

export default function BankView({ words, getStatus, getWordState }: BankViewProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
        <h2 className="text-xl text-farm-muted mb-3">词库</h2>
        <input
          type="text"
          className="w-full mb-3 px-4 py-2.5 rounded-xl border border-farm-muted/25 bg-[rgba(42,24,11,0.5)] backdrop-blur-glass text-farm-text text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-farm-muted/60 focus:border-orange-500/60 focus:bg-[rgba(42,24,11,0.7)] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.2)]"
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
                  ? 'bg-orange-500 border-orange-500 text-farm-text'
                  : 'border-farm-muted bg-transparent text-farm-muted hover:text-farm-text hover:bg-white/5'
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
