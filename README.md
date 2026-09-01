# Cecelia 的知识库

关于 Agent、LLM 与软件工程的学习笔记，使用 VitePress 构建并发布到 GitHub Pages。

## 本地开发

```bash
npm install
npm run docs:dev
```

## 构建

```bash
npm run docs:build
```

在线地址：[ceceliawai.github.io/Agent](https://ceceliawai.github.io/Agent/)

## 项目结构

```text
.
├── .github/workflows/       # GitHub Pages 构建与发布
├── docs/                    # Markdown 文档内容
│   ├── notes/               # 知识库文章
│   ├── index.md             # 首页正文
│   └── about.md             # 关于页正文
├── src/                     # 网站代码
│   └── .vitepress/
│       ├── config.mts       # VitePress 配置
│       └── theme/           # 页面布局、组件与样式
├── package.json             # 开发命令与依赖
└── package-lock.json        # 依赖版本锁定
```

### 网站代码

- `src/.vitepress/config.mts`：站点元信息、内容目录、导航、侧边栏与搜索配置。
- `src/.vitepress/theme/`：页面布局、Vue 组件与全局样式。
- `.github/workflows/deploy-pages.yml`：GitHub Pages 自动发布流程。

### 文档内容

- `docs/notes/`：按主题归档的知识笔记。
- `docs/index.md` 与 `docs/about.md`：首页和关于页的正文内容。

`docs/` 只存放 Markdown；构建结果输出到 `dist/`。本地截图、测试输出等生成文件统一放在 `.artifacts/` 或 `artifacts/`。这些生成目录都不会提交到 GitHub。
