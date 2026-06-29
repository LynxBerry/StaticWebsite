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
    <section className="legend">
      <div className="legend-title">熟悉度成长图</div>
      <div className="legend-steps">
        {steps.map((step, index) => (
          <div key={step.box} className="legend-step-wrapper">
            <div className={`legend-step ${step.mastered ? 'mastered' : ''}`}>
              <span className="legend-icon">{step.icon}</span>
              <span className="legend-box">{step.box}</span>
              <span className="legend-desc">{step.desc}</span>
            </div>
            {index < steps.length - 1 && <div className="legend-arrow">→</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
