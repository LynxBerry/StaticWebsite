'use client';

import { useState, useRef } from 'react';
import { Word } from '../data/words';
import { formatDate } from '../lib/utils';
import { useOverflow } from '../hooks/useOverflow';
import EmptyState from './EmptyState';
import { PlantIcon } from './PlantIcon';
import { CategoriesIcon } from './icons/CategoriesIcon';
import { ArrowBigDownDashIcon } from './icons/ArrowBigDownDashIcon';
import { ScrollFadeHint } from './ScrollFadeHint';
import { Button } from './ui/Button';
import SpeakButton from './ui/SpeakButton';

type FilterType = 'all' | 'unlearned' | 'due' | 'mastered';
type StatusType = 'mastered' | 'due' | 'pending' | 'unlearned';

interface BankViewProps {
  words: Word[];
  getStatus: (en: string) => StatusType;
  getWordState: (en: string) => { level: number; nextReview: number };
  onGoToSettings: () => void;
  /** Add a new word. Returns true on success, false on duplicate/empty. */
  onAddWord: (en: string, cn: string) => boolean;
  /** Edit an existing word (rename + cn update). Returns true on success. */
  onUpdateWord: (oldEn: string, newEn: string, newCn: string) => boolean;
  /** Soft-delete a word. The parent handles undo via the toast it surfaces. */
  onRemoveWord: (en: string) => void;
  /** Undo a deletion (restore word + progress). */
  onUndoRemove: (word: Word, state?: { level: number; nextReview: number }) => void;
}

function wordItemClass(status: StatusType) {
  // Flat list item strip on a white card. The outer flat-card wraps the
  // whole <ul>, so rows just need a light fill and subtle border.
  const base =
    'flex items-center gap-3 px-3 py-3 mb-2 rounded-[14px] ' +
    'bg-farm-bg border border-farm-borderSecondary ' +
    'transition-colors duration-200 hover:bg-farm-fillQuaternary';
  switch (status) {
    case 'due':
      return `${base} ring-1 ring-harvest-200`;
    case 'unlearned':
      // Don't dim the whole row — that hides the action buttons too. The
      // icon's muted fill + the muted plant 🌰 already convey "unlearned".
      return `${base} bg-farm-fillQuaternary`;
    default:
      return base;
  }
}

/** Circular avatar holding the plant icon, tinted by growth stage. */
function iconClass(status: StatusType, level: number) {
  const base = 'flex items-center justify-center shrink-0 w-10 h-10 rounded-full text-lg';
  if (status === 'unlearned') {
    return `${base} bg-farm-fillQuaternary`;
  }
  const heatColors: Record<number, string> = {
    1: 'bg-yellow-50',
    2: 'bg-green-50',
    3: 'bg-green-100',
    4: 'bg-green-200',
    5: 'bg-green-300',
    6: 'bg-green-400'
  };
  return `${base} ${heatColors[level] || heatColors[6]}`;
}

function statusTextClass(status: StatusType) {
  switch (status) {
    case 'mastered':
      return 'text-sprout-600';
    case 'due':
      return 'text-harvest-600';
    case 'unlearned':
      return 'text-farm-textSecondary';
    default:
      return 'text-farm-muted';
  }
}

const inputBaseClass =
  'flex-1 min-w-0 px-4 h-12 rounded-2xl bg-white border border-farm-borderSecondary text-farm-text text-sm outline-none ' +
  'transition-all duration-sprout-mid placeholder:text-farm-textSecondary ' +
  'focus:border-farm-accent focus:ring-2 focus:ring-farm-accent/20';

const addInputClass =
  'w-full px-4 h-12 rounded-2xl bg-white border border-farm-borderSecondary text-farm-text text-base outline-none ' +
  'transition-all duration-sprout-mid placeholder:text-farm-textSecondary ' +
  'focus:border-farm-accent focus:ring-2 focus:ring-farm-accent/20';

