# Zeno 的单词农场 — Agent 协作指南

## 项目概述

- 名称：Zeno 的单词农场（`zeno-vocab-farm`）
- 技术栈：Next.js 16.2.9 + React 19 + TypeScript 5.7 + Tailwind CSS 3.4 + Supabase
- 部署：Vercel
- 性质：基于艾宾浩斯 / Leitner 间隔重复的背单词应用，单页六 tab（Dashboard / Learn / Study / Farm / Bank / Settings）

## 关键架构决策

### 1. 使用 `proxy.ts` 而不是 `middleware.ts`

Next.js 16 已将 `middleware.ts` 文件约定重命名为 `proxy.ts`，导出函数也从 `middleware` 改为 `proxy`。

- 入口文件：`/proxy.ts`
- 实际刷新逻辑：`/lib/supabase/proxy.ts` 中的 `updateSession()`
- 作用：在每个匹配请求前刷新 Supabase auth session cookie，不强制登录（登录保护在页面级 Server Component 里做）
- 验证结果（2026-07-07）：`npm run build` 显示 `ƒ Proxy (Middleware)`，dev server 日志确认 `proxy.ts` 在 `/` 和 `/login` 请求时均正常执行，无 deprecation warning

**不要**把 `proxy.ts` 改回 `middleware.ts`，也不要重复在页面里加 session 刷新逻辑。

### 2. 认证

- 使用 Supabase Auth，仅支持管理员手动建号（README 说明未开放自助注册）
- 登录保护在 `app/page.tsx` 和 `app/login/page.tsx` 中通过 `supabase.auth.getUser()` 实现
- `lib/supabase/server.ts` 中的 `setAll` 会吞掉 Server Component 中设置 cookie 的错误，注释说明依赖 proxy 刷新 session

### 3. 数据模型

核心类型见 `app/lib/types.ts`：

```ts
interface Word {
  en: string; // 主键
  cn: string;
}

interface WordState {
  level: number;        // 1-5 学习阶段，6=掌握
  nextReview: number;   // 下次复习时间戳
  firstLearnedDate?: string;
}

interface WrongItem {
  en: string;
  remaining: number; // 还需连续答对次数（默认 3）
}
```

- 阶段间隔：`1→2→4→7→14` 天（`app/hooks/useVocabState.ts`）
- 掌握（level 6）后**不会再进入复习队列**：`getDueWords` / `getReviewStats` / `getStatus` 都用 `level < MASTERED_LEVEL` 过滤掉了 level 6 的单词。虽然 `markKnown` 里给 level 6 设置了 30 天后的 `nextReview`，但实际不会被用到。
- 因此**不需要**额外的 `retired` 字段，level 6 本身就是「归档」语义。

### 4. 状态持久化

- 本地：`localStorage` 键 `zeno-vocab-words-v1-{userId}`、`zeno-vocab-progress-v3-{userId}`
- 云端：Supabase 表 `user_words`、`user_word_progress`、`user_wrong_queue`、`user_settings`
- 加载顺序：先读 localStorage 保证首屏快，再异步拉 Supabase；若云端为空则迁移本地数据

## 已知注意事项 / 当前计划

- 核心状态逻辑在 `app/hooks/useVocabState.ts`，目前算法和 React 生命周期耦合，计划抽成纯函数到 `app/lib/algorithm.ts` 并补 Vitest 测试
- `SettingsView` 改密码流程使用客户端二次 `signInWithPassword` 验证旧密码，计划改为 `app/actions/auth.ts` Server Action
- `DEFAULT_WORDS` 为空数组，新用户需要手动导入
- 无测试基础设施（计划引入 Vitest）

## 进行中的设计（待用户批准）

基于 2026-07-07 的讨论，方案 B 最终范围为：
1. 改密码：新建 `app/actions/auth.ts` Server Action，`SettingsView` 改为调用它。
2. 算法抽离：新建 `app/lib/algorithm.ts` 和 `app/lib/algorithm.test.ts`，`useVocabState.ts` 调用纯函数。
3. 不动 `proxy.ts`，不加 `retired` 字段。

## 常用命令

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```
