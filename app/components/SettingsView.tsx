'use client';

import { useRef, useState } from 'react';
import { AppState } from '../hooks/useVocabState';

interface SettingsViewProps {
  exportState: () => AppState;
  importState: (data: unknown) => boolean;
  onReset: () => void;
}

export default function SettingsView({ exportState, importState, onReset }: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

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
      const success = importState(data);
      setImportMessage(success ? '恢复成功！' : '备份文件格式不正确。');
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
        <p>备份和恢复你的学习进度</p>
      </div>

      <div className="settings-section">
        <h3>备份进度</h3>
        <p className="settings-desc">将当前学习进度导出为 JSON 文件，文件名会自动带上今天的日期。</p>
        <button className="btn btn-know" onClick={handleExport}>
          💾 导出备份
        </button>
      </div>

      <div className="settings-section">
        <h3>恢复进度</h3>
        <p className="settings-desc">选择之前导出的 JSON 备份文件，恢复学习进度。</p>
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
        <h3>重置进度</h3>
        <p className="settings-desc">清空所有学习进度，此操作不可恢复。建议先导出备份。</p>
        <button className="btn btn-again" onClick={onReset}>
          🗑️ 重置所有进度
        </button>
      </div>
    </section>
  );
}
