'use client';

import { PlantIcon } from './PlantIcon';

export default function Legend() {
  const steps = [
    { level: 1, box: '阶段 1', desc: '刚认识' },
    { level: 2, box: '阶段 2', desc: '有点印象' },
    { level: 3, box: '阶段 3', desc: '正在熟悉' },
    { level: 4, box: '阶段 4', desc: '比较熟悉' },
    { level: 5, box: '阶段 5', desc: '即将掌握' },
    { level: 6, box: '阶段 6', desc: '完全掌握' }
  ];

  const heatColors: Record<number, string> = {
    1: 'bg-yellow-50',
    2: 'bg-green-50',
    3: 'bg-green-100',
    4: 'bg-green-200',
    5: 'bg-green-300',
    6: 'bg-green-400'
  };

  return (
    <section className="mb-6 p-4 glass-card">
      <div className="text-sm text-farm-text mb-1 font-semibold">熟悉度成长图</div>
      <p className="text-xs text-farm-muted mb-4">每棵植物代表一个单词，成长阶段反映熟悉度</p>
      <div className="flex flex-col items-center overflow-x-auto pb-2 -mb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center">
          {steps.map((step, index) => (
            <div key={`icon-${step.box}`} className="flex items-center">
              <div className="flex flex-col items-center min-w-[3rem]">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full ${heatColors[step.level]}`}>
                  <PlantIcon level={step.level} className="w-5 h-5" />
                </div>
              </div>
              {index < steps.length - 1 && (
                <span className="text-farm-textSecondary text-xs font-bold opacity-80 shrink-0">→</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-start mt-1">
          {steps.map((step) => (
            <div key={`label-${step.box}`} className="flex flex-col items-center min-w-[3rem] px-0.5">
              <span className="text-[0.75rem] font-bold text-farm-text">{step.box}</span>
              <span className="text-[0.6875rem] text-farm-muted whitespace-nowrap">{step.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