export default function BankView({
  words,
  getStatus,
  getWordState,
  onGoToSettings,
  onAddWord,
  onUpdateWord,
  onRemoveWord,
  onUndoRemove
}: BankViewProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addEn, setAddEn] = useState('');
  const [addCn, setAddCn] = useState('');
  // Batch-add mode: a textarea where users paste many lines of "英文,中文".
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [editingEn, setEditingEn] = useState<string | null>(null);
  const [editEn, setEditEn] = useState('');
  const [editCn, setEditCn] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const hasOverflow = useOverflow(listRef);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Batch add: parse a textarea of "英文,中文" lines (one per line) and
  // add each via onAddWord. Tolerates full-width comma, tab, and surrounding
  // whitespace. Reports how many were added vs skipped (duplicates/empty).
  const handleBatchSubmit = () => {
    const lines = batchText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setFeedback('请输入至少一行');
      window.setTimeout(() => setFeedback(null), 2500);
      return;
    }
    let added = 0;
    let skipped = 0;
    lines.forEach((line) => {
      const parts = line.split(/[,，\t]/).map((p) => p.trim());
      if (parts.length < 2 || !parts[0] || !parts[1]) {
        skipped++;
        return;
      }
      if (onAddWord(parts[0], parts.slice(1).join(','))) {
        added++;
      } else {
        skipped++;
      }
    });
    setBatchText('');
    setShowBatchForm(false);
    if (added > 0) {
      setFeedback(`已添加 ${added} 个单词${skipped > 0 ? `，跳过 ${skipped} 个（重复或格式错误）` : ''}`);
    } else {
      setFeedback('没有添加，请检查格式：每行"英文,中文"');
    }
    window.setTimeout(() => setFeedback(null), 3500);
  };

  // Empty library: show import guidance + add buttons.
  if (words.length === 0 && !showAddForm && !showBatchForm) {
    return (
      <section className="flex-1 flex flex-col min-h-[60vh]" id="bank-view">
        <div className="mb-4 flex justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowBatchForm(true)}>批量添加</Button>
          <Button size="sm" onClick={() => setShowAddForm(true)}>+ 添加单词</Button>
        </div>
        {/* Batch-add form (empty-state version). */}
        {showBatchForm && (
          <div className="flat-card mb-4 p-3 animate-toast-in">
            <p className="text-xs text-farm-muted mb-2 leading-relaxed">
              每行一个单词，格式：<span className="text-farm-text font-semibold">英文,中文</span>（逗号分隔，支持中文逗号）
            </p>
            <textarea
              className="w-full px-3 py-3 mb-3 rounded-2xl bg-white border border-farm-borderSecondary text-farm-text text-sm outline-none transition-all duration-sprout-mid placeholder:text-farm-textSecondary focus:border-farm-accent focus:ring-2 focus:ring-farm-accent/20 min-h-[180px] resize-y"
              placeholder={'apple,苹果\nbanana,香蕉\ncat,猫'}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => { setShowBatchForm(false); setBatchText(''); }}>
                取消
              </Button>
              <Button size="sm" onClick={handleBatchSubmit}>批量添加</Button>
            </div>
          </div>
        )}
        <EmptyState
          icon="📚"
          title="词库还是空的"
          message="点击上方按钮添加你的第一个单词吧。批量添加支持一次粘贴多个单词。"
        />
      </section>
    );
  }

  const term = searchTerm.trim().toLowerCase();

  const items = words
    .map((word) => ({
      word,
      status: getStatus(word.en),
      ws: getWordState(word.en)
    }))
    .filter(({ status }) => (filter === 'all' ? true : status === filter))
    .filter(({ word }) => {
      if (!term) return true;
      return word.en.toLowerCase().includes(term) || word.cn.includes(term);
    });

  const getStatusText = (status: StatusType, ws: { nextReview: number }) => {
    if (status === 'unlearned') return '待播种';
    if (status === 'mastered') return '已掌握';
    if (status === 'due') return '今日到期';
    return `下次复习 ${formatDate(ws.nextReview)}`;
  };

  const handleAddSubmit = () => {
    if (!addEn.trim()) {
      setFeedback('英文不能为空');
      window.setTimeout(() => setFeedback(null), 2500);
      return;
    }
    if (onAddWord(addEn, addCn)) {
      setAddEn('');
      setAddCn('');
      setShowAddForm(false);
      setFeedback(`已添加 ${addEn.trim()}`);
      window.setTimeout(() => setFeedback(null), 2500);
    } else {
      setFeedback('该单词已存在');
      window.setTimeout(() => setFeedback(null), 2500);
    }
  };

  const startEdit = (word: Word) => {
    setEditingEn(word.en);
    setEditEn(word.en);
    setEditCn(word.cn);
  };

  const handleEditCancel = () => {
    setEditingEn(null);
    setEditEn('');
    setEditCn('');
  };

  const handleEditSave = (oldEn: string) => {
    if (!editEn.trim()) {
      setFeedback('英文不能为空');
      window.setTimeout(() => setFeedback(null), 2500);
      return;
    }
    if (onUpdateWord(oldEn, editEn, editCn)) {
      handleEditCancel();
      setFeedback('已保存');
      window.setTimeout(() => setFeedback(null), 2000);
    } else {
      setFeedback('该英文已存在，无法重命名');
      window.setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleDelete = (word: Word) => {
    onRemoveWord(word.en);
    // The parent surfaces the undo toast; this inline feedback is just a
    // quick local confirmation that fades out on its own.
    setFeedback(`已删除 ${word.en}`);
    window.setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <section className="flex-1 flex flex-col min-h-[60vh]" id="bank-view">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold font-display text-farm-text flex items-center gap-2">
            <CategoriesIcon className="w-6 h-6" /> 词库
          </h2>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => { setShowBatchForm((v) => !v); setShowAddForm(false); }}>
              <ArrowBigDownDashIcon className="w-4 h-4" /> 批量
            </Button>
            <Button size="sm" onClick={() => { setShowAddForm((v) => !v); setShowBatchForm(false); }}>+ 添加</Button>
          </div>
        </div>

        {/* Batch-add form — paste many lines of "英文,中文". */}
        {showBatchForm && (
          <div className="flat-card mb-4 p-3 animate-toast-in">
            <p className="text-xs text-farm-muted mb-2 leading-relaxed">
              每行一个单词，格式：<span className="text-farm-text font-semibold">英文,中文</span>（逗号分隔，支持中文逗号）
            </p>
            <textarea
              className="w-full px-3 py-3 mb-3 rounded-2xl bg-white border border-farm-borderSecondary text-farm-text text-sm outline-none transition-all duration-sprout-mid placeholder:text-farm-textSecondary focus:border-farm-accent focus:ring-2 focus:ring-farm-accent/20 min-h-[180px] resize-y"
              placeholder={'apple,苹果\nbanana,香蕉\ncat,猫'}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => { setShowBatchForm(false); setBatchText(''); }}>
                取消
              </Button>
              <Button size="sm" onClick={handleBatchSubmit}>批量添加</Button>
            </div>
          </div>
        )}

        {/* Inline add-word form */}
        {showAddForm && (
          <div className="flat-card mb-4 p-3 animate-toast-in">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                className={addInputClass}
                placeholder="英文 (如 apple)"
                value={addEn}
                onChange={(e) => setAddEn(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCn.trim() ? handleAddSubmit() : undefined; }}
                autoFocus
              />
              <input
                type="text"
                className={addInputClass}
                placeholder="中文释义 (如 苹果)"
                value={addCn}
                onChange={(e) => setAddCn(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubmit(); }}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => { setShowAddForm(false); setAddEn(''); setAddCn(''); }}>
                  取消
                </Button>
                <Button size="sm" onClick={handleAddSubmit}>添加</Button>
              </div>
            </div>
          </div>
        )}

        <input
          type="text"
          className="w-full mb-4 px-4 h-14 rounded-2xl bg-white border border-farm-borderSecondary text-farm-text text-sm outline-none transition-all duration-sprout-mid placeholder:text-farm-textSecondary focus:border-farm-accent focus:ring-2 focus:ring-farm-accent/20"
          placeholder="搜索英文或中文..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {(['all', 'unlearned', 'due', 'mastered'] as FilterType[]).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                className={`inline-flex items-center h-9 px-3 text-xs rounded-full transition-all duration-sprout-mid ${
                  active
                    ? 'bg-farm-accent/10 text-farm-text font-semibold border border-farm-border'
                    : 'bg-white border border-farm-borderSecondary text-farm-muted hover:bg-farm-bg hover:text-farm-text'
                }`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? '全部' : f === 'unlearned' ? '待播种' : f === 'due' ? '今日到期' : '已掌握'}
              </button>
            );
          })}
        </div>
        {feedback && (
          <p className="text-xs text-farm-muted text-center mb-2 animate-toast-in">{feedback}</p>
        )}
      </div>
      <div className="flat-card p-3 relative">
        <ul ref={listRef} className="list-none max-h-[55vh] overflow-y-auto no-scrollbar text-left">
        {items.length === 0 ? (
          <li className="flex items-center justify-center px-4 py-3.5 mb-2 rounded-xl text-farm-muted">
            没有符合条件的单词
          </li>
        ) : (
          items.map(({ word, status, ws }) => (
            <li key={word.en} className={wordItemClass(status)}>
              {editingEn === word.en ? (
                /* Inline edit form replaces the row content. */
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <input
                    type="text"
                    className={inputBaseClass}
                    value={editEn}
                    onChange={(e) => setEditEn(e.target.value)}
                    placeholder="英文"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(word.en); if (e.key === 'Escape') handleEditCancel(); }}
                    autoFocus
                  />
                  <input
                    type="text"
                    className={inputBaseClass}
                    value={editCn}
                    onChange={(e) => setEditCn(e.target.value)}
                    placeholder="中文释义"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(word.en); if (e.key === 'Escape') handleEditCancel(); }}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" size="sm" onClick={handleEditCancel}>取消</Button>
                    <Button size="sm" onClick={() => handleEditSave(word.en)}>保存</Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className={iconClass(status, ws.level)}>
                    <PlantIcon level={status === 'unlearned' ? 1 : ws.level} className="w-6 h-6" />
                  </span>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-farm-text truncate">{word.en}</span>
                      <SpeakButton text={word.en} size="sm" />
                    </div>
                    <span className="text-sm text-farm-muted truncate">{word.cn}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs shrink-0">
                    <span className="text-farm-textSecondary">{status === 'unlearned' ? '阶段 1' : `阶段 ${ws.level}`}</span>
                    <span className={`font-semibold ${statusTextClass(status)}`}>{getStatusText(status, ws)}</span>
                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => startEdit(word)}
                        aria-label={`编辑 ${word.en}`}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-farm-bg border border-farm-borderSecondary text-[0.625rem] hover:bg-farm-fillQuaternary transition-colors"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(word)}
                        aria-label={`删除 ${word.en}`}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-farm-bg border border-farm-borderSecondary text-[0.625rem] hover:bg-red-50 transition-colors"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))
        )}
        </ul>
        {hasOverflow && <ScrollFadeHint />}
      </div>
    </section>
  );
}
