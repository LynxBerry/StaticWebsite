'use client';

import { useRef, useState } from 'react';
import { Word } from '../data/words';
import { FlatWordEntry } from '../hooks/useVocabState';

interface SettingsViewProps {
  words: Word[];
  exportState: () => FlatWordEntry[];
  importState: (data: unknown) => boolean;
  onReset: () => void;
  onAddWord: (word: Word) => void;
  onUpdateWord: (oldEn: string, newWord: Word) => void;
  onDeleteWord: (en: string) => void;
}

export default function SettingsView({
  words,
  exportState,
  importState,
  onReset,
  onAddWord,
  onUpdateWord,
  onDeleteWord
}: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [newEn, setNewEn] = useState('');
  const [newCn, setNewCn] = useState('');
  const [editingEn, setEditingEn] = useState<string | null>(null);
  const [editEn, setEditEn] = useState('');
  const [editCn, setEditCn] = useState('');

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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEn = newEn.trim();
    const trimmedCn = newCn.trim();
    if (!trimmedEn || !trimmedCn) return;

    onAddWord({ en: trimmedEn, cn: trimmedCn });
    setNewEn('');
    setNewCn('');
  };

  const startEdit = (word: Word) => {
    setEditingEn(word.en);
    setEditEn(word.en);
    setEditCn(word.cn);
  };

  const cancelEdit = () => {
    setEditingEn(null);
    setEditEn('');
    setEditCn('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEn) return;
    const trimmedEn = editEn.trim();
    const trimmedCn = editCn.trim();
    if (!trimmedEn || !trimmedCn) return;

    onUpdateWord(editingEn, { en: trimmedEn, cn: trimmedCn });
    setEditingEn(null);
    setEditEn('');
    setEditCn('');
  };

  return (
    <section className="view" id="settings-view">
      <div className="settings-header">
        <h2>⚙️ 设置</h2>
        <p>管理词库、备份和恢复学习进度</p>
      </div>

      <div className="settings-section">
        <h3>📚 词库管理</h3>
        <p className="settings-desc">当前共有 <strong>{words.length}</strong> 个单词。你可以添加、编辑或删除。</p>

        <form className="word-form" onSubmit={handleAdd}>
          <input
            type="text"
            className="search-input"
            placeholder="英文"
            value={newEn}
            onChange={(e) => setNewEn(e.target.value)}
          />
          <input
            type="text"
            className="search-input"
            placeholder="中文"
            value={newCn}
            onChange={(e) => setNewCn(e.target.value)}
          />
          <button type="submit" className="btn btn-know">➕ 添加单词</button>
        </form>

        <ul className="word-manage-list">
          {words.map((word) => (
            <li key={word.en} className="word-manage-item">
              {editingEn === word.en ? (
                <form className="word-edit-form" onSubmit={handleUpdate}>
                  <input
                    type="text"
                    className="search-input"
                    value={editEn}
                    onChange={(e) => setEditEn(e.target.value)}
                  />
                  <input
                    type="text"
                    className="search-input"
                    value={editCn}
                    onChange={(e) => setEditCn(e.target.value)}
                  />
                  <div className="word-edit-actions">
                    <button type="submit" className="btn btn-know">保存</button>
                    <button type="button" className="btn btn-again" onClick={cancelEdit}>取消</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="word-manage-info">
                    <span className="word-manage-en">{word.en}</span>
                    <span className="word-manage-cn">{word.cn}</span>
                  </div>
                  <div className="word-manage-actions">
                    <button className="btn btn-reset" onClick={() => startEdit(word)}>编辑</button>
                    <button className="btn btn-again" onClick={() => onDeleteWord(word.en)}>删除</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
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
        <p className="settings-desc">选择 flat 格式或旧版内部格式的 JSON 备份文件进行恢复。</p>
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
