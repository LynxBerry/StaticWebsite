'use client';

import { Word } from '../data/words';
import { getPlantIcon } from '../lib/utils';
import Legend from './Legend';

interface FarmViewProps {
  words: Word[];
  getStatus: (en: string) => 'mastered' | 'due' | 'pending' | 'unlearned';
  getWordState: (en: string) => { level: number; nextReview: number };
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
        {words.map((word) => {
          const status = getStatus(word.en);
          const ws = getWordState(word.en);
          return (
            <div
              key={word.en}
              className={`farm-tile ${status} ${status === 'unlearned' ? 'empty' : ''}`}
              title={`${word.en} · ${word.cn} · ${status === 'unlearned' ? '待播种' : `阶段 ${ws.level}`}`}
            >
              <span className="farm-plant">
                {status === 'unlearned' ? '' : getPlantIcon(ws.level)}
              </span>
              {status !== 'unlearned' && <span className="farm-word">{word.en}</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
