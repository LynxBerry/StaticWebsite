# 代码审查问题清单（2026-07-09）

> 审查基准：commit `39155f6`。本文档供后续修复者使用。
> 修复前请先阅读根目录 `AGENTS.md` 了解架构约定（尤其：**不要**把 `proxy.ts` 改回 `middleware.ts`，**不要**加 `retired` 字段）。
> 每个问题修复前请先按「位置/复现」自行验证，修复后跑 `npm run build` 确认无误。

---

## 修复状态（2026-07-09，由 opencode 实施）

验证：`npm run build` 通过（`ƒ Proxy (Middleware)`，无告警），`npm run test` 31/31 通过。

| # | 问题 | 状态 | 说明 |
|---|------|------|------|
| 1 | LearnView 越界白屏 | ✅ 已修 | 钳制 `safeIndex` + 渲染守卫 `!currentWord` |
| 2 | 登录开放重定向 | ✅ 已修 | 校验 redirect 以单个 `/` 开头 |
| 3 | 错题「连续答对」失效 | ✅ 已修 | 新增 `resetWrongRemaining` 动作 + 纯函数 `resetWrongRemainingPure`，StudyView 错题答错时调用；有测试用例 |
| 4 | 答题双击跳两级 | ✅ 已修 | StudyView/LearnView 加 `busyRef` 防抖，feedback 期间禁用按钮；顺手清理 feedback setTimeout |
| 5 | 批量添加判重失效 | ✅ 已修 | `addWord` 改用 `wordsRef` 镜像同步判重，不再依赖 React eager updater |
| 6 | 恢复备份无确认 + 同步静默 | ✅ 已修 | 非合并导入前 `confirm()`；`importState` 改为 async 返回 `{ok, cloudSynced}`，失败时提示「云端同步失败」 |
| 7 | body 样式冲突 | ✅ 已修 | 删除 globals.css 的 body 块，横屏媒体查询用 Tailwind 任意变体 `[@media(max-height:500px)]:` 移入 layout.tsx |
| 8 | idle 误判 | ✅ 已修 | scroll 监听加 `{ capture: true }` |
| 9 | FarmView 触屏看不到词义 | ✅ 已修 | tile 改为 `<button>`，点击/触摸/键盘切换 tooltip，点击外部关闭，补 aria-label/aria-pressed |
| 10 | 键盘劫持 | ✅ 已修 | 跳过可交互元素（button/input/a）；判定快捷键仅翻面后生效 |
| 11 | 表单 a11y | ✅ 已修 | 密码三框包 `<form>` + sr-only label + `aria-live`；BankView 过滤按钮 `aria-pressed`；导入提示 `aria-live` |
| 12 | BankView 搜索性能 | ✅ 已修 | `useMemo` + `useDeferredValue` |
| 13 | Dashboard render 副作用 | ✅ 已修 | `getReviewStats` 改为纯读，快照写入移到 `useEffect` |
| 14 | 改密码 Server Action | ⏸ 暂不做 | 用户决定本轮不做，保留现有客户端流程 |
| 15 | 算法抽离 + Vitest | ✅ 已做 | 新建 `app/lib/algorithm.ts` 纯函数 + `algorithm.test.ts`（31 用例）；`useVocabState.ts` 重构为调用纯函数 + ref 镜像 |
| 16 | next-env.d.ts 抖动 | ✅ 已修 | 加入 `.gitignore` 并 `git rm --cached` |
| 17 | 小杂项 | ✅ 大部分 | proxy 注释、formatDate 跨年加年份、导出文件名本地日期、commitTitle/commitLimit clamp+反馈、setTimeout 卸载清理、BankView 回车空中文提示、useOverflow 加 MutationObserver。未做：BankView 半角逗号 join 丢分隔符（纯样式）、useSpeech Safari cancel 边缘（低概率）、next.config 安全头（可选） |

### 新增/改动文件
- 新增：`app/lib/algorithm.ts`、`app/lib/algorithm.test.ts`、`vitest.config.ts`
- 重构：`app/hooks/useVocabState.ts`（算法移至纯函数，ref 镜像，新增 `resetWrongRemaining`）
- 修复：`app/components/{LearnView,StudyView,BankView,FarmView,SettingsView,DashboardView}.tsx`、`app/login/LoginForm.tsx`、`app/hooks/{useIdlePrompt,useOverflow}.ts`、`app/lib/utils.ts`、`app/layout.tsx`、`app/globals.css`、`lib/supabase/proxy.ts`、`app/HomeClient.tsx`、`.gitignore`、`package.json`

