'use client';

export default function Legend() {
  const steps = [
    { icon: '🌰', box: 'Box 1', desc: '刚认识' },
    { icon: '🌱', box: 'Box 2', desc: '有点印象' },
    { icon: '🌿', box: 'Box 3', desc: '正在熟悉' },
    { icon: '🪴', box: 'Box 4', desc: '比较熟悉' },
    { icon: '🌳', box: 'Box 5', desc: '即将掌握' },
    { icon: '✨🌳✨', box: '掌握', desc: '参天大树', mastered: true }
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
