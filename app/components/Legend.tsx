'use client';

import { PlantIcon } from './PlantIcon';

export default function Legend() {
  const steps = [
    { level: 1, box: '阶段 1', desc: '刚认识' },
    { level: 2, box: '阶段 2', desc: '有点印象' },
    { level: 3, box: '阶段 3', desc: '正在熟悉' },
    { level: 4, box: '阶段 4', desc: '比较熟悉' },
    { level: 5, box: '阶段 5', desc: '即将掌握' },
    { level: 6, box: '阶段 6', desc: '完全掌握', mastered: true }
  ];

  return (
    <section className="mb-6 p-4 glass-card">
      <div className="text-sm text-farm-text mb-4 font-semibold">熟悉度成长图</div>
      <div className="flex items-center justify-start gap-0.5 overflow-x-auto pb-2 -mb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {steps.map((step, index) => (
          <div key={step.box} className="flex items-center gap-0.5 shrink-0">
            <div className={`flex flex-col items-center min-w-[3rem] px-0.5 py-1 rounded-lg transition-colors duration-200 ${step.mastered ? 'bg-farm-bg' : ''}`}>
              <PlantIcon level={step.level} className="w-6 h-6 mb-0.5" />
              <span className="text-[0.75rem] font-bold text-farm-text">{step.box}</span>
              <span className="text-[0.6875rem] text-farm-muted whitespace-nowrap">{step.desc}</span>
            </div>
            {index < steps.length - 1 && <div className="text-farm-textSecondary text-xs font-bold opacity-80 shrink-0">→</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