---

## P0 — 崩溃与安全（建议最先修）

### 1. LearnView 索引越界导致白屏崩溃 【已人工复核】

- **位置**：`app/components/LearnView.tsx:38`（取词）、`:31`（isDone 判断）、`:127`（解引用崩溃点）
- **复现**：进入「播种」tab → 连按「跳过」让 `currentIndex` 停在最后一个词 → 按「播种」。
- **原因链**：
  1. `onLearn` 使父级 `unlearnedWords` 和 `remaining` 同时减 1，`availableWords = unlearnedWords.slice(0, actualRemaining)` 缩短；
  2. `currentIndex` 仍是旧值（等于新数组长度），`currentWord = availableWords[currentIndex]` 为 `undefined`；
  3. `isDone`（`availableWords.length === 0 || actualRemaining === 0`）此时仍为 `false`，走到第 127 行 `{currentWord.en}` 抛 TypeError；
  4. 第 33-36 行重置索引的 `useEffect` 在 render **之后**才执行，救不了当次渲染。
- **修复方向**：render 前对索引做钳制（如 `const safeIndex = Math.min(currentIndex, availableWords.length - 1)`），或在 `isDone` / 渲染分支中加入 `!currentWord` 守卫。注意 `handleLearn`（:40-44）已有 `!currentWord` 守卫，仅渲染路径缺。
- **附带小问题**：第 36 行 effect 只依赖 `availableWords.length`，长度不变但内容变（如导入替换词库）时索引不重置，可顺手改为依赖数组内容或首词。

### 2. 登录页开放重定向 【已人工复核】

