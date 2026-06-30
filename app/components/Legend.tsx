'use client';

export default function Legend() {
  const steps = [
    { icon: '🌰', box: '阶段 1', desc: '刚认识' },
    { icon: '🌱', box: '阶段 2', desc: '有点印象' },
    { icon: '🌿', box: '阶段 3', desc: '正在熟悉' },
    { icon: '🪴', box: '阶段 4', desc: '比较熟悉' },
    { icon: '🌳', box: '阶段 5', desc: '即将掌握' },
    { icon: '✨🌳✨', box: '阶段 6', desc: '完全掌握', mastered: true }
  ];

  return (
    <section className="mb-6 p-4 bg-farm-card backdrop-blur-glass rounded-2xl border border-farm-border shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
      <div className="text-sm text-farm-muted mb-3 font-semibold">熟悉度成长图</div>
      <div className="flex items-center justify-start gap-0.5 overflow-x-auto pb-2 -mb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {steps.map((step, index) => (
          <div key={step.box} className="flex items-center gap-0.5 shrink-0">
            <div className={`flex flex-col items-center min-w-[3rem] px-0.5 py-1 rounded-lg transition-colors duration-200 ${step.mastered ? 'bg-[rgba(20,40,20,0.7)]' : ''}`}>
              <span className="text-lg mb-0.5">{step.icon}</span>
              <span className="text-[0.625rem] font-bold text-farm-text">{step.box}</span>
              <span className="text-[0.5625rem] text-farm-muted whitespace-nowrap">{step.desc}</span>
            </div>
            {index < steps.length - 1 && <div className="text-orange-500 text-xs font-bold opacity-70 shrink-0">→</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
