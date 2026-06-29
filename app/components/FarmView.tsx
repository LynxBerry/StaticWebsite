'use client';

import { Word } from '../data/words';
import { getPlantIcon } from '../lib/utils';
import Legend from './Legend';

interface FarmViewProps {
  words: Word[];
  getStatus: (index: number) => 'mastered' | 'due' | 'pending';
  getWordState: (index: number) => { level: number; nextReview: number };
}

export default function FarmView({ words, getStatus, getWordState }: FarmViewProps) {
  return (
    <section className="view" id="farm-view">
      <div className="farm-header">
        <h2>🌾 单词农场</h2>
        <p>每棵植物代表一个单词，成长阶段反映熟悉度</p>
      </div>

      <Legend />

      <div className="farm-grid">
        {words.map((word, index) => {
          const status = getStatus(index);
          const ws = getWordState(index);
          return (
            <div
              key={index}
              className={`farm-tile ${status}`}
              title={`${word.en} · ${word.cn} · Box ${ws.level}`}
            >
              <span className="farm-plant">{getPlantIcon(ws.level)}</span>
              <span className="farm-word">{word.en}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