- **位置**：`app/login/LoginForm.tsx:15`（读取参数）、`:36`（跳转）
- **问题**：`searchParams.get('redirect')` 未做任何校验直接 `router.push(redirect)`。App Router 对外部 URL（`https://evil.com`、`//evil.com`）会执行整页跳转 → 钓鱼链接 `https://本站/login?redirect=https://evil.com` 可在用户登录成功后把人带走。
- **修复方向**：校验 redirect 必须以单个 `/` 开头且不以 `//` 或 `/\` 开头，否则回退 `'/'`。例如：
  ```ts
  const raw = searchParams.get('redirect') || '/';
  const redirect = raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : '/';
  ```
- **附带小问题**（同文件，低优先级）：
  - `:16` + `:65-68`：任何人拼 `?error=1` 即可让登录页显示「密码错误」；
  - `:31-33`：所有登录错误（含限流、网络错误）统一显示「邮箱或密码错误」，可按错误类型区分文案。

---

## P1 — 逻辑与数据一致性

### 3. 错题队列「连续答对」语义失效

- **位置**：`app/components/StudyView.tsx:115-127`（`handleAgain`）；根因在 `app/hooks/useVocabState.ts:464-478`（`addToWrongQueue` 对已存在条目直接 return）
- **问题**：`WrongItem.remaining` 的设计语义是「还需**连续**答对次数」（默认 3，见 AGENTS.md）。但错题模式下答错时：`onAddToWrongQueue(en)` 发现条目已存在直接 return，`onAgain(en)` 只重置 level——**remaining 不会重置回 3**。结果「对-错-对-对」也能让单词离开错题队列，连续性被破坏。
- **修复方向**：新增或修改一个动作（如 `resetWrongRemaining(en)` 或给 `addToWrongQueue` 加 `forceReset` 参数），在错题模式答错时把 remaining 重置为 3，并同步到 DB（`upsertWrongItem`）。
- **注意**：若按 AGENTS.md 方案 B 抽离算法，此逻辑应落在纯函数里并配 Vitest 用例。

### 4. 答题按钮无防抖，双击一次跳两级

- **位置**：`app/components/StudyView.tsx:97-113`（`handleKnown` / `handleAgain`）；`app/components/LearnView.tsx` 同类问题
- **问题**：答题后有 450ms 的 feedback 动画，但期间按钮不禁用、回调无幂等保护。快速双击「认识」→ 对同一词调用两次 `markKnown` → level 一次跳两级、复习间隔跳档。
- **修复方向**：feedback 展示期间禁用按钮或在 handler 里用 ref 标志位拦截重复触发（键盘快捷键路径也要覆盖）。
- **附带小问题**：`StudyView.tsx:60-63` `triggerFeedback` 的 setTimeout 未清理，连续快速答题时前一个 timeout 会提前清掉新 feedback。

### 5. BankView 批量添加时重复检测失效，本地/云端数据可分叉

- **位置**：`app/components/BankView.tsx:116-145`（批量添加循环）；根因在 `app/hooks/useVocabState.ts:526-547`（`addWord`）
- **问题**：`addWord` 的重复检测靠「在 `setWords` 的 updater 里给外部变量 `isDuplicate` 赋值，然后同步读取」。React 仅在更新队列为空时对首次 `setState` 做 eager evaluation；循环中第 2..N 次调用的 updater 会被推迟执行 → `isDuplicate` 读到的永远是 false：
  - 重复行被误报「已添加」（计数虚高）；
  - 照样发出 `upsertWord` 覆盖 DB 里的 cn，而本地 state 稍后执行 updater 时跳过该词 → **本地与云端释义不一致**，直到下次整体拉取才收敛。
- **修复方向**：`addWord` 不要在 updater 里做同步判重。可改为：先基于当前 `words`（或一个 ref 镜像）同步判重，再 `setWords`；或将批量添加改为专门的 `addWords(list)` 一次性去重+更新+批量 upsert。
- **关联问题**：判重全程大小写敏感——"Apple" 与 "apple" 可共存（`en` 是主键）。添加、批量添加、编辑三处均无归一化。建议统一 `trim().toLowerCase()` 或至少大小写不敏感比较（需决策是否保留原始大小写显示）。

### 6. 恢复备份无确认弹窗 + 云端同步失败静默

- **位置**：`app/components/SettingsView.tsx:151-152`（导入入口）；`app/hooks/useVocabState.ts:749-897`（`importState`）
- **问题**：
  1. 非合并模式恢复备份会**整体替换**词库和全部学习进度，但没有确认弹窗（对比：重置进度在 `useVocabState.ts:692` 有 `confirm()`）；
  2. `importState` 内部对 DB 的 `syncWords` / `upsertProgress` 是 fire-and-forget（`:808-819` 仅 console.error），UI 显示「恢复成功」但云端可能写入失败 → 换设备后数据回退。
- **修复方向**：非合并导入前加确认弹窗；导入的 DB 同步改为 await 并向 UI 返回成功/失败状态（失败时提示「本地已恢复但云端同步失败」）。

### 7. layout 与 globals.css 的 body 样式冲突，横屏优化是死代码

- **位置**：`app/layout.tsx:64`（body className）vs `app/globals.css:19-31`
- **问题**：两处都定义 body 的 padding：layout 是 `pt-6 sm:pt-8 lg:pt-10`，globals 是 `pt-20 sm:pt-24 lg:pt-28`。类选择器特异性 (0,1,0) 恒高于元素选择器 (0,0,1)，layout 永远赢 → globals.css 的 body padding 以及 `:27-31` 针对手机横屏矮视口的 `pt-12 p-3` 媒体查询**全部失效**。背景色也三处不一致：globals `:21` 用 `#efefeb`、`:41` 注释说 `#f4f4f0`、layout 用 `bg-farm-bg`（实际生效的是 layout 的类）。
- **修复方向**：二选一收敛——把 body 样式全部归到 layout.tsx（横屏媒体查询逻辑用 Tailwind 任意变体重写），或从 layout 移除冲突类让 globals.css 生效。修复后需在窄高度视口（手机横屏）实测。

### 8. useIdlePrompt 收不到容器滚动，正常使用中会误弹「数据过期」提示

- **位置**：`app/hooks/useIdlePrompt.ts:5,32`
- **问题**：`scroll` 事件不冒泡。`window.addEventListener('scroll', ...)` 非捕获模式只能收到 document 级滚动，而本应用所有滚动都发生在 overflow 容器里（词库列表、农场网格）→ 用户持续滚动列表仍被判定 idle，1 小时后弹 StalePrompt。
- **修复方向**：`window.addEventListener('scroll', handler, { capture: true })`（移除时也要带相同的 capture 选项）。

---

## P2 — 体验 / 可访问性（儿童应用，触屏是主场景）

### 9. FarmView 词义 tooltip 触屏完全不可用

