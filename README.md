# Zeno的单词农场

一个基于艾宾浩斯 / Leitner 间隔重复系统的背单词小网站，使用 Next.js + React 构建，部署在 Vercel。

## 功能

- 🌱 学习模式：卡片式背单词，认识则升级，不认识则回到种子
- 🌾 单词农场：可视化查看所有单词的熟悉度成长状态
- 📚 词库模式：列表查看、搜索、按状态筛选
- 💾 进度自动保存到浏览器 localStorage

## 本地开发

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 部署到 Vercel

1. 推送代码到 GitHub：

```bash
git add .
git commit -m "your message"
git push
```

2. 在 [Vercel Dashboard](https://vercel.com/dashboard) 导入该仓库。

3. Vercel 会自动识别为 Next.js 项目，保持默认配置，点击 **Deploy**。
