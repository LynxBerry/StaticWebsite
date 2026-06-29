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
    <section className="view" id="bank-view">
      <div className="bank-header">
        <h2>词库</h2>
        <input
          type="text"
          className="search-input"
          placeholder="搜索英文或中文..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="bank-filters">
          {(['all', 'unlearned', 'due', 'mastered'] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`filter ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '全部' : f === 'unlearned' ? '待播种' : f === 'due' ? '今日到期' : '已掌握'}
            </button>
          ))}
        </div>
      </div>
      <ul className="word-list">
        {items.length === 0 ? (
          <li className="word-item empty">没有符合条件的单词</li>
        ) : (
          items.map(({ word, status, ws }) => (
            <li key={word.en} className={`word-item ${status}`}>
              <div className="word-info">
                <span className="word-en">{word.en}</span>
                <span className="word-cn">{word.cn}</span>
              </div>
              <div className="word-meta">
                <span className="word-box">{getLevelText(status, ws)}</span>
                <span className="word-status">{getStatusText(status, ws)}</span>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
