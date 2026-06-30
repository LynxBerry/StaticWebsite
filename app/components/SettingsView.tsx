'use client';

import { useRef, useState } from 'react';
import { FlatWordEntry } from '../hooks/useVocabState';

interface SettingsViewProps {
  exportState: () => FlatWordEntry[];
  importState: (data: unknown, options?: { merge?: boolean }) => boolean;
  onReset: () => void;
}

const sectionClass = 'text-left p-5 mb-4 bg-farm-card backdrop-blur-glass border border-farm-border rounded-2xl';

const primaryBtn =
  `relative flex-1 overflow-hidden rounded-xl px-4 py-3.5 text-base font-semibold text-farm-text transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-[0_4px_16px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] [text-shadow:0_1px_2px_rgba(0,0,0,0.2)] before:absolute before:inset-0 before:content-[''] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-60 before:transition-opacity before:duration-250 enabled:hover:-translate-y-0.5 enabled:hover:scale-[1.02] enabled:hover:shadow-[0_8px_24px_rgba(249,115,22,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] enabled:hover:before:opacity-100 enabled:active:-translate-y-px enabled:active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale-[0.5]`;

const secondaryBtn =
  `relative flex-1 overflow-hidden rounded-xl border border-farm-muted/25 bg-[rgba(69,26,3,0.6)] px-4 py-3.5 text-base font-semibold text-farm-muted backdrop-blur-lg shadow-[0_4px_14px_rgba(0,0,0,0.2)] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] before:absolute before:inset-0 before:content-[''] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-60 before:transition-opacity before:duration-250 enabled:hover:bg-[rgba(69,26,3,0.8)] enabled:hover:border-farm-muted/45 enabled:hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] enabled:hover:before:opacity-100 enabled:active:-translate-y-px enabled:active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale-[0.5]`;

export default function SettingsView({ exportState, importState, onReset }: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [mergeImport, setMergeImport] = useState(true);

  const handleExport = () => {
    const state = exportState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    const filename = `zeno-vocab-backup-${date}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const success = importState(data, { merge: mergeImport });
      setImportMessage(success ? (mergeImport ? '增量导入成功！' : '恢复成功！') : '备份文件格式不正确。');
    } catch (err) {
      setImportMessage('无法读取文件，请检查是否为有效的 JSON。');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => setImportMessage(null), 3000);
  };

  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="settings-view">
      <div className="mb-4">
        <h2 className="text-xl text-farm-muted mb-1">⚙️ 设置</h2>
        <p className="text-sm text-farm-muted/80">备份、恢复和重置</p>
      </div>

      <div className={sectionClass}>
        <h3 className="text-base text-farm-text mb-2">💾 备份词库和进度</h3>
        <p className="text-sm text-farm-muted mb-4 leading-relaxed">
          导出为 flat 格式，每个单词一行：wordInEnglish / wordInChinese / level / next date。
          level 0 表示未学习，文件名自动带日期。
        </p>
        <button className={`${primaryBtn} flex-none min-w-[140px]`} onClick={handleExport}>
          导出备份
        </button>
      </div>

      <div className={sectionClass}>
        <h3 className="text-base text-farm-text mb-2">📂 恢复词库和进度</h3>
        <p className="text-sm text-farm-muted mb-4 leading-relaxed">
          选择 flat 格式或旧版内部格式的 JSON 备份文件进行恢复。
          默认开启增量导入：新增文件里没有的单词；文件里已有的单词会更新中文释义、level 和 next date，不在文件里的单词和进度保持不变。
        </p>
        <label className="flex items-center gap-2 mb-4 text-sm text-farm-text cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-[1.125rem] h-[1.125rem] accent-green-500 cursor-pointer"
            checked={mergeImport}
            onChange={(e) => setMergeImport(e.target.checked)}
          />
          增量导入（保留现有进度）
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="w-full py-2.5 text-farm-muted text-sm file:mr-3 file:px-4 file:py-2 file:rounded-full file:border file:border-farm-muted/35 file:bg-farm-muted/10 file:text-farm-text file:text-sm file:cursor-pointer file:transition-all file:duration-200 hover:file:bg-farm-muted/20 hover:file:border-farm-muted/60"
          onChange={handleFileChange}
        />
        {importMessage && <p className="mt-3 px-4 py-1.5 rounded-full text-sm text-center bg-green-500/15 text-green-400 border border-green-500/30">{importMessage}</p>}
      </div>

      <div className={sectionClass}>
        <h3 className="text-base text-red-300 mb-2">🗑️ 重置进度</h3>
        <p className="text-sm text-farm-muted mb-4 leading-relaxed">清空所有学习进度（不会删除词库）。此操作不可恢复，建议先导出备份。</p>
        <button className={`${secondaryBtn} flex-none min-w-[140px]`} onClick={onReset}>
          重置所有进度
        </button>
      </div>
    </section>
  );
}