- **位置**：`app/components/FarmView.tsx:103-104`
- **问题**：tooltip 只绑定 `onMouseEnter` / `onMouseLeave`。**iPad / 手机上无法查看词义**；tile 是不可聚焦的 div，键盘用户同样无法访问，且无任何 aria 属性。
- **修复方向**：改为点击/触摸切换 tooltip（点击 tile 显示，点击其他区域关闭），tile 加 `role="button"` + `tabIndex={0}` + 键盘支持；或改用原生 `<button>`。
- **附带小问题**：`:131-136` tooltip 用 fixed 定位，悬停中滚动内层容器时位置不跟随（mouseleave 会隐藏，影响小）；`:36` `STAGE_HEAT_COLORS[level] || [6]` 的 fallback 是「已掌握」色，异常 level 会显示成掌握（前置分支已挡住 unlearned，残余风险低）。

### 10. 学习/复习页的全局空格键劫持

- **位置**：`app/components/StudyView.tsx:134-144`；`app/components/LearnView.tsx:52-67`
- **问题**：window 级 keydown 对空格 `preventDefault`：
  1. 焦点在任何按钮上按空格，会被劫持去翻卡而不是激活按钮（违反键盘交互惯例）；
  2. 卡片**未翻面**时方向键也能直接判「认识/不认识」——不看答案就能操作，对自律性差的儿童用户是漏洞。
- **修复方向**：keydown handler 里检查 `e.target` 是否为可交互元素（button/input/a），是则不拦截；判定快捷键仅在 `flipped === true` 时生效。

### 11. 表单可访问性缺失

- **位置**：`app/components/SettingsView.tsx`（三个密码输入框）、`app/components/BankView.tsx:336-351`（过滤按钮组）
- **问题**：
  - 密码输入框只有 placeholder 没有 `<label>`；成功/错误消息无 `aria-live`；未包 `<form>`，无法回车提交；
  - 过滤按钮组无 `aria-pressed`，选中态只靠颜色区分。
- **修复方向**：补 label（可视觉隐藏）、`aria-live="polite"` 消息区、包 form；过滤按钮加 `aria-pressed`。

---

## P3 — 性能（词库增大后显现）

### 12. BankView 搜索与列表渲染无优化

- **位置**：`app/components/BankView.tsx:187-197`（items 计算）、`:358-435`（列表渲染）
- **问题**：
  - `items` 无 `useMemo`，搜索框每敲一个字符对全部单词跑 `getStatus` + `getWordState`，且搜索无防抖；
  - 列表全量渲染无虚拟化，每行挂一个 SpeakButton（各自跑 useSpeech effect），千词级会明显卡顿。
- **修复方向**：`items` 用 `useMemo`；搜索输入 150-300ms 防抖；如词库预期超过几百词，考虑虚拟化（或先做分页/按需渲染）。

### 13. DashboardView 在 render 期间产生副作用

- **位置**：`app/components/DashboardView.tsx:90`；副作用源头 `app/hooks/useVocabState.ts:340-363`（`getReviewStats` 写 `todayInitialDueRef`）
- **问题**：render 期间调用会写 ref 的函数，属 render 阶段副作用。StrictMode 双渲染下因幂等暂无实害，但这是反模式，抽离算法（方案 B）时应一并处理——快照逻辑移到 effect 或状态更新路径里。
- **附带**：`:74-81` 每次 render 全量遍历 words 算 stageCounts 无 memo（轻）；`:68` `totalCount === 0` 分支不可达（`:50` 已提前 return），是死代码。

---

## P4 — 工程化与杂项

### 14. 改密码流程应改为 Server Action（AGENTS.md 方案 B 第 1 项，已获用户批准）

- **位置**：`app/components/SettingsView.tsx:79-126`
- **现状**：纯客户端三步——`getUser()` 取 email → `signInWithPassword` 验旧密码 → `updateUser({ password })`。
- **问题**：
  1. 旧密码验证只是 UX 屏障：持会话者可直接调 `supabase.auth.updateUser` 绕过；
  2. `signInWithPassword` 成功会轮换 session token——「验证」本身有副作用，若随后 `updateUser` 失败，会话已被重建；
  3. `:107-108` 所有 signIn 错误（网络错误、限流）一律显示「旧密码不正确」。
- **修复方向**：按 AGENTS.md 方案 B 新建 `app/actions/auth.ts` Server Action：服务端用旧密码 `signInWithPassword` 验证 + `updateUser` 改密，向客户端返回结构化结果；`SettingsView` 改为调用 action 并区分错误文案。

### 15. 核心算法与 React 耦合，无测试（AGENTS.md 方案 B 第 2 项，已获用户批准）

