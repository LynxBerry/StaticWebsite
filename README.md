# Zeno的单词农场

一个基于艾宾浩斯 / Leitner 间隔重复系统的背单词小网站，部署在 Vercel。

## 本地预览

直接打开 `index.html`，或者运行一个本地服务器：

```bash
npx serve .
```

## 部署到 Vercel

1. 把代码提交并推送到 GitHub：

```bash
git add .
git commit -m "init: simple static site"
git push
```

2. 在 [Vercel Dashboard](https://vercel.com/dashboard) 点击 **Add New Project**。

3. 导入这个 GitHub repo，保持默认配置（Vercel 会自动识别为 Static 站点）。

4. 点击 **Deploy**。

部署完成后，Vercel 会给你一个 `*.vercel.app` 域名。
