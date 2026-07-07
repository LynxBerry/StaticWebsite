'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FlatWordEntry } from '../hooks/useVocabState';
import { Button } from './ui/Button';
import { SettingsIcon } from './icons/SettingsIcon';
import { TagIcon } from './icons/TagIcon';
import { TurtleIcon } from './icons/TurtleIcon';
import { SaveIcon } from './icons/SaveIcon';
import { ArchiveRestoreIcon } from './icons/ArchiveRestoreIcon';
import { TrashIcon } from './icons/TrashIcon';
import { KeyRoundIcon } from './icons/KeyRoundIcon';

interface SettingsViewProps {
  exportState: () => FlatWordEntry[];
  importState: (data: unknown, options?: { merge?: boolean }) => boolean;
  onReset: () => void;
  siteTitle: string;
  onUpdateSiteTitle: (title: string) => void;
  dailyNewLimit: number;
  onUpdateDailyNewLimit: (limit: number) => void;
}

const sectionClass = 'text-left p-5 mb-4 flat-card';

export default function SettingsView({ exportState, importState, onReset, siteTitle, onUpdateSiteTitle, dailyNewLimit, onUpdateDailyNewLimit }: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [mergeImport, setMergeImport] = useState(true);
  const [titleDraft, setTitleDraft] = useState(siteTitle);
  const [titleSaved, setTitleSaved] = useState(false);
  const [limitDraft, setLimitDraft] = useState(String(dailyNewLimit));
  const [limitSaved, setLimitSaved] = useState(false);
  const router = useRouter();

  // Keep the draft in sync when the loaded title changes (e.g. after DB pull).
  useEffect(() => {
    setTitleDraft(siteTitle);
  }, [siteTitle]);

  // Keep the daily-limit draft in sync when the DB value changes.
  useEffect(() => {
    setLimitDraft(String(dailyNewLimit));
  }, [dailyNewLimit]);

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed === siteTitle) return;
    onUpdateSiteTitle(trimmed);
    setTitleSaved(true);
    window.setTimeout(() => setTitleSaved(false), 2000);
  };

  const commitLimit = () => {
    const parsed = parseInt(limitDraft, 10);
    if (Number.isNaN(parsed) || parsed === dailyNewLimit) return;
    onUpdateDailyNewLimit(parsed);
    setLimitSaved(true);
    window.setTimeout(() => setLimitSaved(false), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Password change: verify the old password by re-signing in, then update.
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: '新密码至少需要 6 个字符。' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '两次输入的新密码不一致。' });
      return;
    }

    setPasswordSubmitting(true);
    const supabase = createClient();

    // Get the current user's email to verify the old password.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setPasswordMessage({ type: 'error', text: '无法获取用户信息，请重新登录后再试。' });
      setPasswordSubmitting(false);
      return;
    }

    // Verify the old password by re-signing in.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword
    });
    if (signInError) {
      setPasswordMessage({ type: 'error', text: '旧密码不正确。' });
      setPasswordSubmitting(false);
      return;
    }

    // Update to the new password.
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSubmitting(false);

    if (updateError) {
      setPasswordMessage({ type: 'error', text: '修改失败：' + updateError.message });
      return;
    }

    setPasswordMessage({ type: 'success', text: '密码已更新 ✓' });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

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
        <h2 className="text-xl font-semibold text-farm-text mb-1 font-display flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> 设置
        </h2>
        <p className="text-sm text-farm-muted">备份、恢复和重置</p>
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-farm-text mb-2 font-display flex items-center gap-2">
          <TagIcon className="w-5 h-5" /> 站点名称
        </h3>
        <p className="text-sm text-farm-muted mb-4 leading-relaxed">
          自定义你的单词农场名字，会显示在标题和浏览器标签页，所有设备同步。
        </p>
        <input
          type="text"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Sprout · 单词农场"
          maxLength={30}
          className="w-full px-4 py-2.5 rounded-lg bg-white border border-farm-borderSecondary text-farm-text text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-farm-textSecondary focus:border-farm-accent focus:ring-2 focus:ring-farm-accent/20"
        />
        {titleSaved && (
          <p className="mt-3 px-4 py-1.5 rounded-full text-sm text-center bg-farm-bg text-sprout-600 border border-farm-border">
            已保存 ✓
          </p>
        )}
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-farm-text mb-2 font-display flex items-center gap-2">
          <TurtleIcon className="w-5 h-5" /> 每日新词限额
        </h3>
        <p className="text-sm text-farm-muted mb-4 leading-relaxed">
          设置每天最多可以播种几个新单词（1-100），会同步到所有设备。
        </p>
        <input
          type="number"
          min={1}
          max={100}
          value={limitDraft}
          onChange={(e) => setLimitDraft(e.target.value)}
          onBlur={commitLimit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full px-4 py-2.5 rounded-lg bg-white border border-farm-borderSecondary text-farm-text text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-farm-textSecondary focus:border-farm-accent focus:ring-2 focus:ring-farm-accent/20"
        />
        {limitSaved && (
          <p className="mt-3 px-4 py-1.5 rounded-full text-sm text-center bg-farm-bg text-sprout-600 border border-farm-border">
            已保存 ✓
          </p>
        )}
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-farm-text mb-2 font-display flex items-center gap-2">
          <SaveIcon className="w-5 h-5" /> 备份词库和进度
        </h3>
        <p className="text-sm text-farm-muted mb-4 leading-relaxed">
          导出你的全部单词和学习进度为 JSON 文件，方便备份或迁移到其他设备。
        </p>
        <Button className="flex-none min-w-[140px]" onClick={handleExport}>
          导出备份
        </Button>
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-farm-text mb-2 font-display flex items-center gap-2">
          <ArchiveRestoreIcon className="w-5 h-5" /> 恢复备份
        </h3>
        <p className="text-sm text-farm-muted mb-4 leading-relaxed">
          选择之前导出的备份文件，恢复你的词库和学习进度。适用于换设备或重装后找回数据。
        </p>
        <label className="flex items-center gap-2 mb-4 text-sm text-farm-text cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-[1.125rem] h-[1.125rem] accent-green-500 cursor-pointer"
            checked={mergeImport}
            onChange={(e) => setMergeImport(e.target.checked)}
          />
          合并恢复（保留现有数据）
        </label>
        {/* Hidden native file input — triggered by the styled Button below
            so the chooser matches the rest of the app's button styling. */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button variant="secondary" className="flex-none min-w-[140px]" onClick={() => fileInputRef.current?.click()}>
          选择备份文件
        </Button>
        {importMessage && <p className="mt-3 px-4 py-1.5 rounded-full text-sm text-center bg-farm-bg text-sprout-600 border border-farm-border">{importMessage}</p>}
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-red-500/80 mb-2 font-display flex items-center gap-2">
          <TrashIcon className="w-5 h-5" /> 重置进度
        </h3>
        <p className="text-sm text-farm-muted mb-4 leading-relaxed">清空所有学习进度（不会删除词库）。此操作不可恢复，建议先导出备份。</p>
        <Button variant="secondary" className="flex-none min-w-[140px]" onClick={onReset}>
          重置所有进度
        </Button>
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-farm-text mb-2 font-display flex items-center gap-2">
          <KeyRoundIcon className="w-5 h-5" /> 修改密码
        </h3>
        <p className="text-sm text-farm-muted mb-4 leading-relaxed">
          修改你的登录密码。需要先验证旧密码。
        </p>
        <div className="space-y-3">
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="旧密码"
            autoComplete="current-password"
            className="w-full px-4 py-2.5 rounded-lg bg-white border border-farm-borderSecondary text-farm-text text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-farm-textSecondary focus:border-farm-accent focus:ring-2 focus:ring-farm-accent/20"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="新密码（至少 6 位）"
            autoComplete="new-password"
            className="w-full px-4 py-2.5 rounded-lg bg-white border border-farm-borderSecondary text-farm-text text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-farm-textSecondary focus:border-farm-accent focus:ring-2 focus:ring-farm-accent/20"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="确认新密码"
            autoComplete="new-password"
            className="w-full px-4 py-2.5 rounded-lg bg-white border border-farm-borderSecondary text-farm-text text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-farm-textSecondary focus:border-farm-accent focus:ring-2 focus:ring-farm-accent/20"
          />
          {passwordMessage && (
            <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-sprout-600' : 'text-red-500'}`}>
              {passwordMessage.text}
            </p>
          )}
          <Button
            className="flex-none min-w-[140px]"
            onClick={handleChangePassword}
            disabled={passwordSubmitting || !oldPassword || !newPassword || !confirmPassword}
          >
            {passwordSubmitting ? '更新中...' : '更新密码'}
          </Button>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-farm-text mb-2 font-display">🚪 退出登录</h3>
        <p className="text-sm text-farm-muted mb-4 leading-relaxed">退出当前账号，返回登录页。你的学习进度会保留在这个设备的本账号下。</p>
        <Button variant="secondary" className="flex-none min-w-[140px]" onClick={handleSignOut}>
          退出登录
        </Button>
      </div>
    </section>
  );
}