- **位置**：`app/hooks/useVocabState.ts`（930 行）
- **问题**：间隔重复算法（升降级、到期判断、错题队列、导入合并）全部内联在 hook 的 setState updater 里，无法单测。本清单 #3、#4、#5 都是这种耦合的直接后果。
- **修复方向**：抽纯函数到 `app/lib/algorithm.ts`（输入 state + 动作 → 输出新 state + 需同步的 DB 操作描述），配 `app/lib/algorithm.test.ts`（Vitest，需先引入：`npm i -D vitest` + `"test": "vitest"` script）。用例应覆盖：升级/降级/掌握边界、错题 remaining 连续性（#3）、重复添加（#5）、导入合并。

### 16. next-env.d.ts 在 dev/build 之间来回抖动

- **位置**：`next-env.d.ts:3`（当前有未提交改动：`./.next/types/routes.d.ts` ↔ `./.next/dev/types/routes.d.ts`）
- **问题**：`next dev` 与 `next build` 各自重新生成该行，导致 git 永远有 diff；且该 import 指向 gitignored 路径，新 clone 不先跑 dev/build 直接 `tsc --noEmit` 会报错。
- **修复方向**：把 `next-env.d.ts` 加入 `.gitignore` 并从 git 追踪中移除（`git rm --cached next-env.d.ts`），这是 Next.js 16 的推荐做法。

### 17. 小杂项（顺手修即可）

| 位置 | 问题 |
|---|---|
| `lib/supabase/proxy.ts:8` | 注释过期：说 route protection 在 `app/layout.tsx`，实际在 `app/page.tsx:9-11` |
| `app/components/SettingsView.tsx:132` | 导出文件名用 `toISOString()` 取 UTC 日期，东八区晚间导出日期差一天；改用本地日期格式化 |
| `app/components/SettingsView.tsx:49-52` | `commitTitle` 对 trim 后为空的输入仍调用 `onUpdateSiteTitle('')`（hook 内会兜底重置为默认标题，但 UI 无提示） |
| `app/components/SettingsView.tsx:57-63` | `commitLimit` 不 clamp 也不反馈：输入 `abc` 得 NaN 静默忽略，输入 0/999 显示「已保存」但实际值被 hook 改写为 1-100 |
| `app/components/SettingsView.tsx:54,62,161` | 三处 `setTimeout` 组件卸载时未清理 |
| `app/components/BankView.tsx:307` | 英文框回车且中文为空时静默无反应，无提示 |
| `app/components/BankView.tsx:131` | 批量添加时全角逗号/制表符分隔的行，释义重组统一用半角逗号 join，原分隔符丢失 |
| `app/lib/utils.ts` | `formatDate` 只输出 月/日 无年份，30 天间隔跨年时（12 月学的词显示「下次复习 1/3」）有歧义 |
| `app/hooks/useOverflow.ts` | ResizeObserver 只观察容器自身，容器 max-h 固定时内容增删不触发回调 → 渐隐提示状态过期；且 effect 依赖 `[ref]` 永不变，挂载时 `ref.current` 为 null 则永远不观察 |
| `app/hooks/useSpeech.ts:56` | `cancel()` 打断前一个 utterance 时部分 Safari 不触发 onend/onerror → 上一个按钮的 speaking 卡 true（低概率） |
| `next.config.js` | 空配置，未设任何安全响应头（CSP、X-Frame-Options、Referrer-Policy）；个人应用可接受，可选加固 |

---

## 建议修复顺序

1. **P0**：#1 崩溃、#2 开放重定向（各几行改动，独立可修）
2. **P4 #15 算法抽离 + 测试**：先建基础设施，再在纯函数里修 **P1 #3/#4/#5**（这样每个逻辑修复都有测试兜底）
3. **P1 其余**：#6 导入确认、#7 CSS 冲突、#8 idle 误判
4. **P4 #14**：改密码 Server Action
5. **P2/P3**：触屏 tooltip、键盘行为、性能优化
6. **#16/#17** 杂项随其他改动顺手处理

## 验证方式

- 每步跑 `npm run build`（应显示 `ƒ Proxy (Middleware)` 且无告警）
- 引入 Vitest 后跑 `npm run test`
- 手工回归路径：登录 → 播种（跳到最后一词再播种，不应白屏）→ 施肥（答错一词再连对，检查错题队列语义）→ 词库批量添加含重复词 → 设置导出/导入 → iPad 或触屏模拟器上看农场词义
