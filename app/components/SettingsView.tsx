'use client';

import { useRef, useState } from 'react';
import { FlatWordEntry } from '../hooks/useVocabState';

interface SettingsViewProps {
  exportState: () => FlatWordEntry[];
  importState: (data: unknown, options?: { merge?: boolean }) => boolean;
  onReset: () => void;
}

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
    <section className="view" id="settings-view">
      <div className="settings-header">
        <h2>⚙️ 设置</h2>
        <p>备份、恢复和重置</p>
      </div>

      <div className="settings-section">
        <h3>💾 备份词库和进度</h3>
        <p className="settings-desc">
          导出为 flat 格式，每个单词一行：wordInEnglish / wordInChinese / level / next date。
          level 0 表示未学习，文件名自动带日期。
        </p>
        <button className="btn btn-know" onClick={handleExport}>
          导出备份
        </button>
      </div>

      <div className="settings-section">
        <h3>📂 恢复词库和进度</h3>
        <p className="settings-desc">
          选择 flat 格式或旧版内部格式的 JSON 备份文件进行恢复。
          默认开启增量导入：新增文件里没有的单词；文件里已有的单词会更新中文释义、level 和 next date，不在文件里的单词和进度保持不变。
        </p>
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={mergeImport}
            onChange={(e) => setMergeImport(e.target.checked)}
          />
          增量导入（保留现有进度）
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="file-input"
          onChange={handleFileChange}
        />
        {importMessage && <p className="settings-message">{importMessage}</p>}
      </div>

      <div className="settings-section danger">
        <h3>🗑️ 重置进度</h3>
        <p className="settings-desc">清空所有学习进度（不会删除词库）。此操作不可恢复，建议先导出备份。</p>
        <button className="btn btn-again" onClick={onReset}>
          重置所有进度
        </button>
      </div>
    </section>
  );
}
