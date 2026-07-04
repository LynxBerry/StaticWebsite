'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FlatWordEntry } from '../hooks/useVocabState';
import { Button } from './ui/Button';

interface SettingsViewProps {
  exportState: () => FlatWordEntry[];
  importState: (data: unknown, options?: { merge?: boolean }) => boolean;
  onReset: () => void;
  siteTitle: string;
  onUpdateSiteTitle: (title: string) => void;
}

const sectionClass = 'text-left p-5 mb-4 glass-card';

export default function SettingsView({ exportState, importState, onReset, siteTitle, onUpdateSiteTitle }: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [mergeImport, setMergeImport] = useState(true);
  const [titleDraft, setTitleDraft] = useState(siteTitle);
  const [titleSaved, setTitleSaved] = useState(false);
  const router = useRouter();

  // Keep the draft in sync when the loaded title changes (e.g. after DB pull).
  useEffect(() => {
    setTitleDraft(siteTitle);
  }, [siteTitle]);

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed === siteTitle) return;
    onUpdateSiteTitle(trimmed);
    setTitleSaved(true);
    window.setTimeout(() => setTitleSaved(false), 2000);
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
        <h2 className="text-xl font-semibold text-white mb-1 font-display">⚙️ 设置</h2>
        <p className="text-sm text-white/60">备份、恢复和重置</p>
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-white mb-2 font-display">🏷️ 站点名称</h3>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">
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
          className="w-full px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-xl backdrop-saturate-150 text-white text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-white/45 focus:bg-white/25 focus:shadow-[0_0_0_2px_rgba(255,255,255,0.25)]"
        />
        {titleSaved && (
          <p className="mt-3 px-4 py-1.5 rounded-full text-sm text-center bg-white/15 text-sprout-300 border border-white/25">
            已保存 ✓
          </p>
        )}
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-white mb-2 font-display">💾 备份词库和进度</h3>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">
          导出为 flat 格式，每个单词一行：wordInEnglish / wordInChinese / level / next date。
          level 0 表示未学习，文件名自动带日期。
        </p>
        <Button className="flex-none min-w-[140px]" onClick={handleExport}>
          导出备份
        </Button>
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-white mb-2 font-display">📂 恢复词库和进度</h3>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">
          选择 flat 格式或旧版内部格式的 JSON 备份文件进行恢复。
          默认开启增量导入：新增文件里没有的单词；文件里已有的单词会更新中文释义、level 和 next date，不在文件里的单词和进度保持不变。
        </p>
        <label className="flex items-center gap-2 mb-4 text-sm text-white/90 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-[1.125rem] h-[1.125rem] accent-green-500 cursor-pointer"
            checked={mergeImport}
            onChange={(e) => setMergeImport(e.target.checked)}
          />
          增量导入（保留现有进度）
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
        {importMessage && <p className="mt-3 px-4 py-1.5 rounded-full text-sm text-center bg-white/15 text-sprout-300 border border-white/25">{importMessage}</p>}
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-red-500/80 mb-2 font-display">🗑️ 重置进度</h3>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">清空所有学习进度（不会删除词库）。此操作不可恢复，建议先导出备份。</p>
        <Button variant="secondary" className="flex-none min-w-[140px]" onClick={onReset}>
          重置所有进度
        </Button>
      </div>

      <div className={sectionClass}>
        <h3 className="text-base font-semibold text-white mb-2 font-display">🔑 修改密码</h3>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">
          修改你的登录密码。需要先验证旧密码。
        </p>
        <div className="space-y-3">
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="旧密码"
            autoComplete="current-password"
            className="w-full px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-xl backdrop-saturate-150 text-white text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-white/45 focus:bg-white/25 focus:shadow-[0_0_0_2px_rgba(255,255,255,0.25)]"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="新密码（至少 6 位）"
            autoComplete="new-password"
            className="w-full px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-xl backdrop-saturate-150 text-white text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-white/45 focus:bg-white/25 focus:shadow-[0_0_0_2px_rgba(255,255,255,0.25)]"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="确认新密码"
            autoComplete="new-password"
            className="w-full px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-xl backdrop-saturate-150 text-white text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-white/45 focus:bg-white/25 focus:shadow-[0_0_0_2px_rgba(255,255,255,0.25)]"
          />
          {passwordMessage && (
            <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-sprout-300' : 'text-red-400'}`}>
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
        <h3 className="text-base font-semibold text-white mb-2 font-display">🚪 退出登录</h3>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">退出当前账号，返回登录页。你的学习进度会保留在这个设备的本账号下。</p>
        <Button variant="secondary" className="flex-none min-w-[140px]" onClick={handleSignOut}>
          退出登录
        </Button>
      </div>
    </section>
  );
}
